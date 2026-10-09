'use client'
/* eslint-disable @next/next/no-img-element -- This is a local data-URL upload preview. */

import { useId, useState, useRef } from 'react'
import Image from 'next/image'
import { X, Upload, File as FileIcon, Image as ImageIcon, Film, Music, FileText, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { encryptAndUpload, encryptMedia } from '@/lib/mediaEncryption'

interface FileUploadProps {
  onFileUpload: (fileData: { url: string; type: string; name: string; size: number; path?: string; mimeType?: string; storageProvider?: 'supabase' | 'backblaze_b2' | 'google_drive'; storageFileId?: string }) => void
  onClose: () => void
  coupleId: string
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024 // Application upload ceiling; files over 50MB use B2

export default function FileUpload({ onFileUpload, onClose, coupleId }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setError('File size must be 5GB or smaller')
      setSelectedFile(null)
      setPreview(null)
      return
    }

    setSelectedFile(file)

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setPreview(null)
    }
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return ImageIcon
    if (type.startsWith('video/')) return Film
    if (type.startsWith('audio/')) return Music
    if (type.startsWith('text/') || type.includes('pdf') || type.includes('document')) return FileText
    return FileIcon
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file first')
      return
    }

    // Validate the application-wide 5GB ceiling
    const maxSize = 5 * 1024 * 1024 * 1024 // B2 ceiling
    if (selectedFile.size > maxSize) {
      alert('File size must be 5GB or smaller')
      return
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
    ]

    if (!allowedTypes.includes(selectedFile.type)) {
      alert('File type not allowed. Allowed: JPG, PNG, GIF, WebP, PDF, TXT')
      return
    }

    try {
      setUploading(true)
      setError(null)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Please log in to upload files')
        return
      }

      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `1791192980778_${crypto.randomUUID()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const DRIVE_FILE_LIMIT = 25 * 1024 * 1024
      const driveSupportedFile = selectedFile.type.startsWith('image/') || selectedFile.type === 'application/pdf'
      let driveConnected = false
      if (driveSupportedFile && selectedFile.size <= DRIVE_FILE_LIMIT) {
        const statusResponse = await fetch('/api/drive/status')
        const statusBody = (await statusResponse.json().catch(() => ({}))) as { connected?: boolean }
        driveConnected = statusResponse.ok && statusBody.connected === true
      }

      if (driveConnected) {
        const form = new FormData()
        form.append('file', selectedFile)
        form.append('coupleId', coupleId)
        const driveResponse = await fetch('/api/drive/chat-upload', { method: 'POST', body: form })
        const driveBody = (await driveResponse.json().catch(() => ({}))) as {
          file?: { id?: string; mimeType?: string }
          storageProvider?: 'google_drive'
          storageFileId?: string
          storagePath?: string
          url?: string
          error?: string
        }
        if (!driveResponse.ok || !driveBody.file?.id || !driveBody.storageFileId) {
          throw new Error(driveBody.error || 'Google Drive chat attachment upload failed.')
        }
        onFileUpload({
          url: driveBody.url || '/api/drive/file?fileId=' + encodeURIComponent(driveBody.file.id) + '&download=1',
          type: selectedFile.type,
          name: selectedFile.name,
          size: selectedFile.size,
          path: driveBody.storagePath,
          mimeType: driveBody.file.mimeType || selectedFile.type,
          storageProvider: 'google_drive',
          storageFileId: driveBody.storageFileId,
        })
      } else if (selectedFile.size <= 50 * 1024 * 1024) {
        const { path: storedPath, mimeType } = await encryptAndUpload(
          selectedFile,
          coupleId,
          'chat_files',
          filePath,
          { cacheControl: '3600', upsert: false }
        )
        const { data: signedUrlData } = await supabase.storage
          .from('chat_files')
          .createSignedUrl(storedPath, 3600)
        if (!signedUrlData?.signedUrl) throw new Error('Failed to generate signed URL for chat file')
        onFileUpload({
          url: signedUrlData.signedUrl,
          type: selectedFile.type,
          name: selectedFile.name,
          size: selectedFile.size,
          path: storedPath,
          mimeType,
          storageProvider: 'supabase',
        })
      } else {
        const encrypted = await encryptMedia(selectedFile, coupleId)
        const bytes = new Uint8Array(await encrypted.arrayBuffer())
        const digest = await crypto.subtle.digest('SHA-1', bytes)
        const sha1 = Array.from(new Uint8Array(digest)).map((value) => value.toString(16).padStart(2, '0')).join('')
        const targetResponse = await fetch('/api/media/b2-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            coupleId,
            fileName,
            contentType: 'application/octet-stream',
            contentLength: bytes.byteLength,
            sha1,
          }),
        })
        if (!targetResponse.ok) throw new Error('Unable to prepare large-media storage')
        const target = await targetResponse.json() as { uploadUrl: string; authorizationToken: string; objectName: string }
        const uploadResponse = await fetch(target.uploadUrl, {
          method: 'POST',
          headers: {
            Authorization: target.authorizationToken,
            'X-Bz-File-Name': encodeURIComponent(target.objectName),
            'Content-Type': 'application/octet-stream',
            'Content-Length': String(bytes.byteLength),
            'X-Bz-Content-Sha1': sha1,
          },
          body: bytes,
        })
        if (!uploadResponse.ok) throw new Error('Large-media upload failed')
        const uploaded = await uploadResponse.json() as { fileId?: string; fileName?: string }
        if (!uploaded.fileId || !uploaded.fileName) throw new Error('Large-media storage returned an invalid response')
        onFileUpload({
          url: uploaded.fileName,
          type: selectedFile.type,
          name: selectedFile.name,
          size: selectedFile.size,
          path: uploaded.fileName,
          mimeType: selectedFile.type,
          storageProvider: 'backblaze_b2',
          storageFileId: uploaded.fileId,
        })
      }

      // Reset state
      setSelectedFile(null)
      setPreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Failed to upload file. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-modal border border-accent-1/20 bg-card shadow-[0_20px_40px_rgba(19,10,33,0.28)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-accent-1/20 p-4">
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-accent-1" />
            <h2 className="text-lg font-serif text-text-1">Upload File</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-text-2 hover:bg-accent-1/10 hover:text-accent-1 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* File Input */}
          <div>
            <label htmlFor={fileInputId} className="block text-sm font-medium text-text-1 mb-2">
              Select a file
            </label>
            <input
              id={fileInputId}
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept="image/*,application/pdf,.txt"
              className="w-full rounded-input border-2 border-dashed border-accent-1/30 bg-card px-4 py-8 text-sm text-text-2 hover:border-accent-1/50 transition cursor-pointer"
            />
            <p className="text-xs text-text-2 mt-2">
              Up to 50MB in secure app storage • larger shared media uses B2
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-input bg-error/10 border border-error/30">
              <AlertCircle className="h-4 w-4 text-error flex-shrink-0 mt-0.5" />
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          {/* File Preview */}
          {selectedFile && (
            <div className="rounded-input border border-accent-1/20 bg-card p-4 space-y-3">
              {preview && (
                <div className="relative">
                  <Image
                    src={preview}
                    alt="Preview"
                    width={640}
                    height={384}
                    unoptimized
                    className="h-48 w-full rounded-lg object-cover"
                  />
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-accent-1/10 p-2">
                  {(() => {
                    const Icon = getFileIcon(selectedFile.type)
                    return <Icon className="h-5 w-5 text-accent-1" />
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-1 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-text-2">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-2">Uploading...</span>
                    <span className="text-accent-1">Processing</span>
                  </div>
                  <div className="h-2 rounded-full bg-accent-1/20 overflow-hidden">
                    <div
                      className="h-full bg-accent-1 animate-pulse"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Upload Button */}
          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="w-full rounded-btn bg-gradient-to-r from-accent-1 to-accent-2 px-6 py-3 text-base font-medium text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload File
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

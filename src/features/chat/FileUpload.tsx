'use client'

import { useState, useRef } from 'react'
import { X, Upload, File as FileIcon, Image as ImageIcon, Film, Music, FileText, Check, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface FileUploadProps {
  onFileUpload: (fileData: { url: string; type: string; name: string; size: number; path?: string }) => void
  onClose: () => void
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export default function FileUpload({ onFileUpload, onClose }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setError('File size must be less than 5MB')
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

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (selectedFile.size > maxSize) {
      alert('File size must be less than 5MB')
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

      // Generate unique filename
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat_files')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('chat_files')
        .getPublicUrl(filePath)

      // Call parent callback with file info
      onFileUpload({
        url: publicUrl,
        type: selectedFile.type,
        name: selectedFile.name,
        size: selectedFile.size,
        path: filePath,
      })

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
      <div className="w-full max-w-md rounded-[28px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] shadow-[0_20px_40px_rgba(19,10,33,0.28)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--accent-1)]/20 p-4">
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-[var(--accent-1)]" />
            <h2 className="text-lg font-serif text-[var(--text-primary)]">Upload File</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[var(--text-secondary)] hover:bg-[var(--accent-1)]/10 hover:text-[var(--accent-1)] transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* File Input */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Select a file
            </label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept="image/*,application/pdf,.txt"
              className="w-full rounded-xl border-2 border-dashed border-[var(--accent-1)]/30 bg-[var(--card-bg-strong)] px-4 py-8 text-sm text-[var(--text-secondary)] hover:border-[var(--accent-1)]/50 transition cursor-pointer"
            />
            <p className="text-xs text-[var(--text-secondary)] mt-2">
              Max file size: 5MB • Images, PDF, TXT
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30">
              <AlertCircle className="h-4 w-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-rose-500">{error}</p>
            </div>
          )}

          {/* File Preview */}
          {selectedFile && (
            <div className="rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] p-4 space-y-3">
              {preview && (
                <div className="relative">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-[var(--accent-1)]/10 p-2">
                  {(() => {
                    const Icon = getFileIcon(selectedFile.type)
                    return <Icon className="h-5 w-5 text-[var(--accent-1)]" />
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-secondary)]">Uploading...</span>
                    <span className="text-[var(--accent-1)]">Processing</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--accent-1)]/20 overflow-hidden">
                    <div
                      className="h-full bg-[var(--accent-1)] animate-pulse"
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
            className="w-full rounded-xl bg-gradient-to-r from-[var(--accent-1)] to-[var(--accent-2)] px-6 py-3 text-base font-medium text-[var(--bg-color)] transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

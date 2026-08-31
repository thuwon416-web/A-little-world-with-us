'use client'

import { ChangeEvent, useRef, useState } from 'react'
import { uploadGalleryImage } from '@/lib/storage'

export type UploadImageResult = Awaited<ReturnType<typeof uploadGalleryImage>>

export default function ImageUpload({
  onUpload,
  folder = 'gallery',
}: {
  onUpload?: (image: UploadImageResult) => void
  folder?: string
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null
    setError('')

    if (!nextFile) {
      setSelectedFile(null)
      setPreview(null)
      return
    }

    if (!nextFile.type.startsWith('image/')) {
      setSelectedFile(null)
      setPreview(null)
      setError('Please choose a valid image file.')
      return
    }

    setSelectedFile(nextFile)
    setPreview(URL.createObjectURL(nextFile))
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Choose an image to upload first.')
      return
    }

    try {
      setIsUploading(true)
      setError('')
      const uploaded = await uploadGalleryImage(selectedFile, folder)
      onUpload?.(uploaded)
      setSelectedFile(null)
      setPreview(null)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : 'Image upload failed.'
      setError(message)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="rounded-[28px] border border-white/10 bg-[var(--card-bg)] p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Upload</p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">Share a moment</h2>
        </div>
      </div>

      <label className="block cursor-pointer rounded-[22px] border border-dashed border-[var(--accent-1)]/40 bg-[var(--card-bg-strong)] p-4 text-center text-sm text-[var(--text-secondary)]">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        {selectedFile ? 'Choose a different image' : 'Tap to choose an image'}
      </label>

      {preview && (
        <div className="mt-4 overflow-hidden rounded-[20px] border border-white/10">
          <img src={preview} alt="Selected upload preview" className="h-52 w-full object-cover" />
        </div>
      )}

      {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}

      <button
        type="button"
        onClick={() => void handleUpload()}
        disabled={!selectedFile || isUploading}
        className="mt-4 w-full rounded-full bg-[var(--accent-1)] px-4 py-3 text-sm font-semibold text-[var(--bg-color)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isUploading ? 'Uploading...' : 'Upload to gallery'}
      </button>
    </div>
  )
}

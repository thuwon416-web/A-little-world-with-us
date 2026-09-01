'use client'

import { useState, useRef } from 'react'
import { Image, X } from 'lucide-react'

interface Props {
  onClose: () => void
  onPhotoSelect: (file: File) => void
}

export default function PhotoShare({ onClose, onPhotoSelect }: Props) {
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) return

    setSelectedFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSend = () => {
    if (selectedFile) {
      onPhotoSelect(selectedFile)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="glass-card p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Share Photo
          </h3>
          <button onClick={onClose} className="text-[var(--text-secondary)]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {preview ? (
            <div className="relative">
              <img
                src={preview}
                alt="Selected photo preview"
                className="w-full h-64 object-cover rounded-lg"
              />
              <button
                onClick={() => {
                  setPreview(null)
                  setSelectedFile(null)
                }}
                className="absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[var(--accent-1)]/30 rounded-lg p-8 text-center cursor-pointer hover:bg-[var(--bg-2)]"
            >
              <Image className="h-12 w-12 mx-auto mb-2 text-[var(--accent-1)]" />
              <p className="text-sm text-[var(--text-secondary)]">
                Tap to select photo
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            onClick={handleSend}
            disabled={!selectedFile}
            className="w-full rounded-xl bg-[var(--button-bg)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

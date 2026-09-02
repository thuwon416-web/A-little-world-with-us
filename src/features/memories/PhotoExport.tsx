'use client'

import { useState } from 'react'
import { Download, Image as ImageIcon } from 'lucide-react'
import { exportPhotosAsZIP, getStorageQuotaUsage } from '@/lib/photoPipeline'

interface Photo {
  id: string
  url: string
  filename: string
  created_at: string
}

interface Props {
  photos: Photo[]
}

export default function PhotoExport({ photos }: Props) {
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set())
  const [exporting, setExporting] = useState(false)
  const [quotaUsage, setQuotaUsage] = useState<{ usage: number; quota: number; percentUsed: number } | null>(null)

  const togglePhoto = (id: string) => {
    const newSelected = new Set(selectedPhotos)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedPhotos(newSelected)
  }

  const selectAll = () => {
    setSelectedPhotos(new Set(photos.map(p => p.id)))
  }

  const deselectAll = () => {
    setSelectedPhotos(new Set())
  }

  const handleExport = async () => {
    if (selectedPhotos.size === 0) return

    setExporting(true)

    const selectedPhotosData = photos.filter(p => selectedPhotos.has(p.id))
    const zipBlob = await exportPhotosAsZIP(
      selectedPhotosData.map(p => ({
        url: p.url,
        filename: p.filename,
      }))
    )

    const url = URL.createObjectURL(zipBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `memories-${new Date().toISOString().split('T')[0]}.zip`
    a.click()
    URL.revokeObjectURL(url)

    setExporting(false)
  }

  const checkQuota = async () => {
    const usage = await getStorageQuotaUsage()
    setQuotaUsage(usage)
  }

  return (
    <div className="glass-card p-5">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
        <Download className="h-5 w-5 text-[var(--accent-1)]" />
        Export Photos
      </h3>

      {/* Quota Info */}
      <div className="mb-4">
        <button
          onClick={checkQuota}
          className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          Check Storage Usage
        </button>
        {quotaUsage && (
          <div className="mt-2 text-xs text-[var(--text-secondary)]">
            Storage: {(quotaUsage.usage / 1024 / 1024).toFixed(2)} MB / {(quotaUsage.quota / 1024 / 1024).toFixed(0)} MB ({quotaUsage.percentUsed.toFixed(1)}%)
          </div>
        )}
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-3 gap-2 mb-4 max-h-64 overflow-y-auto">
        {photos.map(photo => (
          <div
            key={photo.id}
            onClick={() => togglePhoto(photo.id)}
            className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer ${
              selectedPhotos.has(photo.id)
                ? 'ring-2 ring-[var(--accent-1)]'
                : 'ring-1 ring-[var(--accent-1)]/20'
            }`}
          >
            <img
              src={photo.url}
              alt={photo.filename}
              className="w-full h-full object-cover"
            />
            {selectedPhotos.has(photo.id) && (
              <div className="absolute top-1 right-1 bg-[var(--accent-1)] text-white rounded-full p-1">
                <ImageIcon className="h-3 w-3" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Selection Controls */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={selectAll}
          className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          Select All
        </button>
        <span className="text-xs text-[var(--text-secondary)]">|</span>
        <button
          onClick={deselectAll}
          className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          Deselect All
        </button>
        <span className="text-xs text-[var(--text-secondary)] flex-1 text-right">
          {selectedPhotos.size} / {photos.length} selected
        </span>
      </div>

      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={selectedPhotos.size === 0 || exporting}
        className="w-full rounded-xl bg-[var(--button-bg)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Download className="h-4 w-4" />
        {exporting ? 'Exporting...' : `Export ${selectedPhotos.size} Photos as ZIP`}
      </button>
    </div>
  )
}

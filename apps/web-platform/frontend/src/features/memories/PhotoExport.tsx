'use client'
/* eslint-disable @next/next/no-img-element -- Canvas export must read the original user-selected URL. */

import { useState } from 'react'
import Image from 'next/image'
import { Download, Image as ImageIcon } from 'lucide-react'
import { exportPhotosAsZIP, getStorageQuotaUsage } from '@/lib/photoPipeline'
import { useLanguage } from '@/contexts/LanguageContext'
import { EmptyState } from '@/components/ui/empty-state'

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
  const { t } = useLanguage()
  const [error, setError] = useState('')
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
    setError('')
    try {
      const selectedPhotosData = photos.filter((photo) => selectedPhotos.has(photo.id))
      const zipBlob = await exportPhotosAsZIP(
        selectedPhotosData.map((photo) => ({ url: photo.url, filename: photo.filename }))
      )
      const url = URL.createObjectURL(zipBlob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `memories-${new Date().toISOString().split('T')[0]}.zip`
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (caughtError) {
      console.error('Photo export error:', caughtError)
      setError(t('Settings.photoExportError'))
    } finally {
      setExporting(false)
    }
  }

  const checkQuota = async () => {
    setError('')
    try {
      const usage = await getStorageQuotaUsage()
      setQuotaUsage(usage)
    } catch (caughtError) {
      console.error('Storage quota check error:', caughtError)
      setError(t('Settings.quotaError'))
    }
  }

  return (
    <div className="glass-card p-5">
      <h3 className="text-lg font-semibold text-text-1 mb-4 flex items-center gap-2">
        <Download className="h-5 w-5 text-accent-1" />
        {t('Settings.photoExportTitle')}
      </h3>

      {/* Quota Info */}
      <div className="mb-4">
        <button
          onClick={checkQuota}
          className="min-h-11 text-xs text-text-2 hover:text-text-1"
        >
          {t('Settings.checkStorageUsage')}
        </button>
        {quotaUsage && (
          <div className="mt-2 text-xs text-text-2">
            {t('Settings.storage')}: {(quotaUsage.usage / 1024 / 1024).toFixed(2)} MB / {(quotaUsage.quota / 1024 / 1024).toFixed(0)} MB ({quotaUsage.percentUsed.toFixed(1)}%)
          </div>
        )}
      </div>

      {/* Photo Grid */}
      {photos.length === 0 ? <EmptyState title={t('Settings.noPhotosToExport')} /> : <div className="grid grid-cols-3 gap-2 mb-4 max-h-64 overflow-y-auto">
        {photos.map(photo => (
          <button
            type="button"
            key={photo.id}
            tabIndex={0}
            aria-pressed={selectedPhotos.has(photo.id)}
            onClick={() => togglePhoto(photo.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                togglePhoto(photo.id)
              }
            }}
            className={`relative aspect-square w-full overflow-hidden rounded-lg border-0 bg-transparent p-0 text-left cursor-pointer ${
              selectedPhotos.has(photo.id)
                ? 'ring-2 ring-accent-1'
                : 'ring-1 ring-accent-1/20'
            }`}
          >
            <Image
              src={photo.url}
              alt={photo.filename}
              fill
              sizes="(max-width: 768px) 33vw, 160px"
              className="object-cover"
            />
            {selectedPhotos.has(photo.id) && (
              <div className="absolute top-1 right-1 bg-accent-1 text-white font-semibold shadow-sm rounded-full p-1">
                <ImageIcon className="h-3 w-3" />
              </div>
            )}
          </button>
        ))}
      </div>}

      {photos.length > 0 ? <>
      {/* Selection Controls */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          onClick={selectAll}
          className="min-h-11 text-xs text-text-2 hover:text-text-1"
        >
          {t('Settings.selectAll')}
        </button>
        <span className="text-xs text-text-2">|</span>
        <button
          onClick={deselectAll}
          className="min-h-11 text-xs text-text-2 hover:text-text-1"
        >
          {t('Settings.deselectAll')}
        </button>
        <span className="text-xs text-text-2 flex-1 text-right">
          {selectedPhotos.size} / {photos.length} {t('Settings.selected')}
        </span>
      </div>

      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={selectedPhotos.size === 0 || exporting}
        className="ui-button-primary min-h-11 w-full rounded-input px-4 py-2 text-sm disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Download className="h-4 w-4" />
        {exporting ? t('Settings.exporting') : `${t('Settings.exportPhotosZip')} (${selectedPhotos.size})`}
      </button>
      </> : null}
      {error ? <p role="alert" className="mt-3 text-sm text-error">{error}</p> : null}
    </div>
  )
}

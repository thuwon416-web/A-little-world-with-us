'use client'

import { useEffect, useState } from 'react'
import ImageUpload from '@/components/shared/ImageUpload'
import { LoadingState } from '@/components/shared/Loading'
import { GallerySkeleton } from '@/components/shared/Skeleton'
import { deleteGalleryImage, listGalleryImages, type GalleryImage } from '@/lib/storage'

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadGallery = async () => {
    try {
      setLoading(true)
      const items = await listGalleryImages('gallery')
      setImages(items)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load gallery.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadGallery()
  }, [])

  const handleUpload = async (image: GalleryImage) => {
    setImages((current) => [image, ...current])
  }

  const handleDelete = async (image: GalleryImage) => {
    try {
      const isDeleted = await deleteGalleryImage(image.path, 'gallery')
      if (!isDeleted) {
        setError('Unable to delete this image.')
        return
      }

      setImages((current) => current.filter((item) => item.path !== image.path))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete this image.')
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="rounded-[28px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-6">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Gallery</p>
        <h1 className="mt-3 text-3xl font-serif text-[var(--text-primary)]">Shared memories</h1>
      </div>

      <ImageUpload onUpload={handleUpload} />

      {error && <div className="rounded-[20px] border border-rose-200/20 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>}

      {loading ? (
        <>
          <GallerySkeleton />
          <LoadingState label="Fetching gallery..." />
        </>
      ) : images.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-white/10 bg-[var(--card-bg)] p-8 text-center text-[var(--text-secondary)]">
          No images yet. Add your first memory to start the gallery.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {images.map((image) => (
            <div key={image.id} className="overflow-hidden rounded-[24px] border border-white/10 bg-[var(--card-bg)] shadow-[0_18px_40px_rgba(0,0,0,0.14)]">
              <img src={image.url} alt={image.name} className="h-64 w-full object-cover" />
              <div className="flex items-center justify-between gap-3 p-4">
                <span className="text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                  {new Date(image.created_at).toLocaleDateString()}
                </span>
                <button
                  type="button"
                  onClick={() => void handleDelete(image)}
                  className="rounded-full border border-rose-200/30 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-200"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import ImageUpload from '@/components/shared/ImageUpload'
import { LoadingState } from '@/components/shared/Loading'
import { GallerySkeleton } from '@/components/shared/Skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Image as ImageIcon } from 'lucide-react'
import { deleteGalleryImage, listGalleryImages, type GalleryImage } from '@/lib/storage'
import { supabase } from '@/lib/supabase'

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [yearFilter, setYearFilter] = useState('all')
  const router = useRouter()

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

  const loadCoupleId = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('couple_links')
      .select('couple_id')
      .or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`)
      .eq('status', 'accepted')
      .maybeSingle()
    setCoupleId(data?.couple_id ?? null)
  }

  useEffect(() => {
    void loadGallery()
    void loadCoupleId()
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

  const years = useMemo(
    () => [...new Set(images.map((image) => new Date(image.created_at).getFullYear()))].sort((a, b) => b - a),
    [images]
  )
  const visibleImages = useMemo(
    () => yearFilter === 'all' ? images : images.filter((image) => new Date(image.created_at).getFullYear() === Number(yearFilter)),
    [images, yearFilter]
  )

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="rounded-modal border border-accent-1/20 bg-card p-6">
        <p className="text-xs uppercase tracking-[0.22em] text-text-2">Gallery</p>
        <h1 className="mt-3 text-3xl font-serif text-text-1">Shared memories</h1>
      </div>

      <ImageUpload onUpload={handleUpload} coupleId={coupleId ?? ''} />

      {error && <div className="rounded-btn border border-error/20 bg-error/10 p-4 text-sm text-error">{error}</div>}

      {loading ? (
        <>
          <GallerySkeleton />
          <LoadingState label="Fetching gallery..." />
        </>
      ) : images.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="Your gallery is ready for its first photo"
          description="Add a memory to begin building your shared gallery."
          action={{ label: 'Add your first memory', onClick: () => router.push('/memories') }}
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-text-2">{visibleImages.length} photos</p>
            <label className="flex items-center gap-2 text-sm text-text-2">
              <span>Year</span>
              <select
                value={yearFilter}
                onChange={(event) => setYearFilter(event.target.value)}
                className="rounded-full border border-accent-1/20 bg-card px-3 py-2 text-text-1"
                aria-label="Filter gallery by year"
              >
                <option value="all">All years</option>
                {years.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            </label>
          </div>
          {visibleImages.length === 0 ? (
            <p className="rounded-btn border border-dashed border-border bg-card p-6 text-center text-text-2">No photos from this year.</p>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleImages.map((image) => (
            <div key={image.id} className="overflow-hidden rounded-btn border border-border bg-card shadow-[0_18px_40px_rgba(0,0,0,0.14)]">
              <Image src={image.url} alt={`Shared photo from ${new Date(image.created_at).toLocaleDateString()}`} width={256} height={256} className="h-64 w-full object-cover" />
              <div className="flex items-center justify-between gap-3 p-4">
                <span className="text-xs uppercase tracking-[0.16em] text-text-2">
                  {new Date(image.created_at).toLocaleDateString()}
                </span>
                <button
                  type="button"
                  onClick={() => void handleDelete(image)}
                  className="rounded-pill border border-error/30 bg-error/10 px-3 py-1 text-xs font-medium text-error"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          </div>
        </>
      )}
    </div>
  )
}

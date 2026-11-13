'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import ImageUpload from '@/components/shared/ImageUpload'
import { LoadingState } from '@/components/shared/Loading'
import { GallerySkeleton } from '@/components/shared/Skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Image as ImageIcon, LayoutGrid, Calendar as CalendarIcon } from 'lucide-react'
import { deleteGalleryImage, listGalleryImages, type GalleryImage } from '@/lib/storage'
import { supabase } from '@/lib/supabase'
import { getDecryptedObjectUrl, revokeDecryptedUrl } from '@/lib/mediaEncryption'
import PhotoMediaCalendar from '@/components/shared/PhotoMediaCalendar'
import { useLanguage } from '@/contexts/LanguageContext'

export default function GalleryContent({ showUpload = true }: { showUpload?: boolean }) {
  const { t } = useLanguage()
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [yearFilter, setYearFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const imagesRef = useRef<GalleryImage[]>([])
  const router = useRouter()

  const loadGallery = async (activeCoupleId: string) => {
    try {
      setLoading(true)
      const items = await listGalleryImages(activeCoupleId)
      const decryptedItems = await Promise.all(items.map(async (item) => ({
        ...item,
        url: await getDecryptedObjectUrl(activeCoupleId, 'gallery', item.path, item.mimeType),
      })))
      imagesRef.current.forEach((image) => revokeDecryptedUrl('gallery', image.path))
      imagesRef.current = decryptedItems
      setImages(decryptedItems)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Gallery.loadError'))
    } finally {
      setLoading(false)
    }
  }

  const loadCoupleId = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setCurrentUserId(user.id)
    const { data } = await supabase
      .from('couple_links')
      .select('couple_id')
      .or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`)
      .eq('status', 'accepted')
      .maybeSingle()
    const activeCoupleId = data?.couple_id ?? null
    setCoupleId(activeCoupleId)
    if (activeCoupleId) await loadGallery(activeCoupleId)
    else {
      setError(t('Gallery.linkPartner'))
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadCoupleId()
    return () => imagesRef.current.forEach((image) => revokeDecryptedUrl('gallery', image.path))
    // The initial lookup is intentional; later refreshes use the resolved couple id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleUpload = async (image: GalleryImage) => {
    imagesRef.current = [image, ...imagesRef.current]
    setImages(imagesRef.current)
  }

  const handleDelete = async (image: GalleryImage) => {
    try {
      const isDeleted = await deleteGalleryImage(image.path, 'gallery')
      if (!isDeleted) {
        setError(t('Gallery.deleteError'))
        return
      }
      revokeDecryptedUrl('gallery', image.path)
      imagesRef.current = imagesRef.current.filter((item) => item.path !== image.path)
      setImages(imagesRef.current)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete this image.')
    }
  }

  const years = useMemo(() => [...new Set(images.map((image) => new Date(image.created_at).getFullYear()))].sort((a, b) => b - a), [images])
  const visibleImages = useMemo(() => yearFilter === 'all' ? images : images.filter((image) => new Date(image.created_at).getFullYear() === Number(yearFilter)), [images, yearFilter])

  return (
    <div className={showUpload ? 'space-y-6 p-4 md:p-6' : 'space-y-4'}>
      <div className="rounded-panel border border-accent-1/20 bg-card p-6">
        <p className="text-xs uppercase tracking-[0.22em] text-text-2">{t('Gallery.title')}</p>
        <h1 className="mt-2 text-xl font-serif text-text-1">{t('Gallery.subtitle')}</h1>
      </div>
      {showUpload && coupleId && <ImageUpload onUpload={handleUpload} coupleId={coupleId} />}
      {error && <div className="rounded-btn border border-error/20 bg-error/10 p-4 text-sm text-error">{error}</div>}
      {loading ? <><GallerySkeleton /><LoadingState label={t('Gallery.loading')} /></> : images.length === 0 ? (
        <EmptyState icon={ImageIcon} title={t('Gallery.noFirstPhoto')} description={t('Gallery.firstPhotoDescription')} action={{ label: t('Gallery.addFirstMemory'), onClick: () => router.push('/memories') }} />
      ) : <>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <p className="text-sm text-text-2">{visibleImages.length} {t('Gallery.photos')}</p>
            <div className="inline-flex rounded-full border border-accent-1/20 p-0.5 bg-card">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
                  viewMode === 'grid'
                    ? 'bg-accent-1 text-white font-semibold shadow-sm shadow-sm'
                    : 'text-text-2 hover:text-text-1'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>{t('Gallery.grid')}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
                  viewMode === 'calendar'
                    ? 'bg-accent-1 text-white font-semibold shadow-sm shadow-sm'
                    : 'text-text-2 hover:text-text-1'
                }`}
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                <span>{t('Gallery.calendar')}</span>
              </button>
            </div>
          </div>
          {viewMode === 'grid' && (
            <label className="flex items-center gap-2 text-sm text-text-2">
              <span>{t('Gallery.year')}</span>
              <select
                value={yearFilter}
                onChange={(event) => setYearFilter(event.target.value)}
                className="min-h-11 rounded-full border border-accent-1/20 bg-card px-3 py-2 text-text-1"
                aria-label={t('Gallery.filterYear')}
              >
                <option value="all">{t('Gallery.allYears')}</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {viewMode === 'calendar' ? (
          <PhotoMediaCalendar coupleId={coupleId} />
        ) : (
          <>
            {visibleImages.length === 0 ? <p className="rounded-btn border border-dashed border-border bg-card p-6 text-center text-text-2">{t('Gallery.noPhotosYear')}</p> : null}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {visibleImages.map((image) => (
                <div key={image.id} className="overflow-hidden rounded-card border border-border bg-card shadow-sm">
                  <Image src={image.url} alt={`${t('Gallery.title')} · ${new Date(image.created_at).toLocaleDateString()}`} width={256} height={256} unoptimized className="h-36 w-full object-cover sm:h-40 lg:h-44" />
                  <div className="flex items-center justify-between gap-3 p-4">
                    <span className="text-xs uppercase tracking-[0.16em] text-text-2">{new Date(image.created_at).toLocaleDateString()}</span>
                    {image.ownerId === currentUserId && (
                      <button type="button" onClick={() => void handleDelete(image)} className="min-h-11 min-w-11 rounded-pill border border-error/30 bg-error/10 px-3 py-1 text-xs font-medium text-error">
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </>}
    </div>
  )
}

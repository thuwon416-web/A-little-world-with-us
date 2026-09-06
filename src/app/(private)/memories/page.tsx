'use client'

import { Suspense, type ChangeEvent, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, X } from 'lucide-react'
import MemoryCard from '@/features/dashboard/MemoryCard'
import PhotoExport from '@/features/memories/PhotoExport'
import { isSupabaseConfigured, type Memory, supabase } from '@/lib/supabase'

const PAGE_SIZE = 6

type MemoryCategory = 'all' | 'favorite' | 'travel' | 'ritual' | 'journal'
type MemorySort = 'newest' | 'oldest'

const fallbackMemories: Memory[] = [
  {
    id: 1,
    image_url: '/images/first-date.jpg',
    caption: 'First Date',
    date: '2023-01-15',
    created_at: '2023-01-15T00:00:00.000Z',
    category: 'favorite',
  },
  {
    id: 2,
    image_url: '/images/vacation.jpg',
    caption: 'Vacation',
    date: '2023-06-20',
    created_at: '2023-06-20T00:00:00.000Z',
    category: 'travel',
  },
  {
    id: 3,
    image_url: '/images/hero-1.jpg',
    caption: 'Slow evening walk',
    date: '2024-02-10',
    created_at: '2024-02-10T00:00:00.000Z',
    category: 'ritual',
  },
  {
    id: 4,
    image_url: '/images/hero-2.jpg',
    caption: 'Little notes to each other',
    date: '2024-09-10',
    created_at: '2024-09-10T00:00:00.000Z',
    category: 'journal',
  },
]

type DisplayMemory = Memory & { displayUrl: string }

async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const maxDimension = 1600
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)

  const context = canvas.getContext('2d')
  if (!context) {
    bitmap.close()
    throw new Error('Unable to prepare image compression.')
  }

  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Image compression failed.'))),
      'image/webp',
      0.82
    )
  })
}

export default function MemoriesPage() {
  return (
    <Suspense fallback={<MemoriesSkeleton />}>
      <MemoriesPageContent />
    </Suspense>
  )
}

function MemoriesPageContent() {
  const [memories, setMemories] = useState<DisplayMemory[]>(
    fallbackMemories.map((memory) => ({ ...memory, displayUrl: memory.image_url }))
  )
  const [caption, setCaption] = useState('')
  const [memoryDate, setMemoryDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [memoryCategory, setMemoryCategory] = useState<MemoryCategory>('favorite')
  const [sortBy, setSortBy] = useState<MemorySort>('newest')
  const [filter, setFilter] = useState<MemoryCategory>('all')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [coupleLinkId, setCoupleLinkId] = useState<string | null>(null)
  const [selectedMemory, setSelectedMemory] = useState<DisplayMemory | null>(null)

  const sortedMemories = useMemo(() => {
    const filtered = memories.filter((memory) => {
      if (filter === 'all') return true
      return (memory.category ?? 'favorite') === filter
    })

    return [...filtered].sort((a, b) => {
      const dateA = new Date(a.date || a.created_at).getTime()
      const dateB = new Date(b.date || b.created_at).getTime()
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB
    })
  }, [filter, memories, sortBy])

  const visibleMemories = useMemo(
    () => sortedMemories.slice(0, visibleCount),
    [sortedMemories, visibleCount]
  )

  const birthdayReveal = useMemo(() => {
    const today = new Date()
    const isBirthday = today.getMonth() === 8 && today.getDate() === 10
    return isBirthday
      ? {
          title: 'Birthday reveal',
          text: 'September 10 is a little love day. Save a sweet surprise for KoKo and Pu Tuu.',
        }
      : null
  }, [])

  const loadMemories = async () => {
    if (!isSupabaseConfigured) return

    setIsLoading(true)
    setError('')
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      setError('Please sign in to load shared memories.')
      setIsLoading(false)
      return
    }

    const { data: link } = await supabase.from('couple_links').select('id').or(`inviter_id.eq.${userData.user.id},accepted_by.eq.${userData.user.id}`).eq('status', 'accepted').maybeSingle()
    setCoupleLinkId(link?.id ?? null)
    const { data, error: memoriesError } = await supabase
      .from('memories')
      .select('*')
      .order('date', { ascending: false })

    if (memoriesError) {
      setError(memoriesError.message)
      setIsLoading(false)
      return
    }

    const displayMemories = await Promise.all(
      (data as Memory[]).map(async (memory) => {
        if (memory.image_url.startsWith('/')) {
          return { ...memory, displayUrl: memory.image_url }
        }

        const { data: signedData, error: signedError } = await supabase.storage
          .from('memories')
          .createSignedUrl(memory.image_url, 60 * 60)

        return {
          ...memory,
          category: memory.category ?? 'favorite',
          displayUrl: signedError ? '' : signedData.signedUrl,
        }
      })
    )

    setMemories(displayMemories)
    setIsLoading(false)
  }

  useEffect(() => {
    loadMemories()
  }, [])

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [filter, sortBy])

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    setError('')

    if (!file) {
      setSelectedFile(null)
      return
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setSelectedFile(null)
      setError('Choose a JPEG, PNG, or WebP image.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setSelectedFile(null)
      setError('Images must be 10 MB or smaller before compression.')
      return
    }

    setSelectedFile(file)
  }

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedFile) {
      setError('Choose an image to upload.')
      return
    }

    setIsUploading(true)
    setError('')
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      setError('Please sign in before uploading a memory.')
      setIsUploading(false)
      return
    }

    try {
      const compressedImage = await compressImage(selectedFile)
      const path = `${userData.user.id}/${crypto.randomUUID()}.webp`
      const { error: uploadError } = await supabase.storage
        .from('memories')
        .upload(path, compressedImage, { contentType: 'image/webp', upsert: false })

      if (uploadError) {
        throw uploadError
      }

      if (!coupleLinkId) throw new Error('Link with your partner before adding a shared memory.')
      const { error: insertError } = await supabase.from('memories').insert({
        user_id: userData.user.id,
        couple_id: coupleLinkId,
        image_url: path,
        caption: caption.trim() || 'A memory together',
        date: memoryDate,
        category: memoryCategory,
        visibility: 'shared',
      })

      if (insertError) {
        await supabase.storage.from('memories').remove([path])
        throw insertError
      }

      setCaption('')
      setMemoryDate(new Date().toISOString().slice(0, 10))
      setSelectedFile(null)
      setMemoryCategory('favorite')
      await loadMemories()
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Memory upload failed.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (memory: DisplayMemory) => {
    if (!memory.user_id) {
      setError('This legacy memory cannot be deleted from Storage.')
      return
    }

    setError('')
    const { error: deleteError } = await supabase.from('memories').delete().eq('id', memory.id)
    if (deleteError) {
      setError(deleteError.message)
      return
    }

    if (!memory.image_url.startsWith('/')) {
      const { error: storageError } = await supabase.storage
        .from('memories')
        .remove([memory.image_url])
      if (storageError) {
        setError(storageError.message)
      }
    }

    setMemories((current) => current.filter((item) => item.id !== memory.id))
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <header>
        <h1 className="text-3xl font-serif text-[var(--text-primary)]">Our Memories</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Keep the moments that feel like home.
        </p>
      </header>

      {birthdayReveal && (
        <section className="glass-card rounded-[28px] border border-rose-400/30 bg-gradient-to-r from-rose-500/10 via-pink-500/10 to-amber-300/10 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">
            {birthdayReveal.title}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">
            Celebrate the everyday magic of us.
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">{birthdayReveal.text}</p>
        </section>
      )}

      <section className="glass-card p-5">
        <h2 className="text-xl text-[var(--text-primary)]">Add a memory</h2>
        <form className="mt-4 grid gap-3 md:grid-cols-[1.2fr_1fr_0.8fr_0.7fr_auto]" onSubmit={handleUpload}>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-3 py-2 text-sm text-[var(--text-primary)]"
          />
          <input
            type="text"
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            placeholder="Caption (optional)"
            className="rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-4 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-1)]"
          />
          <select
            value={memoryCategory}
            onChange={(event) => setMemoryCategory(event.target.value as MemoryCategory)}
            className="rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-1)]"
          >
            <option value="favorite">Favorite</option>
            <option value="travel">Travel</option>
            <option value="ritual">Ritual</option>
            <option value="journal">Journal</option>
          </select>
          <input type="date" value={memoryDate} onChange={(event) => setMemoryDate(event.target.value)} className="rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-3 py-2 text-sm text-[var(--text-primary)]" aria-label="Memory date" />
          <button
            type="submit"
            disabled={isUploading || !isSupabaseConfigured}
            className="rounded-2xl bg-[var(--button-bg)] px-5 py-2 text-sm font-medium text-[var(--text-primary)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </button>
        </form>
        {!isSupabaseConfigured && (
          <p className="mt-3 text-xs text-[var(--text-secondary)]">
            Configure Supabase to upload new memories.
          </p>
        )}
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      </section>

      <section className="glass-card p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {(['all', 'favorite', 'travel', 'ritual', 'journal'] as MemoryCategory[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFilter(option)}
                className={`rounded-full px-3 py-1.5 text-xs capitalize transition ${
                  filter === option
                    ? 'bg-[var(--button-bg)] text-[var(--text-primary)]'
                    : 'bg-[var(--bg-2)] text-[var(--text-secondary)]'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as MemorySort)}
            className="rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-3 py-2 text-sm text-[var(--text-primary)]"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
      </section>

      <PhotoExport photos={memories.map(memory => ({
        id: memory.id.toString(),
        url: memory.displayUrl,
        filename: memory.caption || 'memory.jpg',
        created_at: memory.created_at
      }))} />

      {isLoading && <p className="text-sm text-[var(--text-secondary)]">Loading memories...</p>}
      <section className="grid gap-4 md:grid-cols-2">
        {visibleMemories.map((memory, index) => (
          <div key={memory.id} className="relative">
            {memory.displayUrl ? (
              <MemoryCard
                id={memory.id}
                imageUrl={memory.displayUrl}
                caption={memory.caption ?? 'Memory'}
                date={memory.date}
                index={index}
                onOpen={() => setSelectedMemory(memory)}
              />
            ) : (
              <button type="button" onClick={() => setSelectedMemory(memory)} className="glass-card w-full bg-gradient-to-br from-[var(--accent-1)]/25 via-[var(--bg-2)] to-[var(--accent-2)]/20 p-6 text-left"><p className="font-serif text-xl text-[var(--text-primary)]">{memory.caption || 'A moment together'}</p><p className="mt-2 text-sm text-[var(--text-secondary)]">{new Date(memory.date).toLocaleDateString()}</p></button>
            )}
            {memory.category && (
              <span className="absolute left-3 top-3 rounded-full bg-black/50 px-2 py-1 text-[10px] uppercase tracking-[0.15em] text-white">
                {memory.category}
              </span>
            )}
            {memory.user_id && (
              <button
                type="button"
                onClick={() => handleDelete(memory)}
                className="absolute right-3 top-3 rounded-full bg-red-500/80 px-3 py-1 text-xs text-white hover:bg-red-500"
              >
                Delete
              </button>
            )}
          </div>
        ))}
      </section>

      {visibleCount < sortedMemories.length && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}
            className="rounded-full border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-5 py-2 text-sm text-[var(--text-primary)]"
          >
            Load more memories
          </button>
        </div>
      )}
      {!isLoading && sortedMemories.length === 0 && <section className="glass-card flex min-h-56 flex-col items-center justify-center p-6 text-center"><Heart className="h-9 w-9 text-[var(--accent-1)]" /><p className="mt-4 text-lg text-[var(--text-primary)]">No memories yet. Start creating your little world together!</p></section>}
      {selectedMemory && <MemoryDetail memory={selectedMemory} onClose={() => setSelectedMemory(null)} />}
    </main>
  )
}

function MemoryDetail({ memory, onClose }: { memory: DisplayMemory; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Memory details"><motion.section initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card max-h-[90vh] w-full max-w-2xl overflow-y-auto p-4"><div className="flex justify-end"><button type="button" onClick={onClose} className="rounded-full p-2 text-[var(--text-secondary)] hover:bg-white/10" aria-label="Close"><X className="h-5 w-5" /></button></div>{memory.displayUrl ? <img src={memory.displayUrl} alt={memory.caption || 'Memory'} className="max-h-[55vh] w-full rounded-2xl object-cover" /> : <div className="h-64 rounded-2xl bg-gradient-to-br from-[var(--accent-1)]/25 via-[var(--bg-2)] to-[var(--accent-2)]/20" />}<div className="p-3"><p className="text-xs uppercase tracking-[0.16em] text-[var(--accent-2)]">{memory.category || 'favorite'} · {new Date(memory.date).toLocaleDateString()}</p><h2 className="mt-2 text-3xl font-serif text-[var(--text-primary)]">{memory.caption || 'A moment together'}</h2></div></motion.section></div>
}

function MemoriesSkeleton() {
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="h-8 w-48 animate-pulse rounded-full bg-[var(--card-bg-strong)]" />
      <div className="h-20 animate-pulse rounded-3xl bg-[var(--card-bg-strong)]" />
      <div className="h-12 animate-pulse rounded-full bg-[var(--card-bg-strong)]" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-60 animate-pulse rounded-3xl bg-[var(--card-bg-strong)]" />
        <div className="h-60 animate-pulse rounded-3xl bg-[var(--card-bg-strong)]" />
        <div className="h-60 animate-pulse rounded-3xl bg-[var(--card-bg-strong)]" />
      </div>
    </main>
  )
}

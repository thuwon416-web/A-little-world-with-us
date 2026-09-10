'use client'
/* eslint-disable @next/next/no-img-element -- Supabase signed image URLs are user-provided and can expire. */

import { Suspense, type ChangeEvent, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Heart, X } from 'lucide-react'
import MemoryCard from '@/features/dashboard/MemoryCard'
import { isSupabaseConfigured, type Memory, supabase } from '@/lib/supabase'
import ExplicitAdviceControl from '@/features/ai-guardian/ExplicitAdviceControl'

const MemoryCurationAI = dynamic(
  () => import('@/features/memories/MemoryCurationAI'),
  {
    ssr: false,
    loading: () => <div className="h-64 animate-pulse rounded-2xl bg-[var(--card-bg-strong)]" />,
  }
)

const PAGE_SIZE = 6

type MemoryCategory = 'all' | 'favorite' | 'travel' | 'ritual' | 'journal'
type MemorySort = 'newest' | 'oldest'

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
  const [memories, setMemories] = useState<DisplayMemory[]>([])
  const [caption, setCaption] = useState('')
  const [memoryDate, setMemoryDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [memoryCategory, setMemoryCategory] = useState<MemoryCategory>('favorite')
  const [sortBy, setSortBy] = useState<MemorySort>('newest')
  const [filter, setFilter] = useState<MemoryCategory>('all')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSummary, setUploadSummary] = useState('')
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

    const { data: link } = await supabase.from('couple_links').select('couple_id').or(`inviter_id.eq.${userData.user.id},accepted_by.eq.${userData.user.id}`).eq('status', 'accepted').maybeSingle()
    setCoupleLinkId(link?.couple_id ?? null)
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
        if (memory.image_url?.startsWith('/')) {
          return { ...memory, displayUrl: memory.image_url ?? '' }
        }

        const { data: signedData, error: signedError } = await supabase.storage
          .from('memories')
          .createSignedUrl(memory.storage_path ?? memory.image_url ?? '', 60 * 60)

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
    const files = Array.from(event.target.files ?? [])
    setError('')
    setUploadSummary('')

    if (!files.length) {
      setSelectedFiles([])
      return
    }

    const invalidFile = files.find((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    if (invalidFile) {
      setSelectedFiles([])
      setError(`${invalidFile.name}: choose a JPEG, PNG, or WebP image.`)
      return
    }

    const oversizedFile = files.find((file) => file.size > 10 * 1024 * 1024)
    if (oversizedFile) {
      setSelectedFiles([])
      setError(`${oversizedFile.name}: images must be 10 MB or smaller before compression.`)
      return
    }

    setSelectedFiles(files)
  }

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedFiles.length) {
      setError('Choose at least one image to upload.')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setUploadSummary('')
    setError('')
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      setError('Please sign in before uploading a memory.')
      setIsUploading(false)
      return
    }

    try {
      if (!coupleLinkId) throw new Error('Link with your partner before adding a shared memory.')
      let uploadedCount = 0
      const uploadErrors: string[] = []
      for (const file of selectedFiles) {
        try {
          const compressedImage = await compressImage(file)
          const path = `${userData.user.id}/${crypto.randomUUID()}.webp`
          const { error: uploadError } = await supabase.storage.from('memories').upload(path, compressedImage, { contentType: 'image/webp', upsert: false })
          if (uploadError) throw uploadError
          const { error: insertError } = await supabase.from('memories').insert({
            user_id: userData.user.id,
            couple_id: coupleLinkId,
            image_url: path,
            storage_path: path,
            title: caption.trim() || 'A memory together',
            caption: caption.trim() || 'A memory together',
            date: memoryDate,
            category: memoryCategory,
            visibility: 'shared',
          })
          if (insertError) {
            await supabase.storage.from('memories').remove([path])
            throw insertError
          }
          uploadedCount += 1
        } catch (fileError) {
          uploadErrors.push(`${file.name}: ${fileError instanceof Error ? fileError.message : 'upload failed'}`)
        } finally {
          setUploadProgress(Math.round(((uploadedCount + uploadErrors.length) / selectedFiles.length) * 100))
        }
      }
      setCaption('')
      setMemoryDate(new Date().toISOString().slice(0, 10))
      setSelectedFiles([])
      setMemoryCategory('favorite')
      setUploadSummary(`${uploadedCount} ${uploadedCount === 1 ? 'photo' : 'photos'} uploaded${uploadErrors.length ? `; ${uploadErrors.length} failed` : ''}.`)
      if (uploadErrors.length) setError(uploadErrors.join(' '))
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

    if (memory.image_url && !memory.image_url.startsWith('/')) {
      const { error: storageError } = await supabase.storage
        .from('memories')
        .remove([memory.storage_path ?? memory.image_url])
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

      <ExplicitAdviceControl
        title="Talk through a memory"
        description="Choose a memory and ask for a gentle, two-sided reflection."
        placeholder="What happened, and what would you like help understanding?"
      />

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
            multiple
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
            {isUploading ? `Uploading ${uploadProgress}%` : 'Upload'}
          </button>
        </form>
        {isUploading ? <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--bg-2)]" role="progressbar" aria-valuenow={uploadProgress} aria-valuemin={0} aria-valuemax={100}><div className="h-full bg-[var(--accent-1)] transition-all" style={{ width: `${uploadProgress}%` }} /></div> : null}
        {!isSupabaseConfigured && (
          <p className="mt-3 text-xs text-[var(--text-secondary)]">
            Configure Supabase to upload new memories.
          </p>
        )}
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        {uploadSummary && <p className="mt-3 text-sm text-emerald-400">{uploadSummary}</p>}
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

      <MemoryCurationAI memories={memories.map((memory) => ({ id: memory.id, title: memory.title ?? memory.caption ?? 'A memory together', date: memory.date }))} />

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
      {selectedMemory && <MemoryDetail memory={selectedMemory} onClose={() => setSelectedMemory(null)} onSaved={(updated) => {
        setMemories((current) => current.map((memory) => memory.id === updated.id ? { ...memory, ...updated } : memory))
        setSelectedMemory((current) => current?.id === updated.id ? { ...current, ...updated } : current)
      }} />}
    </main>
  )
}

function MemoryDetail({ memory, onClose, onSaved }: { memory: DisplayMemory; onClose: () => void; onSaved: (memory: Partial<DisplayMemory> & { id: string }) => void }) {
  const [title, setTitle] = useState(memory.title ?? memory.caption ?? '')
  const [date, setDate] = useState(memory.date)
  const [category, setCategory] = useState<Exclude<MemoryCategory, 'all'>>((memory.category as Exclude<MemoryCategory, 'all'>) ?? 'favorite')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const save = async () => {
    setSaving(true); setSaveError('')
    const { error } = await supabase.from('memories').update({ title: title.trim() || 'A memory together', caption: title.trim() || 'A memory together', date, category }).eq('id', memory.id)
    if (error) setSaveError(error.message)
    else onSaved({ id: memory.id, title, caption: title, date, category })
    setSaving(false)
  }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Memory details"><motion.section initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card max-h-[90vh] w-full max-w-2xl overflow-y-auto p-4"><div className="flex justify-end"><button type="button" onClick={onClose} className="rounded-full p-2 text-[var(--text-secondary)] hover:bg-white/10" aria-label="Close"><X className="h-5 w-5" /></button></div>{memory.displayUrl ? <div className="relative h-[55vh] w-full overflow-hidden rounded-2xl"><Image src={memory.displayUrl} alt={memory.caption || 'Memory'} fill sizes="(max-width: 768px) 100vw, 672px" className="object-cover" /></div> : <div className="h-64 rounded-2xl bg-gradient-to-br from-[var(--accent-1)]/25 via-[var(--bg-2)] to-[var(--accent-2)]/20" />}<div className="space-y-3 p-3"><input value={title} onChange={(event) => setTitle(event.target.value)} aria-label="Memory title" className="w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-3 py-2 text-lg font-serif text-[var(--text-primary)]" /><div className="grid gap-2 sm:grid-cols-2"><input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="rounded-xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-3 py-2 text-sm text-[var(--text-primary)]" /><select value={category} onChange={(event) => setCategory(event.target.value as Exclude<MemoryCategory, 'all'>)} className="rounded-xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-3 py-2 text-sm text-[var(--text-primary)]"><option value="favorite">Favorite</option><option value="travel">Travel</option><option value="ritual">Ritual</option><option value="journal">Journal</option></select></div>{saveError && <p className="text-sm text-red-400">{saveError}</p>}<button type="button" onClick={save} disabled={saving} className="rounded-xl bg-[var(--button-bg)] px-4 py-2 text-sm text-[var(--text-primary)] disabled:opacity-50">{saving ? 'Saving...' : 'Save changes'}</button></div></motion.section></div>
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

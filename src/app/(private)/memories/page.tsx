'use client'
/* eslint-disable @next/next/no-img-element -- Supabase signed image URLs are user-provided and can expire. */

import { type ChangeEvent, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Frown, Heart, Meh, Pencil, Smile, Sparkles, Square, Trash2, TriangleAlert, Volume2, X } from 'lucide-react'
import MemoryCard from '@/features/dashboard/MemoryCard'
import MemorySlideshow from '@/features/memories/MemorySlideshow'
import SlideshowLaunchButton from '@/features/memories/SlideshowLaunchButton'
const MemoryLocationPicker = dynamic(() => import('@/features/memories/MemoryLocationPicker'), { ssr: false })
import { isSupabaseConfigured, type Memory, supabase } from '@/lib/supabase'
import ExplicitAdviceControl from '@/features/ai-guardian/ExplicitAdviceControl'
import { validateUpload } from '@/lib/upload-validation'
import { encryptAndUpload, getCachedDecryptedUrl } from '@/lib/mediaEncryption'

const MemoryCurationAI = dynamic(
  () => import('@/features/memories/MemoryCurationAI'),
  {
    ssr: false,
    loading: () => <div className="h-64 animate-pulse rounded-btn bg-card" />,
  }
)
const MemoryMapContent = dynamic(
  () => import('@/app/(private)/memories/map/page'),
  { ssr: false, loading: () => <div className="h-96 animate-pulse rounded-panel bg-card" /> }
)
const OurStoryContent = dynamic(
  () => import('@/app/(private)/our-story/page'),
  { ssr: false, loading: () => <div className="h-96 animate-pulse rounded-panel bg-card" /> }
)
const GalleryContent = dynamic(
  () => import('@/app/(private)/gallery/page'),
  { ssr: false, loading: () => <div className="h-96 animate-pulse rounded-panel bg-card" /> }
)
const TimeCapsulesContent = dynamic(
  () => import('@/app/(private)/time-capsules/page'),
  { ssr: false, loading: () => <div className="h-96 animate-pulse rounded-panel bg-card" /> }
)

const PAGE_SIZE = 6

type MemoryCategory = 'all' | 'favorite' | 'travel' | 'ritual' | 'journal'
type MemorySort = 'newest' | 'oldest'

type DisplayMemory = Memory & { displayUrl: string; mime_type?: string | null }
type JournalMemory = DisplayMemory & {
  metadata?: { mood_tag?: string; ai_reflection?: string } | null
}
type JournalMood = 'happy' | 'okay' | 'sad' | 'loved' | 'anxious'
const JOURNAL_MOODS: { id: JournalMood; label: string; Icon: typeof Smile }[] = [
  { id: 'happy', label: 'Happy', Icon: Smile },
  { id: 'okay', label: 'Okay', Icon: Meh },
  { id: 'sad', label: 'Sad', Icon: Frown },
  { id: 'loved', label: 'Loved', Icon: Heart },
  { id: 'anxious', label: 'Anxious', Icon: TriangleAlert },
]

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
  return <MemoriesPageContent />
}

function MemoriesPageContent() {
  const [memories, setMemories] = useState<JournalMemory[]>([])
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
  const [isSlideshowOpen, setIsSlideshowOpen] = useState(false)
  const [isLocationOpen, setIsLocationOpen] = useState(false)
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [locationLabel, setLocationLabel] = useState('')
  const [journalModalOpen, setJournalModalOpen] = useState(false)
  const [editingJournalId, setEditingJournalId] = useState<string | null>(null)
  const [journalTitle, setJournalTitle] = useState('')
  const [journalBody, setJournalBody] = useState('')
  const [journalMood, setJournalMood] = useState<JournalMood>('okay')
  const [journalSaving, setJournalSaving] = useState(false)
  const [reflectingId, setReflectingId] = useState<string | null>(null)
  const [speakingJournalId, setSpeakingJournalId] = useState<string | null>(null)

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

    const { data: link, error: linkError } = await supabase.from('couple_links').select('couple_id').or(`inviter_id.eq.${userData.user.id},accepted_by.eq.${userData.user.id}`).eq('status', 'accepted').maybeSingle()
    if (linkError) {
      setError(linkError.message)
      setIsLoading(false)
      return
    }
    setCoupleLinkId(link?.couple_id ?? null)
    if (!link?.couple_id) {
      setMemories([])
      setIsLoading(false)
      return
    }
    const { data, error: memoriesError } = await supabase
      .from('memories')
      .select('*,mime_type')
      .eq('couple_id', link.couple_id)
      .order('date', { ascending: false })

    if (memoriesError) {
      setError(memoriesError.message)
      setIsLoading(false)
      return
    }

    const displayMemories = await Promise.all(
      (data as Memory[]).map(async (memory) => {
        const path = memory.storage_path ?? memory.image_url ?? ''
        if (!path || path.startsWith('/')) {
          return { ...memory, displayUrl: memory.image_url ?? '', mime_type: memory.mime_type }
        }

        if (path.startsWith('http://') || path.startsWith('https://')) {
          return { ...memory, displayUrl: path, mime_type: memory.mime_type }
        }

        if (!link?.couple_id) {
          const { data: signedData, error: signedError } = await supabase.storage
            .from('memories')
            .createSignedUrl(path, 60 * 60)
          return {
            ...memory,
            category: memory.category ?? 'favorite',
            displayUrl: signedError ? '' : signedData.signedUrl,
            mime_type: memory.mime_type,
          }
        }

        const mimeType = memory.mime_type || 'image/jpeg'
        const displayUrl = await getCachedDecryptedUrl(link.couple_id, 'memories', path, mimeType)

        return {
          ...memory,
          category: memory.category ?? 'favorite',
          displayUrl,
          mime_type: memory.mime_type,
        }
      })
    )

    setMemories(displayMemories)
    setIsLoading(false)
  }

  useEffect(() => {
    loadMemories()
  }, [])
  useEffect(() => () => {
    if (typeof window !== 'undefined') window.speechSynthesis.cancel()
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

    const invalidFile = files
      .map((file) => ({ file, validation: validateUpload(file, { imagesOnly: true }) }))
      .find(({ validation }) => !validation.valid)
    if (invalidFile) {
      setSelectedFiles([])
      setError(invalidFile.validation.error ?? 'Unsupported image file.')
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
          const { path: storedPath, mimeType } = await encryptAndUpload(
            compressedImage,
            coupleLinkId,
            'memories',
            path
          )
          const { error: insertError } = await supabase.from('memories').insert({
            user_id: userData.user.id,
            couple_id: coupleLinkId,
            image_url: storedPath,
            storage_path: storedPath,
            mime_type: mimeType,
            title: caption.trim() || 'A memory together',
            caption: caption.trim() || 'A memory together',
            date: memoryDate,
            category: memoryCategory,
            visibility: 'shared',
            latitude: location?.latitude ?? null,
            longitude: location?.longitude ?? null,
            location_label: locationLabel.trim() || null,
          })
          if (insertError) {
            await supabase.storage.from('memories').remove([storedPath])
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
      setLocation(null)
      setLocationLabel('')
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

  const openNewJournal = () => {
    setEditingJournalId(null)
    setJournalTitle('')
    setJournalBody('')
    setJournalMood('okay')
    setJournalModalOpen(true)
  }

  const openEditJournal = (memory: JournalMemory) => {
    setEditingJournalId(memory.id)
    setJournalTitle(memory.title ?? memory.caption ?? '')
    setJournalBody(memory.description ?? '')
    const tag = memory.metadata?.mood_tag
    setJournalMood(JOURNAL_MOODS.some((mood) => mood.id === tag) ? (tag as JournalMood) : 'okay')
    setJournalModalOpen(true)
  }

  const closeJournalModal = () => {
    setJournalModalOpen(false)
    setEditingJournalId(null)
    setJournalTitle('')
    setJournalBody('')
    setJournalMood('okay')
  }

  const saveJournal = async () => {
    if (!journalTitle.trim() || journalSaving) return
    setJournalSaving(true)
    setError('')
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData.user) throw new Error('Please sign in before saving a journal entry.')
      if (!coupleLinkId) throw new Error('Link with your partner before adding a journal entry.')
      const payload = {
        couple_id: coupleLinkId,
        user_id: userData.user.id,
        title: journalTitle.trim(),
        description: journalBody.trim() || null,
        category: 'journal' as const,
        date: new Date().toISOString().slice(0, 10),
        metadata: { mood_tag: journalMood },
      }
      const query = editingJournalId
        ? supabase.from('memories').update(payload).eq('id', editingJournalId).select().single()
        : supabase.from('memories').insert(payload).select().single()
      const { data, error: saveError } = await query
      if (saveError) throw new Error(saveError.message)
      const saved = data as JournalMemory
      setMemories((current) =>
        editingJournalId
          ? current.map((memory) => (memory.id === editingJournalId ? { ...memory, ...saved } : memory))
          : [saved, ...current]
      )
      closeJournalModal()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save journal entry.')
    } finally {
      setJournalSaving(false)
    }
  }

  const deleteJournal = (memory: JournalMemory) => {
    if (!window.confirm(`Delete journal entry "${memory.title}"?`)) return
    void handleDelete(memory)
  }

  const requestReflection = async (memory: JournalMemory) => {
    if (reflectingId) return
    setReflectingId(memory.id)
    setError('')
    try {
      const response = await fetch('/api/ai/journal-reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ journal_id: memory.id }),
      })
      const body = (await response.json()) as { reflection?: string; error?: string }
      if (!response.ok || !body.reflection) throw new Error(body.error || 'Reflection failed.')
      setMemories((current) => current.map((item) =>
        item.id === memory.id
          ? { ...item, metadata: { ...(item.metadata ?? {}), ai_reflection: body.reflection } }
          : item
      ))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to reflect right now.')
    } finally {
      setReflectingId(null)
    }
  }
  const speakReflection = (memory: JournalMemory) => {
    const text = memory.metadata?.ai_reflection
    if (!text || typeof window === 'undefined' || !window.speechSynthesis) return
    if (speakingJournalId === memory.id) {
      window.speechSynthesis.cancel()
      setSpeakingJournalId(null)
      return
    }
    window.speechSynthesis.cancel()
    setSpeakingJournalId(memory.id)
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = /[\uAC00-\uD7AF]/.test(text) ? 'ko-KR' : 'en-US'
    utterance.rate = 0.95
    utterance.onend = () => setSpeakingJournalId(null)
    utterance.onerror = () => setSpeakingJournalId(null)
    window.speechSynthesis.speak(utterance)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-serif text-text-1">Our Memories</h1>
        <p className="mt-2 text-sm text-text-2">
          Keep the moments that feel like home.
        </p>
        </div>
        <SlideshowLaunchButton memories={memories} onClick={() => setIsSlideshowOpen(true)} />
      </header>

      {birthdayReveal && (
        <section className="glass-card rounded-modal border border-error/30 bg-gradient-to-r from-error/10 via-accent-1/10 to-warning/10 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-text-2">
            {birthdayReveal.title}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-text-1">
            Celebrate the everyday magic of us.
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-text-2">{birthdayReveal.text}</p>
        </section>
      )}

      <section className="glass-card p-5">
        <h2 className="text-xl text-text-1">Add a memory</h2>
        <form className="mt-4 grid gap-3 md:grid-cols-[1.2fr_1fr_0.8fr_0.7fr_auto]" onSubmit={handleUpload}>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFileChange}
            className="rounded-btn border border-accent-1/20 bg-soft-tint px-3 py-2 text-sm text-text-1"
          />
          <input
            type="text"
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            placeholder="Caption (optional)"
            className="rounded-btn border border-accent-1/20 bg-soft-tint px-4 py-2 text-sm text-text-1 outline-none focus:border-accent-1"
          />
          <select
            value={memoryCategory}
            onChange={(event) => setMemoryCategory(event.target.value as MemoryCategory)}
            className="rounded-btn border border-accent-1/20 bg-soft-tint px-3 py-2 text-sm text-text-1 outline-none focus:border-accent-1"
          >
            <option value="favorite">Favorite</option>
            <option value="travel">Travel</option>
            <option value="ritual">Ritual</option>
            <option value="journal">Journal</option>
          </select>
          <input type="date" value={memoryDate} onChange={(event) => setMemoryDate(event.target.value)} className="rounded-btn border border-accent-1/20 bg-soft-tint px-3 py-2 text-sm text-text-1" aria-label="Memory date" />
          <button type="button" onClick={() => setIsLocationOpen(true)} className="rounded-btn border border-accent-1/20 px-3 py-2 text-sm text-text-1">{location ? 'Location added' : 'Add location (optional)'}</button>
          <button
            type="submit"
            disabled={isUploading || !isSupabaseConfigured}
            className="rounded-btn bg-accent-1 px-5 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUploading ? `Uploading ${uploadProgress}%` : 'Upload'}
          </button>
        </form>
        {isUploading ? <div className="mt-3 h-2 overflow-hidden rounded-full bg-soft-tint" role="progressbar" aria-valuenow={uploadProgress} aria-valuemin={0} aria-valuemax={100}><div className="h-full bg-accent-1 transition-all" style={{ width: `${uploadProgress}%` }} /></div> : null}
        {!isSupabaseConfigured && (
          <p className="mt-3 text-xs text-text-2">
            Configure Supabase to upload new memories.
          </p>
        )}
        {error && <p className="mt-3 text-sm text-error">{error}</p>}
        {uploadSummary && <p className="mt-3 text-sm text-success">{uploadSummary}</p>}
      </section>
      {isLocationOpen ? <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4"><div className="w-full max-w-xl space-y-4 rounded-panel bg-card p-5"><div className="flex items-center justify-between"><h2 className="text-lg text-text-1">Memory location</h2><button type="button" onClick={() => setIsLocationOpen(false)} className="text-sm text-text-2">Close</button></div><MemoryLocationPicker value={location} onChange={setLocation} /><button type="button" onClick={() => navigator.geolocation.getCurrentPosition((position) => setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude }), () => setError('Unable to read your current location.'))} className="rounded-xl border border-accent-1/20 px-3 py-2 text-sm text-text-1">Use current location</button><input value={locationLabel} onChange={(event) => setLocationLabel(event.target.value)} placeholder="Label (optional, e.g. Home or Cafe)" className="w-full rounded-xl border border-accent-1/20 bg-soft-tint px-3 py-2 text-sm text-text-1" /><button type="button" onClick={() => setIsLocationOpen(false)} className="rounded-xl bg-accent-1 px-4 py-2 text-sm text-white">Save location</button></div></div> : null}

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
                    ? 'bg-accent-1 text-white'
                    : 'bg-soft-tint text-text-2'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          {filter === 'journal' ? (
            <button
              type="button"
              onClick={openNewJournal}
              className="rounded-btn bg-accent-1 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              New journal entry
            </button>
          ) : null}
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as MemorySort)}
            className="rounded-btn border border-accent-1/20 bg-soft-tint px-3 py-2 text-sm text-text-1"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
      </section>

      <MemoryCurationAI memories={memories.map((memory) => ({ id: memory.id, title: memory.title ?? memory.caption ?? 'A memory together', date: memory.date }))} />

      {isLoading && <p className="text-sm text-text-2">Loading memories...</p>}
      <section className="grid gap-4 md:grid-cols-2">
        {visibleMemories.map((memory, index) => (
          memory.category === 'journal' ? (
            <article key={memory.id} className="glass-card relative space-y-3 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="font-semibold text-text-1">{memory.title}</h3>
                  <p className="mt-1 text-xs text-text-2">{memory.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  {memory.metadata?.mood_tag ? (() => {
                    const mood = JOURNAL_MOODS.find((item) => item.id === memory.metadata?.mood_tag) ??
                      JOURNAL_MOODS.find((item) => item.id === 'okay')
                    if (!mood) return null
                    const MoodIcon = mood.Icon
                    return <MoodIcon className="h-5 w-5 text-accent-1" aria-label={mood.label} />
                  })() : null}
                  <button type="button" onClick={() => openEditJournal(memory)} className="text-accent-1" aria-label="Edit journal entry">
                    <Pencil className="h-5 w-5" />
                  </button>
                  <button type="button" onClick={() => deleteJournal(memory)} className="text-error" aria-label="Delete journal entry">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
              {memory.description ? <p className="line-clamp-2 text-sm text-text-2">{memory.description}</p> : null}
              {memory.metadata?.ai_reflection ? (
                <div className="rounded-xl border border-accent-1/20 bg-soft-tint p-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-accent-1">
                    <Sparkles className="h-4 w-4" />
                    AI reflection
                    <button type="button" onClick={() => speakReflection(memory)} aria-label="Read AI reflection aloud">
                      {speakingJournalId === memory.id
                        ? <Square className="h-4 w-4" />
                        : <Volume2 className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-text-1">{memory.metadata.ai_reflection}</p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => void requestReflection(memory)}
                  disabled={reflectingId !== null}
                  className="inline-flex items-center gap-2 rounded-full border border-accent-1/20 px-3 py-2 text-sm text-accent-1 disabled:opacity-50"
                >
                  {reflectingId === memory.id ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-1 border-t-transparent" /> : <Sparkles className="h-4 w-4" />}
                  {reflectingId === memory.id ? 'Reflecting...' : 'Reflect with AI'}
                </button>
              )}
            </article>
          ) : (
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
                <button type="button" onClick={() => setSelectedMemory(memory)} className="glass-card w-full bg-gradient-to-br from-accent-1/25 via-soft-tint to-accent-2/20 p-6 text-left"><p className="font-serif text-xl text-text-1">{memory.caption || 'A moment together'}</p><p className="mt-2 text-sm text-text-2">{new Date(memory.date).toLocaleDateString()}</p></button>
              )}
              {memory.category && (
                <span className="absolute left-3 top-3 rounded-full bg-black/50 px-2 py-1 text-[10px] uppercase tracking-[0.15em] text-text-1">
                  {memory.category}
                </span>
              )}
              {memory.user_id && (
                <button
                  type="button"
                  onClick={() => handleDelete(memory)}
                  className="absolute right-3 top-3 rounded-full bg-error/80 px-3 py-1 text-xs text-text-1 hover:bg-error"
                >
                  Delete
                </button>
              )}
            </div>
          )
        ))}
      </section>

      {visibleCount < sortedMemories.length && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}
            className="rounded-full border border-accent-1/20 bg-soft-tint px-5 py-2 text-sm text-text-1"
          >
            Load more memories
          </button>
        </div>
      )}
      {!isLoading && sortedMemories.length === 0 && <section className="glass-card flex min-h-56 flex-col items-center justify-center p-6 text-center"><Heart className="h-9 w-9 text-accent-1" /><p className="mt-4 text-lg text-text-1">No memories yet. Start creating your little world together!</p></section>}
      {isSlideshowOpen ? <MemorySlideshow memories={memories} onClose={() => setIsSlideshowOpen(false)} coupleId={coupleLinkId ?? ''} /> : null}
      {selectedMemory && <MemoryDetail memory={selectedMemory} onClose={() => setSelectedMemory(null)} onSaved={(updated) => {
        setMemories((current) => current.map((memory) => memory.id === updated.id ? { ...memory, ...updated } : memory))
        setSelectedMemory((current) => current?.id === updated.id ? { ...current, ...updated } : current)
      }} />}
      {journalModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={editingJournalId ? 'Edit journal entry' : 'New journal entry'}>
          <section className="glass-card w-full max-w-xl space-y-4 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-1">{editingJournalId ? 'Edit journal entry' : 'New journal entry'}</h2>
              <button type="button" onClick={closeJournalModal} className="rounded-full p-2 text-text-2 hover:bg-card/10" aria-label="Close journal modal"><X className="h-5 w-5" /></button>
            </div>
            <input value={journalTitle} onChange={(event) => setJournalTitle(event.target.value)} placeholder="Title" className="w-full rounded-xl border border-accent-1/20 bg-soft-tint px-3 py-2 text-text-1" />
            <textarea value={journalBody} onChange={(event) => setJournalBody(event.target.value)} placeholder="Write your thoughts..." rows={5} className="w-full resize-y rounded-xl border border-accent-1/20 bg-soft-tint px-3 py-2 text-text-1" />
            <div>
              <p className="mb-2 text-sm font-medium text-text-1">How are you feeling?</p>
              <div className="flex flex-wrap gap-2">
                {JOURNAL_MOODS.map(({ id, label, Icon }) => {
                  const selected = journalMood === id
                  return (
                    <button key={id} type="button" onClick={() => setJournalMood(id)} className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm ${selected ? 'border-accent-1 bg-accent-1 text-white' : 'border-accent-1/20 text-text-2'}`}>
                      <Icon className="h-5 w-5" />
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={closeJournalModal} className="rounded-xl px-4 py-2 text-sm text-text-2">Cancel</button>
              <button type="button" onClick={() => void saveJournal()} disabled={journalSaving || !journalTitle.trim()} className="rounded-xl bg-accent-1 px-4 py-2 text-sm text-white disabled:opacity-50">{journalSaving ? 'Saving...' : 'Save'}</button>
            </div>
          </section>
        </div>
      ) : null}
      <section aria-labelledby="our-story-heading" className="border-t border-border/30 pt-8">
        <h2 id="our-story-heading" className="mb-4 text-2xl font-serif text-text-1">Our Story</h2>
        <OurStoryContent />
      </section>
      <section aria-labelledby="photo-memories-heading" className="border-t border-border/30 pt-8">
        <h2 id="photo-memories-heading" className="mb-4 text-2xl font-serif text-text-1">Photo memories</h2>
        <GalleryContent />
      </section>
      <section aria-labelledby="places-heading" className="border-t border-border/30 pt-8">
        <h2 id="places-heading" className="mb-4 text-2xl font-serif text-text-1">Places we remember</h2>
        <MemoryMapContent />
      </section>
      <section aria-labelledby="capsules-heading" className="border-t border-border/30 pt-8">
        <h2 id="capsules-heading" className="mb-4 text-2xl font-serif text-text-1">Time capsules</h2>
        <TimeCapsulesContent />
      </section>
      <ExplicitAdviceControl
        title="Talk through a memory"
        description="Choose a memory and ask for a gentle, two-sided reflection."
        placeholder="What happened, and what would you like help understanding?"
      />
    </div>
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
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Memory details"><motion.section initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card max-h-[90vh] w-full max-w-2xl overflow-y-auto p-4"><div className="flex justify-end"><button type="button" onClick={onClose} className="rounded-full p-2 text-text-2 hover:bg-card/10" aria-label="Close"><X className="h-5 w-5" /></button></div>{memory.displayUrl ? <div className="relative h-[55vh] w-full overflow-hidden rounded-btn"><Image src={memory.displayUrl} alt={memory.caption || 'Memory'} fill sizes="(max-width: 768px) 100vw, 672px" className="object-cover" /></div> : <div className="h-64 rounded-btn bg-gradient-to-br from-accent-1/25 via-soft-tint to-accent-2/20" />}<div className="space-y-3 p-3"><input value={title} onChange={(event) => setTitle(event.target.value)} aria-label="Memory title" className="w-full rounded-xl border border-accent-1/20 bg-soft-tint px-3 py-2 text-lg font-serif text-text-1" /><div className="grid gap-2 sm:grid-cols-2"><input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="rounded-xl border border-accent-1/20 bg-soft-tint px-3 py-2 text-sm text-text-1" /><select value={category} onChange={(event) => setCategory(event.target.value as Exclude<MemoryCategory, 'all'>)} className="rounded-xl border border-accent-1/20 bg-soft-tint px-3 py-2 text-sm text-text-1"><option value="favorite">Favorite</option><option value="travel">Travel</option><option value="ritual">Ritual</option><option value="journal">Journal</option></select></div>{saveError && <p className="text-sm text-error">{saveError}</p>}<button type="button" onClick={save} disabled={saving} className="rounded-xl bg-accent-1 px-4 py-2 text-sm text-white disabled:opacity-50">{saving ? 'Saving...' : 'Save changes'}</button></div></motion.section></div>
}

function MemoriesSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="h-8 w-48 animate-pulse rounded-full bg-card" />
      <div className="h-20 animate-pulse rounded-panel bg-card" />
      <div className="h-12 animate-pulse rounded-full bg-card" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-60 animate-pulse rounded-panel bg-card" />
        <div className="h-60 animate-pulse rounded-panel bg-card" />
        <div className="h-60 animate-pulse rounded-panel bg-card" />
      </div>
    </div>
  )
}

'use client'
/* eslint-disable @next/next/no-img-element -- Supabase signed image URLs are user-provided and can expire. */

import { type ChangeEvent, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  Camera,
  Compass,
  FolderArchive,
  Frown,
  Heart,
  Hourglass,
  MapPin,
  Meh,
  Pencil,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Smile,
  Sparkles,
  Square,
  Trash2,
  TriangleAlert,
  UploadCloud,
  Volume2,
  X,
} from 'lucide-react'
import MemoryCard from '@/features/dashboard/MemoryCard'
import LegacyGallery from '@/features/memories/LegacyGallery'
import MemorySlideshow from '@/features/memories/MemorySlideshow'
import SlideshowLaunchButton from '@/features/memories/SlideshowLaunchButton'
const MemoryLocationPicker = dynamic(() => import('@/features/memories/MemoryLocationPicker'), { ssr: false })
import { isSupabaseConfigured, type Memory, supabase } from '@/lib/supabase'
import ExplicitAdviceControl from '@/features/ai-guardian/ExplicitAdviceControl'
import { validateUpload } from '@/lib/upload-validation'
import { downloadAndDecrypt, encryptAndUpload, getCachedDecryptedUrl } from '@/lib/mediaEncryption'

const MemoryCurationAI = dynamic(
  () => import('@/features/memories/MemoryCurationAI'),
  {
    ssr: false,
    loading: () => <div className="h-64 animate-pulse rounded-2xl bg-card/60" />,
  }
)
const MemoryMapContent = dynamic(
  () => import('@/app/(private)/memories/map/page'),
  { ssr: false, loading: () => <div className="h-96 animate-pulse rounded-2xl bg-card/60" /> }
)
const OurStoryContent = dynamic(
  () => import('@/app/(private)/our-story/page'),
  { ssr: false, loading: () => <div className="h-96 animate-pulse rounded-2xl bg-card/60" /> }
)
const TimeCapsulesContent = dynamic(
  () => import('@/app/(private)/time-capsules/page'),
  { ssr: false, loading: () => <div className="h-96 animate-pulse rounded-2xl bg-card/60" /> }
)

const PAGE_SIZE = 12

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

type MemoryTab = 'photos' | 'map' | 'story' | 'capsules' | 'ai' | 'legacy'

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
  const [activeTab, setActiveTab] = useState<MemoryTab>('photos')
  const [memories, setMemories] = useState<JournalMemory[]>([])
  const [caption, setCaption] = useState('')
  const localDateKey = (value: Date) => {
    const year = value.getFullYear()
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const [memoryDate, setMemoryDate] = useState(() => localDateKey(new Date()))
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [memoryCategory, setMemoryCategory] = useState<MemoryCategory>('favorite')
  const [sortBy, setSortBy] = useState<MemorySort>('newest')
  const [filter, setFilter] = useState<MemoryCategory>('all')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isDriveSyncing, setIsDriveSyncing] = useState(false)
  const [isMigratingToDrive, setIsMigratingToDrive] = useState(false)
  const [isAddMemoryOpen, setIsAddMemoryOpen] = useState(false)
  const [driveSyncSummary, setDriveSyncSummary] = useState('')
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

  const loadMemories = async () => {
    setIsLoading(true)
    setError('')
    try {
      if (!isSupabaseConfigured) {
        setError('Shared memories are unavailable because Supabase is not configured.')
        return
      }

      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData.user) {
        setError('Please sign in to load shared memories.')
        return
      }

      const { data: link, error: linkError } = await supabase
        .from('couple_links')
        .select('couple_id')
        .or(`inviter_id.eq.${userData.user.id},accepted_by.eq.${userData.user.id}`)
        .eq('status', 'accepted')
        .maybeSingle()
      if (linkError) {
        setError(linkError.message)
        return
      }
      setCoupleLinkId(link?.couple_id ?? null)
      if (!link?.couple_id) {
        setMemories([])
        return
      }

      const legacyIndexResponse = await fetch('/api/memories/index-legacy-gallery', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!legacyIndexResponse.ok) {
        const legacyIndexBody = (await legacyIndexResponse.json().catch(() => ({}))) as { error?: string }
        console.warn('Legacy Gallery indexing was not completed:', legacyIndexBody.error ?? legacyIndexResponse.status)
      }

      const { data, error: memoriesError } = await supabase
        .from('memories')
        .select('*,mime_type')
        .eq('couple_id', link.couple_id)
        .order('date', { ascending: false })

      if (memoriesError) {
        setError(memoriesError.message)
        return
      }

      const displayMemories = await Promise.all(
        (data as Memory[]).map(async (memory) => {
          const provider = (memory as Memory & { storage_provider?: string }).storage_provider ?? 'supabase'
          const driveFileId = (memory as Memory & { drive_file_id?: string | null }).drive_file_id
          const cloudinaryProvider = (memory as Memory & { storage_provider?: string }).storage_provider === 'cloudinary'
          if (cloudinaryProvider) {
            const mediaResponse = await fetch(`/api/media/url?memoryId=${encodeURIComponent(memory.id)}`)
            const mediaBody = (await mediaResponse.json().catch(() => ({}))) as { url?: string }
            return { ...memory, displayUrl: mediaResponse.ok ? (mediaBody.url ?? '') : '', mime_type: memory.mime_type }
          }
          const path = memory.storage_path ?? memory.image_url ?? ''
          const memoryMetadata = (memory as Memory & { metadata?: Record<string, unknown> | null }).metadata
          const legacyGalleryPath = typeof memoryMetadata?.legacy_gallery_path === 'string' ? memoryMetadata.legacy_gallery_path : null
          if (legacyGalleryPath && memoryMetadata?.legacy_gallery_bucket === 'gallery' && link?.couple_id) {
            const displayUrl = await getCachedDecryptedUrl(link.couple_id, 'gallery', legacyGalleryPath, memory.mime_type || 'image/jpeg')
            return { ...memory, displayUrl, mime_type: memory.mime_type }
          }
          if (provider === 'google_drive' && driveFileId) {
            return { ...memory, displayUrl: `/api/drive/file?fileId=${encodeURIComponent(driveFileId)}&download=1`, mime_type: memory.mime_type }
          }
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
    } catch (loadError) {
      console.error('Failed to load shared memories:', loadError)
      setError(loadError instanceof Error ? loadError.message : 'Unable to load shared memories.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMemories()
  }, [])

  useEffect(() => {
    if (!coupleLinkId) return
    let cancelled = false
    setIsDriveSyncing(true)
    void fetch('/api/drive/sync-memories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coupleId: coupleLinkId }),
    })
      .then(async (response) => {
        const body = (await response.json().catch(() => ({}))) as { imported?: number; updated?: number; error?: string }
        if (!response.ok) throw new Error(body.error || 'Drive memory sync failed.')
        if (!cancelled) {
          setDriveSyncSummary(
            body.imported || body.updated
              ? `Drive synced: ${body.imported ?? 0} new, ${body.updated ?? 0} updated.`
              : 'Drive is already in sync.'
          )
          await loadMemories()
        }
      })
      .catch((syncError) => {
        if (!cancelled) setDriveSyncSummary(syncError instanceof Error ? syncError.message : 'Drive memory sync failed.')
      })
      .finally(() => {
        if (!cancelled) setIsDriveSyncing(false)
      })
    return () => { cancelled = true }
  }, [coupleLinkId])

  useEffect(() => {
    if (!coupleLinkId) return
    const channel = supabase
      .channel(`web-memories-${coupleLinkId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'memories',
        filter: `couple_id=eq.${coupleLinkId}`,
      }, () => { void loadMemories() })
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [coupleLinkId])

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
      const failedFiles: File[] = []
      let driveConnected = false
      try {
        const driveStatusResponse = await fetch('/api/drive/status')
        const driveStatus = (await driveStatusResponse.json().catch(() => ({}))) as { connected?: boolean }
        driveConnected = driveStatusResponse.ok && driveStatus.connected === true
      } catch {
        driveConnected = false
      }

      for (const file of selectedFiles) {
        try {
          let memoryCreatedByMediaApi = false
          const compressedImage = await compressImage(file)
          let storageProvider: 'supabase' | 'cloudinary' = 'supabase'
          let storedPath: string | null = null
          let mimeType = 'image/webp'

          const formData = new FormData()
          formData.append('file', new File([compressedImage], `${crypto.randomUUID()}.webp`, { type: 'image/webp' }))
          formData.append('coupleId', coupleLinkId)
          formData.append('title', caption.trim() || 'A memory together')
          formData.append('caption', caption.trim() || 'A memory together')
          formData.append('date', memoryDate)
          formData.append('category', memoryCategory)
          if (location) {
            formData.append('latitude', String(location.latitude))
            formData.append('longitude', String(location.longitude))
          }
          if (locationLabel.trim()) formData.append('locationLabel', locationLabel.trim())

          let tryFallbackStorage = !driveConnected
          if (driveConnected) {
            let driveResponse: Response | null = null
            try {
              driveResponse = await fetch('/api/drive/upload', { method: 'POST', body: formData })
            } catch {
              throw new Error('Google Drive upload response was interrupted. Check Memories before retrying.')
            }
            if (driveResponse) {
              const driveBody = (await driveResponse.json().catch(() => ({}))) as { file?: { id?: string }; error?: string }
              if (driveResponse.ok && driveBody.file?.id) {
                memoryCreatedByMediaApi = true
              } else if (driveResponse.status >= 500) {
                tryFallbackStorage = true
              } else {
                throw new Error(driveBody.error || 'Google Drive memory upload failed.')
              }
            }
          }

          if (!memoryCreatedByMediaApi && tryFallbackStorage) {
            let mediaResponse: Response | null = null
            let mediaBody: { file?: { id?: string; mimeType?: string }; error?: string } = {}
            try {
              mediaResponse = await fetch('/api/media/upload', { method: 'POST', body: formData })
              mediaBody = (await mediaResponse.json().catch(() => ({}))) as typeof mediaBody
            } catch {
              throw new Error('Media upload response was interrupted. Check Memories before retrying.')
            }
            if (mediaResponse?.ok && mediaBody.file?.id) {
              storageProvider = 'cloudinary'
              mimeType = mediaBody.file.mimeType || mimeType
              memoryCreatedByMediaApi = true
            } else if (mediaResponse && mediaResponse.status < 500) {
              throw new Error(mediaBody.error || 'Memory upload failed.')
            }
          }

          if (!memoryCreatedByMediaApi) {
            const path = `${userData.user.id}/${crypto.randomUUID()}.webp`
            const result = await encryptAndUpload(compressedImage, coupleLinkId, 'memories', path)
            storedPath = result.path
            mimeType = result.mimeType

            const { error: insertError } = await supabase.from('memories').insert({
              user_id: userData.user.id,
              couple_id: coupleLinkId,
              image_url: storedPath,
              storage_path: storedPath,
              storage_provider: storageProvider,
              drive_file_id: null,
              mime_type: mimeType,
              title: caption.trim() || 'A memory together',
              caption: caption.trim() || 'A memory together',
              date: memoryDate,
              category: memoryCategory,
              latitude: location?.latitude ?? null,
              longitude: location?.longitude ?? null,
              location_label: locationLabel.trim() || null,
            })
            if (insertError) {
              if (storedPath) await supabase.storage.from('memories').remove([storedPath])
              throw insertError
            }
          }
          uploadedCount += 1
        } catch (fileError) {
          failedFiles.push(file)
          uploadErrors.push(`${file.name}: ${fileError instanceof Error ? fileError.message : 'upload failed'}`)
        } finally {
          setUploadProgress(Math.round(((uploadedCount + uploadErrors.length) / selectedFiles.length) * 100))
        }
      }

      setSelectedFiles(failedFiles)
      if (uploadErrors.length === 0) {
        setCaption('')
        setMemoryDate(localDateKey(new Date()))
        setMemoryCategory('favorite')
        setLocation(null)
        setLocationLabel('')
        setIsAddMemoryOpen(false)
      }
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
      setError('This legacy memory cannot be deleted.')
      return
    }

    setError('')
    const response = await fetch('/api/media/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memoryId: memory.id }),
    })
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string }
      setError(body.error || 'Memory deletion failed.')
      return
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
        date: localDateKey(new Date()),
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
    } catch (saveError_) {
      setError(saveError_ instanceof Error ? saveError_.message : 'Unable to save journal entry.')
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
    } catch (reflectError_) {
      setError(reflectError_ instanceof Error ? reflectError_.message : 'Unable to reflect right now.')
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

  const triggerDriveMigration = async () => {
    if (!coupleLinkId || isMigratingToDrive) return
    setIsMigratingToDrive(true)
    setDriveSyncSummary('Checking Google Drive connection…')
    try {
      const statusRes = await fetch('/api/drive/status').catch(() => null)
      const statusData = statusRes?.ok ? await statusRes.json().catch(() => ({})) : {}
      if (!statusData?.connected) {
        setDriveSyncSummary('Google Drive is not connected. Please connect Google Drive first.')
        return
      }

      setDriveSyncSummary('Moving Supabase photos to Google Drive…')
      const { data: sessionData } = await supabase.auth.getSession()
      const authHeader: Record<string, string> = {}
      if (sessionData?.session?.access_token) {
        authHeader.Authorization = `Bearer ${sessionData.session.access_token}`
      }

      let migrated = 0
      let failed = 0
      let lastFailReason = ''
      const candidates = memories.filter((memory) => {
        const row = memory as DisplayMemory & { storage_provider?: string; storage_path?: string | null }
        return row.storage_provider === 'supabase' && Boolean(row.storage_path)
      })

      if (candidates.length === 0) {
        setDriveSyncSummary('No Supabase-stored memories need migration.')
        return
      }

      for (const item of candidates) {
        const row = item as DisplayMemory & { storage_provider?: string; storage_path?: string | null }
        const path = row.storage_path
        if (!path) continue
        try {
          const blob = await downloadAndDecrypt(coupleLinkId, 'memories', path, row.mime_type || 'image/jpeg')
          const file = new File([blob], `memory-${row.id}.${(row.mime_type || 'image/jpeg').split('/')[1] || 'jpg'}`, { type: row.mime_type || 'image/jpeg' })
          const form = new FormData()
          form.append('memoryId', row.id)
          form.append('file', file)
          const response = await fetch('/api/drive/migrate-memory', {
            method: 'POST',
            headers: authHeader,
            body: form,
          })
          const body = (await response.json().catch(() => ({}))) as { migrated?: boolean; alreadyInDrive?: boolean; oldStoragePath?: string; error?: string }
          if (!response.ok || (!body.migrated && !body.alreadyInDrive)) {
            throw new Error(body.error || response.statusText || 'Migration failed.')
          }
          if (body.migrated && body.oldStoragePath) {
            const { error: removeError } = await supabase.storage.from('memories').remove([body.oldStoragePath])
            if (removeError) console.warn('Migrated memory old storage object cleanup failed:', row.id)
          }
          migrated += body.migrated ? 1 : 0
        } catch (migrationError) {
          failed += 1
          const msg = migrationError instanceof Error ? migrationError.message : 'unknown error'
          lastFailReason = msg
        }
      }
      setDriveSyncSummary(`Drive migration: ${migrated} moved${failed ? `, ${failed} failed (${lastFailReason || 'originals kept'})` : ''}.`)
      await loadMemories()
    } catch (migrationError) {
      setDriveSyncSummary(migrationError instanceof Error ? migrationError.message : 'Drive migration failed.')
    } finally {
      setIsMigratingToDrive(false)
    }
  }

  const triggerDriveSync = async () => {
    if (!coupleLinkId || isDriveSyncing) return
    setIsDriveSyncing(true)
    setDriveSyncSummary('')
    try {
      const response = await fetch('/api/drive/sync-memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coupleId: coupleLinkId }),
      })
      const body = (await response.json().catch(() => ({}))) as { imported?: number; updated?: number; error?: string }
      if (!response.ok) throw new Error(body.error || 'Drive memory sync failed.')
      setDriveSyncSummary(`Drive synced: ${body.imported ?? 0} new, ${body.updated ?? 0} updated.`)
      await loadMemories()
    } catch (syncError) {
      setDriveSyncSummary(syncError instanceof Error ? syncError.message : 'Drive sync failed.')
    } finally {
      setIsDriveSyncing(false)
    }
  }

  const tabs: { id: MemoryTab; label: string; icon: typeof Camera; badge?: string | number }[] = [
    { id: 'photos', label: 'Photos & Moments', icon: Camera, badge: memories.length },
    { id: 'map', label: 'Places Map', icon: MapPin },
    { id: 'story', label: 'Our Story', icon: BookOpen },
    { id: 'capsules', label: 'Time Capsules', icon: Hourglass },
    { id: 'ai', label: 'AI Companion', icon: Sparkles },
    { id: 'legacy', label: 'Archived Gallery', icon: FolderArchive },
  ]

  return (
    <div className="dashboard-shell mx-auto w-full max-w-7xl space-y-6 px-4 py-4 sm:px-6 sm:py-6">
      {/* Unified Romantic Hero Header */}
      <header className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/60 p-6 backdrop-blur-xl shadow-lg">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-secondary/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Heart className="h-3.5 w-3.5 fill-primary text-primary" />
              <span>A Little World, Just For Us</span>
              <span className="opacity-40">•</span>
              <span>{memories.length} Keepsakes</span>
            </div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Memories & Keepsakes
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              Every shared glance, travel postcard, quiet ritual, and little moment we cherish forever.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsAddMemoryOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-md transition hover:opacity-90 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Add Memory</span>
            </button>

            <button
              type="button"
              onClick={openNewJournal}
              className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3.5 py-2.5 text-sm font-medium text-foreground backdrop-blur-md transition hover:bg-card/90 active:scale-95"
            >
              <Pencil className="h-4 w-4 text-primary" />
              <span className="hidden sm:inline">Write Journal</span>
            </button>

            <SlideshowLaunchButton memories={memories} onClick={() => setIsSlideshowOpen(true)} />

            {/* Drive Controls */}
            <div className="flex items-center gap-1 rounded-full border border-border/70 bg-card/50 p-1 backdrop-blur-md">
              <button
                type="button"
                title="Sync with Google Drive"
                disabled={isDriveSyncing || !coupleLinkId}
                onClick={() => void triggerDriveSync()}
                className="rounded-full p-2 text-muted-foreground transition hover:bg-card hover:text-foreground disabled:opacity-40"
              >
                <RefreshCw className={`h-4 w-4 ${isDriveSyncing ? 'animate-spin text-primary' : ''}`} />
              </button>
              <button
                type="button"
                title="Migrate photos to Google Drive"
                disabled={isMigratingToDrive || !coupleLinkId}
                onClick={() => void triggerDriveMigration()}
                className="rounded-full p-2 text-muted-foreground transition hover:bg-card hover:text-foreground disabled:opacity-40"
              >
                <UploadCloud className={`h-4 w-4 ${isMigratingToDrive ? 'animate-bounce text-primary' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {driveSyncSummary ? (
          <div className="relative mt-3 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2 text-xs text-foreground/80">
            {driveSyncSummary}
          </div>
        ) : null}
      </header>

      {/* Navigation Sub-Tabs */}
      <nav aria-label="Memories navigation" className="flex items-center gap-1 overflow-x-auto rounded-2xl border border-border/70 bg-card/60 p-1.5 backdrop-blur-xl shadow-sm">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium whitespace-nowrap transition ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-card/80 hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined ? (
                <span className={`rounded-full px-2 py-0.5 text-xs ${isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {tab.badge}
                </span>
              ) : null}
            </button>
          )
        })}
      </nav>

      {/* Tab 1: Photos & Moments */}
      {activeTab === 'photos' && (
        <section className="space-y-5">
          {/* Filter and Sort Bar */}
          <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/40 p-3.5 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-1.5">
              {(['all', 'favorite', 'travel', 'ritual', 'journal'] as MemoryCategory[]).map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setFilter(category)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium capitalize transition ${
                    filter === category
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'border border-border/50 bg-card/60 text-muted-foreground hover:bg-card hover:text-foreground'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2.5 self-end sm:self-auto">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as MemorySort)}
                className="rounded-xl border border-border/70 bg-card/70 px-3 py-1.5 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Loading / Status */}
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin text-primary" />
              <span>Loading our memories...</span>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && sortedMemories.length === 0 && (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 bg-card/30 p-8 text-center backdrop-blur-md">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Heart className="h-7 w-7" />
              </div>
              <h3 className="mt-4 font-serif text-lg font-semibold text-foreground">No memories in this view</h3>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                Capture your special days, date nights, and heartfelt journals together.
              </p>
              <button
                type="button"
                onClick={() => setIsAddMemoryOpen(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition hover:opacity-90"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Upload First Memory</span>
              </button>
            </div>
          )}

          {/* Memories Grid: Responsive 4-column */}
          <MemoryGrid
            memories={visibleMemories}
            reflectingId={reflectingId}
            speakingJournalId={speakingJournalId}
            onEditJournal={openEditJournal}
            onDeleteJournal={deleteJournal}
            onSpeakReflection={speakReflection}
            onRequestReflection={requestReflection}
            onOpenMemory={setSelectedMemory}
            onDeleteMemory={handleDelete}
          />

          {/* Pagination */}
          {visibleCount < sortedMemories.length && (
            <div className="flex justify-center pt-4">
              <button
                type="button"
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                className="rounded-full border border-border/80 bg-card/70 px-6 py-2.5 text-xs font-medium text-foreground backdrop-blur-md transition hover:bg-card hover:border-primary/40 active:scale-95"
              >
                Load More Memories ({sortedMemories.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </section>
      )}

      {/* Tab 2: Places Map */}
      {activeTab === 'map' && (
        <section className="space-y-4 rounded-3xl border border-border/70 bg-card/60 p-5 backdrop-blur-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-semibold text-foreground">Places We Remember</h2>
              <p className="text-xs text-muted-foreground">Pins, coordinates, and scenic spots from all our adventures.</p>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
            <MemoryMapContent embedded />
          </div>
        </section>
      )}

      {/* Tab 3: Our Story */}
      {activeTab === 'story' && (
        <section className="space-y-4 rounded-3xl border border-border/70 bg-card/60 p-5 backdrop-blur-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-semibold text-foreground">Our Story Timeline</h2>
              <p className="text-xs text-muted-foreground">Every milestone and memory woven into a chronological journey.</p>
            </div>
          </div>
          <OurStoryContent />
        </section>
      )}

      {/* Tab 4: Time Capsules */}
      {activeTab === 'capsules' && (
        <section className="space-y-4 rounded-3xl border border-border/70 bg-card/60 p-5 backdrop-blur-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Hourglass className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-semibold text-foreground">Time Capsules</h2>
              <p className="text-xs text-muted-foreground">Letters, photos, and secrets locked until a special future date.</p>
            </div>
          </div>
          <TimeCapsulesContent />
        </section>
      )}

      {/* Tab 5: AI Companion */}
      {activeTab === 'ai' && (
        <section className="space-y-5 rounded-3xl border border-border/70 bg-card/60 p-6 backdrop-blur-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-semibold text-foreground">AI Companion & Memory Reflection</h2>
              <p className="text-xs text-muted-foreground">Turn moments into romantic stories, poetic highlights, or gentle reflections.</p>
            </div>
          </div>
          <MemoryCurationAI
            memories={memories.map((memory) => ({
              id: memory.id,
              title: memory.title ?? memory.caption ?? 'A memory together',
              date: memory.date,
            }))}
          />
          <div className="border-t border-border/40 pt-5">
            <ExplicitAdviceControl
              title="Talk Through a Memory"
              description="Ask for a gentle, loving reflection about any shared experience."
              placeholder="What happened, and what would you like help understanding?"
            />
          </div>
        </section>
      )}

      {/* Tab 6: Archived Legacy Gallery */}
      {activeTab === 'legacy' && (
        <section className="space-y-4 rounded-3xl border border-border/70 bg-card/60 p-5 backdrop-blur-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FolderArchive className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-semibold text-foreground">Previously Saved Gallery Photos</h2>
              <p className="text-xs text-muted-foreground">
                Photos stored in original encrypted Gallery storage. Safely preserved without alteration.
              </p>
            </div>
          </div>
          <LegacyGallery showUpload={false} />
        </section>
      )}

      {/* Add Memory Modal / Sheet */}
      <AnimatePresence>
        {isAddMemoryOpen ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label="Add Memory"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-border/80 bg-card/95 p-6 backdrop-blur-2xl shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border/50 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Plus className="h-4 w-4" />
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-foreground">Add a Shared Memory</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddMemoryOpen(false)}
                  className="rounded-full p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <MemoryUploadPanel
                caption={caption}
                memoryDate={memoryDate}
                memoryCategory={memoryCategory}
                location={location}
                locationLabel={locationLabel}
                isLocationOpen={isLocationOpen}
                isUploading={isUploading}
                uploadProgress={uploadProgress}
                uploadSummary={uploadSummary}
                error={error}
                onCaptionChange={setCaption}
                onMemoryDateChange={setMemoryDate}
                onMemoryCategoryChange={setMemoryCategory}
                onLocationChange={setLocation}
                onLocationLabelChange={setLocationLabel}
                onLocationOpenChange={setIsLocationOpen}
                onErrorChange={setError}
                onFileChange={handleFileChange}
                onUpload={handleUpload}
              />
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      {/* Memory Slideshow Modal */}
      {isSlideshowOpen ? (
        <MemorySlideshow
          memories={memories}
          onClose={() => setIsSlideshowOpen(false)}
          coupleId={coupleLinkId ?? ''}
        />
      ) : null}

      {/* Memory Detail Modal */}
      {selectedMemory && (
        <MemoryDetail
          memory={selectedMemory}
          onClose={() => setSelectedMemory(null)}
          onSaved={(updated) => {
            setMemories((current) =>
              current.map((memory) => (memory.id === updated.id ? { ...memory, ...updated } : memory))
            )
            setSelectedMemory((current) => (current?.id === updated.id ? { ...current, ...updated } : current))
          }}
        />
      )}

      {/* Journal Entry Modal */}
      {journalModalOpen ? (
        <JournalEntryModal
          isEditing={editingJournalId !== null}
          title={journalTitle}
          body={journalBody}
          mood={journalMood}
          saving={journalSaving}
          onTitleChange={setJournalTitle}
          onBodyChange={setJournalBody}
          onMoodChange={setJournalMood}
          onClose={closeJournalModal}
          onSave={() => void saveJournal()}
        />
      ) : null}
    </div>
  )
}

function JournalEntryModal({
  isEditing,
  title,
  body,
  mood,
  saving,
  onTitleChange,
  onBodyChange,
  onMoodChange,
  onClose,
  onSave,
}: {
  readonly isEditing: boolean
  readonly title: string
  readonly body: string
  readonly mood: JournalMood
  readonly saving: boolean
  readonly onTitleChange: (value: string) => void
  readonly onBodyChange: (value: string) => void
  readonly onMoodChange: (value: JournalMood) => void
  readonly onClose: () => void
  readonly onSave: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={isEditing ? 'Edit journal entry' : 'New journal entry'}
    >
      <section className="w-full max-w-lg space-y-4 rounded-3xl border border-border/80 bg-card/95 p-6 backdrop-blur-2xl shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <h2 className="font-serif text-lg font-semibold text-foreground">
            {isEditing ? 'Edit Journal Entry' : 'New Journal Entry'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close journal modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <input
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="Journal Title..."
          className="w-full rounded-2xl border border-border/70 bg-card/60 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
        />
        <textarea
          value={body}
          onChange={(event) => onBodyChange(event.target.value)}
          placeholder="Pour your heartfelt thoughts, intimate memories, or feelings here..."
          rows={5}
          className="w-full resize-y rounded-2xl border border-border/70 bg-card/60 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
        />
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">How are you feeling today?</p>
          <div className="flex flex-wrap gap-2">
            {JOURNAL_MOODS.map(({ id, label, Icon }) => {
              const selected = mood === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onMoodChange(id)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    selected
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                      : 'border-border/60 bg-card/60 text-muted-foreground hover:bg-card hover:text-foreground'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{label}</span>
                </button>
              )
            })}
          </div>
        </div>
        <div className="flex justify-end gap-2.5 pt-2 border-t border-border/40">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving || !title.trim()}
            className="rounded-full bg-primary px-5 py-2 text-xs font-medium text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Journal'}
          </button>
        </div>
      </section>
    </div>
  )
}

function MemoryUploadPanel({
  caption,
  memoryDate,
  memoryCategory,
  location,
  locationLabel,
  isLocationOpen,
  isUploading,
  uploadProgress,
  uploadSummary,
  error,
  onCaptionChange,
  onMemoryDateChange,
  onMemoryCategoryChange,
  onLocationChange,
  onLocationLabelChange,
  onLocationOpenChange,
  onErrorChange,
  onFileChange,
  onUpload,
}: {
  readonly caption: string
  readonly memoryDate: string
  readonly memoryCategory: MemoryCategory
  readonly location: { latitude: number; longitude: number } | null
  readonly locationLabel: string
  readonly isLocationOpen: boolean
  readonly isUploading: boolean
  readonly uploadProgress: number
  readonly uploadSummary: string
  readonly error: string
  readonly onCaptionChange: (value: string) => void
  readonly onMemoryDateChange: (value: string) => void
  readonly onMemoryCategoryChange: (value: MemoryCategory) => void
  readonly onLocationChange: (value: { latitude: number; longitude: number } | null) => void
  readonly onLocationLabelChange: (value: string) => void
  readonly onLocationOpenChange: (value: boolean) => void
  readonly onErrorChange: (value: string) => void
  readonly onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  readonly onUpload: (event: React.FormEvent<HTMLFormElement>) => void
}) {
  return (
    <div className="space-y-4 pt-3">
      <form className="space-y-3.5" onSubmit={onUpload}>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Select Photos</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={onFileChange}
            className="w-full rounded-2xl border border-border/70 bg-card/50 px-3.5 py-2 text-xs text-foreground file:mr-3 file:rounded-full file:border-0 file:bg-primary/10 file:px-3 file:py-1 file:text-xs file:font-medium file:text-primary hover:file:bg-primary/20"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Caption or Title</label>
          <input
            type="text"
            value={caption}
            onChange={(event) => onCaptionChange(event.target.value)}
            placeholder="e.g. Coffee date at the corner cafe"
            className="w-full rounded-2xl border border-border/70 bg-card/50 px-3.5 py-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Category</label>
            <select
              value={memoryCategory}
              onChange={(event) => onMemoryCategoryChange(event.target.value as MemoryCategory)}
              className="w-full rounded-2xl border border-border/70 bg-card/50 px-3 py-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="favorite">Favorite</option>
              <option value="travel">Travel</option>
              <option value="ritual">Ritual</option>
              <option value="journal">Journal</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Date</label>
            <input
              type="date"
              value={memoryDate}
              onChange={(event) => onMemoryDateChange(event.target.value)}
              className="w-full rounded-2xl border border-border/70 bg-card/50 px-3 py-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
              aria-label="Memory date"
            />
          </div>
        </div>

        <div className="pt-1">
          <button
            type="button"
            onClick={() => onLocationOpenChange(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-3 py-1.5 text-xs text-foreground hover:bg-card"
          >
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span>{location ? (locationLabel || 'Location pinned') : 'Add Location (Optional)'}</span>
          </button>
        </div>

        {isUploading && (
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Uploading & encrypting...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}
        {uploadSummary && <p className="text-xs text-emerald-500">{uploadSummary}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="submit"
            disabled={isUploading || !isSupabaseConfigured}
            className="w-full rounded-full bg-primary py-2.5 text-xs font-medium text-primary-foreground shadow-md transition hover:opacity-90 disabled:opacity-50"
          >
            {isUploading ? `Uploading ${uploadProgress}%` : 'Upload & Save Memory'}
          </button>
        </div>
      </form>

      {isLocationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md space-y-3.5 rounded-3xl border border-border bg-card p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="font-serif text-sm font-semibold text-foreground">Pick Location</h4>
              <button type="button" onClick={() => onLocationOpenChange(false)} className="text-xs text-muted-foreground hover:text-foreground">
                Close
              </button>
            </div>
            <MemoryLocationPicker value={location} onChange={onLocationChange} />
            <button
              type="button"
              onClick={() =>
                navigator.geolocation.getCurrentPosition(
                  (pos) => onLocationChange({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
                  () => onErrorChange('Unable to read your current location.')
                )
              }
              className="w-full rounded-xl border border-border/70 py-2 text-xs font-medium text-foreground hover:bg-card/80"
            >
              Use Current Location
            </button>
            <input
              value={locationLabel}
              onChange={(event) => onLocationLabelChange(event.target.value)}
              placeholder="Place label (e.g. Cozy Cafe, Riverside Park)"
              className="w-full rounded-xl border border-border/70 bg-card/60 px-3 py-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              onClick={() => onLocationOpenChange(false)}
              className="w-full rounded-full bg-primary py-2 text-xs font-medium text-primary-foreground"
            >
              Confirm Location
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function MemoryGrid({
  memories,
  reflectingId,
  speakingJournalId,
  onEditJournal,
  onDeleteJournal,
  onSpeakReflection,
  onRequestReflection,
  onOpenMemory,
  onDeleteMemory,
}: {
  readonly memories: JournalMemory[]
  readonly reflectingId: string | null
  readonly speakingJournalId: string | null
  readonly onEditJournal: (memory: JournalMemory) => void
  readonly onDeleteJournal: (memory: JournalMemory) => void
  readonly onSpeakReflection: (memory: JournalMemory) => void
  readonly onRequestReflection: (memory: JournalMemory) => void
  readonly onOpenMemory: (memory: DisplayMemory) => void
  readonly onDeleteMemory: (memory: DisplayMemory) => void
}) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {memories.map((memory, index) =>
        memory.category === 'journal' ? (
          <article
            key={memory.id}
            className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border/70 bg-card/60 p-4.5 backdrop-blur-md shadow-sm transition hover:border-primary/40 hover:shadow-md"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                    <Pencil className="h-3 w-3" />
                    <span>Journal</span>
                  </span>
                  <h3 className="line-clamp-1 font-serif text-base font-semibold text-foreground">
                    {memory.title}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">{memory.date}</p>
                </div>

                <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100">
                  {memory.metadata?.mood_tag ? (() => {
                    const mood =
                      JOURNAL_MOODS.find((item) => item.id === memory.metadata?.mood_tag) ??
                      JOURNAL_MOODS.find((item) => item.id === 'okay')
                    if (!mood) return null
                    const MoodIcon = mood.Icon
                    return <MoodIcon className="h-4 w-4 text-primary" aria-label={mood.label} />
                  })() : null}
                  <button
                    type="button"
                    onClick={() => onEditJournal(memory)}
                    className="rounded-full p-1 text-muted-foreground hover:bg-card hover:text-foreground"
                    aria-label="Edit journal entry"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteJournal(memory)}
                    className="rounded-full p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Delete journal entry"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {memory.description ? (
                <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                  {memory.description}
                </p>
              ) : null}

              {memory.metadata?.ai_reflection ? (
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-primary">
                    <span className="inline-flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      AI Reflection
                    </span>
                    <button
                      type="button"
                      onClick={() => onSpeakReflection(memory)}
                      aria-label="Read reflection aloud"
                      className="rounded-full p-1 hover:bg-primary/10"
                    >
                      {speakingJournalId === memory.id ? (
                        <Square className="h-3.5 w-3.5" />
                      ) : (
                        <Volume2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                  <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-foreground/90">
                    {memory.metadata.ai_reflection}
                  </p>
                </div>
              ) : null}
            </div>

            {!memory.metadata?.ai_reflection && (
              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => void onRequestReflection(memory)}
                  disabled={reflectingId !== null}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-border/70 bg-card/50 py-1.5 text-xs font-medium text-foreground transition hover:border-primary/40 hover:text-primary disabled:opacity-50"
                >
                  {reflectingId === memory.id ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                  )}
                  <span>{reflectingId === memory.id ? 'Reflecting...' : 'Reflect with AI'}</span>
                </button>
              </div>
            )}
          </article>
        ) : (
          <MemoryCard
            key={memory.id}
            id={memory.id}
            imageUrl={memory.displayUrl || null}
            caption={memory.title || memory.caption || 'A moment together'}
            date={memory.date}
            category={memory.category}
            locationLabel={(memory as DisplayMemory & { location_label?: string | null }).location_label || null}
            index={index}
            onOpen={() => onOpenMemory(memory)}
            onDelete={
              memory.user_id &&
              !(
                memory.metadata &&
                typeof memory.metadata === 'object' &&
                'legacy_gallery_original' in memory.metadata &&
                memory.metadata.legacy_gallery_original === true
              )
                ? () => onDeleteMemory(memory)
                : undefined
            }
          />
        )
      )}
    </section>
  )
}

function MemoryDetail({
  memory,
  onClose,
  onSaved,
}: {
  readonly memory: DisplayMemory
  readonly onClose: () => void
  readonly onSaved: (memory: Partial<DisplayMemory> & { id: string }) => void
}) {
  const [title, setTitle] = useState(memory.title ?? memory.caption ?? '')
  const [date, setDate] = useState(memory.date)
  const [category, setCategory] = useState<Exclude<MemoryCategory, 'all'>>(
    (memory.category as Exclude<MemoryCategory, 'all'>) ?? 'favorite'
  )
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const save = async () => {
    setSaving(true)
    setSaveError('')
    const { error } = await supabase
      .from('memories')
      .update({
        title: title.trim() || 'A memory together',
        caption: title.trim() || 'A memory together',
        date,
        category,
      })
      .eq('id', memory.id)
    if (error) setSaveError(error.message)
    else onSaved({ id: memory.id, title, caption: title, date, category })
    setSaving(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Memory details"
    >
      <motion.section
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border/80 bg-card/95 p-5 backdrop-blur-2xl shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <span className="text-xs font-medium text-muted-foreground">Memory Details</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {memory.displayUrl ? (
          <div className="relative mt-3 flex h-[45vh] min-h-60 max-h-[500px] w-full items-center justify-center overflow-hidden rounded-2xl bg-black/20">
            <img
              src={memory.displayUrl}
              alt={memory.title || memory.caption || 'Memory'}
              loading="eager"
              decoding="async"
              className="absolute inset-0 h-full w-full object-contain"
            />
          </div>
        ) : (
          <div className="mt-3 flex h-48 w-full items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Heart className="h-12 w-12" />
          </div>
        )}

        <div className="space-y-3.5 pt-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Title</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              aria-label="Memory title"
              className="w-full rounded-2xl border border-border/70 bg-card/60 px-3.5 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Date</label>
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="w-full rounded-2xl border border-border/70 bg-card/60 px-3 py-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Category</label>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value as Exclude<MemoryCategory, 'all'>)}
                className="w-full rounded-2xl border border-border/70 bg-card/60 px-3 py-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="favorite">Favorite</option>
                <option value="travel">Travel</option>
                <option value="ritual">Ritual</option>
                <option value="journal">Journal</option>
              </select>
            </div>
          </div>

          {saveError && <p className="text-xs text-destructive">{saveError}</p>}

          <div className="flex justify-end gap-2.5 pt-2 border-t border-border/40">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-full bg-primary px-5 py-2 text-xs font-medium text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </motion.section>
    </div>
  )
}

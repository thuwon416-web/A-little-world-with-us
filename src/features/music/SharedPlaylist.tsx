'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarHeart, Loader2, Plus, Trash2, X } from 'lucide-react'
import { getCoupleStatus } from '@/lib/couples'
import { supabase } from '@/lib/supabase'
import YouTubePlayer from './YouTubePlayer'
import type { SharedPlaylistSong } from './music-types'

export interface SharedPlaylistProps {
  coupleId?: string
  realtime?: boolean
  enableRealtime?: boolean
  className?: string
}

export function parseYouTubeId(value: string): string | null {
  const input = value.trim()
  if (/^[A-Za-z0-9_-]{11}$/.test(input)) return input

  try {
    const url = new URL(input)
    if (url.hostname === 'youtu.be') return url.pathname.slice(1).match(/^[A-Za-z0-9_-]{11}$/)?.[0] ?? null
    if (url.hostname.endsWith('youtube.com')) {
      const queryId = url.searchParams.get('v')
      if (queryId && /^[A-Za-z0-9_-]{11}$/.test(queryId)) return queryId
      const pathId = url.pathname.match(/\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})/)
      return pathId?.[1] ?? null
    }
  } catch {
    return null
  }

  return null
}

export const extractYouTubeId = parseYouTubeId

function toTrack(row: Record<string, unknown>): SharedPlaylistSong {
  return {
    id: String(row.id),
    coupleId: String(row.couple_id),
    provider: (row.provider as SharedPlaylistSong['provider']) ?? 'youtube',
    externalId: String(row.external_id),
    title: String(row.title),
    artist: typeof row.artist === 'string' ? row.artist : '',
    album: typeof row.album === 'string' ? row.album : null,
    thumbnailUrl: typeof row.thumbnail_url === 'string' ? row.thumbnail_url : null,
    sourceUrl: typeof row.source_url === 'string' ? row.source_url : null,
    durationSeconds: typeof row.duration_seconds === 'number' ? row.duration_seconds : null,
    whyAdded: typeof row.why_added === 'string' ? row.why_added : null,
    position: Number(row.position ?? 0),
    isAnniversarySong: Boolean(row.is_anniversary_song),
    addedBy: String(row.added_by),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

export default function SharedPlaylist({ coupleId: requestedCoupleId, realtime, enableRealtime, className = '' }: SharedPlaylistProps) {
  const realtimeEnabled = realtime ?? enableRealtime ?? false
  const [coupleId, setCoupleId] = useState(requestedCoupleId ?? null)
  const [playlist, setPlaylist] = useState<SharedPlaylistSong[]>([])
  const [anniversary, setAnniversary] = useState('')
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [notes, setNotes] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingAnniversary, setSavingAnniversary] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const previewId = useMemo(() => parseYouTubeId(url), [url])

  const loadPlaylist = useCallback(async (targetCoupleId: string) => {
    const { data, error: queryError } = await supabase
      .from('shared_playlist')
      .select('id,couple_id,added_by,provider,external_id,title,artist,album,thumbnail_url,source_url,duration_seconds,why_added,position,is_anniversary_song,created_at,updated_at')
      .eq('couple_id', targetCoupleId)
      .order('position', { ascending: true })
    if (queryError) throw queryError
    setPlaylist((data ?? []).map((row) => toTrack(row as Record<string, unknown>)))
  }, [])

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)
      const status = requestedCoupleId ? null : await getCoupleStatus()
      const targetCoupleId = requestedCoupleId ?? status?.couple?.id ?? null
      if (!targetCoupleId) {
        setCoupleId(null)
        setPlaylist([])
        return
      }
      setCoupleId(targetCoupleId)
      await loadPlaylist(targetCoupleId)
      if (status?.couple) setAnniversary(status.couple.anniversary ?? '')
      else {
        const { data: couple, error: coupleError } = await supabase.from('couples').select('anniversary').eq('id', targetCoupleId).single()
        if (coupleError) throw coupleError
        setAnniversary(couple?.anniversary ?? '')
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load your shared playlist.')
    } finally {
      setLoading(false)
    }
  }, [loadPlaylist, requestedCoupleId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!realtimeEnabled || !coupleId) return
    const channel = supabase
      .channel(`shared-playlist-${coupleId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shared_playlist', filter: `couple_id=eq.${coupleId}` }, () => { void loadPlaylist(coupleId) })
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [coupleId, loadPlaylist, realtimeEnabled])

  const addTrack = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!coupleId || !userId || !previewId || !title.trim()) {
      setError('Choose a valid YouTube URL or ID and add a title.')
      return
    }
    try {
      setSaving(true)
      setError(null)
      const { data, error: insertError } = await supabase.from('shared_playlist').insert({
        couple_id: coupleId,
        provider: 'youtube',
        external_id: previewId,
        title: title.trim(),
        artist: artist.trim() || null,
        why_added: notes.trim() || null,
        added_by: userId,
        source_url: `https://www.youtube.com/watch?v=${previewId}`,
        thumbnail_url: `https://i.ytimg.com/vi/${previewId}/hqdefault.jpg`,
      }).select('id,couple_id,added_by,provider,external_id,title,artist,album,thumbnail_url,source_url,duration_seconds,why_added,position,is_anniversary_song,created_at,updated_at').single()
      if (insertError) throw insertError
      if (data) setPlaylist((current) => [...current, toTrack(data as Record<string, unknown>)])
      setUrl('')
      setTitle('')
      setArtist('')
      setNotes('')
    } catch (insertError) {
      setError(insertError instanceof Error ? insertError.message : 'Unable to add that song.')
    } finally {
      setSaving(false)
    }

  }

  const toggleAnniversary = async (track: SharedPlaylistSong) => {
    const next = !track.isAnniversarySong
    const { error: updateError } = await supabase.from('shared_playlist').update({ is_anniversary_song: next }).eq('id', track.id).eq('couple_id', coupleId)
    if (updateError) {
      setError(updateError.message)
      return
    }
    setPlaylist((current) => current.map((item) => item.id === track.id ? { ...item, isAnniversarySong: next } : item))
  }

  const removeTrack = async (id: string) => {
    try {
      setError(null)
      const { error: deleteError } = await supabase.from('shared_playlist').delete().eq('id', id)
      if (deleteError) throw deleteError
      setPlaylist((current) => current.filter((track) => track.id !== id))
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to remove that song.')
    }
  }

  const saveAnniversary = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!coupleId) return
    try {
      setSavingAnniversary(true)
      setError(null)
      const { error: updateError } = await supabase.from('couples').update({ anniversary: anniversary || null }).eq('id', coupleId)
      if (updateError) throw updateError
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Unable to update your anniversary.')
    } finally {
      setSavingAnniversary(false)
    }
  }

  if (loading) return <div className={`flex items-center justify-center gap-2 rounded-3xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-8 text-sm text-[var(--text-secondary)] ${className}`}><Loader2 className="h-4 w-4 animate-spin" /> Loading your playlist…</div>
  if (!coupleId) return <div className={`rounded-3xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-6 text-sm text-[var(--text-secondary)] ${className}`}>Link your partner to start a shared playlist.</div>

  return (
    <div className={`space-y-5 ${className}`}>
      {error && <div role="alert" className="flex items-start justify-between gap-3 rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100"><span>{error}</span><button type="button" onClick={() => setError(null)} aria-label="Dismiss error"><X className="h-4 w-4" /></button></div>}

      <form onSubmit={addTrack} className="rounded-3xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]"><Plus className="h-4 w-4 text-[var(--accent-1)]" /> Add a song for us</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="YouTube URL or video ID" aria-label="YouTube URL or video ID" className="sm:col-span-2 rounded-xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-1)]" />
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Song title" aria-label="Song title" className="rounded-xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-1)]" />
          <input value={artist} onChange={(event) => setArtist(event.target.value)} placeholder="Artist (optional)" aria-label="Artist" className="rounded-xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-1)]" />
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="A note for your partner (optional)" aria-label="Song notes" rows={2} className="sm:col-span-2 rounded-xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-1)]" />
        </div>
        {previewId && <div className="mt-4"><YouTubePlayer videoId={previewId} title={title || 'Song preview'} /></div>}
        <button type="submit" disabled={saving || !previewId || !title.trim()} className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--accent-1)] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} {saving ? 'Adding…' : 'Add to playlist'}</button>
      </form>

      <div className="space-y-3">
        {playlist.length === 0 ? <div className="rounded-3xl border border-dashed border-[var(--accent-1)]/30 bg-[var(--card-bg)] p-8 text-center text-sm text-[var(--text-secondary)]">Your playlist is waiting for its first song.</div> : playlist.map((track) => (
          <article key={track.id} className="rounded-3xl border border-[var(--accent-1)]/15 bg-[var(--card-bg)] p-4">
            <div className="flex items-start justify-between gap-3">
              <div><h3 className="font-medium text-[var(--text-primary)]">{track.title}</h3><p className="text-xs text-[var(--text-secondary)]">{track.artist || 'YouTube'} </p>{track.whyAdded && <p className="mt-2 text-sm text-[var(--text-secondary)]">{track.whyAdded}</p>}</div>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => void toggleAnniversary(track)} className={`rounded-full px-2 py-1 text-xs ${track.isAnniversarySong ? 'bg-[var(--accent-1)]/20 text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>{track.isAnniversarySong ? 'Anniversary song' : 'Mark anniversary'}</button>
                <button type="button" onClick={() => void removeTrack(track.id)} aria-label={`Remove ${track.title}`} className="rounded-full p-2 text-[var(--text-secondary)] hover:bg-red-500/10 hover:text-red-300"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <YouTubePlayer videoId={track.externalId} title={track.title} className="mt-3" />
          </article>
        ))}
      </div>

      <form onSubmit={saveAnniversary} className="flex flex-col gap-3 rounded-3xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-5 sm:flex-row sm:items-end">
        <label className="flex-1 text-sm text-[var(--text-secondary)]"><span className="mb-2 flex items-center gap-2 text-[var(--text-primary)]"><CalendarHeart className="h-4 w-4 text-[var(--accent-1)]" /> Our anniversary</span><input type="date" value={anniversary} onChange={(event) => setAnniversary(event.target.value)} className="w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-3 py-2 text-sm text-[var(--text-primary)]" /></label>
        <button type="submit" disabled={savingAnniversary} className="rounded-full border border-[var(--accent-1)]/30 px-4 py-2 text-sm text-[var(--text-primary)] disabled:opacity-50">{savingAnniversary ? 'Saving…' : 'Save date'}</button>
      </form>
    </div>
  )
}

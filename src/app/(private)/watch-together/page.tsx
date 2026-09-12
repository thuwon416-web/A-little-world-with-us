'use client'
/* eslint-disable @next/next/no-img-element -- YouTube thumbnails are remote user-selected URLs. */

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import RealtimeChat from '@/features/chat/RealtimeChat'
import { supabase } from '@/lib/supabase'
import { getCoupleStatus } from '@/lib/couples'
import { extractYouTubeId, getYouTubeThumbnail } from '@/lib/watchTogether'

type WatchItem = { id: string; youtube_id: string; title: string; thumbnail_url: string | null; position: number }

export default function WatchTogetherPage() {
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [items, setItems] = useState<WatchItem[]>([])
  const [current, setCurrent] = useState<WatchItem | null>(null)
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const channelName = useMemo(() => coupleId ? `watch-sync-${coupleId}` : null, [coupleId])
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const latestSyncTimestamp = useRef(0)

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null
    void (async () => {
      const [{ data: { user } }, { couple }] = await Promise.all([supabase.auth.getUser(), getCoupleStatus()])
      if (!user || !couple) { setError('Link with your partner to use Watch Together.'); return }
      setUserId(user.id); setCoupleId(couple.id)
      const { data, error: loadError } = await supabase.from('watchlist').select('*').eq('couple_id', couple.id).order('position').order('created_at')
      if (loadError) throw loadError
      const rows = (data ?? []) as WatchItem[]
      setItems(rows); setCurrent(rows[0] ?? null)
      channel = supabase.channel(`watch-sync-${couple.id}`)
      channelRef.current = channel
        .on('broadcast', { event: 'play' }, ({ payload }) => {
          const timestamp = Number(payload.timestamp) || 0
          if (timestamp <= latestSyncTimestamp.current) return
          latestSyncTimestamp.current = timestamp
          setPlaying(true)
        })
        .on('broadcast', { event: 'pause' }, ({ payload }) => {
          const timestamp = Number(payload.timestamp) || 0
          if (timestamp <= latestSyncTimestamp.current) return
          latestSyncTimestamp.current = timestamp
          setPlaying(false)
        })
        .on('broadcast', { event: 'video' }, ({ payload }) => {
          const timestamp = Number(payload.timestamp) || 0
          if (timestamp <= latestSyncTimestamp.current) return
          latestSyncTimestamp.current = timestamp
          const item = rows.find((row) => row.youtube_id === payload.youtubeId)
          if (item) setCurrent(item)
        })
        .subscribe()
    })().catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to load Watch Together.'))
    return () => {
      channelRef.current = null
      if (channel) void supabase.removeChannel(channel)
    }
  }, [])

  const broadcast = async (event: 'play' | 'pause' | 'video', payload: Record<string, unknown> = {}) => {
    if (!channelName) return
    if (!channelRef.current) return
    const response = await channelRef.current.send({ type: 'broadcast', event, payload: { ...payload, timestamp: Date.now() } })
    if (response !== 'ok') throw new Error(`Watch sync unavailable: ${response}`)
  }
  const select = async (item: WatchItem) => {
    setCurrent(item); setPlaying(false); await broadcast('video', { youtubeId: item.youtube_id })
    if (coupleId && userId) await supabase.from('watch_history').insert({ couple_id: coupleId, watched_by: userId, youtube_id: item.youtube_id })
  }
  const add = async (event: React.FormEvent) => {
    event.preventDefault()
    const id = extractYouTubeId(url)
    if (!id || !coupleId || !userId) { setError('Enter a valid YouTube URL or video ID.'); return }
    const { count } = await supabase.from('watchlist').select('id', { count: 'exact', head: true }).eq('couple_id', coupleId)
    const { data, error: insertError } = await supabase.from('watchlist').insert({ couple_id: coupleId, added_by: userId, youtube_id: id, title: title.trim() || `YouTube video ${id}`, thumbnail_url: getYouTubeThumbnail(id), position: count ?? 0 }).select().single()
    if (insertError) { setError(insertError.message); return }
    const item = data as WatchItem; setItems((old) => [...old, item]); setCurrent((old) => old ?? item); setUrl(''); setTitle(''); setError(null)
  }
  const toggle = async () => { const next = !playing; setPlaying(next); await broadcast(next ? 'play' : 'pause') }

  return <main className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm uppercase tracking-[0.25em] text-[var(--muted)]">Shared moment</p><h1 className="text-4xl font-bold">Watch Together</h1><p className="mt-2 text-[var(--muted)]">Choose a video and stay in sync with your partner.</p></div><Link href="/chat" className="glass-button rounded-xl px-4 py-2">Open full chat</Link></div>
    {error && <p className="rounded-xl bg-red-500/10 p-3 text-red-300">{error}</p>}
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-4">
        <div className="glass-card overflow-hidden rounded-2xl p-3">{current ? <><div className="aspect-video overflow-hidden rounded-xl bg-black"><iframe className="h-full w-full" src={`https://www.youtube.com/embed/${current.youtube_id}?enablejsapi=1`} title={current.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /></div><div className="flex items-center justify-between gap-3 p-2"><h2 className="font-semibold">{current.title}</h2><button className="glass-button rounded-lg px-4 py-2" onClick={() => void toggle()}>{playing ? 'Pause sync' : 'Play sync'}</button></div></> : <div className="p-12 text-center text-[var(--muted)]">Add a video to start your watch party.</div>}</div>
        <form onSubmit={(event) => void add(event)} className="glass-card grid gap-3 rounded-2xl p-4 md:grid-cols-[1fr_1fr_auto]"><input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="YouTube URL or video ID" className="rounded-lg border border-white/10 bg-black/20 px-3 py-2" /><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title (optional)" className="rounded-lg border border-white/10 bg-black/20 px-3 py-2" /><button className="glass-button rounded-lg px-4 py-2" type="submit">Add video</button></form>
      </section>
      <aside className="space-y-4"><div className="glass-card rounded-2xl p-4"><h2 className="mb-3 text-xl font-semibold">Watchlist</h2><div className="space-y-3">{items.map((item) => <div key={item.id} className="flex items-center gap-3"><img src={item.thumbnail_url ?? getYouTubeThumbnail(item.youtube_id)} alt="" className="h-12 w-20 rounded object-cover" /><button className="min-w-0 flex-1 text-left" onClick={() => void select(item)}><span className="block truncate font-medium">{item.title}</span><span className="text-xs text-[var(--muted)]">Play together</span></button><button className="text-xs text-red-300" onClick={() => void supabase.from('watchlist').delete().eq('id', item.id).then(() => setItems((old) => old.filter((row) => row.id !== item.id)))}>Remove</button></div>)}</div></div><div className="glass-card max-h-[500px] overflow-auto rounded-2xl p-3"><h2 className="mb-2 px-2 text-xl font-semibold">Party chat</h2><RealtimeChat /></div></aside>
    </div>
  </main>
}

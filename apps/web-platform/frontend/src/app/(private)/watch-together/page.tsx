'use client'
/* eslint-disable @next/next/no-img-element -- YouTube thumbnails are remote user-selected URLs. */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { History, Play, Trash2 } from 'lucide-react'
import RealtimeChat from '@/features/chat/RealtimeChat'
import { supabase } from '@/lib/supabase'
import { getCoupleStatus } from '@/lib/couples'
import { extractYouTubeId, getYouTubeThumbnail } from '@/lib/watchTogether'
import { useLanguage } from '@/contexts/LanguageContext'

type WatchItem = {
  id: string
  youtube_id: string
  title: string
  thumbnail_url: string | null
  position: number
}

type WatchHistoryItem = {
  id: string
  youtube_id: string
  watched_at: string
}

export default function WatchTogetherPage() {
  const { language } = useLanguage()
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [items, setItems] = useState<WatchItem[]>([])
  const [history, setHistory] = useState<WatchHistoryItem[]>([])
  const [current, setCurrent] = useState<WatchItem | null>(null)
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [error, setError] = useState<string | null>(null)
  const channelName = useMemo(() => (coupleId ? `watch-sync-${coupleId}` : null), [coupleId])
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const latestSyncTimestamp = useRef(0)

  const loadHistory = useCallback(async (cId: string) => {
    const { data } = await supabase
      .from('watch_history')
      .select('id, youtube_id, watched_at')
      .eq('couple_id', cId)
      .order('watched_at', { ascending: false })
      .limit(10)
    if (data) {
      setHistory(data as WatchHistoryItem[])
    }
  }, [])

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null
    void (async () => {
      const [{ data: { user } }, { couple }] = await Promise.all([
        supabase.auth.getUser(),
        getCoupleStatus(),
      ])
      if (!user || !couple) {
        setError('Link with your partner to use Watch Together.')
        return
      }
      setUserId(user.id)
      setCoupleId(couple.id)

      void loadHistory(couple.id)

      const { data, error: loadError } = await supabase
        .from('watchlist')
        .select('*')
        .eq('couple_id', couple.id)
        .order('position')
        .order('created_at')
      if (loadError) throw loadError
      const rows = (data ?? []) as WatchItem[]
      setItems(rows)
      setCurrent(rows[0] ?? null)

      channel = supabase.channel(`watch-sync-${couple.id}`)
      channelRef.current = channel
        .on('broadcast', { event: 'video' }, ({ payload }) => {
          const timestamp = Number(payload.timestamp) || 0
          if (timestamp <= latestSyncTimestamp.current) return
          latestSyncTimestamp.current = timestamp
          const item = rows.find((row) => row.youtube_id === payload.youtubeId)
          if (item) setCurrent(item)
        })
        .subscribe()
    })().catch((reason: unknown) =>
      setError(reason instanceof Error ? reason.message : 'Unable to load Watch Together.')
    )
    return () => {
      channelRef.current = null
      if (channel) void supabase.removeChannel(channel)
    }
  }, [loadHistory])

  const broadcast = async (event: 'video', payload: Record<string, unknown> = {}) => {
    if (!channelName || !channelRef.current) return
    const response = await channelRef.current.send({
      type: 'broadcast',
      event,
      payload: { ...payload, timestamp: Date.now() },
    })
    if (response !== 'ok') throw new Error(`Watch sync unavailable: ${response}`)
  }

  const select = async (item: WatchItem) => {
    setCurrent(item)
    await broadcast('video', { youtubeId: item.youtube_id })
    if (coupleId && userId) {
      await supabase
        .from('watch_history')
        .insert({ couple_id: coupleId, watched_by: userId, youtube_id: item.youtube_id })
      void loadHistory(coupleId)
    }
  }

  const playHistoryItem = async (hist: WatchHistoryItem) => {
    const matched = items.find((i) => i.youtube_id === hist.youtube_id)
    const playItem: WatchItem = matched ?? {
      id: hist.id,
      youtube_id: hist.youtube_id,
      title: `Video ${hist.youtube_id}`,
      thumbnail_url: getYouTubeThumbnail(hist.youtube_id),
      position: 0,
    }
    await select(playItem)
  }

  const add = async (event: React.FormEvent) => {
    event.preventDefault()
    const id = extractYouTubeId(url)
    if (!id || !coupleId || !userId) {
      setError('Enter a valid YouTube URL or video ID.')
      return
    }
    const { count } = await supabase
      .from('watchlist')
      .select('id', { count: 'exact', head: true })
      .eq('couple_id', coupleId)

    const { data, error: insertError } = await supabase
      .from('watchlist')
      .insert({
        couple_id: coupleId,
        added_by: userId,
        youtube_id: id,
        title: title.trim() || `YouTube video ${id}`,
        thumbnail_url: getYouTubeThumbnail(id),
        position: count ?? 0,
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      return
    }

    const item = data as WatchItem
    setItems((old) => [...old, item])
    setCurrent((old) => old ?? item)
    setUrl('')
    setTitle('')
    setError(null)
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-text-2">Shared moment</p>
          <h1 className="text-4xl font-serif text-text-1">Watch Together</h1>
          <p className="mt-2 text-text-2">
            {language === 'my'
              ? 'ရွေးထားတဲ့ဗီဒီယိုက နှစ်ယောက်စလုံးရဲ့စာရင်းမှာ တစ်ပြိုင်တည်းပြောင်းပါမယ်။'
              : 'Selected videos update on both partners’ screens in real-time.'}
          </p>
        </div>
        <Link href="/chat" className="glass-button rounded-xl px-4 py-2 text-sm font-semibold">
          Open full chat
        </Link>
      </div>

      {error && <p className="rounded-xl bg-error/10 p-3 text-error">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-4">
          <div className="glass-card overflow-hidden rounded-btn p-3">
            {current ? (
              <>
                <div className="aspect-video overflow-hidden rounded-xl bg-black shadow-md">
                  <iframe
                    className="h-full w-full"
                    src={`https://www.youtube.com/embed/${current.youtube_id}?autoplay=1&cc_load_policy=1`}
                    title={current.title}
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="p-3">
                  <h2 className="text-lg font-semibold text-text-1">{current.title}</h2>
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-text-2">
                Add a video or choose from your watchlist to start watching together.
              </div>
            )}
          </div>

          <form
            onSubmit={(event) => void add(event)}
            className="glass-card grid gap-3 rounded-btn p-4 md:grid-cols-[1fr_1fr_auto]"
          >
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="YouTube URL or video ID"
              className="rounded-lg border border-border bg-card/40 px-3 py-2 text-sm text-text-1 placeholder:text-text-2"
            />
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Title (optional)"
              className="rounded-lg border border-border bg-card/40 px-3 py-2 text-sm text-text-1 placeholder:text-text-2"
            />
            <button
              className="rounded-lg bg-accent-1 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 active:scale-95"
              type="submit"
            >
              Add video
            </button>
          </form>

          {history.length > 0 && (
            <div className="glass-card rounded-btn p-4">
              <div className="flex items-center gap-2 mb-3">
                <History className="h-4 w-4 text-accent-1" />
                <h3 className="font-semibold text-text-1">Recently watched together</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {history.map((hist) => (
                  <button
                    key={hist.id}
                    type="button"
                    onClick={() => void playHistoryItem(hist)}
                    className="group flex flex-col items-start rounded-xl border border-border/50 bg-card/30 p-2 text-left transition hover:border-accent-1/40 hover:bg-card/70"
                  >
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black/40">
                      <img
                        src={getYouTubeThumbnail(hist.youtube_id)}
                        alt=""
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition">
                        <Play className="h-6 w-6 text-white drop-shadow" />
                      </div>
                    </div>
                    <span className="mt-1.5 line-clamp-1 text-xs font-medium text-text-1">
                      {hist.youtube_id}
                    </span>
                    <span className="text-[10px] text-text-2">
                      {new Date(hist.watched_at).toLocaleDateString()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="glass-card rounded-btn p-4">
            <h2 className="mb-3 text-xl font-serif text-text-1">Watchlist</h2>
            <div className="space-y-3 max-h-[280px] overflow-auto">
              {items.length === 0 ? (
                <p className="text-sm text-text-2">Your watchlist is empty.</p>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <img
                      src={item.thumbnail_url ?? getYouTubeThumbnail(item.youtube_id)}
                      alt=""
                      className="h-12 w-20 rounded object-cover shrink-0"
                    />
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => void select(item)}
                    >
                      <span className="block truncate text-sm font-medium text-text-1">
                        {item.title}
                      </span>
                      <span className="text-xs text-accent-1 font-semibold">Play together</span>
                    </button>
                    <button
                      type="button"
                      className="text-text-2 transition hover:text-error"
                      onClick={() =>
                        void supabase
                          .from('watchlist')
                          .delete()
                          .eq('id', item.id)
                          .then(() => setItems((old) => old.filter((row) => row.id !== item.id)))
                      }
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="glass-card max-h-[500px] overflow-auto rounded-btn p-3">
            <h2 className="mb-2 px-2 text-xl font-serif text-text-1">Party chat</h2>
            <RealtimeChat />
          </div>
        </aside>
      </div>
    </div>
  )
}

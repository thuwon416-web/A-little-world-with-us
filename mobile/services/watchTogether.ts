import { supabase } from '@/lib/supabase'
import { getContext } from './secondary'

export type WatchlistItem = {
  id: string
  couple_id: string
  added_by: string
  youtube_id: string
  title: string
  thumbnail_url: string | null
  position: number
  created_at: string
}

export type WatchSyncEvent = 'play' | 'pause' | 'seek' | 'video'

export function extractYouTubeId(input: string) {
  const value = input.trim()
  if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value
  const match = value.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/)
  return match?.[1] ?? null
}

export function getYouTubeThumbnail(videoId: string) {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
}

export async function getWatchContext() {
  const context = await getContext()
  if (!context.coupleId) throw new Error('Link with your partner to use Watch Together.')
  return context
}

export async function getWatchlist(coupleId: string) {
  const { data, error } = await supabase.from('watchlist').select('*').eq('couple_id', coupleId).order('position').order('created_at')
  if (error) throw new Error(error.message)
  return (data ?? []) as WatchlistItem[]
}

export async function addWatchlistItem(coupleId: string, userId: string, youtubeId: string, title: string) {
  const { count } = await supabase.from('watchlist').select('id', { count: 'exact', head: true }).eq('couple_id', coupleId)
  const { data, error } = await supabase.from('watchlist').insert({
    couple_id: coupleId,
    added_by: userId,
    youtube_id: youtubeId,
    title: title.trim() || `YouTube video ${youtubeId}`,
    thumbnail_url: getYouTubeThumbnail(youtubeId),
    position: count ?? 0,
  }).select('*').single()
  if (error) throw new Error(error.message)
  return data as WatchlistItem
}

export async function removeWatchlistItem(id: string) {
  const { error } = await supabase.from('watchlist').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function addWatchHistory(coupleId: string, userId: string, youtubeId: string) {
  const { error } = await supabase.from('watch_history').insert({ couple_id: coupleId, watched_by: userId, youtube_id: youtubeId })
  if (error) throw new Error(error.message)
}

export async function sendWatchSync(coupleId: string, event: WatchSyncEvent, payload: { position?: number; youtubeId?: string }) {
  const channel = supabase.channel(`watch-sync-${coupleId}`)
  await new Promise<void>((resolve, reject) => {
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') resolve()
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') reject(new Error(`Watch sync unavailable: ${status}`))
    })
  })
  try {
    const response = await channel.send({ type: 'broadcast', event, payload })
    if (response !== 'ok') throw new Error(`Watch sync unavailable: ${response}`)
  } finally {
    await supabase.removeChannel(channel)
  }
}

export function subscribeToWatchSync(coupleId: string, onEvent: (event: WatchSyncEvent, payload: { position?: number; youtubeId?: string }) => void) {
  const channel = supabase.channel(`watch-sync-${coupleId}`)
  channel.on('broadcast', { event: 'play' }, ({ payload }) => onEvent('play', payload))
    .on('broadcast', { event: 'pause' }, ({ payload }) => onEvent('pause', payload))
    .on('broadcast', { event: 'seek' }, ({ payload }) => onEvent('seek', payload))
    .on('broadcast', { event: 'video' }, ({ payload }) => onEvent('video', payload))
    .subscribe()
  return () => { void supabase.removeChannel(channel) }
}

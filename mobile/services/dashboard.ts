import { supabase } from '@/lib/supabase'
import type { MemoryRecord } from '@/services/memories'
import type { PlaylistSong } from '@/services/music'

export type DashboardData = {
  coupleId: string
  messageCount: number
  memoryCount: number
  vaultCount: number
  longestStreak: number
  memory: MemoryRecord | null
  playlistSong: PlaylistSong | null
}

async function getCoupleId() {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Please sign in again to view your dashboard.')
  const { data, error } = await supabase.from('couple_links').select('couple_id')
    .or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`).eq('status', 'accepted').maybeSingle()
  if (error) throw error
  if (!data?.couple_id) throw new Error('Accept a partner link before viewing your shared dashboard.')
  return data.couple_id
}

function longestConsecutiveDays(values: string[]) {
  const days = [...new Set(values)].sort()
  let longest = days.length ? 1 : 0
  let current = longest
  for (let index = 1; index < days.length; index += 1) {
    const previous = new Date(`${days[index - 1]}T12:00:00`)
    const next = new Date(`${days[index]}T12:00:00`)
    if (Math.round((next.getTime() - previous.getTime()) / 86400000) === 1) current += 1
    else current = 1
    longest = Math.max(longest, current)
  }
  return longest
}

export async function getDashboardData(): Promise<DashboardData> {
  const coupleId = await getCoupleId()
  const [{ count: messageCount, error: messagesError }, { count: memoryCount, error: memoriesError }, { count: vaultCount, error: vaultError }, { data: messages, error: messageDatesError }, { data: memories, error: memoryError }, { data: playlist, error: playlistError }] = await Promise.all([
    supabase.from('messages').select('id', { count: 'exact', head: true }).eq('couple_id', coupleId),
    supabase.from('memories').select('id', { count: 'exact', head: true }).eq('couple_id', coupleId),
    supabase.from('vault_items').select('id', { count: 'exact', head: true }).eq('couple_id', coupleId),
    supabase.from('messages').select('created_at').eq('couple_id', coupleId).order('created_at', { ascending: true }),
    supabase.from('memories').select('id,title,caption,date,category,image_url,created_at').eq('couple_id', coupleId),
    supabase.from('shared_playlist').select('*').eq('couple_id', coupleId).order('position').order('created_at').limit(1),
  ])
  if (messagesError) throw messagesError
  if (memoriesError) throw memoriesError
  if (vaultError) throw vaultError
  if (messageDatesError) throw messageDatesError
  if (memoryError) throw memoryError
  if (playlistError) throw playlistError
  const memoryRows = (memories ?? []) as MemoryRecord[]
  const randomMemory = memoryRows.length ? memoryRows[Math.floor(Math.random() * memoryRows.length)] : null
  return {
    coupleId,
    messageCount: messageCount ?? 0,
    memoryCount: memoryCount ?? 0,
    vaultCount: vaultCount ?? 0,
    longestStreak: longestConsecutiveDays((messages ?? []).map((message) => message.created_at.slice(0, 10))),
    memory: randomMemory ?? null,
    playlistSong: ((playlist ?? [])[0] as PlaylistSong | undefined) ?? null,
  }
}

import { supabase } from '@/lib/supabase'

export type PlaylistSong = {
  id: string
  couple_id: string
  added_by: string
  provider: 'youtube' | 'spotify' | 'upload' | 'local'
  external_id: string
  title: string
  artist: string | null
  thumbnail_url: string | null
  why_added: string | null
  is_anniversary_song: boolean
}

async function context() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')
  const { data, error } = await supabase
    .from('couple_links')
    .select('couple_id')
    .or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`)
    .eq('status', 'accepted')
    .maybeSingle()
  if (error || !data?.couple_id) throw new Error('No accepted couple is linked to this account.')
  return { user, coupleId: data.couple_id }
}

export async function getPlaylist() {
  const { coupleId } = await context()
  const { data, error } = await supabase
    .from('shared_playlist')
    .select('*')
    .eq('couple_id', coupleId)
    .order('position')
    .order('created_at')
  if (error) throw new Error(error.message)
  return (data ?? []) as PlaylistSong[]
}

export async function addSong(input: {
  externalId: string
  title: string
  artist?: string
  whyAdded?: string
  thumbnailUrl?: string
}) {
  const { user, coupleId } = await context()
  const { error } = await supabase.from('shared_playlist').insert({
    couple_id: coupleId,
    added_by: user.id,
    provider: 'youtube',
    external_id: input.externalId,
    title: input.title,
    artist: input.artist || null,
    why_added: input.whyAdded || null,
    thumbnail_url: input.thumbnailUrl || `https://i.ytimg.com/vi/${input.externalId}/hqdefault.jpg`,
  })
  if (error) throw new Error(error.message)
}

export async function removeSong(id: string) {
  const { error } = await supabase.from('shared_playlist').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function toggleAnniversary(id: string, value: boolean) {
  const { error } = await supabase
    .from('shared_playlist')
    .update({ is_anniversary_song: value })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

import { supabase } from '@/lib/supabase'
import type { Memory } from '@/shared-types'

export type MemoryRecord = Pick<
  Memory,
  | 'id'
  | 'title'
  | 'caption'
  | 'date'
  | 'category'
  | 'image_url'
  | 'storage_path'
  | 'latitude'
  | 'longitude'
  | 'location_label'
  | 'created_at'
  | 'mime_type'
> & {
  metadata?: { mood_tag?: string; ai_reflection?: string; voice_url?: string; voice_path?: string } | null
  storage_provider?: 'supabase' | 'google_drive' | 'cloudinary' | 'backblaze_b2'
  b2_file_id?: string | null
  b2_file_name?: string | null
  b2_bucket_name?: string | null
  drive_file_id?: string | null
  cloudinary_asset_id?: string | null
  cloudinary_public_id?: string | null
  storage_url?: string | null
  thumbnail_url?: string | null
  description?: string | null
}

async function getCoupleId() {
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
  return data.couple_id
}

export async function getMemories(): Promise<MemoryRecord[]> {
  const id = await getCoupleId()
  const { data, error } = await supabase
    .from('memories')
    .select(
      'id,title,caption,description,date,category,image_url,storage_path,latitude,longitude,location_label,created_at,mime_type,metadata,storage_provider,drive_file_id,cloudinary_asset_id,cloudinary_public_id,storage_url,thumbnail_url'
    )
    .eq('couple_id', id)
    .order('date', { ascending: false })
  if (error) throw new Error(error.message)

  const webUrl = process.env.EXPO_PUBLIC_WEB_URL?.replace(/\/$/, '')
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const records = (data ?? []) as MemoryRecord[]
  if (!webUrl || !session?.access_token) return records

  return Promise.all(records.map(async (memory) => {
    if (memory.storage_provider !== 'cloudinary') return memory
    const response = await fetch(`${webUrl}/api/media/url?memoryId=${encodeURIComponent(memory.id)}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    if (!response.ok) return memory
    const body = (await response.json().catch(() => ({}))) as { url?: string }
    return body.url ? { ...memory, image_url: body.url } : memory
  }))
}

export async function deleteMemory(id: string) {
  const webUrl = process.env.EXPO_PUBLIC_WEB_URL?.replace(/\/$/, '')
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!webUrl || !session?.access_token) throw new Error('Please sign in again.')

  const response = await fetch(`${webUrl}/api/media/delete`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ memoryId: id }),
  })
  const body = (await response.json().catch(() => ({}))) as { error?: string }
  if (!response.ok) throw new Error(body.error || 'Memory deletion failed.')
}

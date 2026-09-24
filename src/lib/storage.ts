import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { validateUpload } from '@/lib/upload-validation'
import { encryptAndUpload, getDecryptedObjectUrl, guessMimeTypeFromPath } from '@/lib/mediaEncryption'

export type GalleryImage = { id: string; name: string; path: string; ownerId: string; mimeType: string; url: string; created_at: string }

async function currentUserId() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Please sign in first.')
  return user.id
}

export async function uploadGalleryImage(file: File, coupleId: string, _folder?: string) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.')
  const validation = validateUpload(file, { imagesOnly: true })
  if (!validation.valid) throw new Error(validation.error)
  const userId = await currentUserId()
  const extension = file.name.includes('.') ? file.name.split('.').pop() ?? 'jpg' : 'jpg'
  const path = `${userId}/${crypto.randomUUID()}.${extension}`
  const { path: storedPath, mimeType } = await encryptAndUpload(
    file,
    coupleId,
    'gallery',
    path,
    { cacheControl: '3600', upsert: false }
  )
  return { id: crypto.randomUUID(), name: storedPath, path: storedPath, ownerId: userId, url: await getDecryptedObjectUrl(coupleId, 'gallery', storedPath, mimeType), created_at: new Date().toISOString(), mimeType }
}

export async function listGalleryImages(coupleId: string, bucket = 'gallery'): Promise<GalleryImage[]> {
  if (!isSupabaseConfigured) return []
  const userId = await currentUserId()
  const { data: link, error: linkError } = await supabase.from('couple_links').select('inviter_id,accepted_by').eq('couple_id', coupleId).eq('status', 'accepted').or(`inviter_id.eq.${userId},accepted_by.eq.${userId}`).maybeSingle()
  if (linkError) throw linkError
  if (!link?.inviter_id || !link.accepted_by) throw new Error('An accepted partner link is required to view the shared gallery.')
  const ownerIds = [link.inviter_id, link.accepted_by]
  const folders = await Promise.all(ownerIds.map(async (ownerId) => {
    const { data, error } = await supabase.storage.from(bucket).list(ownerId, { limit: 100, offset: 0, sortBy: { column: 'created_at', order: 'desc' } })
    if (error) throw error
    return (data ?? []).filter((item) => item.name && !item.metadata?.isFolder).map((item) => {
      const path = `${ownerId}/${item.name}`
      return { id: item.id ?? path, name: item.name, path, ownerId, mimeType: guessMimeTypeFromPath(item.name), url: '', created_at: item.created_at ?? new Date().toISOString() }
    })
  }))
  return folders.flat().sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export async function deleteGalleryImage(path: string, bucket = 'gallery') {
  if (!isSupabaseConfigured) return false
  const userId = await currentUserId()
  if (!path.startsWith(`${userId}/`)) return false
  const { error } = await supabase.storage.from(bucket).remove([path])
  return !error
}

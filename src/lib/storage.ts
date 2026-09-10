import { isSupabaseConfigured, supabase } from '@/lib/supabase'

export type GalleryImage = { id: string; name: string; path: string; url: string; created_at: string }

async function signedUrl(bucket: string, path: string) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60)
  if (error || !data?.signedUrl) throw error ?? new Error('Unable to create private media link.')
  return data.signedUrl
}

async function currentUserId() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Please sign in first.')
  return user.id
}

export async function uploadGalleryImage(file: File, _folder?: string) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.')
  const userId = await currentUserId()
  const extension = file.name.includes('.') ? file.name.split('.').pop() ?? 'jpg' : 'jpg'
  const path = `${userId}/${crypto.randomUUID()}.${extension}`
  const { data, error } = await supabase.storage.from('gallery').upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type || 'image/jpeg' })
  if (error) throw error
  return { id: data?.id ?? crypto.randomUUID(), name: data?.path ?? path, path: data?.path ?? path, url: await signedUrl('gallery', data?.path ?? path), created_at: new Date().toISOString() }
}

export async function listGalleryImages(bucket = 'gallery'): Promise<GalleryImage[]> {
  if (!isSupabaseConfigured) return []
  const userId = await currentUserId()
  const { data, error } = await supabase.storage.from(bucket).list(userId, { limit: 100, offset: 0, sortBy: { column: 'created_at', order: 'desc' } })
  if (error) throw error
  const results = await Promise.all((data ?? []).filter((item) => item.name && !item.metadata?.isFolder).map(async (item) => {
    const path = `${userId}/${item.name}`
    try {
      return { id: item.id ?? path, name: item.name, path, url: await signedUrl(bucket, path), created_at: item.created_at ?? new Date().toISOString() }
    } catch {
      return null
    }
  }))
  return results.filter((item): item is GalleryImage => item !== null)
}

export async function deleteGalleryImage(path: string, bucket = 'gallery') {
  if (!isSupabaseConfigured) return false
  const { error } = await supabase.storage.from(bucket).remove([path])
  return !error
}

import { isSupabaseConfigured, supabase } from '@/lib/supabase'

export type GalleryImage = {
  id: string
  name: string
  path: string
  url: string
  created_at: string
}

export async function uploadGalleryImage(file: File, folder = 'gallery') {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.')
  }

  const extension = file.name.includes('.') ? file.name.split('.').pop() ?? 'jpg' : 'jpg'
  const path = `${folder}/${crypto.randomUUID()}.${extension}`

  const { data, error } = await supabase.storage.from('gallery').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || 'image/jpeg',
  })

  if (error) {
    throw error
  }

  const { data: publicData } = supabase.storage.from('gallery').getPublicUrl(data?.path ?? path)

  return {
    id: data?.id ?? crypto.randomUUID(),
    name: data?.path ?? path,
    path: data?.path ?? path,
    url: publicData.publicUrl,
    created_at: new Date().toISOString(),
  }
}

export async function listGalleryImages(bucket = 'gallery'): Promise<GalleryImage[]> {
  if (!isSupabaseConfigured) {
    return []
  }

  const { data, error } = await supabase.storage.from(bucket).list('', {
    limit: 100,
    offset: 0,
    sortBy: { column: 'created_at', order: 'desc' },
  })

  if (error) {
    throw error
  }

  return (data ?? [])
    .filter((item) => item.name && !item.metadata?.isFolder)
    .map((item) => {
      const filePath = `${item.name}`
      const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(filePath)
      return {
        id: item.id ?? filePath,
        name: item.name,
        path: filePath,
        url: publicData.publicUrl,
        created_at: item.created_at ?? new Date().toISOString(),
      }
    })
}

export async function deleteGalleryImage(path: string, bucket = 'gallery') {
  if (!isSupabaseConfigured) {
    return false
  }

  const { error } = await supabase.storage.from(bucket).remove([path])
  return !error
}

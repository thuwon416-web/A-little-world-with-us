'use client'

import { useEffect, useState } from 'react'
import PhotoExport from '@/features/memories/PhotoExport'
import { supabase } from '@/lib/supabase'

type Photo = { id: string; url: string; filename: string; created_at: string }

export default function PhotoExportSettings() {
  const [photos, setPhotos] = useState<Photo[]>([])

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.from('memories').select('id,image_url,storage_path,title,caption,created_at').order('created_at', { ascending: false })
      const resolved = await Promise.all((data ?? []).map(async (memory) => {
        const path = memory.storage_path ?? memory.image_url ?? ''
        if (!path || path.startsWith('/')) return { id: memory.id, url: path, filename: memory.title ?? memory.caption ?? 'memory', created_at: memory.created_at }
        const { data: signed } = await supabase.storage.from('memories').createSignedUrl(path, 3600)
        return { id: memory.id, url: signed?.signedUrl ?? '', filename: memory.title ?? memory.caption ?? 'memory', created_at: memory.created_at }
      }))
      setPhotos(resolved.filter((photo) => photo.url))
    })()
  }, [])

  return <PhotoExport photos={photos} />
}

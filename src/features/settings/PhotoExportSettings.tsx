'use client'

import { useEffect, useState } from 'react'
import PhotoExport from '@/features/memories/PhotoExport'
import { supabase } from '@/lib/supabase'
import { getCachedDecryptedUrl, guessMimeTypeFromPath } from '@/lib/mediaEncryption'

function isExternalUrl(v?: string | null) {
  return !!v && (v.startsWith('http://') || v.startsWith('https://'))
}

type Photo = { id: string; url: string; filename: string; created_at: string }

export default function PhotoExportSettings() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [coupleId, setCoupleId] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return
      const { data: link } = await supabase.from('couple_links').select('couple_id').or(`inviter_id.eq.${userData.user.id},accepted_by.eq.${userData.user.id}`).eq('status', 'accepted').maybeSingle()
      setCoupleId(link?.couple_id ?? null)
      const { data } = await supabase.from('memories').select('id,image_url,storage_path,title,caption,created_at,mime_type').order('created_at', { ascending: false })
      const resolved = await Promise.all((data ?? []).map(async (memory) => {
        const path = memory.storage_path ?? memory.image_url ?? ''
        if (!path || path.startsWith('/')) return { id: memory.id, url: path, filename: memory.title ?? memory.caption ?? 'memory', created_at: memory.created_at }
        let url: string | undefined
        if (isExternalUrl(path)) {
          const { data: signed } = await supabase.storage.from('memories').createSignedUrl(path, 3600)
          url = signed?.signedUrl
        } else if (link?.couple_id) {
          const mimeType = memory.mime_type || guessMimeTypeFromPath(path)
          url = await getCachedDecryptedUrl(link.couple_id, 'memories', path, mimeType)
        }
        return { id: memory.id, url: url ?? '', filename: memory.title ?? memory.caption ?? 'memory', created_at: memory.created_at }
      }))
      setPhotos(resolved.filter((photo) => photo.url))
    })()
  }, [])

  return <PhotoExport photos={photos} />
}

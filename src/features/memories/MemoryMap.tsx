'use client'
/* eslint-disable @next/next/no-img-element -- private signed URLs are resolved at runtime. */

import { useEffect, useState } from 'react'
import { divIcon } from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import type { Memory } from '@/lib/supabase'
import { getCachedDecryptedUrl } from '@/lib/mediaEncryption'
import { useTheme } from '@/contexts/ThemeContext'

const memoryPin = divIcon({
  className: 'memory-map-pin',
  html: '<span aria-hidden="true">♥</span>',
  iconSize: [34, 42],
  iconAnchor: [17, 40],
  popupAnchor: [0, -38],
})

export default function MemoryMap({ memories, coupleId }: { memories: Memory[]; coupleId: string }) {
  const { mode } = useTheme()
  const first = memories[0]
  const [urls, setUrls] = useState<Record<string, string>>({})
  useEffect(() => {
    let mounted = true
    void Promise.all(memories.map(async (memory) => {
      const path = memory.storage_path ?? memory.image_url
      if (!path) return null
      if (path.startsWith('/') || path.startsWith('http')) return [memory.id, path] as const
      const mimeType = memory.mime_type || 'image/jpeg'
      try {
        const url = await getCachedDecryptedUrl(coupleId, 'memories', path, mimeType)
        return [memory.id, url] as const
      } catch {
        return null
      }
    })).then((entries) => { if (mounted) setUrls(Object.fromEntries(entries.filter((entry): entry is readonly [string, string] => entry !== null))) })
    return () => { mounted = false }
  }, [memories, coupleId])
  const darkMap = mode === 'lavender-mist' || mode === 'monochrome'
  const tileUrl = process.env.NEXT_PUBLIC_CARTO_TILE_URL ?? `https://{s}.basemaps.cartocdn.com/${darkMap ? 'dark_all' : 'light_all'}/{z}/{x}/{y}{r}.png`
  return <MapContainer center={[first.latitude ?? 0, first.longitude ?? 0]} zoom={4} scrollWheelZoom className="h-[70vh] w-full rounded-panel"><TileLayer attribution="&copy; OpenStreetMap contributors &copy; CARTO" url={tileUrl} />{memories.map((memory) => <Marker key={memory.id} position={[memory.latitude as number, memory.longitude as number]} icon={memoryPin}><Popup><strong>{memory.title ?? 'A memory together'}</strong><br />{memory.location_label ?? 'Located memory'}<br />{memory.date}{urls[memory.id] ? <><br /><img src={urls[memory.id]} alt={`Memory photo: ${memory.title ?? 'Shared memory'}`} className="mt-2 h-20 w-28 rounded object-cover" /></> : null}</Popup></Marker>)}</MapContainer>
}

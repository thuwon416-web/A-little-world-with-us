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

function hasValidCoordinates(memory: Memory): boolean {
  return (
    typeof memory.latitude === 'number' &&
    Number.isFinite(memory.latitude) &&
    memory.latitude >= -90 &&
    memory.latitude <= 90 &&
    typeof memory.longitude === 'number' &&
    Number.isFinite(memory.longitude) &&
    memory.longitude >= -180 &&
    memory.longitude <= 180
  )
}

export default function MemoryMap({ memories, coupleId }: { memories: Memory[]; coupleId: string }) {
  const { mode } = useTheme()
  const locatedMemories = memories.filter(hasValidCoordinates)
  const first = locatedMemories[0]
  const [urls, setUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    let mounted = true
    void Promise.all(locatedMemories.map(async (memory) => {
      const driveFileId = (memory as Memory & { storage_provider?: string; drive_file_id?: string | null }).storage_provider === 'google_drive'
        ? (memory as Memory & { drive_file_id?: string | null }).drive_file_id
        : null
      const path = memory.storage_path ?? memory.image_url
      if (driveFileId) return [memory.id, `/api/drive/file?fileId=${encodeURIComponent(driveFileId)}&download=1`] as const
      if (!path) return null
      if (path.startsWith('/') || path.startsWith('http')) return [memory.id, path] as const
      const mimeType = memory.mime_type || 'image/jpeg'
      try {
        const url = await getCachedDecryptedUrl(coupleId, 'memories', path, mimeType)
        return [memory.id, url] as const
      } catch {
        return null
      }
    })).then((entries) => {
      if (mounted) {
        setUrls(Object.fromEntries(entries.filter((entry): entry is readonly [string, string] => entry !== null)))
      }
    })
    return () => { mounted = false }
  }, [locatedMemories, coupleId])

  if (!first) return null

  const darkMap = mode === 'lavender-mist' || mode === 'monochrome'
  const tileUrl = process.env.NEXT_PUBLIC_CARTO_TILE_URL ?? `https://{s}.basemaps.cartocdn.com/${darkMap ? 'dark_all' : 'light_all'}/{z}/{x}/{y}{r}.png`

  return (
    <MapContainer
      center={[first.latitude as number, first.longitude as number]}
      zoom={4}
      scrollWheelZoom
      className="h-[70vh] w-full rounded-panel"
    >
      <TileLayer attribution="&copy; OpenStreetMap contributors &copy; CARTO" url={tileUrl} />
      {locatedMemories.map((memory) => (
        <Marker
          key={memory.id}
          position={[memory.latitude as number, memory.longitude as number]}
          icon={memoryPin}
        >
          <Popup>
            <strong>{memory.title ?? 'A memory together'}</strong>
            <br />
            {memory.location_label ?? 'Located memory'}
            <br />
            {memory.date}
            {urls[memory.id] ? (
              <>
                <br />
                <img
                  src={urls[memory.id]}
                  alt={`Memory photo: ${memory.title ?? 'Shared memory'}`}
                  className="mt-2 h-20 w-28 rounded object-cover"
                />
              </>
            ) : null}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}

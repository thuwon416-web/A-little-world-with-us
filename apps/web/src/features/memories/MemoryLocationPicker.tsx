'use client'

import { useEffect, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'
import type { LatLng } from 'leaflet'

type Props = {
  value: { latitude: number; longitude: number } | null
  onChange: (value: { latitude: number; longitude: number }) => void
}

function ClickHandler({ onChange }: { onChange: Props['onChange'] }) {
  useMapEvents({ click: (event: { latlng: LatLng }) => onChange({ latitude: event.latlng.lat, longitude: event.latlng.lng }) })
  return null
}

export default function MemoryLocationPicker({ value, onChange }: Props) {
  const [center, setCenter] = useState<[number, number]>(value ? [value.latitude, value.longitude] : [16.8661, 96.1951])
  useEffect(() => { if (value) setCenter([value.latitude, value.longitude]) }, [value])
  return (
    <MapContainer center={center} zoom={value ? 13 : 5} scrollWheelZoom className="h-64 w-full rounded-btn">
      <TileLayer attribution="&copy; OpenStreetMap contributors &copy; CARTO" url={process.env.NEXT_PUBLIC_CARTO_TILE_URL ?? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'} />
      <ClickHandler onChange={onChange} />
      {value ? <Marker position={[value.latitude, value.longitude]} /> : null}
    </MapContainer>
  )
}

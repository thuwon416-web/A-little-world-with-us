'use client'

import { useEffect } from 'react'
import { Circle, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import { divIcon, type LatLngExpression } from 'leaflet'

export type MapLocation = { user_id: string; latitude: number; longitude: number; accuracy: number | null; updated_at: string }
export type MapHistory = { user_id: string; latitude: number; longitude: number; captured_at: string }
export type MapPlace = { id: string; name: string; latitude: number; longitude: number; radius_meters: number }
export type MapAlert = { id: string; reporter_id: string; latitude: number | null; longitude: number | null; created_at: string }

const marker = (label: string, color: string) => divIcon({ className: 'pair-map-marker', html: `<span style="display:grid;place-items:center;width:34px;height:34px;border-radius:9999px;border:2px solid #fff;background:${color};box-shadow:0 4px 16px rgba(0,0,0,.45);font-size:16px">${label}</span>`, iconSize: [34, 34], iconAnchor: [17, 17] })

function FocusMap({ point }: { point: LatLngExpression | null }) {
  const map = useMap()
  useEffect(() => { if (point) map.flyTo(point, Math.max(map.getZoom(), 13), { duration: 0.7 }) }, [map, point])
  return null
}

export default function PairLocationMap({ locations, history, selectedUser, names, places, alerts }: { locations: MapLocation[]; history: MapHistory[]; selectedUser: string | null; names: Record<string, string>; places: MapPlace[]; alerts: MapAlert[] }) {
  const selected = locations.find((item) => item.user_id === selectedUser) ?? locations[0]
  const focus: LatLngExpression | null = selected ? [selected.latitude, selected.longitude] : null
  const route = history.filter((row) => row.user_id === selectedUser).slice().reverse().map((row) => [row.latitude, row.longitude] as LatLngExpression)
  return <MapContainer center={focus ?? [16.8661, 96.1951]} zoom={focus ? 13 : 4} scrollWheelZoom className="h-[430px] w-full rounded-2xl" aria-label="Live pair location map">
    <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>' url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
    <FocusMap point={focus} />
    {route.length > 1 && <Polyline positions={route} pathOptions={{ color: '#FFD700', weight: 4, opacity: 0.75 }} />}
    {locations.map((row, index) => <Marker key={row.user_id} position={[row.latitude, row.longitude]} icon={marker(index === 0 ? '♥' : '✦', index === 0 ? '#ff6b9d' : '#8b5cf6')}><Popup><strong>{names[row.user_id] ?? 'Linked account'}</strong><br />Updated {new Date(row.updated_at).toLocaleString()}<br />Accuracy ±{Math.round(row.accuracy ?? 0)}m</Popup></Marker>)}
    {locations.map((row) => <Circle key={`${row.user_id}-accuracy`} center={[row.latitude, row.longitude]} radius={Math.max(row.accuracy ?? 0, 10)} pathOptions={{ color: '#ff6b9d', fillOpacity: 0.08 }} />)}
    {places.map((place) => <Circle key={place.id} center={[place.latitude, place.longitude]} radius={place.radius_meters} pathOptions={{ color: '#34d399', fillOpacity: 0.12 }}><Popup><strong>{place.name}</strong><br />Safe zone · {place.radius_meters}m</Popup></Circle>)}
    {alerts.filter((alert) => alert.latitude !== null && alert.longitude !== null).map((alert) => <Marker key={alert.id} position={[alert.latitude as number, alert.longitude as number]} icon={marker('!', '#ef4444')}><Popup><strong>SOS alert</strong><br />{new Date(alert.created_at).toLocaleString()}</Popup></Marker>)}
  </MapContainer>
}

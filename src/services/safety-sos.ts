import { getCoupleStatus } from '@/lib/couples'
import { getCurrentUserId, supabase } from '@/lib/supabase'

export type SosAlert = {
  id: string
  coupleId: string
  reporterId: string
  latitude: number | null
  longitude: number | null
  accuracy: number | null
  message: string | null
  createdAt: string
  resolvedAt: string | null
  resolvedBy: string | null
  resolutionNote: string | null
}

type SosRow = {
  id: string; couple_id: string; reporter_id: string; latitude: number | null; longitude: number | null
  accuracy: number | null; message: string | null; created_at: string; resolved_at: string | null
  resolved_by: string | null; resolution_note: string | null
}
const mapSos = (row: SosRow): SosAlert => ({
  id: row.id, coupleId: row.couple_id, reporterId: row.reporter_id, latitude: row.latitude,
  longitude: row.longitude, accuracy: row.accuracy, message: row.message, createdAt: row.created_at,
  resolvedAt: row.resolved_at, resolvedBy: row.resolved_by, resolutionNote: row.resolution_note,
})
async function context() {
  const userId = await getCurrentUserId()
  const status = await getCoupleStatus()
  if (!userId || status.status !== 'accepted' || !status.couple?.id) throw new Error('An accepted couple link is required.')
  return { userId, coupleId: status.couple.id }
}
export async function getActiveSos() {
  const { coupleId } = await context()
  const { data, error } = await supabase.from('emergency_alerts').select('*').eq('couple_id', coupleId).is('resolved_at', null).order('created_at', { ascending: false })
  if (error) throw error
  return ((data ?? []) as SosRow[]).map(mapSos)
}
export async function getSosHistory(limit = 50) {
  const { coupleId } = await context()
  const { data, error } = await supabase.from('emergency_alerts').select('*').eq('couple_id', coupleId).order('created_at', { ascending: false }).limit(limit)
  if (error) throw error
  return ((data ?? []) as SosRow[]).map(mapSos)
}
export async function resolveSos(id: string, note?: string) {
  const { userId, coupleId } = await context()
  const { error } = await supabase.from('emergency_alerts').update({
    resolved_at: new Date().toISOString(), resolved_by: userId, resolution_note: note?.trim() || null,
  }).eq('id', id).eq('couple_id', coupleId).is('resolved_at', null)
  if (error) throw error
  const { error: notifyError } = await supabase.functions.invoke('sos-resolved', { body: { alertId: id, note: note?.trim() || undefined } })
  if (notifyError) throw notifyError
}

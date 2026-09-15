import { supabase } from '@/lib/supabase'
import { getContext } from '@/services/secondary'

export type SosAlert = {
  id: string; coupleId: string; reporterId: string; latitude: number | null; longitude: number | null
  accuracy: number | null; message: string | null; createdAt: string; resolvedAt: string | null
  resolvedBy: string | null; resolutionNote: string | null
}
type Row = Record<string, unknown>
const mapSos = (row: Row): SosAlert => ({
  id: row.id as string, coupleId: row.couple_id as string, reporterId: row.reporter_id as string,
  latitude: row.latitude as number | null, longitude: row.longitude as number | null,
  accuracy: row.accuracy as number | null, message: row.message as string | null,
  createdAt: row.created_at as string, resolvedAt: row.resolved_at as string | null,
  resolvedBy: row.resolved_by as string | null, resolutionNote: row.resolution_note as string | null,
})
async function context() {
  const value = await getContext()
  if (!value.coupleId) throw new Error('An accepted couple link is required.')
  return value
}
export async function getActiveSos() { const { coupleId } = await context(); const { data, error } = await supabase.from('emergency_alerts').select('*').eq('couple_id', coupleId).is('resolved_at', null).order('created_at', { ascending: false }); if (error) throw new Error(error.message); return ((data ?? []) as Row[]).map(mapSos) }
export async function getSosHistory(limit = 50) { const { coupleId } = await context(); const { data, error } = await supabase.from('emergency_alerts').select('*').eq('couple_id', coupleId).order('created_at', { ascending: false }).limit(limit); if (error) throw new Error(error.message); return ((data ?? []) as Row[]).map(mapSos) }
export async function resolveSos(id: string, note?: string) { const { coupleId, user } = await context(); const { error } = await supabase.from('emergency_alerts').update({ resolved_at: new Date().toISOString(), resolved_by: user.id, resolution_note: note?.trim() || null }).eq('id', id).eq('couple_id', coupleId).is('resolved_at', null); if (error) throw new Error(error.message); const { error: notifyError } = await supabase.functions.invoke('sos-resolved', { body: { alertId: id, note: note?.trim() || undefined } }); if (notifyError) throw new Error(notifyError.message) }

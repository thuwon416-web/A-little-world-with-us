import { supabase } from '@/lib/supabase'
import { getContext } from '@/services/secondary'

export type SafetyCheckin = {
  id: string; coupleId: string; userId: string; checkinType: 'safe' | 'need_help' | 'home'
  status: 'pending' | 'acknowledged' | 'completed' | 'cancelled' | 'expired'
  message: string | null; latitude: number | null; longitude: number | null; accuracy: number | null
  expectedUntil: string | null; acknowledgedAt: string | null; acknowledgedBy: string | null
  completedAt: string | null; createdAt: string; updatedAt: string
}
export type SafetyCheckinInput = Pick<SafetyCheckin, 'checkinType' | 'message' | 'latitude' | 'longitude' | 'accuracy' | 'expectedUntil'>
type Row = Record<string, unknown>
const mapCheckin = (r: Row): SafetyCheckin => ({
  id: r.id as string, coupleId: r.couple_id as string, userId: r.user_id as string, checkinType: r.checkin_type as SafetyCheckin['checkinType'], status: r.status as SafetyCheckin['status'], message: r.message as string | null, latitude: r.latitude as number | null, longitude: r.longitude as number | null, accuracy: r.accuracy as number | null, expectedUntil: r.expected_until as string | null, acknowledgedAt: r.acknowledged_at as string | null, acknowledgedBy: r.acknowledged_by as string | null, completedAt: r.completed_at as string | null, createdAt: r.created_at as string, updatedAt: r.updated_at as string,
})
async function context() { const value = await getContext(); if (!value.coupleId) throw new Error('An accepted couple link is required.'); return value }
export async function getCheckins() { const { coupleId } = await context(); const { data, error } = await supabase.from('safety_checkins').select('*').eq('couple_id', coupleId).order('created_at', { ascending: false }); if (error) throw new Error(error.message); return ((data ?? []) as Row[]).map(mapCheckin) }
export async function createCheckin(input: SafetyCheckinInput) { const { coupleId, user } = await context(); const { data, error } = await supabase.from('safety_checkins').insert({ couple_id: coupleId, user_id: user.id, checkin_type: input.checkinType, message: input.message, latitude: input.latitude, longitude: input.longitude, accuracy: input.accuracy, expected_until: input.expectedUntil }).select('*').single(); if (error) throw new Error(error.message); return mapCheckin(data as Row) }
export async function acknowledgeCheckin(id: string) { const { coupleId, user } = await context(); const { error } = await supabase.from('safety_checkins').update({ status: 'acknowledged', acknowledged_at: new Date().toISOString(), acknowledged_by: user.id }).eq('id', id).eq('couple_id', coupleId); if (error) throw new Error(error.message) }
export async function cancelCheckin(id: string) { const { coupleId, user } = await context(); const { error } = await supabase.from('safety_checkins').update({ status: 'cancelled' }).eq('id', id).eq('couple_id', coupleId).eq('user_id', user.id); if (error) throw new Error(error.message) }

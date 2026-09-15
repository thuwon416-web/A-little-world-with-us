import { getCoupleStatus } from '@/lib/couples'
import { getCurrentUserId, supabase } from '@/lib/supabase'

export type SafetyCheckin = {
  id: string; coupleId: string; userId: string; checkinType: 'safe' | 'need_help' | 'home'
  status: 'pending' | 'acknowledged' | 'completed' | 'cancelled' | 'expired'
  message: string | null; latitude: number | null; longitude: number | null; accuracy: number | null
  expectedUntil: string | null; acknowledgedAt: string | null; acknowledgedBy: string | null
  completedAt: string | null; createdAt: string; updatedAt: string
}
export type SafetyCheckinInput = Pick<SafetyCheckin, 'checkinType' | 'message' | 'latitude' | 'longitude' | 'accuracy' | 'expectedUntil'>
type CheckinRow = Record<string, unknown>
const mapCheckin = (r: CheckinRow): SafetyCheckin => ({
  id: r.id as string, coupleId: r.couple_id as string, userId: r.user_id as string,
  checkinType: r.checkin_type as SafetyCheckin['checkinType'], status: r.status as SafetyCheckin['status'],
  message: r.message as string | null, latitude: r.latitude as number | null, longitude: r.longitude as number | null,
  accuracy: r.accuracy as number | null, expectedUntil: r.expected_until as string | null,
  acknowledgedAt: r.acknowledged_at as string | null, acknowledgedBy: r.acknowledged_by as string | null,
  completedAt: r.completed_at as string | null, createdAt: r.created_at as string, updatedAt: r.updated_at as string,
})
async function context() { const userId = await getCurrentUserId(); const status = await getCoupleStatus(); if (!userId || status.status !== 'accepted' || !status.couple?.id) throw new Error('An accepted couple link is required.'); return { userId, coupleId: status.couple.id } }
export async function getCheckins() { const { coupleId } = await context(); const { data, error } = await supabase.from('safety_checkins').select('*').eq('couple_id', coupleId).order('created_at', { ascending: false }); if (error) throw error; return ((data ?? []) as CheckinRow[]).map(mapCheckin) }
export async function createCheckin(input: SafetyCheckinInput) { const { coupleId, userId } = await context(); const { data, error } = await supabase.from('safety_checkins').insert({ couple_id: coupleId, user_id: userId, checkin_type: input.checkinType, message: input.message, latitude: input.latitude, longitude: input.longitude, accuracy: input.accuracy, expected_until: input.expectedUntil }).select('*').single(); if (error) throw error; return mapCheckin(data as CheckinRow) }
export async function acknowledgeCheckin(id: string) { const { coupleId, userId } = await context(); const { error } = await supabase.from('safety_checkins').update({ status: 'acknowledged', acknowledged_at: new Date().toISOString(), acknowledged_by: userId }).eq('id', id).eq('couple_id', coupleId); if (error) throw error }
export async function cancelCheckin(id: string) { const { coupleId, userId } = await context(); const { error } = await supabase.from('safety_checkins').update({ status: 'cancelled' }).eq('id', id).eq('couple_id', coupleId).eq('user_id', userId); if (error) throw error }

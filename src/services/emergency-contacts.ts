import { getCoupleStatus } from '@/lib/couples'
import { getCurrentUserId, supabase } from '@/lib/supabase'

export type EmergencyContact = {
  id: string
  coupleId: string
  createdBy: string
  name: string
  relationship: string | null
  phone: string | null
  email: string | null
  priority: number
  notifyOnSos: boolean
  notifyOnCheckinMissed: boolean
  notifyOnLowBattery: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type EmergencyContactInput = Omit<
  EmergencyContact,
  'id' | 'coupleId' | 'createdBy' | 'createdAt' | 'updatedAt'
>

type ContactRow = {
  id: string; couple_id: string; created_by: string; name: string
  relationship: string | null; phone: string | null; email: string | null
  priority: number; notify_on_sos: boolean; notify_on_checkin_missed: boolean
  notify_on_low_battery: boolean; is_active: boolean; created_at: string; updated_at: string
}

const mapContact = (row: ContactRow): EmergencyContact => ({
  id: row.id, coupleId: row.couple_id, createdBy: row.created_by, name: row.name,
  relationship: row.relationship, phone: row.phone, email: row.email, priority: row.priority,
  notifyOnSos: row.notify_on_sos, notifyOnCheckinMissed: row.notify_on_checkin_missed,
  notifyOnLowBattery: row.notify_on_low_battery, isActive: row.is_active,
  createdAt: row.created_at, updatedAt: row.updated_at,
})

async function getContext() {
  const userId = await getCurrentUserId()
  const status = await getCoupleStatus()
  if (!userId || status.status !== 'accepted' || !status.couple?.id) {
    throw new Error('An accepted couple link is required.')
  }
  return { userId, coupleId: status.couple.id }
}

export async function getContacts(): Promise<EmergencyContact[]> {
  const { coupleId } = await getContext()
  const { data, error } = await supabase.from('emergency_contacts').select('id, couple_id, created_by, name, relationship, phone, email, priority, notify_on_sos, notify_on_checkin_missed, notify_on_low_battery, is_active, created_at, updated_at').eq('couple_id', coupleId).order('priority').order('created_at')
  if (error) throw error
  return ((data ?? []) as ContactRow[]).map(mapContact)
}

export async function createContact(input: EmergencyContactInput): Promise<EmergencyContact> {
  const { coupleId, userId } = await getContext()
  const { data, error } = await supabase.from('emergency_contacts').insert({
    couple_id: coupleId, created_by: userId, name: input.name, relationship: input.relationship,
    phone: input.phone, email: input.email, priority: input.priority, notify_on_sos: input.notifyOnSos,
    notify_on_checkin_missed: input.notifyOnCheckinMissed, notify_on_low_battery: input.notifyOnLowBattery,
    is_active: input.isActive,
  }).select('id, couple_id, created_by, name, relationship, phone, email, priority, notify_on_sos, notify_on_checkin_missed, notify_on_low_battery, is_active, created_at, updated_at').single()
  if (error) throw error
  return mapContact(data as ContactRow)
}

export async function updateContact(id: string, input: Partial<EmergencyContactInput>): Promise<void> {
  const { coupleId } = await getContext()
  const update: Record<string, unknown> = {}
  const fields: Record<string, string> = {
    name: 'name', relationship: 'relationship', phone: 'phone', email: 'email',
    priority: 'priority', notifyOnSos: 'notify_on_sos', notifyOnCheckinMissed: 'notify_on_checkin_missed',
    notifyOnLowBattery: 'notify_on_low_battery', isActive: 'is_active',
  }
  for (const [key, column] of Object.entries(fields)) {
    if (input[key as keyof EmergencyContactInput] !== undefined) update[column] = input[key as keyof EmergencyContactInput]
  }
  const { error } = await supabase.from('emergency_contacts').update(update).eq('id', id).eq('couple_id', coupleId)
  if (error) throw error
}

export async function deleteContact(id: string): Promise<void> {
  const { coupleId } = await getContext()
  const { error } = await supabase.from('emergency_contacts').delete().eq('id', id).eq('couple_id', coupleId)
  if (error) throw error
}

export async function toggleActive(id: string, isActive: boolean): Promise<void> {
  return updateContact(id, { isActive })
}

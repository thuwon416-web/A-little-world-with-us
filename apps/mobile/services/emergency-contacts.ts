import { supabase } from '@/lib/supabase'
import { getContext } from '@/services/secondary'

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
  id: string
  couple_id: string
  created_by: string
  name: string
  relationship: string | null
  phone: string | null
  email: string | null
  priority: number
  notify_on_sos: boolean
  notify_on_checkin_missed: boolean
  notify_on_low_battery: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}
const mapContact = (r: ContactRow): EmergencyContact => ({
  id: r.id,
  coupleId: r.couple_id,
  createdBy: r.created_by,
  name: r.name,
  relationship: r.relationship,
  phone: r.phone,
  email: r.email,
  priority: r.priority,
  notifyOnSos: r.notify_on_sos,
  notifyOnCheckinMissed: r.notify_on_checkin_missed,
  notifyOnLowBattery: r.notify_on_low_battery,
  isActive: r.is_active,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
})
async function context() {
  const value = await getContext()
  if (!value.coupleId) throw new Error('An accepted couple link is required.')
  return value
}
export async function getContacts() {
  const { coupleId } = await context()
  const { data, error } = await supabase
    .from('emergency_contacts')
    .select('*')
    .eq('couple_id', coupleId)
    .order('priority')
    .order('created_at')
  if (error) throw new Error(error.message)
  return ((data ?? []) as ContactRow[]).map(mapContact)
}
export async function createContact(input: EmergencyContactInput) {
  const { coupleId, user } = await context()
  const { data, error } = await supabase
    .from('emergency_contacts')
    .insert({
      couple_id: coupleId,
      created_by: user.id,
      name: input.name,
      relationship: input.relationship,
      phone: input.phone,
      email: input.email,
      priority: input.priority,
      notify_on_sos: input.notifyOnSos,
      notify_on_checkin_missed: input.notifyOnCheckinMissed,
      notify_on_low_battery: input.notifyOnLowBattery,
      is_active: input.isActive,
    })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return mapContact(data as ContactRow)
}
export async function updateContact(id: string, input: Partial<EmergencyContactInput>) {
  const { coupleId } = await context()
  const update: Record<string, unknown> = {}
  const fields: Record<string, string> = {
    name: 'name',
    relationship: 'relationship',
    phone: 'phone',
    email: 'email',
    priority: 'priority',
    notifyOnSos: 'notify_on_sos',
    notifyOnCheckinMissed: 'notify_on_checkin_missed',
    notifyOnLowBattery: 'notify_on_low_battery',
    isActive: 'is_active',
  }
  for (const [key, column] of Object.entries(fields)) {
    const value = input[key as keyof EmergencyContactInput]
    if (value !== undefined) update[column] = value
  }
  const { error } = await supabase
    .from('emergency_contacts')
    .update(update)
    .eq('id', id)
    .eq('couple_id', coupleId)
  if (error) throw new Error(error.message)
}
export async function deleteContact(id: string) {
  const { coupleId } = await context()
  const { error } = await supabase
    .from('emergency_contacts')
    .delete()
    .eq('id', id)
    .eq('couple_id', coupleId)
  if (error) throw new Error(error.message)
}
export function toggleActive(id: string, isActive: boolean) {
  return updateContact(id, { isActive })
}

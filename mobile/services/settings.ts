import AsyncStorage from '@react-native-async-storage/async-storage'

import { supabase } from '@/lib/supabase'

export type SettingsData = {
  userId: string
  coupleId: string | null
  partnerEmail: string | null
  coupleName: string | null
  anniversary: string | null
  relationshipStatus: string
  health: { age: string; weight: string; height: string; conditions: string; medications: string; allergies: string }
  privacy: Record<string, boolean>
  pinEnabled: boolean
  biometricEnabled: boolean
  language: 'en' | 'my'
}

const defaultPrivacy = {
  allow_ai_read_mood: false, allow_ai_read_cycle: false, allow_ai_read_chat: false,
  allow_ai_read_location: false, allow_ai_read_finance: false,
  share_cycle: true, share_mood: true, share_location: false,
}

async function context() {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Please sign in again.')
  const { data: link, error } = await supabase.from('couple_links').select('id,couple_id,inviter_id,accepted_by,status').or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`).eq('status', 'accepted').maybeSingle()
  if (error) throw error
  return { user, link }
}

export async function getSettingsData(): Promise<SettingsData> {
  const { user, link } = await context()
  const coupleId = link?.couple_id ?? null
  const partnerId = link ? (link.inviter_id === user.id ? link.accepted_by : link.inviter_id) : null
  const [{ data: couple }, { data: partner }, { data: health }, { data: privacy }, { data: userSettings }, language, pin] = await Promise.all([
    coupleId ? supabase.from('couples').select('name,anniversary').eq('id', coupleId).maybeSingle() : Promise.resolve({ data: null }),
    partnerId ? supabase.from('profiles').select('email').eq('id', partnerId).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from('health_profiles').select('height_cm,weight_kg,allergies,medications,conditions,data').eq('user_id', user.id).maybeSingle(),
    supabase.from('ai_privacy_settings').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('user_settings').select('settings,lock_pin_hash').eq('user_id', user.id).maybeSingle(),
    AsyncStorage.getItem('a-little-world-with-us-language'),
    AsyncStorage.getItem('a-little-world-with-us-pin'),
  ])
  const stored = (userSettings?.settings ?? {}) as { biometricEnabled?: boolean; privacy?: Record<string, boolean> }
  return {
    userId: user.id, coupleId, partnerEmail: partner?.email ?? null, coupleName: couple?.name ?? null,
    anniversary: couple?.anniversary ?? null, relationshipStatus: link ? 'Linked and accepted' : 'Not linked',
    health: { age: String(health?.data?.age ?? ''), weight: health?.weight_kg ? String(health.weight_kg) : '', height: health?.height_cm ? String(health.height_cm) : '', conditions: (health?.conditions ?? []).join(', '), medications: (health?.medications ?? []).join(', '), allergies: (health?.allergies ?? []).join(', ') },
    privacy: { ...defaultPrivacy, ...stored.privacy, ...(privacy ?? {}) }, pinEnabled: Boolean(pin), biometricEnabled: stored.biometricEnabled ?? false, language: language === 'my' ? 'my' : 'en',
  }
}

export async function saveHealthProfile(userId: string, health: SettingsData['health']) {
  const age = Number(health.age)
  const weight = Number(health.weight)
  const height = Number(health.height)
  if (health.age && (!Number.isInteger(age) || age < 1 || age > 120)) throw new Error('Age must be between 1 and 120.')
  if (health.weight && (!Number.isFinite(weight) || weight < 1 || weight > 300)) throw new Error('Weight must be between 1 and 300 kg.')
  if (health.height && (!Number.isFinite(height) || height < 50 || height > 250)) throw new Error('Height must be between 50 and 250 cm.')
  const { error } = await supabase.from('health_profiles').upsert({ user_id: userId, height_cm: health.height ? height : null, weight_kg: health.weight ? weight : null, conditions: health.conditions.split(',').map((item) => item.trim()).filter(Boolean), medications: health.medications.split(',').map((item) => item.trim()).filter(Boolean), allergies: health.allergies.split(',').map((item) => item.trim()).filter(Boolean), data: { age: health.age } })
  if (error) throw error
}

export async function savePrivacy(userId: string, privacy: Record<string, boolean>) {
  const aiPayload = Object.fromEntries(Object.entries(privacy).filter(([key]) => key.startsWith('allow_ai_')))
  const { error } = await supabase.from('ai_privacy_settings').upsert({ user_id: userId, ...aiPayload })
  if (error) throw error
  const { data: existing } = await supabase.from('user_settings').select('settings').eq('user_id', userId).maybeSingle()
  const { error: settingsError } = await supabase.from('user_settings').upsert({ user_id: userId, settings: { ...((existing?.settings ?? {}) as object), privacy: { ...defaultPrivacy, ...privacy } } })
  if (settingsError) throw settingsError
}

export async function saveCouple(coupleId: string, anniversary: string, name: string) {
  const { error } = await supabase.from('couples').update({ anniversary: anniversary || null, name: name || null }).eq('id', coupleId)
  if (error) throw error
}

export async function unlinkCouple(linkId: string) {
  const { error } = await supabase.from('couple_links').update({ status: 'revoked' }).eq('id', linkId)
  if (error) throw error
}

export async function saveLocalSecurity(userId: string, pinEnabled: boolean, biometricEnabled: boolean, pin?: string) {
  if (pinEnabled && pin && !/^\d{4,6}$/.test(pin)) throw new Error('PIN must be 4 to 6 digits.')
  if (pinEnabled && pin) await AsyncStorage.setItem('a-little-world-with-us-pin', pin)
  if (!pinEnabled) await AsyncStorage.removeItem('a-little-world-with-us-pin')
  const { data: existing } = await supabase.from('user_settings').select('settings').eq('user_id', userId).maybeSingle()
  const { error } = await supabase.from('user_settings').upsert({ user_id: userId, settings: { ...((existing?.settings ?? {}) as object), biometricEnabled } })
  if (error) throw error
}

export async function exportSettingsData(coupleId: string, kind: 'photos' | 'chat' | 'care' | 'finance') {
  const table = kind === 'photos' ? 'memories' : kind === 'chat' ? 'messages' : kind === 'care' ? 'care_daily_logs' : 'financial_goals'
  const { data, error } = await supabase.from(table).select('*').eq('couple_id', coupleId).limit(500)
  if (error) throw error
  if (kind === 'chat') return JSON.stringify(data ?? [], null, 2)
  const rows = (data ?? []) as Array<Record<string, unknown>>
  if (!rows.length) return 'No records found.'
  const columns = Object.keys(rows[0])
  const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`
  return [columns.join(','), ...rows.map((row) => columns.map((column) => escape(row[column])).join(','))].join('\n')
}

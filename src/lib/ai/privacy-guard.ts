import 'server-only'
import { createClient } from '@supabase/supabase-js'

export type AiPrivacyScope = 'location' | 'finance' | 'mood' | 'cycle' | 'chat' | 'memories'

export type PrivacySettings = {
  allow_ai_read_location: boolean
  allow_ai_read_finance: boolean
  allow_ai_read_mood: boolean
  allow_ai_read_cycle: boolean
  allow_ai_read_chat: boolean
  allow_ai_read_memories: boolean
}

type ScopedData = Partial<Record<AiPrivacyScope, unknown>>

export class PrivacyDeniedError extends Error {
  constructor(public readonly scope: AiPrivacyScope) {
    super(`AI access to ${scope} data is disabled.`)
    this.name = 'PrivacyDeniedError'
  }
}

export class PrivacySettingsUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PrivacySettingsUnavailableError'
  }
}

function createPrivacyClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    throw new PrivacySettingsUnavailableError('AI privacy settings service configuration is missing.')
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function getPrivacySettings(userId: string): Promise<PrivacySettings> {
  const { data, error } = await createPrivacyClient()
    .from('ai_privacy_settings')
    .select(
      'allow_ai_read_location,allow_ai_read_finance,allow_ai_read_mood,allow_ai_read_cycle,allow_ai_read_chat,allow_ai_read_memories'
    )
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw new PrivacySettingsUnavailableError(`Could not load AI privacy settings: ${error.message}`)
  }

  return {
    allow_ai_read_location: data?.allow_ai_read_location ?? false,
    allow_ai_read_finance: data?.allow_ai_read_finance ?? false,
    allow_ai_read_mood: data?.allow_ai_read_mood ?? false,
    allow_ai_read_cycle: data?.allow_ai_read_cycle ?? false,
    allow_ai_read_chat: data?.allow_ai_read_chat ?? false,
    allow_ai_read_memories: data?.allow_ai_read_memories ?? false,
  }
}

export async function assertAiScope(userId: string, scope: AiPrivacyScope): Promise<void> {
  const settings = await getPrivacySettings(userId)
  if (!settings[`allow_ai_read_${scope}`]) throw new PrivacyDeniedError(scope)
}

export async function filterByPrivacy<T extends ScopedData>(
  userId: string,
  data: T
): Promise<Partial<T>> {
  const settings = await getPrivacySettings(userId)
  const filtered: Partial<T> = {}

  for (const [key, value] of Object.entries(data) as [AiPrivacyScope, T[AiPrivacyScope]][]) {
    if (value !== undefined && settings[`allow_ai_read_${key}`]) {
      filtered[key] = value
    }
  }

  return filtered
}

'use client'

import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import {
  DEFAULT_PRIVACY_SETTINGS,
  type AIPrivacySettings,
} from './contexts/privacy-context'

export type GuardianRequest = {
  message: string
  language?: 'my' | 'en'
}

export type AdviceRequest = {
  message: string
  language?: 'my' | 'en'
}

export type AdviceResult = {
  response: string
  provider: string | null
  role?: 'him' | 'her'
  safety?: 'safe' | 'caution' | 'blocked'
  riskLevel?: 'green' | 'yellow' | 'red'
}

export type AIGuardianContextValue = {
  privacy: AIPrivacySettings
  loading: boolean
  error: string | null
  updatePrivacy: (changes: Partial<AIPrivacySettings>) => Promise<void>
  askGuardian: (request: GuardianRequest) => Promise<string>
  askMediator: (request: AdviceRequest) => Promise<AdviceResult>
  askIntimacy: (request: AdviceRequest) => Promise<AdviceResult>
}

export const AIGuardianContext = createContext<AIGuardianContextValue | null>(null)

export function AIGuardianProvider({ children }: { children: ReactNode }) {
  const [privacy, setPrivacy] = useState<AIPrivacySettings>(DEFAULT_PRIVACY_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPrivacy = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) {
      setError(userError.message)
      setLoading(false)
      return
    }

    if (!user) {
      setLoading(false)
      return
    }

    const { data, error: settingsError } = await supabase
      .from('ai_privacy_settings')
      .select('allow_ai_read_mood,allow_ai_read_cycle,allow_ai_read_chat,allow_ai_read_location,allow_ai_read_finance')
      .eq('user_id', user.id)
      .maybeSingle()

    if (settingsError) {
      setError(settingsError.message)
    } else if (data) {
      setPrivacy({ ...DEFAULT_PRIVACY_SETTINGS, ...data })
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    void loadPrivacy()
  }, [loadPrivacy])

  const updatePrivacy = useCallback(async (changes: Partial<AIPrivacySettings>) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!user) throw new Error('You must be signed in to update AI privacy settings.')

    const next = { ...privacy, ...changes }
    const { error: settingsError } = await supabase
      .from('ai_privacy_settings')
      .upsert({ user_id: user.id, ...next }, { onConflict: 'user_id' })

    if (settingsError) throw settingsError
    setPrivacy(next)
    setError(null)
  }, [privacy])

  const askGuardian = useCallback(async (request: GuardianRequest) => {
    const response = await fetch('/api/ai/guardian', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })

    const payload = await response.json() as { response?: string; error?: string }
    if (!response.ok || !payload.response) {
      throw new Error(payload.error || 'AI Guardian is unavailable.')
    }

    return payload.response
  }, [])

  const askAdvice = useCallback(async (endpoint: '/api/ai/mediate' | '/api/ai/intimacy', request: AdviceRequest) => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
    const payload = await response.json() as Partial<AdviceResult> & {
      error?: string
      riskLevel?: 'green' | 'yellow' | 'red'
      consentDisclaimer?: string
    }
    if (!response.ok || !payload.response) {
      throw new Error(payload.error || 'AI advice is unavailable.')
    }
    const result: AdviceResult = {
      response: payload.response,
      provider: payload.provider ?? null,
      role: payload.role,
      safety: payload.safety ?? (payload.riskLevel === 'red' ? 'blocked' : payload.riskLevel === 'yellow' ? 'caution' : payload.riskLevel === 'green' ? 'safe' : undefined),
      riskLevel: payload.riskLevel,
    }
    return payload.consentDisclaimer
      ? { ...result, response: `${result.response}\n\n${payload.consentDisclaimer}` }
      : result
  }, [])

  const askMediator = useCallback(
    (request: AdviceRequest) => askAdvice('/api/ai/mediate', request),
    [askAdvice]
  )

  const askIntimacy = useCallback(
    (request: AdviceRequest) => askAdvice('/api/ai/intimacy', request),
    [askAdvice]
  )

  return (
    <AIGuardianContext.Provider value={{ privacy, loading, error, updatePrivacy, askGuardian, askMediator, askIntimacy }}>
      {children}
    </AIGuardianContext.Provider>
  )
}

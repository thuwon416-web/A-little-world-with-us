import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export interface LogAiUsageParams {
  userId: string
  coupleId?: string
  endpoint: string
  provider: string
  status: 'success' | 'failure' | 'timeout'
  promptLength: number
  responseLength: number
}

interface AiUsageLogRow {
  user_id: string
  couple_id?: string
  endpoint: string
  provider: string
  status: LogAiUsageParams['status']
  estimated_tokens: number
  prompt_length: number
  response_length: number
}

function createUsageClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    throw new Error('Supabase service role configuration is missing')
  }
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function estimateTokens(promptLength: number, responseLength: number): number {
  return Math.ceil((Math.max(0, promptLength) + Math.max(0, responseLength)) / 4)
}

export async function logAiUsage(params: LogAiUsageParams): Promise<void> {
  try {
    const promptLength = Math.max(0, Math.floor(params.promptLength))
    const responseLength = Math.max(0, Math.floor(params.responseLength))
    const row: AiUsageLogRow = {
      user_id: params.userId,
      couple_id: params.coupleId,
      endpoint: params.endpoint,
      provider: params.provider,
      status: params.status,
      estimated_tokens: estimateTokens(promptLength, responseLength),
      prompt_length: promptLength,
      response_length: responseLength,
    }
    const { error } = await createUsageClient().from('ai_usage_logs').insert(row)
    if (error) throw error
  } catch (error) {
    console.error('AI usage logging failed:', error instanceof Error ? error.message : 'unknown error')
  }
}

export async function getDailyAiUsage(userId: string): Promise<number> {
  try {
    const start = new Date()
    start.setUTCHours(0, 0, 0, 0)
    const { count, error } = await createUsageClient()
      .from('ai_usage_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', start.toISOString())

    if (error) throw error
    return count ?? 0
  } catch (error) {
    console.error('AI usage lookup failed:', error instanceof Error ? error.message : 'unknown error')
    return 0
  }
}

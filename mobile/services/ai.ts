import { isSupabaseConfigured, supabase } from '@/lib/supabase'

export type SuggestionType = 'gift' | 'date' | 'message'
export type AIRequestState = 'idle' | 'loading' | 'success' | 'error'

export type AISuggestion = {
  id: string
  user_id: string
  suggestion_type: SuggestionType
  content: string
  created_at: string
}

const cache: Record<string, AISuggestion[]> = {}

export async function getGiftIdeas(interests: string[] = []): Promise<AISuggestion[]> {
  return getAIResponse('gift', interests)
}

export async function getDateIdeas(mood: string = 'romantic'): Promise<AISuggestion[]> {
  return getAIResponse('date', [mood])
}

export async function getMessageSuggestions(context: string = 'love note'): Promise<AISuggestion[]> {
  return getAIResponse('message', [context])
}

async function getAIResponse(type: SuggestionType, context: string[]): Promise<AISuggestion[]> {
  const cacheKey = `${type}:${context.join('|')}`
  if (cache[cacheKey]) {
    return cache[cacheKey]
  }

  if (!isSupabaseConfigured) {
    const fallback = buildFallbackSuggestions(type, context)
    cache[cacheKey] = fallback
    return fallback
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return buildFallbackSuggestions(type, context)
  }

  const payload = {
    user_id: user.id,
    prompt_type: type,
    context: JSON.stringify(context),
    created_at: new Date().toISOString(),
  }

  await supabase.from('ai_prompts').insert(payload).select()

  const { data, error } = await supabase.functions.invoke('ai-assistant', {
    body: { type, context },
  })

  if (error || !data) {
    const fallback = buildFallbackSuggestions(type, context)
    cache[cacheKey] = fallback
    return fallback
  }

  const suggestions = Array.isArray(data?.suggestions) ? data.suggestions : [data]
  const mapped = suggestions.map((entry: any, index: number) => ({
    id: `${type}-${index}-${Date.now()}`,
    user_id: user.id,
    suggestion_type: type,
    content: typeof entry === 'string' ? entry : entry?.content ?? `AI idea ${index + 1}`,
    created_at: new Date().toISOString(),
  }))

  cache[cacheKey] = mapped
  return mapped
}

function buildFallbackSuggestions(type: SuggestionType, context: string[]): AISuggestion[] {
  const base = {
    gift: [
      'A handwritten letter tucked into a favorite treat.',
      'A tiny ritual kit: tea, candle, and a shared playlist.',
      'A keepsake from a place that means something to both of you.',
    ],
    date: [
      'A slow sunrise walk with coffee and a little conversation.',
      'A homemade picnic under the evening sky.',
      'A no-plan date: wander, snack, and enjoy each other.',
    ],
    message: [
      'I am grateful for how softly you make life feel warmer.',
      'You are my favorite place to land after a busy day.',
      'I love us in the small, everyday moments most.',
    ],
  }[type] ?? ['A small thoughtful gesture goes a long way.']

  return base.map((content, index) => ({
    id: `fallback-${type}-${index}`,
    user_id: 'local-user',
    suggestion_type: type,
    content,
    created_at: new Date().toISOString(),
  }))
}

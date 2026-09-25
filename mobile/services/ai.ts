import { AIClientError, requestAI } from '@/lib/aiClient'
import { supabase } from '@/lib/supabase'

export type SuggestionType = 'gift' | 'date' | 'message'
export type AIRequestState = 'idle' | 'loading' | 'success' | 'error'
export type AISuggestion = {
  id: string
  user_id: string
  suggestion_type: SuggestionType
  content: string
  created_at: string
}

const fallback: Record<SuggestionType, string[]> = {
  gift: [
    'A handwritten letter with a favorite treat.',
    'A small ritual kit for a slow evening together.',
    'A keepsake from a meaningful place.',
  ],
  date: [
    'Take a slow walk and share a coffee.',
    'Make a simple picnic together.',
    'Choose a no-plan evening and follow your curiosity.',
  ],
  message: [
    'I am grateful for the warmth you bring to ordinary days.',
    'You are my favorite place to come home to.',
    'I am here, and I want to understand how today felt for you.',
  ],
}

async function request(type: SuggestionType, context: string[]) {
  const webUrl = process.env.EXPO_PUBLIC_WEB_URL?.replace(/\/$/, '')
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!webUrl || !session?.access_token) return null
  const instruction =
    type === 'gift'
      ? 'Suggest three thoughtful gifts.'
      : type === 'date'
        ? 'Suggest three practical romantic date ideas.'
        : 'Draft three warm message ideas.'
  try {
    return await requestAI(
      `${webUrl}/api/ai/chat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ message: `${instruction}\nContext: ${context.join(', ')}` }),
      },
      {
        parse: (data) => {
          const body = data as { response?: unknown }
          if (typeof body.response !== 'string' || !body.response.trim()) {
            throw new Error('The AI service returned no suggestions.')
          }
          return body.response
        },
      }
    )
  } catch (error) {
    if (error instanceof AIClientError) return null
    throw error
  }
}

async function getAIResponse(type: SuggestionType, context: string[]): Promise<AISuggestion[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const result = await request(type, context)
  const content = result ? [result] : fallback[type]
  return content.map((item, index) => ({
    id: `${type}-${index}-${Date.now()}`,
    user_id: user?.id ?? 'local-user',
    suggestion_type: type,
    content: item,
    created_at: new Date().toISOString(),
  }))
}

export const getGiftIdeas = (interests: string[] = []) => getAIResponse('gift', interests)
export const getDateIdeas = (mood = 'romantic') => getAIResponse('date', [mood])
export const getMessageSuggestions = (context = 'love note') => getAIResponse('message', [context])

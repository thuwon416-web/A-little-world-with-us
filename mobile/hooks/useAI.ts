import { useCallback, useEffect, useState } from 'react'
import { getDateIdeas, getGiftIdeas, getMessageSuggestions, type AIRequestState, type AISuggestion, type SuggestionType } from '@/services/ai'

export function useAI() {
  const [state, setState] = useState<AIRequestState>('idle')
  const [type, setType] = useState<SuggestionType>('gift')
  const [items, setItems] = useState<AISuggestion[]>([])
  const [error, setError] = useState<string | null>(null)

  const refreshSuggestions = useCallback(async (nextType: SuggestionType = type, context: string[] = []) => {
    setState('loading')
    setType(nextType)
    setError(null)

    try {
      const load =
        nextType === 'gift'
          ? getGiftIdeas(context)
          : nextType === 'date'
            ? getDateIdeas(context.join(' ') || 'romantic')
            : getMessageSuggestions(context.join(' ') || 'love note')

      const suggestions = await load
      setItems(suggestions)
      setState('success')
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to load AI suggestions')
      setState('error')
    }
  }, [type])

  useEffect(() => {
    void refreshSuggestions(type)
  }, [])

  return {
    state,
    type,
    items,
    error,
    refreshSuggestions,
  }
}

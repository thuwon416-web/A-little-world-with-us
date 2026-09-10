import { useContext } from 'react'
import { AIGuardianContext, type AdviceRequest, type AdviceResult } from './AIGuardianProvider'

export type { AdviceRequest, AdviceResult }

export function useAIGuardian() {
  const context = useContext(AIGuardianContext)
  if (!context) {
    throw new Error('useAIGuardian must be used within AIGuardianProvider')
  }
  return context
}

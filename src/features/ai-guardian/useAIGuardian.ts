import { useContext } from 'react'
import { AIGuardianContext } from './AIGuardianProvider'

export type { AdviceRequest, AdviceResult } from './AIGuardianProvider'

export function useAIGuardian() {
  const context = useContext(AIGuardianContext)
  if (!context) {
    throw new Error('useAIGuardian must be used within AIGuardianProvider')
  }
  return context
}

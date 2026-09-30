import type { AiMessage } from './providers'
import { HER_PERSONA } from '@/features/ai-guardian/personas/her-persona'

export { HER_PERSONA }

export function withHerPersona(messages: AiMessage[]): AiMessage[] {
  return [{ role: 'system', content: HER_PERSONA }, ...messages]
}

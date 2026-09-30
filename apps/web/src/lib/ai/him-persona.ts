import type { AiMessage } from './providers'
import { HIM_PERSONA } from '@/features/ai-guardian/personas/him-persona'

export { HIM_PERSONA }

export function withHimPersona(messages: AiMessage[]): AiMessage[] {
  return [{ role: 'system', content: HIM_PERSONA }, ...messages]
}

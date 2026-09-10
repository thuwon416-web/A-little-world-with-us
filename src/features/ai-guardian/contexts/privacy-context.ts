export type AIPrivacySettings = {
  allow_ai_read_mood: boolean
  allow_ai_read_cycle: boolean
  allow_ai_read_chat: boolean
  allow_ai_read_location: boolean
  allow_ai_read_finance: boolean
}

export const DEFAULT_PRIVACY_SETTINGS: AIPrivacySettings = {
  allow_ai_read_mood: false,
  allow_ai_read_cycle: false,
  allow_ai_read_chat: false,
  allow_ai_read_location: false,
  allow_ai_read_finance: false,
}

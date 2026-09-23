export type TelegramImportRow = {
  message_date: string
  sender_name: string
  sender_id: string | null
  message_text: string
  raw_payload: Record<string, unknown>
}

function flattenTelegramText(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (!Array.isArray(value)) return ''
  return value.map((part) => {
    if (typeof part === 'string' || typeof part === 'number') return String(part)
    if (part && typeof part === 'object' && 'text' in part) return flattenTelegramText(part.text)
    return ''
  }).join('')
}

function normalizeTelegramDate(value: unknown): string | null {
  const date = typeof value === 'number'
    ? new Date(value * 1000)
    : typeof value === 'string'
      ? /^\d+$/.test(value)
        ? new Date(Number(value) * 1000)
        : new Date(value)
      : null
  return date && Number.isFinite(date.getTime()) ? date.toISOString() : null
}

export function parseTelegramExport(value: unknown): TelegramImportRow[] {
  if (!value || typeof value !== 'object' || !('messages' in value) || !Array.isArray(value.messages)) {
    throw new Error('Telegram မှ JSON စကားပြောမှတ်တမ်းဖိုင်ကို ရွေးပါ။')
  }

  const unique = new Map<string, TelegramImportRow>()
  for (const entry of value.messages) {
    if (!entry || typeof entry !== 'object') continue
    const message = entry as Record<string, unknown>
    if (message.type && message.type !== 'message') continue
    const messageDate = normalizeTelegramDate(message.date_unixtime ?? message.date)
    const messageText = flattenTelegramText(message.text).trim()
    if (!messageDate || !messageText) continue
    const senderName = typeof message.from === 'string' && message.from.trim() ? message.from.trim() : 'အမည်မသိ'
    const senderId = typeof message.from_id === 'string' ? message.from_id : null
    const row: TelegramImportRow = {
      message_date: messageDate,
      sender_name: senderName,
      sender_id: senderId,
      message_text: messageText,
      raw_payload: message,
    }
    unique.set(`${messageDate}\u0000${senderName}\u0000${messageText}`, row)
  }

  if (!unique.size) throw new Error('ဖိုင်ထဲမှာ တင်သွင်းလို့ရတဲ့ စာသားမှတ်တမ်း မတွေ့ပါ။')
  return [...unique.values()]
}

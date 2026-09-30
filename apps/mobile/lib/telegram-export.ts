export type TelegramImportRow = {
  message_date: string
  sender_name: string
  sender_id: string | null
  message_text: string
  raw_payload: Record<string, unknown>
}

function flatten(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (!Array.isArray(value)) return ''
  return value
    .map((part) => {
      if (typeof part === 'string' || typeof part === 'number') return String(part)
      if (part && typeof part === 'object' && 'text' in part) return flatten(part.text)
      return ''
    })
    .join('')
}

export function parseTelegramExport(value: unknown): TelegramImportRow[] {
  if (
    !value ||
    typeof value !== 'object' ||
    !('messages' in value) ||
    !Array.isArray(value.messages)
  ) {
    throw new Error('Choose a Telegram JSON export file.')
  }
  const rows = new Map<string, TelegramImportRow>()
  for (const entry of value.messages) {
    if (!entry || typeof entry !== 'object') continue
    const message = entry as Record<string, unknown>
    if (message.type && message.type !== 'message') continue
    const rawDate = message.date_unixtime ?? message.date
    const date =
      typeof rawDate === 'number'
        ? new Date(rawDate * 1000)
        : typeof rawDate === 'string' && /^\d+$/.test(rawDate)
          ? new Date(Number(rawDate) * 1000)
          : typeof rawDate === 'string'
            ? new Date(rawDate)
            : null
    const messageText = flatten(message.text).trim()
    if (!date || !Number.isFinite(date.getTime()) || !messageText) continue
    const senderName =
      typeof message.from === 'string' && message.from.trim() ? message.from.trim() : 'Unknown'
    const row = {
      message_date: date.toISOString(),
      sender_name: senderName,
      sender_id: typeof message.from_id === 'string' ? message.from_id : null,
      message_text: messageText,
      raw_payload: message,
    }
    rows.set(`${row.message_date}\u0000${row.sender_name}\u0000${row.message_text}`, row)
  }
  if (!rows.size) throw new Error('No importable text messages were found in this file.')
  return [...rows.values()]
}

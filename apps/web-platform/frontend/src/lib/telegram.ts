import type { TelegramInlineButton, TelegramNotificationPayload } from '@/shared-types'

const TELEGRAM_API_BASE = 'https://api.telegram.org'

function getTelegramConfig() {
  const token = (process.env.TELEGRAM_BOT_TOKEN || '').trim()
  const chatId = (process.env.TELEGRAM_CHAT_ID || '').trim()
  const topicStr = (process.env.TELEGRAM_TOPIC_ID || '').trim()
  const topicId = /^\d+$/.test(topicStr) ? Number.parseInt(topicStr, 10) : undefined
  const enabled = (process.env.TELEGRAM_ENABLED || 'false').toLowerCase() === 'true'

  return { token, chatId, topicId, enabled }
}

export async function sendTelegramMessage(
  text: string,
  options?: {
    topicId?: number
    parseMode?: 'HTML' | 'MarkdownV2'
    inlineKeyboard?: TelegramInlineButton[][]
    disableWebPagePreview?: boolean
    chatId?: string | number
  }
): Promise<unknown | null> {
  const { token, chatId: configuredChatId, topicId: defaultTopic, enabled } = getTelegramConfig()
  const effectiveChatId = options?.chatId ?? configuredChatId
  // Replies directed to an explicit chat must stay in the supplied topic context.
  // Do not fall back to the configured notification topic when the incoming message
  // belongs to the General topic (where Telegram may omit message_thread_id).
  const effectiveTopic = options?.chatId !== undefined
    ? options.topicId
    : options?.topicId ?? defaultTopic

  if (!token || !effectiveChatId) {
    console.info('[Telegram:OurWorld:DryRun] message suppressed; bot configuration is incomplete.')
    return null
  }

  if (!enabled) {
    console.debug('[Telegram:OurWorld:Disabled] message suppressed; integration is disabled.')
    return null
  }

  const url = `${TELEGRAM_API_BASE}/bot${token}/sendMessage`
  const payload: Record<string, unknown> = {
    chat_id: effectiveChatId,
    text,
    parse_mode: options?.parseMode ?? 'HTML',
    disable_web_page_preview: options?.disableWebPagePreview ?? false,
  }

  if (effectiveTopic !== undefined) {
    payload.message_thread_id = effectiveTopic
  }

  if (options?.inlineKeyboard && options.inlineKeyboard.length > 0) {
    payload.reply_markup = {
      inline_keyboard: options.inlineKeyboard,
    }
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      console.error(`Telegram API error (${res.status}); response body omitted.`)
      return null
    }

    return await res.json()
  } catch (err) {
    console.warn('Failed to send Telegram message:', err)
    return null
  }
}

export async function sendTelegramNotification(payload: TelegramNotificationPayload): Promise<unknown | null> {
  const iconMap: Record<string, string> = {
    SUCCESS: '💖',
    INFO: '💌',
    WARNING: '⚠️',
    ERROR: '🚨',
  }
  const statusIcon = iconMap[payload.status || 'INFO'] || '💌'

  const lines = [
    `❤️ <b>[A-Little-World]</b> ${statusIcon} <b>${payload.title}</b>`,
    '',
    payload.details,
  ]
  const text = lines.join('\n')

  let inlineKeyboard: TelegramInlineButton[][] | undefined
  if (payload.actions && payload.actions.length > 0) {
    inlineKeyboard = [
      payload.actions.map((act: { text: string; callback_data?: string; url?: string }) => ({
        text: act.text,
        callback_data: act.callback_data,
        url: act.url,
      })),
    ]
  }

  return sendTelegramMessage(text, {
    topicId: payload.topicId,
    inlineKeyboard,
  })
}

// ==========================================
// A-Little-World Domain Event Hooks
// ==========================================

export async function notifyAnniversaryReminder(title: string, daysLeft: number, dateStr: string): Promise<void> {
  const dayText = daysLeft === 0 ? "🎉 Today is the day!" : `⏳ Only <b>${daysLeft} days</b> left!`
  const details = `📅 <b>${title}</b>\n🗓️ Date: <code>${dateStr}</code>\n${dayText}`

  await sendTelegramNotification({
    title: 'Special Milestone Reminder',
    details,
    status: 'SUCCESS',
    actions: [{ text: '📖 Open Couple Memories', callback_data: 'world_open_memories' }],
  })
}

export async function notifyKoreanDailyWord(word: string, pronunciation: string, meaning: string, exampleSentence?: string): Promise<void> {
  let details = `🇰🇷 <b>Word:</b> <b>${word}</b> [${pronunciation}]\n🇲🇲 <b>Meaning:</b> ${meaning}`
  if (exampleSentence) {
    details += `\n\n💬 <i>${exampleSentence}</i>`
  }

  await sendTelegramNotification({
    title: 'Daily Korean Word',
    details,
    status: 'INFO',
    actions: [
      { text: '✍️ Take Daily Quiz', callback_data: 'world_korean_quiz' },
    ],
  })
}

export async function notifyExpenseLogged(amount: number, category: string, description: string, loggedBy: string): Promise<void> {
  const details = `💰 <b>Amount:</b> ${amount.toLocaleString()} MMK\n🏷️ <b>Category:</b> ${category}\n📝 <b>Description:</b> ${description}\n👤 <b>Logged By:</b> ${loggedBy}`

  await sendTelegramNotification({
    title: 'New Shared Expense Logged',
    details,
    status: 'INFO',
    actions: [{ text: '📊 Open Budget Tracker', callback_data: 'world_open_budget' }],
  })
}

export async function notifySafetyCheckinAlert(partnerName: string, status: string, locationSummary?: string): Promise<void> {
  let details = `👤 <b>Partner:</b> ${partnerName}\n📍 <b>Status:</b> ${status}`
  if (locationSummary) {
    details += `\n🗺️ <b>Location:</b> ${locationSummary}`
  }

  await sendTelegramNotification({
    title: 'Safety Check-in Update',
    details,
    status: 'INFO',
  })
}

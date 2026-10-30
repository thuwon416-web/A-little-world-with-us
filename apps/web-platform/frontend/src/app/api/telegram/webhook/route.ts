import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { sendTelegramMessage } from '@/lib/telegram'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://alittleworldwithus.com'
const MAX_UPDATE_BYTES = 1024 * 1024

type TelegramChat = { id?: number; type?: string }
type TelegramUser = { id?: number }
type TelegramMessage = {
  text?: string
  from?: TelegramUser
  chat?: TelegramChat
  message_thread_id?: number
}
type TelegramCallbackQuery = {
  id?: string
  data?: string
  from?: TelegramUser
  message?: TelegramMessage
}
type TelegramUpdate = {
  message?: TelegramMessage
  callback_query?: TelegramCallbackQuery
}

type TelegramSendOptions = NonNullable<Parameters<typeof sendTelegramMessage>[1]>

async function sendReply(text: string, options?: TelegramSendOptions): Promise<void> {
  const result = await sendTelegramMessage(text, options)
  if (!result || typeof result !== 'object' || !('ok' in result) || result.ok !== true) {
    console.error('[Telegram:OurWorld:Webhook] reply delivery failed', {
      hasExplicitChat: options?.chatId !== undefined,
      topicConfigured: Boolean(process.env.TELEGRAM_TOPIC_ID),
    })
    throw new Error('Telegram reply delivery failed')
  }
}

function constantTimeEqual(providedValue: string, expectedValue: string): boolean {
  const provided = Buffer.from(providedValue, 'utf8')
  const expected = Buffer.from(expectedValue, 'utf8')
  return provided.length === expected.length && timingSafeEqual(provided, expected)
}

function getAllowedUserIds(): Set<number> {
  return new Set(
    (process.env.TELEGRAM_ALLOWED_USER_IDS || '')
      .split(',')
      .map((value) => value.trim())
      .filter((value) => /^\d+$/.test(value))
      .map(Number)
      .filter((value) => Number.isSafeInteger(value) && value > 0)
  )
}

function isExpectedGroupTopic(chatId?: number, topicId?: number): boolean {
  const expectedChatId = (process.env.TELEGRAM_CHAT_ID || '').trim()
  const expectedTopicValue = (process.env.TELEGRAM_TOPIC_ID || '').trim()
  if (!/^-?\\d+$/.test(expectedChatId) || !/^\\d+$/.test(expectedTopicValue)) return false
  const expectedTopicId = Number(expectedTopicValue)
  return Number.isSafeInteger(expectedTopicId) &&
    expectedTopicId > 0 &&
    chatId !== undefined &&
    String(chatId) === expectedChatId &&
    topicId === expectedTopicId
}

function isAuthorizedWebhook(req: Request): boolean {
  const expectedToken = process.env.TELEGRAM_WEBHOOK_SECRET_TOKEN
  const providedToken = req.headers.get('x-telegram-bot-api-secret-token') || ''
  return Boolean(expectedToken && constantTimeEqual(providedToken, expectedToken))
}

function getCommand(text: string): string {
  const firstToken = text.trim().split(/\s+/, 1)[0] || ''
  return (firstToken.split('@', 1)[0] || '').toLowerCase()
}

function appButton(text: string, url: string) {
  return [[{ text, url }]]
}

function quizButtons() {
  return [
    [
      { text: 'A) ကျေးဇူးတင်ပါတယ်', callback_data: 'world_quiz_ans:A' },
      { text: 'B) ချစ်တယ်', callback_data: 'world_quiz_ans:B' },
    ],
    [
      { text: 'C) မင်္ဂလာပါ', callback_data: 'world_quiz_ans:C' },
      { text: 'D) တောင်းပန်ပါတယ်', callback_data: 'world_quiz_ans:D' },
    ],
  ]
}

async function sendQuiz(topicId?: number, chatId?: number) {
  const message = '✍️ <b>Daily Korean Quiz</b>\n"사랑해" (Saranghae) ၏ မြန်မာလို အဓိပ္ပာယ်မှာ အဘယ်နည်း?\n\nအဖြေကို ခလုတ်နှိပ်ပြီး ရွေးချယ်ပါ။'
  await sendReply(message, { topicId, chatId, inlineKeyboard: quizButtons() })
}

export async function POST(req: Request) {
  if (!process.env.TELEGRAM_WEBHOOK_SECRET_TOKEN || getAllowedUserIds().size === 0 || !process.env.TELEGRAM_CHAT_ID || !process.env.TELEGRAM_TOPIC_ID) {
    return NextResponse.json({ error: 'Telegram webhook access control is not configured.' }, { status: 503 })
  }
  if (!isAuthorizedWebhook(req)) {
    return NextResponse.json({ error: 'Unauthorized webhook.' }, { status: 401 })
  }

  const contentLength = Number(req.headers.get('content-length') || 0)
  if (contentLength > MAX_UPDATE_BYTES) {
    return NextResponse.json({ error: 'Update is too large.' }, { status: 413 })
  }

  let update: TelegramUpdate
  try {
    update = (await req.json()) as TelegramUpdate
  } catch {
    return NextResponse.json({ error: 'Invalid Telegram update.' }, { status: 400 })
  }

  const sourceMessage = update.message ?? update.callback_query?.message
  if (!isExpectedGroupTopic(sourceMessage?.chat?.id, sourceMessage?.message_thread_id)) {
    console.warn('[Telegram:OurWorld:Webhook] update rejected by group/topic scope.')
    return NextResponse.json({ error: 'Telegram update is outside the configured group topic.' }, { status: 403 })
  }

  const actorId = update.message?.from?.id ?? update.callback_query?.from?.id
  if (!actorId || !getAllowedUserIds().has(actorId)) {
    console.warn('[Telegram:OurWorld:Webhook] update rejected by user allowlist.')
    return NextResponse.json({ error: 'Telegram user is not allowed.' }, { status: 403 })
  }

  try {
    if (update.callback_query) {
      const callback = update.callback_query
      const action = callback.data || ''
      const chatId = callback.message?.chat?.id
      const topicId = callback.message?.message_thread_id

      if (action === 'world_start_quiz') {
        await sendQuiz(topicId, chatId)
        return NextResponse.json({ ok: true, action: 'quiz_started' })
      }

      if (action.startsWith('world_quiz_ans:')) {
        const choice = action.split(':')[1]
        if (!['A', 'B', 'C', 'D'].includes(choice)) {
          return NextResponse.json({ error: 'Invalid quiz answer.' }, { status: 400 })
        }
        const feedback = choice === 'B'
          ? '🎉 <b>မှန်ကန်ပါတယ်!</b> "사랑해" = ချစ်တယ် (I love you) ဖြစ်ပါတယ်။ 💖'
          : '❌ အဖြေမှန်မှာ B) ချစ်တယ် (I love you) ဖြစ်ပါတယ်။ နောက်တစ်ကြိမ် ထပ်ကြိုးစားပါ။ ✨'
        await sendReply(feedback, { topicId, chatId })
        return NextResponse.json({ ok: true, action: 'quiz_answered' })
      }

      if (action === 'world_open_memories') {
        await sendReply('📖 Couple Memories ကို ဒီမှာဖွင့်နိုင်ပါတယ်။', {
          topicId,
          chatId,
          inlineKeyboard: appButton('💖 Open Memories', `${APP_URL}/memories`),
        })
        return NextResponse.json({ ok: true, action: 'memories_link_sent' })
      }

      if (action === 'world_open_budget') {
        await sendReply('📊 Shared Budget ကို ဒီမှာဖွင့်နိုင်ပါတယ်။', {
          topicId,
          chatId,
          inlineKeyboard: appButton('Open Budget Tracker', `${APP_URL}/budget`),
        })
        return NextResponse.json({ ok: true, action: 'budget_link_sent' })
      }

      return NextResponse.json({ ok: true, action: 'ignored' })
    }

    if (update.message) {
      const message = update.message
      const text = (message.text || '').trim()
      const chatId = message.chat?.id
      const topicId = message.message_thread_id

      if (!text) return NextResponse.json({ ok: true })
      if (!chatId) return NextResponse.json({ error: 'Message chat is missing.' }, { status: 400 })

      const command = getCommand(text)
      if (command.startsWith('/')) {
        console.info('[Telegram:OurWorld:Webhook] command received', {
          command,
          chatType: message.chat?.type ?? 'unknown',
          topicId: topicId ?? null,
        })
      }
      if (command === '/start' || command === '/help') {
        const helpText = [
          '❤️ <b>A Little World With Us — Commands</b>',
          '',
          '• <code>/status</code> — Bot and app links',
          '• <code>/morning_brief</code> — Couple daily briefing',
          '• <code>/quiz</code> — Korean quiz',
          '• <code>/budget</code> — Open shared budget',
          '• <code>/memories</code> — Open memories',
          '• <code>/spend</code> — Open budget to record an expense',
        ].join('\n')
        await sendReply(helpText, {
          topicId,
          chatId,
          inlineKeyboard: appButton('❤️ Open Our World', APP_URL),
        })
        return NextResponse.json({ ok: true, command: 'help' })
      }

      if (command === '/status') {
        await sendReply(
          '🤖 <b>Our World Bot</b>\nWebhook request authenticated and command access allowed. Shared-data sync is managed by the app; this command does not independently verify database or media sync.',
          {
            topicId,
            chatId,
            inlineKeyboard: [
              [{ text: 'Open Our World', url: APP_URL }],
              [{ text: 'Open Budget', url: `${APP_URL}/budget` }, { text: 'Open Memories', url: `${APP_URL}/memories` }],
            ],
          }
        )
        return NextResponse.json({ ok: true, command: 'status' })
      }

      if (command === '/morning_brief' || command === '/digest') {
        const briefing = [
          '☀️ <b>Our Little World — Daily Briefing</b>',
          '',
          '💌 <i>Together is our favorite place to be. Have a gentle, beautiful day!</i>',
          '',
          '✍️ Korean quiz is ready whenever you are.',
        ].join('\n')
        await sendReply(briefing, {
          topicId,
          chatId,
          inlineKeyboard: [
            [{ text: 'Open Couple Journal', url: `${APP_URL}/couple` }],
            [{ text: 'Play Korean Quiz', callback_data: 'world_start_quiz' }],
          ],
        })
        return NextResponse.json({ ok: true, command: 'morning_brief' })
      }

      if (command === '/quiz') {
        await sendQuiz(topicId, chatId)
        return NextResponse.json({ ok: true, command: 'quiz' })
      }

      if (command === '/budget') {
        await sendReply('📊 Shared Budget ကိုဖွင့်ပြီး မှတ်တမ်းတင်နိုင်ပါတယ်။', {
          topicId,
          chatId,
          inlineKeyboard: appButton('Open Budget Tracker', `${APP_URL}/budget`),
        })
        return NextResponse.json({ ok: true, command: 'budget' })
      }

      if (command === '/memories') {
        await sendReply('📖 Couple Memories ကိုဖွင့်ကြည့်နိုင်ပါတယ်။', {
          topicId,
          chatId,
          inlineKeyboard: appButton('Open Memories', `${APP_URL}/memories`),
        })
        return NextResponse.json({ ok: true, command: 'memories' })
      }

      if (command === '/spend') {
        await sendReply(
          'လုံခြုံရေးအတွက် Telegram မှ expense ကို database ထဲသို့ တိုက်ရိုက်မရေးသေးပါ။ Shared Budget ကိုဖွင့်ပြီး အတည်ပြုမှတ်တမ်းတင်ပါ။',
          { topicId, chatId, inlineKeyboard: appButton('Record Expense in App', `${APP_URL}/budget`) }
        )
        return NextResponse.json({ ok: true, command: 'spend_redirected' })
      }
    }

    return NextResponse.json({ ok: true, action: 'ignored' })
  } catch {
    console.error('[Telegram:OurWorld:Webhook] update processing or reply delivery failed.')
    return NextResponse.json({ error: 'Unable to process Telegram update or deliver reply.' }, { status: 502 })
  }
}

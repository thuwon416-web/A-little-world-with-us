import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { sendTelegramMessage } from '@/lib/telegram'

function isAuthorized(req: Request): boolean {
  const secret = process.env.TELEGRAM_ACTION_SECRET
  const authorization = req.headers.get('authorization')
  if (!secret || !authorization?.startsWith('Bearer ')) return false
  const provided = Buffer.from(authorization.slice('Bearer '.length), 'utf8')
  const expected = Buffer.from(secret, 'utf8')
  return provided.length === expected.length && timingSafeEqual(provided, expected)
}

export async function POST(req: Request) {
  if (!process.env.TELEGRAM_ACTION_SECRET) {
    return NextResponse.json({ error: 'Action gateway is not configured.' }, { status: 503 })
  }
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  try {
    const body = await req.json()
    const { action, topic_id } = body
    if (typeof action !== 'string' || !action) {
      return NextResponse.json({ error: 'Action is required.' }, { status: 400 })
    }

    if (action === 'world_korean_quiz') {
      const msg = '✍️ <b>Daily Korean Quiz:</b>\n"사랑해" (Saranghae) ၏ မြန်မာလို အဓိပ္ပာယ်မှာ အဘယ်နည်း?\n\nခလုတ်နှိပ်၍ ဖြေဆိုပါ:'
      const buttons = [
        [
          { text: 'A) ကျေးဇူးတင်ပါတယ်', callback_data: 'world_quiz_ans:A' },
          { text: 'B) ချစ်တယ် (Correct)', callback_data: 'world_quiz_ans:B' },
        ],
        [
          { text: 'C) မင်္ဂလာပါ', callback_data: 'world_quiz_ans:C' },
          { text: 'D) တောင်းပန်ပါတယ်', callback_data: 'world_quiz_ans:D' },
        ],
      ]
      await sendTelegramMessage(msg, { topicId: topic_id, inlineKeyboard: buttons })
      return NextResponse.json({ status: 'ok', action: 'quiz_sent' })
    }

    if (action.startsWith('world_quiz_ans:')) {
      const choice = action.split(':')[1]
      if (!['A', 'B', 'C', 'D'].includes(choice)) {
        return NextResponse.json({ error: 'Invalid quiz answer.' }, { status: 400 })
      }
      const isCorrect = choice === 'B'
      const feedback = isCorrect
        ? '🎉 <b>မှန်ကန်ပါတယ်!</b> "사랑해" = ချစ်တယ် (I love you) ဖြစ်ပါတယ်။ အမှတ် +10 ရရှိပါပြီ! 💖'
        : '❌ <b>မှားယွင်းနေပါတယ်ခင်ဗျာ။</b> အဖြေမှန်မှာ B) ချစ်တယ် (I love you) ဖြစ်ပါတယ်။ မနက်ဖြန် ထပ်ကြိုးစားပါ! ✨'
      await sendTelegramMessage(feedback, { topicId: topic_id })
      return NextResponse.json({ status: 'ok', correct: isCorrect })
    }

    if (action === 'world_open_memories') {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://alittleworldwithus.com'
      const msg = '📖 <b>Couple Memories:</b>\nအမှတ်တရ ဓာတ်ပုံများနှင့် Diary များကို အောက်ပါ link တွင် ဖွင့်လှစ်ကြည့်ရှုနိုင်ပါသည်:'
      const buttons = [[{ text: '💖 Open Memories Album', url: appUrl + '/memories' }]]
      await sendTelegramMessage(msg, { topicId: topic_id, inlineKeyboard: buttons })
      return NextResponse.json({ status: 'ok', action: 'memories_link_sent' })
    }

    return NextResponse.json({ status: 'ignored', action })
  } catch {
    return NextResponse.json({ error: 'Unable to process Telegram action.' }, { status: 500 })
  }
}

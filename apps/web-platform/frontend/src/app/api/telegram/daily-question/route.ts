import { NextResponse } from 'next/server'
import { sendTelegramMessage } from '@/lib/telegram'

// Curated rotating couple intimacy & bonding questions
const COUPLE_QUESTIONS = [
  'What was the exact moment this week when you felt most loved by your partner?',
  'If we could pause time and spend 24 hours anywhere in the world tomorrow, where would we go?',
  'What is one small habit or gesture of mine that never fails to make you smile?',
  'What is a dream we haven\'t talked about lately that you still want us to achieve together?',
  'What song or melody immediately reminds you of the early days of our relationship?',
  'What is something you appreciate about how we handle challenges together as a team?',
  'What is your favorite memory of us from this past month?',
  'If our relationship was a book or movie title, what would today\'s chapter be called?',
  'What is one new experience or hobby you would love for us to try together next?',
  'What is something I did recently that made you feel proud of me?',
]

export async function GET(req: Request) {
  return handleDailyQuestion(req)
}

export async function POST(req: Request) {
  return handleDailyQuestion(req)
}

async function handleDailyQuestion(req: Request) {
  try {
    const url = new URL(req.url)
    const topicIdParam = url.searchParams.get('topic_id')
    const topicId = topicIdParam ? parseInt(topicIdParam, 10) : undefined

    // Calculate day of year to deterministically rotate questions
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 0)
    const diff = now.getTime() - start.getTime()
    const oneDay = 1000 * 60 * 60 * 24
    const dayOfYear = Math.floor(diff / oneDay)
    const questionIndex = dayOfYear % COUPLE_QUESTIONS.length
    const questionText = COUPLE_QUESTIONS[questionIndex]

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://alittleworldwithus.com'

    const message = [
      '💌 <b>[A Little World With Us] Today\'s Couple Question</b>',
      '',
      `❓ <b>"${questionText}"</b>`,
      '',
      '<i>Take a quiet minute together to share your honest answers and connect.</i>',
    ].join('\n')

    const inlineKeyboard = [
      [
        { text: '💖 Answer in Couple Journal', url: `${appUrl}/couple` },
        { text: '📖 View Past Answers', url: `${appUrl}/memories` },
      ],
    ]

    const tgResult = await sendTelegramMessage(message, {
      topicId,
      inlineKeyboard,
    })

    return NextResponse.json({
      status: 'success',
      day_of_year: dayOfYear,
      question: questionText,
      telegram_sent: !!tgResult,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

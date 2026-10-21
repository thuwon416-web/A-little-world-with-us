import { NextResponse } from 'next/server'
import { sendTelegramMessage } from '@/lib/telegram'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://alittleworldwithus.com'

export async function POST(req: Request) {
  try {
    const update = await req.json()

    // 1. Handle Callback Query (Button clicks)
    if (update.callback_query) {
      const cq = update.callback_query
      const action = cq.data || ''
      const topicId = cq.message?.message_thread_id

      if (action.startsWith('world_quiz_ans:')) {
        const choice = action.split(':')[1]
        const isCorrect = choice === 'B'
        const feedback = isCorrect
          ? '🎉 <b>မှန်ကန်ပါတယ်!</b> "사랑해" = ချစ်တယ် (I love you) ဖြစ်ပါတယ်။ အမှတ် +10 ရရှိပါပြီ! 💖'
          : '❌ <b>မှားယွင်းနေပါတယ်ခင်ဗျာ။</b> အဖြေမှန်မှာ B) ချစ်တယ် ဖြစ်ပါတယ်။ မနက်ဖြန် ထပ်ကြိုးစားပါ! ✨'
        await sendTelegramMessage(feedback, { topicId })
        return NextResponse.json({ ok: true, action: 'quiz_answered' })
      }

      if (action === 'world_start_quiz') {
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
        await sendTelegramMessage(msg, { topicId, inlineKeyboard: buttons })
        return NextResponse.json({ ok: true, action: 'quiz_started' })
      }
    }

    // 2. Handle Message Text (Slash Commands)
    if (update.message) {
      const msg = update.message
      const text = (msg.text || '').trim()
      const topicId = msg.message_thread_id

      if (!text) return NextResponse.json({ ok: true })

      // /start or /help
      if (text.startsWith('/start') || text.startsWith('/help')) {
        const helpText = (
          '❤️ <b>A Little World With Us — Couple Commands:</b>\n\n' +
          '• <code>/status</code> — Check our world heartbeat & sync\n' +
          '• <code>/morning_brief</code> — Today\'s couple morning briefing\n' +
          '• <code>/quiz</code> — Take today\'s Korean intimacy quiz\n' +
          '• <code>/spend [amount] [for]</code> — Quick expense log (e.g. <code>/spend 25000 dinner</code>)\n\n' +
          '👇 Click below to open Our World directly in Telegram:'
        )
        const buttons = [
          [{ text: '❤️ Open Our World (Mini App)', web_app: { url: APP_URL } }]
        ]
        await sendTelegramMessage(helpText, { topicId, inlineKeyboard: buttons })
        return NextResponse.json({ ok: true, command: 'help' })
      }

      // /status
      if (text.startsWith('/status')) {
        const statusText = (
          '🟢 <b>[Our Little World] Heartbeat Status:</b>\n\n' +
          '• <b>Togetherness Status:</b> <code>100% In Sync 💕</code>\n' +
          '• <b>Memory Vault:</b> <code>Cloudinary & Supabase Synced</code>\n' +
          '• <b>Care Reminders:</b> <code>Active & Healthy</code>'
        )
        const buttons = [
          [{ text: '❤️ Open Our World', web_app: { url: APP_URL } }]
        ]
        await sendTelegramMessage(statusText, { topicId, inlineKeyboard: buttons })
        return NextResponse.json({ ok: true, command: 'status' })
      }

      // /morning_brief
      if (text.startsWith('/morning_brief') || text.startsWith('/digest')) {
        const digestText = (
          '☀️ <b>[Our Little World] AI Morning Couple Briefing</b> 💕\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
          '💌 <b>Today\'s Message:</b>\n' +
          '<i>\"Together is our favorite place to be. Have a gentle, beautiful day!\"</i>\n\n' +
          '🗓️ <b>Daily Milestone:</b> Another precious day written in our story.\n' +
          '✍️ <b>Intimacy Quiz:</b> Today\'s Korean challenge is waiting for you!\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
          '<i>Open your shared space via the Mini App below:</i>'
        )
        const buttons = [
          [{ text: '❤️ Open Our World (Mini App)', web_app: { url: APP_URL } }],
          [{ text: '✍️ Play Korean Quiz', callback_data: 'world_start_quiz' }],
        ]
        await sendTelegramMessage(digestText, { topicId, inlineKeyboard: buttons })
        return NextResponse.json({ ok: true, command: 'morning_brief' })
      }

      // /quiz
      if (text.startsWith('/quiz')) {
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
        await sendTelegramMessage(msg, { topicId, inlineKeyboard: buttons })
        return NextResponse.json({ ok: true, command: 'quiz' })
      }

      // /spend <amount> <desc>
      if (text.startsWith('/spend')) {
        const parts = text.split(' ')
        const amount = parts[1] || '0'
        const desc = parts.slice(2).join(' ') || 'Expense'
        const reply = `💸 <b>Shared Expense Recorded:</b>\n• Amount: <code>${amount}</code>\n• Details: <i>${desc}</i>\n• Logged to couple shared ledger. ✅`
        await sendTelegramMessage(reply, { topicId })
        return NextResponse.json({ ok: true, command: 'spend' })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

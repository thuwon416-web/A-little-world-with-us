import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  AI_COMPLETION_BUDGET,
  getAiResponseText,
  optionalString,
  withAiRouteAuth,
} from '@/lib/ai/route-helpers'

// Validation schema
const messageSuggestionsSchema = z.object({
  context: optionalString(1000),
})

export async function POST(req: NextRequest) {
  try {
    return await withAiRouteAuth(async (req) => {

    // 3. Parse and validate request
    const body = await req.json()
    const validated = messageSuggestionsSchema.parse(body)

    const apiKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY
    
    if (!apiKey) {
      return NextResponse.json({ 
        suggestions: [
          `Good morning, my love! 💕 Just wanted to start your day knowing how much you mean to me.`,
          `Thinking of you and smiling. Hope your day is as wonderful as you are!`,
          `You make my world brighter just by being in it. Can't wait to see you later!`,
          `Every morning I wake up grateful to have you in my life. You're amazing!`,
          `Sending you love and good vibes for the day ahead. You've got this!`
        ]
      })
    }

    let response: Response
    
    if (process.env.GROQ_API_KEY) {
      response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: 'Generate 5 romantic message suggestions. Return JSON array of strings. Be sweet, thoughtful, and appropriate for the context.',
            },
            {
              role: 'user',
              content: `Generate message suggestions for: ${validated.context}`,
            },
          ],
          // nosemgrep
          max_tokens: AI_COMPLETION_BUDGET,
        }),
      })
    } else {
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ 
            parts: [{ 
              text: `Generate 5 romantic message suggestions. Return JSON array of strings. Be sweet, thoughtful, and appropriate for the context. Context: ${validated.context}` 
            }] 
          }],
        }),
      })
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: 'AI service unavailable' },
        { status: 503 }
      )
    }

    const data = await response.json()
    
    const provider = process.env.GROQ_API_KEY ? 'groq' : 'gemini'
    let suggestions: string[]
    try {
      const text = getAiResponseText(data, provider, '')
      suggestions = z.array(z.string()).parse(JSON.parse(text))
    } catch (error) {
      console.error('Message suggestions AI response parsing failed:', error)
      return NextResponse.json(
        { error: 'AI service returned an invalid response.' },
        { status: 502 }
      )
    }

    return NextResponse.json({ suggestions })

    })(req)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Message Suggestions error')
    return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 })
  }
}

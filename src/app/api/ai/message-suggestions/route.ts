import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { z } from 'zod'

// Rate limiting store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userLimit = rateLimitStore.get(userId)
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(userId, { count: 1, resetTime: now + 60000 }) // 1 min window
    return true
  }
  
  if (userLimit.count >= 10) { // 10 requests per minute
    return false
  }
  
  userLimit.count++
  return true
}

// Validation schema
const messageSuggestionsSchema = z.object({
  context: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    // 1. Session verification
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll()
          },
          setAll() {
            // Handle cookie updates if needed
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = user.id

    // 2. Rate limiting
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429 }
      )
    }

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
          max_tokens: 600,
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
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: 'AI service unavailable', details: errorData },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    let suggestions: string[] = []
    
    if (process.env.GROQ_API_KEY) {
      try {
        suggestions = JSON.parse(data.choices?.[0]?.message?.content || '[]')
      } catch {
        suggestions = []
      }
    } else {
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]'
      try {
        suggestions = JSON.parse(text)
      } catch {
        suggestions = []
      }
    }

    return NextResponse.json({ suggestions })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Message Suggestions error:', error)
    return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 })
  }
}

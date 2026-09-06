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
const chatSchema = z.object({
  message: z.string().min(1).max(1000),
  provider: z.string().optional(),
})

async function callGemini(message: string) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured')
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `You are a helpful relationship assistant for "A Little World With Us" app. Help users with love advice, date ideas, and relationship tips. Be warm, supportive, and romantic. User says: ${message}` }] }],
    }),
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const error = new Error(`Gemini API error: ${response.status}`)
    ;(error as any).cause = errorData
    throw error
  }
  
  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response'
}

async function callOpenRouter(message: string) {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured')
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful relationship assistant for "A Little World With Us" app. Help users with love advice, date ideas, and relationship tips. Be warm, supportive, and romantic.'
        },
        { role: 'user', content: message }
      ],
    }),
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const error = new Error(`OpenRouter API error: ${response.status}`)
    ;(error as any).cause = errorData
    throw error
  }
  
  const data = await response.json()
  return data.choices?.[0]?.message?.content || 'No response'
}

async function callHuggingFace(message: string) {
  const apiKey = process.env.HUGGINGFACE_API_KEY
  if (!apiKey) {
    throw new Error('HUGGINGFACE_API_KEY not configured')
  }

  const response = await fetch('https://api-inference.huggingface.co/models/gpt2', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: message }),
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const error = new Error(`HuggingFace API error: ${response.status}`)
    ;(error as any).cause = errorData
    throw error
  }
  
  const data = await response.json()
  return data?.generated_text || 'No response'
}

async function callGroq(message: string) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured')
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful relationship assistant for "A Little World With Us" app. Help users with love advice, date ideas, and relationship tips. Be warm, supportive, and romantic.',
        },
        {
          role: 'user',
          content: message,
        },
      ],
      max_tokens: 500,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const error = new Error(`Groq API error: ${response.status}`)
    ;(error as any).cause = errorData
    throw error
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || 'No response'
}

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

    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // 2. Rate limiting
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429 }
      )
    }

    // 3. Parse and validate request
    const body = await req.json()
    const validated = chatSchema.parse(body)

    let response: string

    switch (validated.provider) {
      case 'gemini':
        response = await callGemini(validated.message)
        break
      case 'openrouter':
        response = await callOpenRouter(validated.message)
        break
      case 'huggingface':
        response = await callHuggingFace(validated.message)
        break
      case 'groq':
        response = await callGroq(validated.message)
        break
      default:
        // Try Groq first, then fallback to Gemini
        try {
          response = await callGroq(validated.message)
        } catch {
          try {
            response = await callGemini(validated.message)
          } catch {
            response = 'Sorry, I need an AI API key to function. Please configure GROQ_API_KEY or GEMINI_API_KEY in your environment.'
          }
        }
    }

    return NextResponse.json({
      response,
      provider: validated.provider || 'groq',
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

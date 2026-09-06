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
const recommendPartnersSchema = z.object({
  preferences: z.record(z.string(), z.any()).optional(),
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
    const validated = recommendPartnersSchema.parse(body)

    // Use AI API for relationship activity recommendations
    const apiKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY
    
    if (!apiKey) {
      return NextResponse.json({ 
        recommendations: [
          {
            category: 'Quality Time',
            name: 'Movie Night',
            description: 'Watch a romantic movie together at home',
            reason: 'Perfect for cozy evenings and bonding'
          },
          {
            category: 'Adventure',
            name: 'Nature Walk',
            description: 'Take a walk in a nearby park or nature trail',
            reason: 'Great for conversations and fresh air'
          },
          {
            category: 'Creative',
            name: 'Cook Together',
            description: 'Prepare a meal together from scratch',
            reason: 'Builds teamwork and creates memories'
          }
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
              content: 'You are a relationship activity recommender for couples. Recommend 3-5 couple activities based on preferences. Return JSON array with: category, name, description, reason. Keep it romantic and practical.',
            },
            {
              role: 'user',
              content: `Recommend couple activities for: ${JSON.stringify(validated.preferences)}`,
            },
          ],
          max_tokens: 800,
        }),
      })
    } else {
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ 
            parts: [{ 
              text: `You are a relationship activity recommender for couples. Recommend 3-5 couple activities based on preferences. Return JSON array with: category, name, description, reason. Keep it romantic and practical. Preferences: ${JSON.stringify(validated.preferences)}` 
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
    
    let recommendations: any[] = []
    
    if (process.env.GROQ_API_KEY) {
      try {
        recommendations = JSON.parse(data.choices?.[0]?.message?.content || '[]')
      } catch {
        recommendations = []
      }
    } else {
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]'
      try {
        recommendations = JSON.parse(text)
      } catch {
        recommendations = []
      }
    }

    return NextResponse.json({ recommendations })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    console.error('AI Recommendations error:', error)
    return NextResponse.json({ error: 'Failed to get recommendations' }, { status: 500 })
  }
}

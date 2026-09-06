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
  
  if (userLimit.count >= 5) { // 5 feedback submissions per minute
    return false
  }
  
  userLimit.count++
  return true
}

// Validation schema
const feedbackSchema = z.object({
  feedback: z.string().min(1).max(5000),
})

export async function POST(request: NextRequest) {
  try {
    // 1. Session verification
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
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
    const body = await request.json()
    const validated = feedbackSchema.parse(body)

    // 4. Store feedback with user ID
    const { error } = await supabase
      .from('feedback')
      .insert({ 
        feedback: validated.feedback, 
        user_id: userId,
        created_at: new Date().toISOString() 
      })

    if (error) {
      return NextResponse.json({ error: 'Failed to store feedback' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Failed to process feedback' }, { status: 500 })
  }
}

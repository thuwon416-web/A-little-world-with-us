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
  
  if (userLimit.count >= 20) { // 20 requests per minute for notifications
    return false
  }
  
  userLimit.count++
  return true
}

// Validation schema
const notificationSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().max(500).optional(),
  scheduledAt: z.string().optional(),
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
    const validated = notificationSchema.parse(body)

    // 4. Save notification to database (if table exists)
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId, // Use session user ID instead of arbitrary userId from request
          title: validated.title,
          body: validated.body,
          scheduled_at: validated.scheduledAt || new Date().toISOString(),
        })

      if (error) {
        // If table doesn't exist, log but don't fail - this is an optional feature
        console.log('Notifications table may not exist:', error.message)
      }
    } catch (dbError) {
      // Database error is not critical for this optional feature
      console.log('Database error (optional feature):', dbError)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Notification API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/rate-limit'

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
    const rateLimitResult = await checkRateLimit(userId, 20, 60000)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429 }
      )
    }

    // 3. Parse and validate request
    const body = await req.json()
    const validated = notificationSchema.parse(body)

    // 4. Save notification to database. A success response must mean it was persisted.
    const { error: insertError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: validated.title,
        body: validated.body,
        scheduled_at: validated.scheduledAt || new Date().toISOString(),
      })

    if (insertError) {
      console.error('Unable to save notification:', insertError)
      return NextResponse.json(
        { error: 'Failed to save notification' },
        { status: 500 }
      )
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

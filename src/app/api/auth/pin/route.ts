import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import bcrypt from 'bcrypt'
import { checkRateLimit } from '@/lib/rate-limit'

const SALT_ROUNDS = 10

export async function POST(req: NextRequest) {
  try {
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

    const body = await req.json()
    const { action, pin } = body

    if (action === 'hash') {
      // Hash a new PIN
      if (!pin || pin.length !== 4) {
        return NextResponse.json(
          { error: 'PIN must be 4 digits' },
          { status: 400 }
        )
      }

      const hashedPin = await bcrypt.hash(pin, SALT_ROUNDS)

      // Store the hashed PIN in user_settings
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          lock_pin_hash: hashedPin,
        })

      if (error) {
        console.error('Error storing PIN:', error)
        return NextResponse.json(
          { error: 'Failed to store PIN' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true })
    }

    if (action === 'verify') {
      // Verify a PIN against the stored hash
      if (!pin || pin.length !== 4) {
        return NextResponse.json(
          { error: 'PIN must be 4 digits' },
          { status: 400 }
        )
      }

      const rateLimitResult = await checkRateLimit(`pin:${user.id}`, 5, 60000)
      if (!rateLimitResult.allowed) {
        return NextResponse.json(
          { error: 'Too many PIN attempts. Try again later.' },
          { status: 429 }
        )
      }

      const { data } = await supabase
        .from('user_settings')
        .select('lock_pin_hash')
        .eq('user_id', user.id)
        .single()

      if (!data?.lock_pin_hash) {
        return NextResponse.json(
          { error: 'No PIN set' },
          { status: 400 }
        )
      }

      const isValid = await bcrypt.compare(pin, data.lock_pin_hash)

      return NextResponse.json({ valid: isValid })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('PIN API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

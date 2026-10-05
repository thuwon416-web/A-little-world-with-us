import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/rate-limit'
import { createServerClient } from '@/lib/supabase-server'
import { isSameOriginRequest } from '@/lib/csrf'

const SALT_ROUNDS = 10
const pinRequestSchema = z.object({
  action: z.enum(['hash', 'verify', 'remove', 'status']),
  pin: z.string().regex(/^\d{4,6}$/, 'PIN must be 4 to 6 digits').optional(),
  currentPin: z.string().regex(/^\d{4,6}$/, 'Current PIN must be 4 to 6 digits').optional(),
})

export async function POST(req: NextRequest) {
  try {
    if (!isSameOriginRequest(req)) {
      return NextResponse.json({ error: 'Cross-origin request blocked.' }, { status: 403 })
    }
    const supabase = await createServerClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { action, pin, currentPin } = pinRequestSchema.parse(await req.json())

    if ((action === 'hash' || action === 'verify') && !pin) {
      return NextResponse.json({ error: 'PIN is required' }, { status: 400 })
    }

    if (action === 'status') {
      const { data, error } = await supabase
        .from('user_settings')
        .select('lock_pin_hash')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        return NextResponse.json({ error: 'Failed to load PIN status' }, { status: 500 })
      }

      return NextResponse.json({ hasPIN: Boolean(data?.lock_pin_hash) })
    }

    if (action === 'remove' || action === 'hash') {
      const rateLimitResult = await checkRateLimit(`pin-change:${user.id}`, 5, 60000)
      if (!rateLimitResult.allowed) {
        return NextResponse.json(
          { error: 'Too many PIN changes. Try again later.' },
          { status: 429 }
        )
      }

      const { data: currentSettings, error: currentSettingsError } = await supabase
        .from('user_settings')
        .select('lock_pin_hash')
        .eq('user_id', user.id)
        .maybeSingle()

      if (currentSettingsError) {
        return NextResponse.json({ error: 'Failed to load current PIN.' }, { status: 500 })
      }

      if (currentSettings?.lock_pin_hash) {
        if (!currentPin) {
          return NextResponse.json({ error: 'Current PIN is required.' }, { status: 400 })
        }
        const currentValid = await bcrypt.compare(currentPin, currentSettings.lock_pin_hash)
        if (!currentValid) {
          return NextResponse.json({ error: 'Current PIN is incorrect.' }, { status: 403 })
        }
      } else if (action === 'remove') {
        return NextResponse.json({ error: 'No PIN is currently set.' }, { status: 400 })
      }

      if (action === 'remove') {
        const { error } = await supabase
          .from('user_settings')
          .update({ lock_pin_hash: null })
          .eq('user_id', user.id)

        if (error) {
          return NextResponse.json({ error: 'Failed to remove PIN' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
      }
    }

    if (action === 'hash') {
      const hashedPin = await bcrypt.hash(pin!, SALT_ROUNDS)

      // Store the hashed PIN in user_settings
      const { error } = await supabase
        .from('user_settings')
        .upsert(
          {
            user_id: user.id,
            lock_pin_hash: hashedPin,
          },
          { onConflict: 'user_id' }
        )

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

      const isValid = await bcrypt.compare(pin!, data.lock_pin_hash)

      return NextResponse.json({ valid: isValid })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    console.error('PIN API error')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { createServerClient } from '@supabase/ssr'
import { isSameOriginRequest } from '@/lib/csrf'
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

const pushEndpoint = z
  .string()
  .url()
  .max(2048)
  .refine(isAllowedPushEndpoint, {
    message: 'Unsupported push service endpoint.',
  })

const subscriptionSchema = z.object({
  endpoint: pushEndpoint,
  expirationTime: z.number().nullable().optional(),
  keys: z.object({ p256dh: z.string().min(1).max(256), auth: z.string().min(1).max(256) }),
})

function isAllowedPushEndpoint(value: string): boolean {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') return false
    if (url.username || url.password || url.port) return false
    if (url.hostname === 'fcm.googleapis.com') return true
    if (url.hostname.endsWith('.push.services.mozilla.com')) return true
    if (url.hostname.endsWith('.push.apple.com')) return true
    return false
  } catch {
    return false
  }
}

function getSessionClient(req: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: () => undefined,
      },
    }
  )
}

export async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const supabase = getSessionClient(req)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const input = subscriptionSchema.parse(await req.json())
    const { error } = await supabase.from('web_push_subscriptions').upsert(
      { user_id: user.id, endpoint: input.endpoint, subscription: input, last_seen: new Date().toISOString(), invalidated: false },
      { onConflict: 'endpoint' }
    )
    if (error) {
      console.error('Unable to save browser push subscription:', error)
      return NextResponse.json({ error: 'Unable to save subscription.' }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid subscription.' }, { status: 400 })
    }
    console.error('Browser push subscription error:', error)
    return NextResponse.json({ error: 'Unable to save subscription.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  if (!isSameOriginRequest(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const supabase = getSessionClient(req)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const input = z.object({ endpoint: pushEndpoint }).parse(await req.json())
    const { error } = await supabase
      .from('web_push_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('endpoint', input.endpoint)
    if (error) return NextResponse.json({ error: 'Unable to remove subscription.' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid subscription.' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Unable to remove subscription.' }, { status: 500 })
  }
}

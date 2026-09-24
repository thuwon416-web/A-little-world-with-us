import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

const pushEndpoint = z
  .string()
  .url()
  .max(2048)
  .refine((value) => {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname.includes('.') && !url.hostname.endsWith('.local')
  })

const subscriptionSchema = z.object({
  endpoint: pushEndpoint,
  expirationTime: z.number().nullable().optional(),
  keys: z.object({ p256dh: z.string().min(1).max(256), auth: z.string().min(1).max(256) }),
})

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
  try {
    const supabase = getSessionClient(req)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const input = subscriptionSchema.parse(await req.json())
    const { error } = await supabase.from('web_push_subscriptions').upsert(
      { user_id: user.id, endpoint: input.endpoint, subscription: input },
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

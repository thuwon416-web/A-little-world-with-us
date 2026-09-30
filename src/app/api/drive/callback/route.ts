import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { exchangeCode, saveConnection, verifyOAuthState } from '@/lib/google-drive'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login?error=drive_auth', url.origin))
  if (!code || !state || !verifyOAuthState(state, user.id)) return NextResponse.redirect(new URL('/settings?drive=error', url.origin))
  try {
    await saveConnection(user.id, await exchangeCode(code))
    return NextResponse.redirect(new URL('/settings?drive=connected', url.origin))
  } catch (error) {
    console.error('[drive] callback failed', error instanceof Error ? error.message : 'unknown')
    return NextResponse.redirect(new URL('/settings?drive=error', url.origin))
  }
}

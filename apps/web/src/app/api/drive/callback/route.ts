import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { exchangeCode, saveConnection, verifyOAuthState } from '@/lib/google-drive'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const storedState = (await cookies()).get('drive_oauth_state')?.value
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login?error=drive_auth', url.origin))
  if (!code || !state || storedState !== state) return NextResponse.redirect(new URL('/settings?drive=error', url.origin))
  try {
    if (!verifyOAuthState(state, user.id)) return NextResponse.redirect(new URL('/settings?drive=error', url.origin))
  } catch (error) {
    console.error('[drive] callback state verification failed', error instanceof Error ? error.message : 'unknown')
    return NextResponse.redirect(new URL('/settings?drive=error', url.origin))
  }
  try {
    await saveConnection(user.id, await exchangeCode(code))
    const response = NextResponse.redirect(new URL('/settings?drive=connected', url.origin))
    response.cookies.delete('drive_oauth_state')
    return response
  } catch (error) {
    const response = NextResponse.redirect(new URL('/settings?drive=error', url.origin))
    response.cookies.delete('drive_oauth_state')
    console.error('[drive] callback failed', error instanceof Error ? error.message : 'unknown')
    return response
  }
}

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { exchangeCode, parseOAuthState, saveConnection, verifyOAuthState } from '@/lib/google-drive'

function safeReturnOrigin(origin: string | undefined, fallback: string) {
  if (!origin) return fallback
  try {
    const parsed = new URL(origin)
    const allowedPreview = /^a-little-world-with-[a-z0-9-]+-thuwon416-web\.vercel\.app$/.test(parsed.hostname)
    const allowedProduction = parsed.origin === 'https://a-little-world-with-us.vercel.app'
    const allowedLocal = parsed.hostname === 'localhost' && parsed.port === '3000'
    if (allowedProduction || allowedPreview || allowedLocal) return parsed.origin
  } catch {
    // Ignore malformed return origins.
  }
  return fallback
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const storedState = (await cookies()).get('drive_oauth_state')?.value
  const parsedState = state ? parseOAuthState(state) : null
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const stateUserId = parsedState?.userId

  if (!user && !stateUserId) return NextResponse.redirect(new URL('/login?error=drive_auth', url.origin))
  if (!code || !state || !parsedState) return NextResponse.redirect(new URL('/settings?drive=error', url.origin))

  // Normal same-origin production flow keeps the HttpOnly cookie binding.
  // Preview deployments use the canonical production callback, so their cookie
  // cannot cross hosts. The HMAC-signed, 10-minute state then supplies the
  // already-authenticated user id and signed return origin.
  if (storedState) {
    if (storedState !== state || !user || !verifyOAuthState(state, user.id)) {
      return NextResponse.redirect(new URL('/settings?drive=error', url.origin))
    }
  }

  const userId = user?.id ?? stateUserId
  if (!userId) return NextResponse.redirect(new URL('/login?error=drive_auth', url.origin))

  try {
    await saveConnection(userId, await exchangeCode(code))
    const returnOrigin = safeReturnOrigin(parsedState.returnOrigin, url.origin)
    const response = NextResponse.redirect(new URL('/settings?drive=connected', returnOrigin))
    response.cookies.delete('drive_oauth_state')
    return response
  } catch (error) {
    const returnOrigin = safeReturnOrigin(parsedState.returnOrigin, url.origin)
    const response = NextResponse.redirect(new URL('/settings?drive=error', returnOrigin))
    response.cookies.delete('drive_oauth_state')
    console.error('[drive] callback failed', error instanceof Error ? error.message : 'unknown')
    return response
  }
}

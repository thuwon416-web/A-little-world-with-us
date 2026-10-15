import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { createOAuthState } from '@/lib/google-drive'

export async function GET(request: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI
  if (!clientId || !redirectUri) return NextResponse.json({ error: 'Google Drive OAuth is not configured yet.' }, { status: 503 })
  try {
    const requestOrigin = new URL(request.url).origin
    const allowedOrigin = requestOrigin === 'https://a-little-world-with-us.vercel.app' || requestOrigin === 'http://localhost:3000'
    if (!allowedOrigin) {
      return NextResponse.json({ error: 'Google Drive connection must be started from the production web app.' }, { status: 400 })
    }
    const state = createOAuthState(user.id, requestOrigin)
    const params = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, response_type: 'code', access_type: 'offline', prompt: 'consent', scope: 'https://www.googleapis.com/auth/drive', state })
    const response = NextResponse.redirect('https://accounts.google.com/o/oauth2/v2/auth?' + params.toString())
    response.cookies.set('drive_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/drive',
      maxAge: 10 * 60,
    })
    return response
  } catch (error) {
    console.error('[drive] start failed', error instanceof Error ? error.message : 'unknown')
    return NextResponse.json({ error: 'Google Drive OAuth server configuration is incomplete.' }, { status: 503 })
  }
}

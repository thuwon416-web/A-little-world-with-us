import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { createOAuthState } from '@/lib/google-drive'

export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI
  if (!clientId || !redirectUri) return NextResponse.json({ error: 'Google Drive OAuth is not configured yet.' }, { status: 503 })
  const params = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, response_type: 'code', access_type: 'offline', prompt: 'consent', scope: 'https://www.googleapis.com/auth/drive.file', state: createOAuthState(user.id) })
  return NextResponse.redirect('https://accounts.google.com/o/oauth2/v2/auth?' + params.toString())
}

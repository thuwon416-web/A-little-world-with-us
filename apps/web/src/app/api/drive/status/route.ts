import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase-server'
import { getDriveConnectionInfo } from '@/lib/google-drive'

export async function GET(request: Request) {
  const authorization = request?.headers.get('authorization')
  const supabase = authorization
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { global: { headers: { Authorization: authorization } }, auth: { autoRefreshToken: false, persistSession: false } })
    : await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const info = await getDriveConnectionInfo(user.id)
    if (!info) return NextResponse.json({ connected: false })
    return NextResponse.json({ connected: true, scope: info.scope, rootFolderId: info.rootFolderId, requiresReauthorization: info.scope !== 'https://www.googleapis.com/auth/drive' })
  } catch {
    return NextResponse.json({ connected: false })
  }
}

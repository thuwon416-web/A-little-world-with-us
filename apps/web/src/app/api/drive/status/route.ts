import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { getDriveAccessToken } from '@/lib/google-drive'

export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    await getDriveAccessToken(user.id)
    return NextResponse.json({ connected: true })
  } catch {
    return NextResponse.json({ connected: false })
  }
}

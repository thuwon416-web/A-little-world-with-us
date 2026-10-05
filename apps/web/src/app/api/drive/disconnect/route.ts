import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { disconnectDrive } from '@/lib/google-drive'
import { isSameOriginRequest } from '@/lib/csrf'

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Cross-origin request blocked.' }, { status: 403 })
  }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    await disconnectDrive(user.id)
    return NextResponse.json({ connected: false })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to disconnect Google Drive.' }, { status: 500 })
  }
}

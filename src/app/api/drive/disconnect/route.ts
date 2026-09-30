import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { disconnectDrive } from '@/lib/google-drive'

export async function POST() {
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

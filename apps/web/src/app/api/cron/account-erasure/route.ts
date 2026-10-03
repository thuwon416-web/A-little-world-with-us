import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient, writeAdminAudit } from '@/lib/admin'
import { disconnectDrive, deleteDriveFile } from '@/lib/google-drive'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: requests, error } = await admin
    .from('account_deletion_requests')
    .select('user_id,scheduled_for')
    .is('cancelled_at', null)
    .is('completed_at', null)
    .lte('scheduled_for', new Date().toISOString())
    .limit(10)

  if (error) return NextResponse.json({ error: 'Unable to load deletion queue.' }, { status: 500 })

  let completed = 0
  for (const request of requests ?? []) {
    const userId = request.user_id as string
    try {
      const { data: memories } = await admin
        .from('memories')
        .select('drive_file_id')
        .eq('user_id', userId)
        .not('drive_file_id', 'is', null)

      for (const memory of memories ?? []) {
        if (typeof memory.drive_file_id !== 'string') continue
        try { await deleteDriveFile(userId, memory.drive_file_id) } catch (driveError) {
          console.warn('[account-erasure] Drive file cleanup failed:', driveError instanceof Error ? driveError.message : 'unknown')
        }
      }

      try { await disconnectDrive(userId) } catch (driveError) {
        console.warn('[account-erasure] Drive disconnect failed:', driveError instanceof Error ? driveError.message : 'unknown')
      }

      await writeAdminAudit(admin, userId, 'execute_account_erasure', 'profile', userId, {
        scheduledFor: request.scheduled_for,
      })

      const { error: authError } = await admin.auth.admin.deleteUser(userId)
      if (authError) throw authError

      await admin.from('account_deletion_requests').update({ completed_at: new Date().toISOString() }).eq('user_id', userId)
      completed += 1
    } catch (eraseError) {
      console.error('[account-erasure] failed:', userId, eraseError)
    }
  }

  return NextResponse.json({ processed: requests?.length ?? 0, completed })
}

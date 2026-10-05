import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient, writeAdminAudit } from '@/lib/admin'
import { logEvent } from '@/lib/observability'
import { disconnectDrive } from '@/lib/google-drive'

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
      const { data: authUser, error: authLookupError } = await admin.auth.admin.getUserById(userId)
      if (authLookupError && !/not found|user not found/i.test(authLookupError.message)) throw authLookupError

      if (!authUser?.user) {
        await admin.from('account_deletion_requests')
          .update({ completed_at: new Date().toISOString() })
          .eq('user_id', userId)
        completed += 1
        continue
      }

      // Shared media is couple-owned. Account erasure must never remove it.
      // Revoke only the deleting user's private Drive OAuth connection.
      await disconnectDrive(userId)

      await writeAdminAudit(admin, userId, 'execute_account_erasure', 'profile', userId, {
        scheduledFor: request.scheduled_for,
        sharedDataPolicy: 'retained',
        sharedMediaPolicy: 'retained',
        privateDriveConnection: 'revoked',
      })

      // Database foreign keys with ON DELETE SET NULL preserve couple-owned rows
      // while private/user-owned rows continue to be removed by their own cascades.
      const { error: authError } = await admin.auth.admin.deleteUser(userId)
      if (authError) throw authError

      const { error: completionError } = await admin
        .from('account_deletion_requests')
        .update({ completed_at: new Date().toISOString() })
        .eq('user_id', userId)
      if (completionError) throw completionError

      completed += 1
    } catch (eraseError) {
      console.error('[account-erasure] failed:', userId, eraseError)
    }
  }

  return NextResponse.json({ processed: requests?.length ?? 0, completed })
}

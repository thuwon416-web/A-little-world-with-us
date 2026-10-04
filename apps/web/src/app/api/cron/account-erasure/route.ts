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
      const { data: authUser, error: authLookupError } = await admin.auth.admin.getUserById(userId)
      if (authLookupError && !/not found|user not found/i.test(authLookupError.message)) throw authLookupError
      if (!authUser?.user) {
        await admin.from('account_deletion_requests').update({ completed_at: new Date().toISOString() }).eq('user_id', userId)
        completed += 1
        continue
      }

      const { data: memories, error: memoryError } = await admin
        .from('memories')
        .select('drive_file_id')
        .eq('user_id', userId)
        .not('drive_file_id', 'is', null)
      if (memoryError) throw memoryError

      for (const memory of memories ?? []) {
        if (typeof memory.drive_file_id !== 'string') continue
        await deleteDriveFile(userId, memory.drive_file_id)
      }

      await disconnectDrive(userId)

      const storageBuckets = ['memories', 'gallery', 'chat_files', 'chat_photos', 'voice_messages', 'surprises']
      for (const bucket of storageBuckets) {
        for (;;) {
          const { data: objects, error: objectError } = await admin
            .schema('storage')
            .from('objects')
            .select('name')
            .eq('bucket_id', bucket)
            .eq('owner', userId)
            .limit(1000)
          if (objectError) throw objectError
          const names = (objects ?? []).map((object) => object.name).filter(Boolean)
          if (names.length === 0) break
          const { error: removeError } = await admin.storage.from(bucket).remove(names)
          if (removeError) throw removeError
          if (names.length < 1000) break
        }
      }

      await writeAdminAudit(admin, userId, 'execute_account_erasure', 'profile', userId, {
        scheduledFor: request.scheduled_for,
        storageCleanup: 'completed',
        driveCleanup: 'completed',
      })

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

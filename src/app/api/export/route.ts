import JSZip from 'jszip'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/rate-limit'

const sharedTables = [
  'memories',
  'messages',
  'plans',
  'plan_items',
  'events',
  'financial_goals',
  'reminders',
  'todos',
  'goals',
  'bucket_list',
  'cycle_logs',
  'care_daily_logs',
  'care_cycle_settings',
  'care_reminders',
  'mood_logs',
  'vault_items',
  'time_capsules',
] as const
const mediaBuckets = ['memories', 'gallery', 'chat_files', 'chat_photos', 'voice_messages'] as const
const exportRequestSchema = z
  .object({
    scope: z.literal('shared-couple-data').optional(),
  })
  .default({})

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
    )
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const rateLimitResult = await checkRateLimit(`export:${user.id}`, 3, 60 * 60 * 1000)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many export requests. Try again later.' },
        { status: 429 }
      )
    }
    const exportOptions = exportRequestSchema.parse(await request.json().catch(() => ({})))
    const { data: link } = await supabase
      .from('couple_links')
      .select('couple_id,inviter_id,accepted_by')
      .or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`)
      .eq('status', 'accepted')
      .maybeSingle()
    if (!link?.couple_id || !link.accepted_by)
      return NextResponse.json({ error: 'An accepted couple link is required.' }, { status: 400 })

    const zip = new JSZip()
    const recordEntries = await Promise.all(
      sharedTables.map(async (table) => {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('couple_id', link.couple_id)
        return [table, error ? { error: error.message } : (data ?? [])] as const
      })
    )
    const records = Object.fromEntries(recordEntries)
    zip.file(
      'data.json',
      JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          scope: exportOptions.scope ?? 'shared-couple-data',
          records,
        },
        null,
        2
      )
    )
    zip.file(
      'README.txt',
      'This archive contains shared couple records and authorized private media. Location history is intentionally excluded from this export.'
    )

    const owners = [link.inviter_id, link.accepted_by]
    for (const bucket of mediaBuckets) {
      for (const ownerId of owners) {
        const { data: objects } = await supabase.storage.from(bucket).list(ownerId, { limit: 1000 })
        for (const object of objects ?? []) {
          if (!object.name || object.metadata?.isFolder) continue
          const path = `${ownerId}/${object.name}`
          const { data: signed } = await supabase.storage.from(bucket).createSignedUrl(path, 60)
          if (!signed?.signedUrl) continue
          const media = await fetch(signed.signedUrl)
          if (media.ok) zip.file(`media/${bucket}/${path}`, await media.arrayBuffer())
        }
      }
    }
    const archive = await zip.generateAsync({
      type: 'uint8array',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    })
    const body = archive.buffer.slice(
      archive.byteOffset,
      archive.byteOffset + archive.byteLength
    ) as ArrayBuffer
    return new NextResponse(body, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="a-little-world-backup-${new Date().toISOString().slice(0, 10)}.zip"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid export request.' }, { status: 400 })
    }
    console.error('Couple export error')
    return NextResponse.json({ error: 'Unable to prepare the backup.' }, { status: 500 })
  }
}

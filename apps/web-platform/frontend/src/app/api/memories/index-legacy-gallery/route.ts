import { NextResponse } from 'next/server'
import { isSameOriginRequest } from '@/lib/csrf'
import { createServerClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

/**
 * Index legacy encrypted Gallery objects as Memories metadata without moving,
 * copying, decrypting, or deleting the original objects. Re-running is safe.
 */
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: links, error: linkError } = await supabase
    .from('couple_links')
    .select('couple_id,inviter_id,accepted_by')
    .eq('status', 'accepted')
    .or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`)
    .limit(2)
  if (linkError) return NextResponse.json({ error: 'Unable to verify couple access.' }, { status: 500 })
  if (!links || links.length !== 1) return NextResponse.json({ error: 'Exactly one accepted couple link is required.' }, { status: 409 })
  const link = links[0]
  // RLS intentionally permits a user to insert memories only with their own user_id.
  // Index this signed-in user's folder; the partner's originals are indexed when they visit too.
  const owners = [user.id]
  let indexed = 0

  for (const ownerId of owners) {
    const { data: files, error: listError } = await supabase.storage.from('gallery').list(ownerId, {
      limit: 1000, offset: 0, sortBy: { column: 'created_at', order: 'desc' },
    })
    if (listError) return NextResponse.json({ error: 'Unable to list legacy Gallery objects.', indexed }, { status: 500 })

    for (const file of files ?? []) {
      if (!file.name || file.name.startsWith('.') || file.metadata?.isFolder) continue
      const path = `${ownerId}/${file.name}`
      const { data: existing, error: existingError } = await supabase
        .from('memories')
        .select('id')
        .eq('couple_id', link.couple_id)
        .contains('metadata', { legacy_gallery_path: path })
        .limit(1)
      if (existingError) return NextResponse.json({ error: 'Unable to check existing Gallery index.', indexed }, { status: 500 })
      if (existing?.length) continue

      const createdAt = file.created_at ?? new Date().toISOString()
      const extension = file.name.split('.').pop()?.toLowerCase()
      const mimeType = extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : extension === 'gif' ? 'image/gif' : 'image/jpeg'
      const { error: insertError } = await supabase.from('memories').insert({
        couple_id: link.couple_id,
        user_id: ownerId,
        title: 'A moment together',
        caption: 'A moment together',
        date: createdAt.slice(0, 10),
        category: 'favorite',
        image_url: null,
        storage_path: path,
        storage_provider: 'supabase',
        mime_type: mimeType,
        metadata: { legacy_gallery_bucket: 'gallery', legacy_gallery_path: path, legacy_gallery_original: true, indexed_at: new Date().toISOString() },
      })
      if (insertError) return NextResponse.json({ error: 'Unable to index a legacy Gallery object.', indexed }, { status: 500 })
      indexed += 1
    }
  }

  return NextResponse.json({ ok: true, indexed, message: 'Legacy Gallery originals remain in place; only Memories metadata was added.' })
}

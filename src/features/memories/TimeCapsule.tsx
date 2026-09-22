'use client'

import { useCallback, useEffect, useState } from 'react'
import { Clock3, Lock, Mail, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { validateUpload } from '@/lib/upload-validation'
import { encryptAndUpload, getCachedDecryptedUrl, guessMimeTypeFromPath } from '@/lib/mediaEncryption'

function isExternalUrl(v?: string | null) {
  return !!v && (v.startsWith('http://') || v.startsWith('https://'))
}

type CapsuleAttachment = { id: string; storage_path: string; media_type: 'image' | 'file'; url?: string }
type Capsule = { id: string; title: string; content: string; unlock_at: string; status: 'scheduled' | 'revealed' | 'cancelled'; user_id: string; recipient_id: string; created_at: string; time_capsule_attachments?: CapsuleAttachment[] }

export default function TimeCapsule() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [unlockAt, setUnlockAt] = useState('')
  const [attachment, setAttachment] = useState<File | null>(null)
  const [capsules, setCapsules] = useState<Capsule[]>([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [coupleId, setCoupleId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return
    const { data: link } = await supabase.from('couple_links').select('couple_id').or(`inviter_id.eq.${userData.user.id},accepted_by.eq.${userData.user.id}`).eq('status', 'accepted').maybeSingle()
    setCoupleId(link?.couple_id ?? null)
    const { data, error: loadError } = await supabase.from('time_capsules').select('*, time_capsule_attachments(*)').order('unlock_at', { ascending: true })
    if (loadError) setError(loadError.message)
    else setCapsules(await Promise.all(((data ?? []) as Capsule[]).map(async (capsule) => ({ ...capsule, time_capsule_attachments: await Promise.all((capsule.time_capsule_attachments ?? []).map(async (attachment) => {
      let url: string | undefined
      if (isExternalUrl(attachment.storage_path)) {
        const { data: signed } = await supabase.storage.from('surprises').createSignedUrl(attachment.storage_path, 60 * 60)
        url = signed?.signedUrl
      } else if (link?.couple_id) {
        const mimeType = guessMimeTypeFromPath(attachment.storage_path)
        url = await getCachedDecryptedUrl(link.couple_id, 'surprises', attachment.storage_path, mimeType)
      }
      return { ...attachment, url }
    })) }))))
  }, [])
  useEffect(() => { void load() }, [load])

  const seal = async () => {
    if (!title.trim() || !content.trim() || !unlockAt) { setError('Add a title, message, and reveal time.'); return }
    if (attachment) {
      const validation = validateUpload(attachment)
      if (!validation.valid) { setError(validation.error ?? 'Unsupported attachment.'); return }
    }
    setSaving(true); setError('')
    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user
    if (!user) { setSaving(false); setError('Please sign in first.'); return }
    const { data: link, error: linkError } = await supabase.from('couple_links').select('couple_id,inviter_id,accepted_by').or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`).eq('status', 'accepted').maybeSingle()
    if (linkError || !link?.accepted_by) { setSaving(false); setError('Your accepted pair could not be found.'); return }
    const recipient_id = link.inviter_id === user.id ? link.accepted_by : link.inviter_id
    const { data: capsule, error: insertError } = await supabase.from('time_capsules').insert({ couple_id: link.couple_id, user_id: user.id, recipient_id, title: title.trim(), content: content.trim(), unlock_at: new Date(unlockAt).toISOString() }).select('id').single()
    if (insertError || !capsule) setError(insertError?.message ?? 'Unable to schedule the surprise.')
    else {
      if (attachment) {
        const path = `${user.id}/${crypto.randomUUID()}-${attachment.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
        const { path: storedPath, mimeType } = await encryptAndUpload(
          attachment,
          link.couple_id,
          'surprises',
          path
        )
        const { error: attachmentError } = await supabase.from('time_capsule_attachments').insert({ capsule_id: capsule.id, storage_path: storedPath, media_type: attachment.type.startsWith('image/') ? 'image' : 'file', mime_type: mimeType })
        if (attachmentError) { await supabase.storage.from('surprises').remove([storedPath]); await supabase.from('time_capsules').delete().eq('id', capsule.id); setError(attachmentError instanceof Error ? attachmentError.message : 'Attachment upload failed'); setSaving(false); return }
      }
      setTitle(''); setContent(''); setUnlockAt(''); setAttachment(null); await load()
    }
    setSaving(false)
  }

  const cancel = async (id: string) => {
    const { error: cancelError } = await supabase.from('time_capsules').update({ status: 'cancelled', cancelled_at: new Date().toISOString() }).eq('id', id)
    if (cancelError) setError(cancelError.message); else await load()
  }

  return <section className="glass-card space-y-4 p-5">
    <div className="flex items-center gap-2 text-accent-2"><Clock3 className="h-5 w-5" /><h2 className="font-serif text-2xl">Partner-only surprise</h2></div>
    <p className="text-sm text-text-2">Only your partner can read this after its reveal time. You can cancel it before then.</p>
    <div className="grid gap-3"><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Surprise title" className="rounded-input border border-accent-1/20 bg-soft-tint px-3 py-2 text-text-1" /><textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="Write something for your partner..." className="min-h-28 rounded-input border border-accent-1/20 bg-soft-tint px-3 py-2 text-text-1" /><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => setAttachment(event.target.files?.[0] ?? null)} className="text-sm text-text-2" /><input type="datetime-local" value={unlockAt} onChange={(event) => setUnlockAt(event.target.value)} className="rounded-input border border-accent-1/20 bg-soft-tint px-3 py-2 text-text-1" /><button type="button" onClick={seal} disabled={saving} className="rounded-input bg-accent-1 px-4 py-2 text-sm text-white disabled:opacity-50">{saving ? 'Sealing...' : 'Schedule surprise'}</button></div>
    {error && <p className="text-sm text-error">{error}</p>}
    <div className="space-y-2">{capsules.map((capsule) => { const revealed = capsule.status === 'revealed' || new Date(capsule.unlock_at) <= new Date(); return <article key={capsule.id} className="rounded-btn border border-border/20 bg-soft-tint p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-medium text-text-1">{capsule.title}</p><p className="mt-1 text-xs text-text-2">{new Date(capsule.unlock_at).toLocaleString()}</p></div>{revealed ? <Mail className="h-5 w-5 text-accent-2" /> : <Lock className="h-5 w-5 text-accent-1" />}</div>{revealed && capsule.status !== 'cancelled' && <><p className="mt-3 whitespace-pre-wrap text-sm text-text-2">{capsule.content}</p>{capsule.time_capsule_attachments?.map((attachment) => attachment.url && <a key={attachment.id} href={attachment.url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-accent-2 underline">Open attached {attachment.media_type}</a>)}</>}{capsule.status === 'scheduled' && <button type="button" onClick={() => cancel(capsule.id)} className="mt-3 inline-flex items-center gap-1 text-xs text-error"><Trash2 className="h-3.5 w-3.5" /> Cancel</button>}</article> })}</div>
  </section>
}

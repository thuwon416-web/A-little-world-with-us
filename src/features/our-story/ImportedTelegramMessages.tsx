'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type ImportedMessage = {
  id: string
  message_date: string
  sender_name: string
  message_text: string
}

const PAGE_SIZE = 50

export default function ImportedTelegramMessages({ coupleId }: { coupleId: string }) {
  const [messages, setMessages] = useState<ImportedMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async (offset = 0) => {
    if (offset) setLoadingMore(true)
    else setLoading(true)
    setError('')
    try {
      const { data, error: queryError } = await supabase
        .from('telegram_memories')
        .select('id,message_date,sender_name,message_text')
        .eq('couple_id', coupleId)
        .order('message_date', { ascending: false })
        .range(offset, offset + PAGE_SIZE)
      if (queryError) throw queryError
      const page = (data ?? []) as ImportedMessage[]
      setHasMore(page.length > PAGE_SIZE)
      const visible = page.slice(0, PAGE_SIZE)
      setMessages((current) => offset ? [...current, ...visible] : visible)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'မှတ်တမ်းများကို ဖတ်မရပါ။')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [coupleId])

  useEffect(() => { void load() }, [load])

  if (loading) return <div className="h-48 animate-pulse rounded-panel bg-card" aria-label="မှတ်တမ်းများ ဖွင့်နေသည်" />
  if (error) return <div role="alert" className="rounded-panel border border-error/30 p-5 text-error">{error}<button type="button" onClick={() => void load()} className="ml-3 underline">ပြန်စမ်းရန်</button></div>
  if (!messages.length) return <div className="rounded-panel border border-dashed border-accent-1/25 p-8 text-center text-text-2">တင်သွင်းထားတဲ့ Telegram စာသားမှတ်တမ်း မရှိသေးပါ။</div>

  return <div className="space-y-3">
    <p className="text-sm text-text-2">နောက်ဆုံးမှတ်တမ်း {messages.length} ခုကို ပြထားသည်။</p>
    <ol className="space-y-3">{messages.map((message) => <li key={message.id} className="rounded-btn border border-accent-1/15 bg-card p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2"><strong className="text-sm text-text-1">{message.sender_name}</strong><time className="text-xs text-text-2" dateTime={message.message_date}>{new Date(message.message_date).toLocaleString()}</time></div>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-text-1">{message.message_text}</p>
    </li>)}</ol>
    {hasMore ? <button type="button" disabled={loadingMore} onClick={() => void load(messages.length)} className="rounded-xl border border-accent-1/25 px-4 py-2 text-sm text-text-1 disabled:opacity-60">{loadingMore ? 'ဖွင့်နေသည်…' : 'နောက်ထပ်ဖွင့်ရန်'}</button> : null}
  </div>
}

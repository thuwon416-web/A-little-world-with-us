'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Clock3, Mail } from 'lucide-react'
import { insertRow, readRows } from '@/lib/supabase'

interface Capsule {
  id?: string
  title?: string
  message: string
  reveal_at: string
  created_at?: string
  source?: 'supabase' | 'local'
}

export default function TimeCapsule() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [revealAt, setRevealAt] = useState('')
  const [capsules, setCapsules] = useState<Capsule[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCapsules()
  }, [])

  const fetchCapsules = async () => {
    setError(null)
    try {
      const data = await readRows<Capsule>('time_capsules', '*', {
        column: 'created_at',
        ascending: false,
      })
      if (data.length > 0) {
        setCapsules(data.map((d) => ({ ...d, source: 'supabase' })))
        return
      }
    } catch {
      // ignore
    }

    try {
      const raw = localStorage.getItem('time-capsules')
      const parsed = raw ? JSON.parse(raw) : []
      setCapsules(parsed.map((c: any) => ({ ...c, source: 'local' })))
    } catch {
      setError('Failed to load time capsules')
    }
  }

  const save = async () => {
    if (!message.trim() || !revealAt) return
    setSaving(true)
    setError(null)

    const payload = {
      title: title.trim() || 'A future note',
      message: message.trim(),
      reveal_at: new Date(revealAt).toISOString(),
    }

    try {
      const inserted = await insertRow<Capsule>('time_capsules', payload)
      if (inserted) {
        setCapsules((c) => [{ ...inserted, source: 'supabase' }, ...c])
        setMessage('')
        setTitle('')
        setRevealAt('')
        setSaving(false)
        return
      }
    } catch {
      // ignore and fallback
    }

    try {
      const raw = localStorage.getItem('time-capsules')
      const parsed = raw ? JSON.parse(raw) : []
      const id = 'local-' + Math.random().toString(36).slice(2, 9)
      const newCaps = [
        { id, ...payload, created_at: new Date().toISOString(), source: 'local' },
        ...parsed,
      ]
      localStorage.setItem('time-capsules', JSON.stringify(newCaps))
      setCapsules(newCaps)
      setMessage('')
      setTitle('')
      setRevealAt('')
    } catch {
      setError('Failed to save time capsule')
    }

    setSaving(false)
  }

  const reveal = (c: Capsule) => {
    if (new Date(c.reveal_at) <= new Date()) {
      alert(`Time Capsule: ${c.message}`)
    } else {
      alert('This capsule is still locked until ' + new Date(c.reveal_at).toLocaleString())
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4"
    >
      <div className="flex items-center gap-2 text-[var(--accent-2)] mb-2">
        <Clock3 className="w-5 h-5" />
        <h3 className="font-dancing text-lg">Time Capsule</h3>
      </div>

      <div className="space-y-2 mb-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Capsule title"
          className="w-full p-2 rounded bg-[var(--card-bg)]/60 text-sm"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write a message to the future..."
          className="w-full p-2 rounded h-24 bg-[var(--card-bg)]/60 text-sm"
        />
        <input
          type="datetime-local"
          value={revealAt}
          onChange={(e) => setRevealAt(e.target.value)}
          className="w-full p-2 rounded bg-[var(--card-bg)]/60 text-sm"
        />
        <div className="flex gap-2">
          <button onClick={save} className="glass-button px-4 py-2" disabled={saving}>
            {saving ? 'Saving…' : 'Seal & Save'}
          </button>
          <button
            onClick={fetchCapsules}
            className="px-3 py-2 bg-[var(--card-bg)]/60 rounded text-sm"
          >
            Refresh
          </button>
        </div>
        {error && <div className="text-sm text-[var(--accent-1)]">{error}</div>}
      </div>

      <div className="space-y-2">
        {capsules.length === 0 ? (
          <div className="text-sm opacity-60">No time capsules yet.</div>
        ) : (
          capsules.map((c) => (
            <div
              key={String(c.id ?? `${c.reveal_at}-${c.message}`)}
              className="p-3 rounded border bg-[var(--card-bg)]"
            >
              <div className="font-medium text-sm text-[var(--text-primary)]">
                {c.title || 'A future note'}
              </div>
              <div className="text-xs opacity-70 mt-1">
                Reveal at: {new Date(c.reveal_at).toLocaleString()}
              </div>
              <div className="text-sm mt-1">
                {new Date(c.reveal_at) <= new Date() ? (
                  <span className="font-medium">Unlocked</span>
                ) : (
                  <span className="opacity-60">Locked</span>
                )}
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => reveal(c)}
                  className="glass-button px-3 py-1 text-xs flex items-center gap-1"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Open
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  )
}

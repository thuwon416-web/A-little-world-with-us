'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { BellRing, Plus, Sparkles } from 'lucide-react'

type Notice = {
  id: string
  title: string
  message: string
  pinned: boolean
}

const starterNotices: Notice[] = [
  {
    id: 'n1',
    title: 'Morning thought',
    message: 'You make my whole day feel softer.',
    pinned: true,
  },
  { id: 'n2', title: 'Little reminder', message: 'I am proud of the way you care.', pinned: false },
]

export default function SweetNoticesBoard() {
  const [notices, setNotices] = useState<Notice[]>(starterNotices)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('sweet-notices-board')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length) {
          setNotices(parsed)
        }
      }
    } catch {
      // ignore gracefully
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('sweet-notices-board', JSON.stringify(notices))
  }, [notices])

  const pinnedNotices = useMemo(() => notices.filter((notice) => notice.pinned), [notices])
  const featuredPinnedNotice = pinnedNotices[0] ?? null

  const togglePin = (id: string) => {
    setNotices((current) =>
      current.map((notice) => (notice.id === id ? { ...notice, pinned: !notice.pinned } : notice))
    )
  }

  const addNotice = () => {
    const noticeTitle = title.trim()
    const noticeMessage = message.trim()
    if (!noticeTitle || !noticeMessage) return

    setNotices((current) => [
      ...current,
      { id: `notice-${Date.now()}`, title: noticeTitle, message: noticeMessage, pinned: false },
    ])
    setTitle('')
    setMessage('')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[var(--accent-2)]">
        <BellRing className="h-5 w-5" />
        <h3 className="font-dancing text-2xl">Sweet Notices Board</h3>
      </div>

      <div className="space-y-2">
        {notices.map((notice) => (
          <motion.button
            key={notice.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => togglePin(notice.id)}
            className={`w-full rounded-2xl border p-3 text-left transition ${
              notice.pinned
                ? 'border-[var(--accent-1)]/20 bg-[var(--bg-2)]'
                : 'border-[var(--accent-1)]/20 bg-[var(--card-bg)]/25'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-[var(--text-primary)]">{notice.title}</span>
              <span className="text-[9px] uppercase tracking-[0.18em] text-[var(--text-primary)]/60">
                {notice.pinned ? 'pinned' : 'note'}
              </span>
            </div>
            <p className="mt-1 text-sm text-[var(--text-primary)]/75">{notice.message}</p>
          </motion.button>
        ))}
      </div>

      <div className="space-y-2 rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)]/15 p-3">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Title"
          className="w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/40"
        />
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={2}
          placeholder="Leave a sweet little reminder..."
          className="w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/40"
        />
        <button onClick={addNotice} className="glass-button px-3 py-2 text-sm w-full">
          Add notice
        </button>
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-gradient-to-r from-[var(--accent-2)] to-[var(--accent-1)] p-3 text-sm text-[var(--text-primary)]/80">
        <div className="mb-1 flex items-center gap-2 font-medium text-[var(--accent-2)]">
          <Sparkles className="h-4 w-4" />
          Pinned today
        </div>
        <p>{featuredPinnedNotice ? featuredPinnedNotice.message : 'Pin a note to keep it close.'}</p>
      </div>
    </div>
  )
}

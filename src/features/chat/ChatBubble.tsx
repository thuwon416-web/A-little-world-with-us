'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Reply } from 'lucide-react'

interface ChatBubbleProps {
  text: string
  sender: 'me' | 'her'
  timestamp: string
  mediaType?: 'image' | 'voice' | 'none'
  mediaUrl?: string | null
  replyContext?: string | null
  reactions?: Record<string, number>
  reactionOptions?: string[]
  onReact?: (emoji: string) => void
  onReply?: () => void
  seen?: boolean
}

export default function ChatBubble({
  text,
  sender,
  timestamp,
  mediaType,
  mediaUrl,
  replyContext,
  reactions,
  reactionOptions,
  onReact,
  onReply,
  seen = false,
}: ChatBubbleProps) {
  const isMe = sender === 'me'
  const [display, setDisplay] = useState(text)
  const [revealing, setRevealing] = useState(false)

  useEffect(() => {
    if (!isMe) {
      setDisplay('')
      setRevealing(true)
      let idx = 0
      const chars = text.split('')
      const speed = Math.max(12, 80 - Math.min(60, chars.length))
      const t = setInterval(() => {
        idx++
        setDisplay(chars.slice(0, idx).join(''))
        if (idx >= chars.length) {
          clearInterval(t)
          setRevealing(false)
        }
      }, speed)
      return () => clearInterval(t)
    }

    setDisplay(text)
    setRevealing(false)
  }, [text, isMe])

  return (
    <motion.div
      initial={{ opacity: 0, x: isMe ? 40 : -40, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`mb-4 flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}
    >
      {!isMe && (
        <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-2)] text-[var(--text-primary)] shadow-md">
          <span className="text-xs font-semibold">M</span>
        </div>
      )}

      <div className={`flex max-w-[78%] flex-col ${isMe ? 'items-end' : 'items-start'}`}>
        <span className="mb-1 flex items-center gap-1 px-1 text-[10px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">
          {isMe ? (
            <>
              <Heart className="h-3 w-3 fill-current text-[var(--accent-1)]" />
              Me
            </>
          ) : (
            <>
              <Heart className="h-3 w-3 fill-current text-[var(--accent-2)]" />
              Her
            </>
          )}
        </span>

        <motion.div
          className={`relative break-words rounded-[22px] px-4 py-3 text-sm leading-relaxed shadow-md ${
            isMe
              ? 'rounded-br-none bg-gradient-to-br from-[var(--accent-1)] via-[var(--bg-3)] to-[var(--accent-2)] text-[var(--text-primary)]'
              : 'rounded-bl-none bg-[var(--card-bg-strong)] text-[var(--text-primary)] ring-1 ring-[var(--accent-1)]/20'
          }`}
          initial={{ scale: 0.98 }}
          animate={revealing ? { x: [0, -2, 0] } : { x: 0 }}
          transition={{ duration: 0.45 }}
        >
          {replyContext && (
            <div className="mb-2 max-w-full rounded-lg border border-[var(--accent-1)]/20 bg-[var(--bg-2)]/80 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-[var(--text-secondary)]">
              Replying to: {replyContext}
            </div>
          )}
          {mediaType === 'image' && mediaUrl && (
            <img
              src={mediaUrl}
              alt="Shared media"
              className="mb-2 max-h-60 w-full rounded-xl object-cover"
            />
          )}
          {mediaType === 'voice' && mediaUrl && (
            <div className="mb-2">
              <audio controls src={mediaUrl} className="w-full" />
            </div>
          )}
          <div aria-live="polite">{display}</div>
        </motion.div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="px-1 text-[10px] uppercase tracking-[0.16em] text-[var(--text-secondary)]">
            {timestamp}
          </span>
          {onReply && (
            <button
              type="button"
              onClick={onReply}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-2 py-1 text-[10px] text-[var(--text-secondary)]"
            >
              <Reply className="h-3 w-3" />
              Reply
            </button>
          )}
          {reactionOptions?.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onReact?.(emoji)}
              className="rounded-full border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-2 py-1 text-[10px]"
            >
              {emoji} {reactions?.[emoji] ?? 0}
            </button>
          ))}
          {isMe && seen && (
            <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--text-secondary)]">
              Seen
            </span>
          )}
        </div>
      </div>

      {isMe && (
        <div className="ml-3 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-1)] to-[var(--accent-2)] text-[var(--text-primary)] shadow-md">
          <span className="text-xs font-semibold">A</span>
        </div>
      )}
    </motion.div>
  )
}

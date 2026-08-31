'use client'

import { useState } from 'react'
import { Heart, X } from 'lucide-react'

const REACTIONS = [
  { emoji: '❤️', label: 'Love' },
  { emoji: '😂', label: 'Laugh' },
  { emoji: '👍', label: 'Like' },
  { emoji: '😍', label: 'Love eyes' },
  { emoji: '🥰', label: 'Smile' },
  { emoji: '😘', label: 'Kiss' },
]

interface MessageReactionsProps {
  messageId: string
  onReactionAdd: (emoji: string) => void
  onReactionRemove: (emoji: string) => void
  currentReactions?: string[]
}

export default function MessageReactions({
  _messageId,
  onReactionAdd,
  onReactionRemove,
  currentReactions = [],
}: MessageReactionsProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleReaction = (emoji: string) => {
    if (currentReactions.includes(emoji)) {
      onReactionRemove(emoji)
    } else {
      onReactionAdd(emoji)
    }
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 rounded-full hover:bg-[var(--bg-3)] transition-colors"
        aria-label="Add reaction"
      >
        <Heart className="w-4 h-4 text-[var(--text-secondary)]" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-full left-0 mb-2 bg-[var(--card-bg)] border border-[var(--accent-1)]/20 rounded-full p-2 flex gap-1 shadow-lg z-20">
            {REACTIONS.map((reaction) => (
              <button
                key={reaction.emoji}
                onClick={() => handleReaction(reaction.emoji)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-lg hover:scale-110 transition-transform ${
                  currentReactions.includes(reaction.emoji) ? 'bg-[var(--accent-1)]/20 ring-2 ring-[var(--accent-1)]' : 'hover:bg-[var(--bg-3)]'
                }`}
                title={reaction.label}
              >
                {reaction.emoji}
              </button>
            ))}
          </div>
        </>
      )}

      {currentReactions.length > 0 && (
        <div className="flex gap-1 mt-1 flex-wrap">
          {currentReactions.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onReactionRemove(emoji)}
              className="relative group"
            >
              <span className="text-sm">{emoji}</span>
              <span className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="w-3 h-3 text-red-500" />
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
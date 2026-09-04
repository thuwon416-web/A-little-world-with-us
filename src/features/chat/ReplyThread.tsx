'use client'

import { useState } from 'react'
import { X, Reply as ReplyIcon, Send } from 'lucide-react'

interface Message {
  id: string
  content: string | null
  sender_id: string
  message_type: 'text' | 'voice' | 'photo' | 'sticker' | 'gif' | 'file'
  media_url: string | null
  media_duration: number | null
  encrypted: boolean
  reply_to: string | null
  created_at: string
}

interface ReplyThreadProps {
  message: Message
  currentUserId: string | null
  onReply: (replyData: { text: string; replyTo: string }) => void
  onClose: () => void
}

export default function ReplyThread({ message, currentUserId, onReply, onClose }: ReplyThreadProps) {
  const [replyText, setReplyText] = useState('')

  const handleSendReply = () => {
    if (!replyText.trim()) return

    onReply({
      text: replyText,
      replyTo: message.id,
    })

    setReplyText('')
    onClose()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendReply()
    }
  }

  const getMessagePreview = () => {
    switch (message.message_type) {
      case 'text':
        return message.content || 'Text message'
      case 'voice':
        return '🎤 Voice message'
      case 'photo':
        return '📷 Photo'
      case 'sticker':
        return '😊 Sticker'
      case 'gif':
        return '🎬 GIF'
      case 'file':
        return '📎 File'
      default:
        return 'Message'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[28px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] shadow-[0_20px_40px_rgba(19,10,33,0.28)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--accent-1)]/20 p-4">
          <div className="flex items-center gap-2">
            <ReplyIcon className="h-5 w-5 text-[var(--accent-1)]" />
            <h2 className="text-lg font-serif text-[var(--text-primary)]">Reply to Message</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[var(--text-secondary)] hover:bg-[var(--accent-1)]/10 hover:text-[var(--accent-1)] transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Reply Context */}
          <div className="rounded-xl border-l-4 border-[var(--accent-1)] bg-[var(--accent-1)]/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-[var(--accent-1)]">
                {message.sender_id === currentUserId ? 'You' : 'Partner'}
              </span>
              <span className="text-xs text-[var(--text-secondary)]">
                {new Date(message.created_at).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-sm text-[var(--text-primary)]">{getMessagePreview()}</p>
            {message.content && message.message_type === 'text' && (
              <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">
                {message.content}
              </p>
            )}
          </div>

          {/* Reply Input */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-[var(--text-primary)]">
              Your reply
            </label>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your reply..."
              rows={4}
              className="w-full rounded-xl border-2 border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-1)]/50"
            />
            <p className="text-xs text-[var(--text-secondary)]">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSendReply}
            disabled={!replyText.trim()}
            className="w-full rounded-xl bg-gradient-to-r from-[var(--accent-1)] to-[var(--accent-2)] px-6 py-3 text-base font-medium text-[var(--bg-color)] transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Send className="h-4 w-4" />
            Send Reply
          </button>
        </div>
      </div>
    </div>
  )
}

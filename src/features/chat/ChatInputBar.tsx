'use client'

import { useState } from 'react'
import { FileText, Gift, Image as ImageIcon, MapPin, Mic, Paperclip, Send, Sticker, X, type LucideIcon } from 'lucide-react'

type ChatInputBarProps = {
  onSend: (text: string) => void
  onVoiceRecord: () => void
  onPhotoSelect: () => void
  onStickerSelect: () => void
  onGIFSelect: () => void
  onFileSelect: () => void
  onLocationSend: () => void
  disabled?: boolean
  placeholder?: string
}

export default function ChatInputBar({
  onSend,
  onVoiceRecord,
  onPhotoSelect,
  onStickerSelect,
  onGIFSelect,
  onFileSelect,
  onLocationSend,
  disabled = false,
  placeholder = 'Type a message...',
}: ChatInputBarProps) {
  const [value, setValue] = useState('')
  const [showAttachments, setShowAttachments] = useState(false)
  const canSend = value.trim().length > 0 && !disabled

  const send = () => {
    const text = value.trim()
    if (!text || disabled) return
    onSend(text)
    setValue('')
  }

  const selectAttachment = (callback: () => void) => {
    setShowAttachments(false)
    callback()
  }
  const attachmentOptions: Array<{ label: string; Icon: LucideIcon; callback: () => void }> = [
    { label: 'Photo', Icon: ImageIcon, callback: onPhotoSelect },
    { label: 'Sticker', Icon: Sticker, callback: onStickerSelect },
    { label: 'GIF', Icon: Gift, callback: onGIFSelect },
    { label: 'File', Icon: FileText, callback: onFileSelect },
    { label: 'Location', Icon: MapPin, callback: onLocationSend },
  ]

  return (
    <div className="relative border-t border-[var(--accent-1)]/20 p-4">
      {showAttachments && (
        <div className="absolute bottom-full left-4 z-10 mb-2 w-52 rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-2 shadow-lg">
          <div className="mb-1 flex items-center justify-between px-2 py-1">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Attachments</span>
            <button type="button" onClick={() => setShowAttachments(false)} aria-label="Close attachments">
              <X className="h-4 w-4 text-[var(--text-secondary)]" />
            </button>
          </div>
          {attachmentOptions.map(({ label, Icon, callback }) => (
            <button
              key={label}
              type="button"
              onClick={() => selectAttachment(callback)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--bg-2)]"
            >
              <Icon className="h-4 w-4 text-[var(--accent-1)]" />
              {label}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowAttachments((open) => !open)}
          className="rounded-xl p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-2)]"
          aria-label="Open attachments"
        >
          <Paperclip className="h-5 w-5" />
        </button>
        <input
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              send()
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 rounded-full border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-4 py-2 text-sm text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-1)] disabled:opacity-50"
        />
        <button
          type="button"
          onClick={canSend ? send : onVoiceRecord}
          disabled={disabled}
          className="rounded-xl bg-[var(--button-bg)] p-2 text-[var(--text-primary)] disabled:opacity-50"
          aria-label={canSend ? 'Send message' : 'Record voice message'}
        >
          {canSend ? <Send className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>
      </div>
    </div>
  )
}

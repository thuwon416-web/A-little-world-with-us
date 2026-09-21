'use client'

import { useState } from 'react'
import { Image as ImageIcon, Mic, Music, Paperclip, Smile, Video, X, Reply as ReplyIcon, Send, Edit2, Trash2 } from 'lucide-react'

interface Message {
  id: string
  content: string | null
  sender_id: string
  message_type: 'text' | 'voice' | 'photo' | 'sticker' | 'gif' | 'file' | 'video' | 'audio' | 'location' | 'sos'
  media_url: string | null
  media_duration: number | null
  encrypted: boolean
  reply_to: string | null
  created_at: string
  edited_at: string | null
  deleted_at: string | null
  delivered_at: string | null
  seen_at: string | null
}

interface ReplyThreadProps {
  message: Message
  currentUserId: string | null
  onReply: (replyData: { text: string; replyTo: string }) => void
  onEdit?: (message: Message) => Promise<void>
  onDelete?: (message: Message) => Promise<void>
  onClose: () => void
}

export default function ReplyThread({ message, currentUserId, onReply, onEdit, onDelete, onClose }: ReplyThreadProps) {
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
        return <><Mic className="mr-1 inline h-4 w-4" /> Voice message</>
      case 'photo':
        return <><ImageIcon className="mr-1 inline h-4 w-4" /> Photo</>
      case 'video':
        return <><Video className="mr-1 inline h-4 w-4" /> Video</>
      case 'audio':
        return <><Music className="mr-1 inline h-4 w-4" /> Audio</>
      case 'sticker':
        return <><Smile className="mr-1 inline h-4 w-4" /> Sticker</>
      case 'gif':
        return <><Video className="mr-1 inline h-4 w-4" /> GIF</>
      case 'file':
        return <><Paperclip className="mr-1 inline h-4 w-4" /> File</>
      default:
        return 'Message'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-modal border border-accent-1/20 bg-card shadow-[0_20px_40px_rgba(19,10,33,0.28)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-accent-1/20 p-4">
          <div className="flex items-center gap-2">
            <ReplyIcon className="h-5 w-5 text-accent-1" />
            <h2 className="text-lg font-serif text-text-1">Reply to Message</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-text-2 hover:bg-accent-1/10 hover:text-accent-1 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Reply Context */}
          <div className="rounded-xl border-l-4 border-accent-1 bg-accent-1/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-accent-1">
                {message.sender_id === currentUserId ? 'You' : 'Partner'}
              </span>
              <span className="text-xs text-text-2">
                {new Date(message.created_at).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-sm text-text-1">{getMessagePreview()}</p>
            {message.content && message.message_type === 'text' && (
              <p className="text-sm text-text-2 mt-1 line-clamp-2">
                {message.content}
              </p>
            )}
          </div>

          {/* Reply Input */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-text-1">
              Your reply
            </label>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your reply..."
              rows={4}
              className="w-full rounded-input border-2 border-accent-1/20 bg-card px-4 py-3 text-sm text-text-1 placeholder:text-text-2/50 resize-none focus:outline-none focus:ring-2 focus:ring-accent-1/50"
            />
            <p className="text-xs text-text-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSendReply}
            disabled={!replyText.trim()}
            className="w-full rounded-btn bg-gradient-to-r from-accent-1 to-accent-2 px-6 py-3 text-base font-medium text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Send className="h-4 w-4" />
            Send Reply
          </button>

          {/* Edit/Delete Actions (only for own messages) */}
          {message.sender_id === currentUserId && (
            <div className="flex gap-2 pt-4 border-t border-accent-1/20">
              {message.message_type === 'text' && onEdit && (
                <button
                  type="button"
                  onClick={() => { void onEdit(message) }}
                  className="flex-1 rounded-btn border border-accent-1/30 px-4 py-2 text-sm font-medium text-text-1 hover:bg-accent-1/10 transition flex items-center justify-center gap-2"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => { void onDelete(message) }}
                  className="flex-1 rounded-btn border border-error/30 px-4 py-2 text-sm font-medium text-error hover:bg-error/10 transition flex items-center justify-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

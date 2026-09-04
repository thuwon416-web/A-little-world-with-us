'use client'

import { useState } from 'react'
import { X, Share2, Send, Check } from 'lucide-react'

interface Message {
  id: string
  content: string | null
  message_type: 'text' | 'voice' | 'photo' | 'sticker' | 'gif' | 'file'
  media_url: string | null
  sender_id: string
  media_duration: number | null
  encrypted: boolean
  reply_to: string | null
  created_at: string
}

interface Contact {
  id: string
  name: string
  avatar: string | null
}

interface ForwardMessageProps {
  message: Message
  contacts: Contact[]
  onForward: (forwardData: { to: string; message: Message; caption: string }) => void
  onClose: () => void
}

export default function ForwardMessage({ message, contacts, onForward, onClose }: ForwardMessageProps) {
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [caption, setCaption] = useState('')

  const toggleContact = (contactId: string) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId]
    )
  }

  const handleForward = () => {
    if (selectedContacts.length === 0) return

    selectedContacts.forEach((contactId) => {
      onForward({
        to: contactId,
        message,
        caption,
      })
    })

    setSelectedContacts([])
    setCaption('')
    onClose()
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
      <div className="w-full max-w-md max-h-[80vh] rounded-[28px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] shadow-[0_20px_40px_rgba(19,10,33,0.28)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--accent-1)]/20 p-4">
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-[var(--accent-1)]" />
            <h2 className="text-lg font-serif text-[var(--text-primary)]">Forward Message</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[var(--text-secondary)] hover:bg-[var(--accent-1)]/10 hover:text-[var(--accent-1)] transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Message Preview */}
          <div className="rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] p-4">
            <p className="text-xs text-[var(--text-secondary)] mb-2">Message to forward:</p>
            <p className="text-sm text-[var(--text-primary)]">{getMessagePreview()}</p>
            {message.content && message.message_type === 'text' && (
              <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">
                {message.content}
              </p>
            )}
          </div>

          {/* Contacts List */}
          <div>
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">Select recipients:</h3>
            <div className="space-y-2">
              {contacts.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)] text-center py-4">
                  No contacts available
                </p>
              ) : (
                contacts.map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => toggleContact(contact.id)}
                    className={`w-full p-3 rounded-xl flex items-center gap-3 transition ${
                      selectedContacts.includes(contact.id)
                        ? 'bg-[var(--accent-1)]/10 border-2 border-[var(--accent-1)]'
                        : 'bg-[var(--card-bg-strong)] border-2 border-[var(--accent-1)]/20 hover:border-[var(--accent-1)]/40'
                    }`}
                  >
                    <div className="relative">
                      {contact.avatar ? (
                        <img
                          src={contact.avatar}
                          alt={contact.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[var(--accent-1)]/20 flex items-center justify-center">
                          <span className="text-[var(--accent-1)] font-medium">
                            {contact.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      {selectedContacts.includes(contact.id) && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[var(--accent-1)] flex items-center justify-center">
                          <Check className="h-3 w-3 text-[var(--bg-color)]" />
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-medium text-[var(--text-primary)]">{contact.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Caption */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Add a caption (optional)
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a message..."
              rows={2}
              className="w-full rounded-xl border-2 border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-1)]/50"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--accent-1)]/20 p-4">
          <button
            type="button"
            onClick={handleForward}
            disabled={selectedContacts.length === 0}
            className="w-full rounded-xl bg-gradient-to-r from-[var(--accent-1)] to-[var(--accent-2)] px-6 py-3 text-base font-medium text-[var(--bg-color)] transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Send className="h-4 w-4" />
            Forward to {selectedContacts.length} contact{selectedContacts.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  )
}

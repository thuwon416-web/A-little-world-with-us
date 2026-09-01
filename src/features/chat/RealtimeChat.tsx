'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Mic, Image as ImageIcon } from 'lucide-react'
import { supabase, insertRow } from '@/lib/supabase'
import { getCoupleStatus } from '@/lib/couples'
import { encryptMessage, decryptMessage, deriveChatKey } from '@/lib/chatEncryption'
import VoiceMessageRecorder from './VoiceMessageRecorder'
import PhotoShare from './PhotoShare'

interface Message {
  id: string
  sender_id: string
  content: string | null
  message_type: 'text' | 'voice' | 'photo'
  media_url: string | null
  media_duration: number | null
  encrypted: boolean
  created_at: string
}

export default function RealtimeChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)
  const [showPhotoShare, setShowPhotoShare] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadCoupleAndMessages()
  }, [])

  const loadCoupleAndMessages = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setCurrentUserId(user.id)

    const { couple } = await getCoupleStatus()
    if (!couple) return

    setCoupleId(couple.id)

    // Load messages
    const { data: loadedMessages } = await supabase
      .from('messages')
      .select('*')
      .eq('couple_id', couple.id)
      .order('created_at', { ascending: true })

    // Decrypt encrypted messages
    const chatKey = await deriveChatKey(couple.id)
    const decryptedMessages = await Promise.all(
      (loadedMessages || []).map(async (msg: any) => {
        if (msg.encrypted && msg.content) {
          try {
            const decrypted = await decryptMessage(msg.content, chatKey)
            return { ...msg, content: decrypted }
          } catch {
            return msg
          }
        }
        return msg
      })
    )

    setMessages(decryptedMessages)

    // Subscribe to real-time updates
    const channel = supabase
      .channel('chat')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `couple_id=eq.${couple.id}`,
        },
        async (payload) => {
          const newMessage = payload.new as Message

          // Decrypt if encrypted
          if (newMessage.encrypted && newMessage.content) {
            try {
              const decrypted = await decryptMessage(newMessage.content, chatKey)
              setMessages((prev) => [...prev, { ...newMessage, content: decrypted }])
            } catch {
              setMessages((prev) => [...prev, newMessage])
            }
          } else {
            setMessages((prev) => [...prev, newMessage])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || !coupleId || !currentUserId) return

    // Encrypt message
    const chatKey = await deriveChatKey(coupleId)
    const encryptedContent = await encryptMessage(input.trim(), chatKey)

    await insertRow('messages', {
      couple_id: coupleId,
      sender_id: currentUserId,
      content: encryptedContent,
      message_type: 'text',
      encrypted: true,
    })

    setInput('')
  }

  const handleVoiceMessage = async (recording: { blob: Blob; duration: number }) => {
    if (!coupleId || !currentUserId) return

    // Create message first
    const message = await insertRow<{ id: string }>('messages', {
      couple_id: coupleId,
      sender_id: currentUserId,
      message_type: 'voice',
      media_duration: recording.duration,
      encrypted: false,
    })

    if (!message) return

    // Upload voice recording
    const { uploadVoiceRecording } = await import('@/lib/voiceRecorder')
    const mediaUrl = await uploadVoiceRecording(recording.blob, coupleId, message.id)

    // Update message with media URL
    await supabase.from('messages').update({ media_url: mediaUrl }).eq('id', message.id)
  }

  const handlePhotoMessage = async (file: File) => {
    if (!coupleId || !currentUserId) return

    // Compress image
    const { compressImage } = await import('@/lib/imageCompressor')
    const compressed = await compressImage(file)

    // Create message first
    const message = await insertRow<{ id: string }>('messages', {
      couple_id: coupleId,
      sender_id: currentUserId,
      message_type: 'photo',
      encrypted: false,
    })

    if (!message) return

    // Upload photo
    const { uploadChatPhoto } = await import('@/lib/imageCompressor')
    const mediaUrl = await uploadChatPhoto(compressed.blob, coupleId, message.id)

    // Update message with media URL
    await supabase.from('messages').update({ media_url: mediaUrl }).eq('id', message.id)
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!coupleId) {
    return (
      <div className="flex items-center justify-center h-[600px] glass-card">
        <p className="text-[var(--text-secondary)]">
          Link with your partner to start chatting
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[600px] glass-card">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                message.sender_id === currentUserId
                  ? 'bg-[var(--button-bg)] text-[var(--text-primary)]'
                  : 'bg-[var(--bg-2)] text-[var(--text-primary)]'
              }`}
            >
              {message.message_type === 'text' && <p className="text-sm">{message.content}</p>}
              {message.message_type === 'voice' && message.media_url && (
                <audio controls src={message.media_url} className="h-8" />
              )}
              {message.message_type === 'photo' && message.media_url && (
                <img src={message.media_url} alt="Chat photo" className="rounded-lg max-w-full" />
              )}
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                {new Date(message.created_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[var(--accent-1)]/20 p-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowVoiceRecorder(true)}
            className="p-2 rounded-xl hover:bg-[var(--bg-2)] text-[var(--text-secondary)]"
          >
            <Mic className="h-5 w-5" />
          </button>
          <button
            onClick={() => setShowPhotoShare(true)}
            className="p-2 rounded-xl hover:bg-[var(--bg-2)] text-[var(--text-secondary)]"
          >
            <ImageIcon className="h-5 w-5" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 rounded-xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-4 py-2 text-sm text-[var(--text-primary)]"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-2 rounded-xl bg-[var(--button-bg)] text-[var(--text-primary)] disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Modals */}
      {showVoiceRecorder && (
        <VoiceMessageRecorder
          onClose={() => setShowVoiceRecorder(false)}
          onRecord={handleVoiceMessage}
        />
      )}
      {showPhotoShare && (
        <PhotoShare
          onClose={() => setShowPhotoShare(false)}
          onPhotoSelect={handlePhotoMessage}
        />
      )}
    </div>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Mic, Image as ImageIcon, Sticker, Gift, Paperclip, Reply as ReplyIcon, Share2 } from 'lucide-react'
import { supabase, insertRow } from '@/lib/supabase'
import { getCoupleStatus } from '@/lib/couples'
import { encryptMessage, decryptMessage, deriveChatKey } from '@/lib/chatEncryption'
import VoiceMessageRecorder from './VoiceMessageRecorder'
import PhotoShare from './PhotoShare'
import StickerPicker from './StickerPicker'
import GIFPicker from './GIFPicker'
import FileUpload from './FileUpload'
import ReplyThread from './ReplyThread'
import ForwardMessage from './ForwardMessage'

interface Message {
  id: string
  sender_id: string
  content: string | null
  message_type: 'text' | 'voice' | 'photo' | 'sticker' | 'gif' | 'file'
  media_url: string | null
  media_duration: number | null
  encrypted: boolean
  reply_to: string | null
  created_at: string
}

export default function RealtimeChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)
  const [showPhotoShare, setShowPhotoShare] = useState(false)
  const [showStickerPicker, setShowStickerPicker] = useState(false)
  const [showGIFPicker, setShowGIFPicker] = useState(false)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [showReplyThread, setShowReplyThread] = useState(false)
  const [showForwardMessage, setShowForwardMessage] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
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

    const { data: loadedMessages } = await supabase
      .from('messages')
      .select('*')
      .eq('couple_id', couple.id)
      .order('created_at', { ascending: true })

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

    const message = await insertRow<{ id: string }>('messages', {
      couple_id: coupleId,
      sender_id: currentUserId,
      message_type: 'voice',
      media_duration: recording.duration,
      encrypted: false,
    })

    if (!message) return

    const { uploadVoiceRecording } = await import('@/lib/voiceRecorder')
    const mediaUrl = await uploadVoiceRecording(recording.blob, coupleId, message.id)

    await supabase.from('messages').update({ media_url: mediaUrl }).eq('id', message.id)
  }

  const handlePhotoMessage = async (file: File) => {
    if (!coupleId || !currentUserId) return

    const { compressImage } = await import('@/lib/imageCompressor')
    const compressed = await compressImage(file)

    const message = await insertRow<{ id: string }>('messages', {
      couple_id: coupleId,
      sender_id: currentUserId,
      message_type: 'photo',
      encrypted: false,
    })

    if (!message) return

    const { uploadChatPhoto } = await import('@/lib/imageCompressor')
    const mediaUrl = await uploadChatPhoto(compressed.blob, coupleId, message.id)

    await supabase.from('messages').update({ media_url: mediaUrl }).eq('id', message.id)
  }

  const handleStickerSelect = async (sticker: any) => {
    if (!coupleId || !currentUserId) return

    await insertRow('messages', {
      couple_id: coupleId,
      sender_id: currentUserId,
      content: sticker.emoji,
      message_type: 'sticker',
      encrypted: false,
    })

    setShowStickerPicker(false)
  }

  const handleGIFSelect = async (gif: any) => {
    if (!coupleId || !currentUserId) return

    const message = await insertRow<{ id: string }>('messages', {
      couple_id: coupleId,
      sender_id: currentUserId,
      message_type: 'gif',
      encrypted: false,
    })

    if (!message) return

    await supabase.from('messages').update({ media_url: gif.url }).eq('id', message.id)

    setShowGIFPicker(false)
  }

  const handleFileUpload = async (fileData: { url: string; type: string; name: string; size: number }) => {
    if (!coupleId || !currentUserId) return

    const message = await insertRow<{ id: string }>('messages', {
      couple_id: coupleId,
      sender_id: currentUserId,
      content: fileData.name,
      message_type: 'file',
      encrypted: false,
    })

    if (!message) return

    await supabase.from('messages').update({ media_url: fileData.url }).eq('id', message.id)

    setShowFileUpload(false)
  }

  const handleReply = async (replyData: { text: string; replyTo: string }) => {
    if (!coupleId || !currentUserId) return

    const chatKey = await deriveChatKey(coupleId)
    const encryptedContent = await encryptMessage(replyData.text, chatKey)

    await insertRow('messages', {
      couple_id: coupleId,
      sender_id: currentUserId,
      content: encryptedContent,
      message_type: 'text',
      reply_to: replyData.replyTo,
      encrypted: true,
    })
  }

  const handleForward = (forwardData: { to: string; message: Message; caption: string }) => {
    console.log('Forwarding message:', forwardData)
    setShowForwardMessage(false)
  }

  const handleMessageLongPress = (message: Message) => {
    setSelectedMessage(message)
    setShowReplyThread(true)
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
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => {
          const replyToMessage = message.reply_to ? messages.find((m) => m.id === message.reply_to) : null

          return (
            <div
              key={message.id}
              className={`flex ${message.sender_id === currentUserId ? 'justify-end' : 'justify-start'} group`}
            >
              <div className="flex flex-col gap-1">
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    message.sender_id === currentUserId
                      ? 'bg-[var(--button-bg)] text-[var(--text-primary)]'
                      : 'bg-[var(--bg-2)] text-[var(--text-primary)]'
                  }`}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    handleMessageLongPress(message)
                  }}
                >
                  {replyToMessage && (
                    <div className="mb-2 pb-2 border-b border-[var(--accent-1)]/20">
                      <p className="text-xs text-[var(--text-secondary)] mb-1">
                        Replying to {replyToMessage.sender_id === currentUserId ? 'yourself' : 'partner'}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)] line-clamp-1">
                        {replyToMessage.message_type === 'text' ? replyToMessage.content : 'Message'}
                      </p>
                    </div>
                  )}

                  {message.message_type === 'text' && <p className="text-sm">{message.content}</p>}
                  {message.message_type === 'voice' && message.media_url && (
                    <audio controls src={message.media_url} className="h-8" />
                  )}
                  {message.message_type === 'photo' && message.media_url && (
                    <img src={message.media_url} alt="Chat photo" className="rounded-lg max-w-full" />
                  )}
                  {message.message_type === 'sticker' && (
                    <span className="text-4xl">{message.content}</span>
                  )}
                  {message.message_type === 'gif' && message.media_url && (
                    <img src={message.media_url} alt="GIF" className="rounded-lg max-w-full" />
                  )}
                  {message.message_type === 'file' && (
                    <div className="flex items-center gap-2">
                      <Paperclip className="h-4 w-4" />
                      <span className="text-sm">{message.content}</span>
                    </div>
                  )}
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    {new Date(message.created_at).toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMessage(message)
                      setShowReplyThread(true)
                    }}
                    className="p-1 rounded-full bg-[var(--accent-1)]/10 hover:bg-[var(--accent-1)]/20 text-[var(--accent-1)]"
                  >
                    <ReplyIcon className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMessage(message)
                      setShowForwardMessage(true)
                    }}
                    className="p-1 rounded-full bg-[var(--accent-1)]/10 hover:bg-[var(--accent-1)]/20 text-[var(--accent-1)]"
                  >
                    <Share2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

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
          <button
            onClick={() => setShowStickerPicker(true)}
            className="p-2 rounded-xl hover:bg-[var(--bg-2)] text-[var(--text-secondary)]"
          >
            <Sticker className="h-5 w-5" />
          </button>
          <button
            onClick={() => setShowGIFPicker(true)}
            className="p-2 rounded-xl hover:bg-[var(--bg-2)] text-[var(--text-secondary)]"
          >
            <Gift className="h-5 w-5" />
          </button>
          <button
            onClick={() => setShowFileUpload(true)}
            className="p-2 rounded-xl hover:bg-[var(--bg-2)] text-[var(--text-secondary)]"
          >
            <Paperclip className="h-5 w-5" />
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
      {showStickerPicker && (
        <StickerPicker
          onStickerSelect={handleStickerSelect}
          onClose={() => setShowStickerPicker(false)}
        />
      )}
      {showGIFPicker && (
        <GIFPicker
          onGIFSelect={handleGIFSelect}
          onClose={() => setShowGIFPicker(false)}
        />
      )}
      {showFileUpload && (
        <FileUpload
          onFileUpload={handleFileUpload}
          onClose={() => setShowFileUpload(false)}
        />
      )}
      {showReplyThread && selectedMessage && (
        <ReplyThread
          message={selectedMessage}
          currentUserId={currentUserId}
          onReply={handleReply}
          onClose={() => {
            setShowReplyThread(false)
            setSelectedMessage(null)
          }}
        />
      )}
      {showForwardMessage && selectedMessage && (
        <ForwardMessage
          message={selectedMessage}
          contacts={[]}
          onForward={handleForward}
          onClose={() => {
            setShowForwardMessage(false)
            setSelectedMessage(null)
          }}
        />
      )}
    </div>
  )
}

'use client'
/* eslint-disable @next/next/no-img-element -- Chat attachments use user-provided URLs and GIF media. */

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { Send, Mic, Image as ImageIcon, Sticker, Gift, Paperclip, Reply as ReplyIcon, MapPin, Captions, Sparkles, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getCoupleStatus } from '@/lib/couples'
import { encryptMessage, decryptMessage, deriveChatKey } from '@/lib/chatEncryption'
import { resolveChatMediaUrl } from '@/lib/chatMedia'
import { detectContextKeywords } from '@/features/ai-guardian/context/detector'

const VoiceMessageRecorder = dynamic(() => import('./VoiceMessageRecorder'), { ssr: false })
const PhotoShare = dynamic(() => import('./PhotoShare'), { ssr: false })
const StickerPicker = dynamic(() => import('./StickerPicker'), { ssr: false })
const GIFPicker = dynamic(() => import('./GIFPicker'), { ssr: false })
const FileUpload = dynamic(() => import('./FileUpload'), { ssr: false })
const ReplyThread = dynamic(() => import('./ReplyThread'), { ssr: false })

interface Message {
  id: string
  sender_id: string
  content: string | null
  message_type: 'text' | 'voice' | 'photo' | 'sticker' | 'gif' | 'file' | 'video' | 'audio' | 'location' | 'sos'
  media_url: string | null
  media_duration: number | null
  encrypted: boolean
  reply_to: string | null
  created_at: string
  location_payload?: { latitude: number; longitude: number; accuracy?: number; label?: string } | null
  transcript?: string | null
}

type StickerSelection = { emoji: string }
type GifSelection = { url: string }

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
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [contextCount, setContextCount] = useState(0)
  const [contexts, setContexts] = useState<Array<{ id: string; category: string; sender_role: string; matched_keywords: string[] }>>([])
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [aiResponse, setAiResponse] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let dispose: (() => void) | undefined
    void loadCoupleAndMessages()
      .then((cleanup) => { dispose = cleanup })
      .catch((error) => {
        console.error('Unable to initialize chat:', error)
        setLoadError(error instanceof Error ? error.message : 'Unable to load chat.')
      })
    return () => dispose?.()
  // This loader is intentionally run once to establish the realtime subscription.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadCoupleAndMessages = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setCurrentUserId(user.id)

    const { couple } = await getCoupleStatus()
    if (!couple) return

    setCoupleId(couple.id)
    const { data: contextRows, count } = await supabase.from('ai_context_memory').select('id,category,sender_role,matched_keywords', { count: 'exact' }).eq('user_id', user.id).is('processed_at', null).gte('expires_at', new Date().toISOString())
    setContextCount(count ?? 0)
    setContexts((contextRows ?? []) as typeof contexts)

    const { data: loadedMessages } = await supabase
      .from('messages')
      .select('*')
      .eq('couple_id', couple.id)
      .order('created_at', { ascending: true })

    const chatKey = await deriveChatKey(couple.id)
    const decryptedMessages = await Promise.all(
      (loadedMessages || []).map(async (msg: Message) => {
        let mediaUrl = msg.media_url
        try {
          mediaUrl = msg.message_type === 'voice'
            ? await resolveChatMediaUrl(msg.media_url, 'voice')
            : msg.message_type === 'photo'
              ? await resolveChatMediaUrl(msg.media_url, 'photo')
              : msg.media_url
        } catch {
          mediaUrl = null
        }
        if (msg.encrypted && msg.content) {
          try {
            const decrypted = await decryptMessage(msg.content, chatKey)
            return { ...msg, content: decrypted, media_url: mediaUrl }
          } catch {
            return { ...msg, media_url: mediaUrl }
          }
        }
        return { ...msg, media_url: mediaUrl }
      })
    )

    setMessages(Array.from(new Map(decryptedMessages.map((message) => [message.id, message])).values()))

    const channel = supabase
      .channel(`chat-${couple.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `couple_id=eq.${couple.id}`,
        },
        async (payload) => {
          const rawMessage = payload.new as Message
          let mediaUrl = rawMessage.media_url
          try {
            mediaUrl = rawMessage.message_type === 'voice'
              ? await resolveChatMediaUrl(rawMessage.media_url, 'voice')
              : rawMessage.message_type === 'photo'
                ? await resolveChatMediaUrl(rawMessage.media_url, 'photo')
                : rawMessage.media_url
          } catch {
            mediaUrl = null
          }
          const newMessage = { ...rawMessage, media_url: mediaUrl }

          if (newMessage.encrypted && newMessage.content) {
            try {
              const decrypted = await decryptMessage(newMessage.content, chatKey)
              setMessages((prev) => prev.some((message) => message.id === newMessage.id)
                ? prev.map((message) => message.id === newMessage.id ? { ...message, ...newMessage, content: decrypted } : message)
                : [...prev, { ...newMessage, content: decrypted }])
            } catch {
              setMessages((prev) => prev.some((message) => message.id === newMessage.id) ? prev : [...prev, newMessage])
            }
          } else {
            setMessages((prev) => prev.some((message) => message.id === newMessage.id) ? prev : [...prev, newMessage])
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `couple_id=eq.${couple.id}`,
        },
        async (payload) => {
          const rawMessage = payload.new as Message
          let mediaUrl = rawMessage.media_url
          try {
            mediaUrl = rawMessage.message_type === 'voice'
              ? await resolveChatMediaUrl(rawMessage.media_url, 'voice')
              : rawMessage.message_type === 'photo'
                ? await resolveChatMediaUrl(rawMessage.media_url, 'photo')
                : rawMessage.media_url
          } catch {
            mediaUrl = null
          }
          setMessages((current) => current.map((message) => message.id === rawMessage.id ? { ...message, ...rawMessage, media_url: mediaUrl } : message))
        }
      )
      .subscribe((status) => {
        if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR' || status === 'CLOSED') {
          window.setTimeout(() => {
            void channel.subscribe()
          }, 1000)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || !coupleId || !currentUserId) return

    const messageText = input.trim()
    const chatKey = await deriveChatKey(coupleId)
    const encryptedContent = await encryptMessage(messageText, chatKey)

    const { data: savedMessage, error } = await supabase.from('messages').insert({
      couple_id: coupleId,
      sender_id: currentUserId,
      content: encryptedContent,
      message_type: 'text',
      encrypted: true,
    }).select('id').single()

    if (error || !savedMessage) {
      console.error('Error sending message:', error)
      return
    }

    const detected = detectContextKeywords(messageText)
    if (detected.length) {
      const senderRole = 'her'
      await supabase.from('ai_context_memory').insert(detected.map((item) => ({
        user_id: currentUserId,
        couple_id: coupleId,
        source_message_id: savedMessage.id,
        category: item.category,
        sender_role: senderRole,
        context_text: encryptedContent,
        matched_keywords: item.matchedKeywords,
      })))
      setContextCount((count) => count + detected.length)
    }
    setInput('')
  }

  const askGuardian = async () => {
    setAiLoading(true)
    try {
      const response = await fetch('/api/ai/guardian', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Please review my recent context and give me a gentle, practical suggestion.' }),
      })
      const payload = await response.json() as { response?: string; error?: string }
      if (!response.ok) throw new Error(payload.error ?? 'AI Guardian is unavailable.')
      setAiResponse(payload.response ?? '')
      setContextCount(0)
    } catch (error) {
      setAiResponse(error instanceof Error ? error.message : 'AI Guardian is unavailable.')
    } finally {
      setAiLoading(false)
    }

  }

  const deleteContext = async (id: string) => {
    await supabase.from('ai_context_memory').delete().eq('id', id).eq('user_id', currentUserId)
    setContexts((items) => items.filter((item) => item.id !== id))
    setContextCount((count) => Math.max(0, count - 1))
  }

  const handleSendLocation = () => {
    if (!coupleId || !currentUserId || !navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude
        const longitude = position.coords.longitude
        const accuracy = Math.round(position.coords.accuracy)

        const { error } = await supabase.from('messages').insert({
          couple_id: coupleId,
          sender_id: currentUserId,
          content: `Location pin · ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
          message_type: 'location',
          location_payload: { latitude, longitude, accuracy },
          encrypted: false,
        })

        if (error) {
          console.error('Error sending location:', error)
        }
      },
      () => alert('Location permission is required to send a location pin.'),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    )
  }

  const handleVoiceMessage = async (recording: { blob: Blob; duration: number }) => {
    if (!coupleId || !currentUserId) return

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        couple_id: coupleId,
        sender_id: currentUserId,
        message_type: 'voice',
        media_duration: recording.duration,
        encrypted: false,
      })
      .select()
      .single()

    if (error || !message) return

    const { uploadVoiceRecording } = await import('@/lib/voiceRecorder')
    const mediaUrl = await uploadVoiceRecording(recording.blob, coupleId, message.id)

    await supabase.from('messages').update({ media_url: mediaUrl }).eq('id', message.id)
  }

  const handleTranscribe = async (message: Message) => {
    if (!message.media_url || !message.id) return
    try {
      const media = await fetch(message.media_url)
      if (!media.ok) throw new Error('Unable to read this voice message.')
      const blob = await media.blob()
      const form = new FormData()
      form.set('audio', new File([blob], 'voice-message.webm', { type: blob.type || 'audio/webm' }))
      form.set('messageId', message.id)
      const response = await fetch('/api/ai/transcribe', { method: 'POST', body: form })
      const data = await response.json() as { transcript?: string; error?: string }
      if (!response.ok || !data.transcript) throw new Error(data.error ?? 'Unable to transcribe this voice message.')
      setMessages((current) => current.map((item) => item.id === message.id ? { ...item, transcript: data.transcript ?? null } : item))
    } catch (caught) {
      window.alert(caught instanceof Error ? caught.message : 'Unable to transcribe this voice message.')
    }
  }

  const handlePhotoMessage = async (file: File) => {
    if (!coupleId || !currentUserId) return

    const { compressImage } = await import('@/lib/imageCompressor')
    const compressed = await compressImage(file)

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        couple_id: coupleId,
        sender_id: currentUserId,
        message_type: 'photo',
        encrypted: false,
      })
      .select()
      .single()

    if (error || !message) return

    const { uploadChatPhoto } = await import('@/lib/imageCompressor')
    const mediaUrl = await uploadChatPhoto(compressed.blob, coupleId, message.id)

    await supabase.from('messages').update({ media_url: mediaUrl }).eq('id', message.id)
  }

  const handleStickerSelect = async (sticker: StickerSelection) => {
    if (!coupleId || !currentUserId) return

    const { error } = await supabase.from('messages').insert({
      couple_id: coupleId,
      sender_id: currentUserId,
      content: sticker.emoji,
      message_type: 'sticker',
      encrypted: false,
    })

    if (error) {
      console.error('Error sending sticker:', error)
      return
    }

    setShowStickerPicker(false)
  }

  const handleGIFSelect = async (gif: GifSelection) => {
    if (!coupleId || !currentUserId) return

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        couple_id: coupleId,
        sender_id: currentUserId,
        message_type: 'gif',
        encrypted: false,
      })
      .select()
      .single()

    if (error || !message) return

    await supabase.from('messages').update({ media_url: gif.url }).eq('id', message.id)

    setShowGIFPicker(false)
  }

  const handleFileUpload = async (fileInfo: {
    url: string
    type: string
    name: string
    size: number
    path?: string
  }) => {
    try {
      if (!coupleId || !currentUserId) return

      // Determine message type
      let messageType: 'photo' | 'video' | 'audio' | 'file' = 'file'
      if (fileInfo.type.startsWith('image/')) messageType = 'photo'
      else if (fileInfo.type.startsWith('video/')) messageType = 'video'
      else if (fileInfo.type.startsWith('audio/')) messageType = 'audio'

      const { error } = await supabase.from('messages').insert({
        couple_id: coupleId,
        sender_id: currentUserId,
        content: fileInfo.name,
        media_url: fileInfo.url,
        message_type: messageType,
        encrypted: false,
      })

      if (error) throw error

      setShowFileUpload(false)

    } catch (error) {
      console.error('Error sending file message:', error)
      alert('Failed to send file. Please try again.')
    }
  }

  const handleReply = async (replyData: { text: string; replyTo: string }) => {
    if (!coupleId || !currentUserId) return

    const chatKey = await deriveChatKey(coupleId)
    const encryptedContent = await encryptMessage(replyData.text, chatKey)

    const { error } = await supabase.from('messages').insert({
      couple_id: coupleId,
      sender_id: currentUserId,
      content: encryptedContent,
      message_type: 'text',
      reply_to: replyData.replyTo,
      encrypted: true,
    })

    if (error) {
      console.error('Error sending reply:', error)
    }
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
      <header className="flex items-center gap-3 border-b border-[var(--accent-1)]/20 bg-[var(--card-bg)] px-4 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#8774E1] text-lg text-white">♥</div>
        <div><p className="font-semibold text-[var(--text-primary)]">Your love</p><p className="text-xs text-emerald-400">Online</p></div>
        <button type="button" onClick={() => setShowAIPanel((open) => !open)} className="ml-auto inline-flex items-center gap-1 rounded-full border border-[var(--accent-1)]/20 px-3 py-1.5 text-xs text-[var(--text-primary)]" aria-label="Open AI Guardian">
          <Sparkles className="h-3.5 w-3.5" /> AI {contextCount > 0 ? `•${contextCount}` : ''}
        </button>
      </header>
      {loadError && <div role="alert" className="border-b border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">{loadError}</div>}
      {showAIPanel && <section className="border-b border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] p-4">
        <div className="flex items-center justify-between"><p className="text-sm font-semibold text-[var(--text-primary)]">AI Guardian context</p><button type="button" onClick={() => setShowAIPanel(false)} aria-label="Close AI Guardian"><X className="h-4 w-4 text-[var(--text-secondary)]" /></button></div>
        <p className="mt-2 text-xs text-[var(--text-secondary)]">{contextCount ? `${contextCount} unprocessed context hint${contextCount === 1 ? '' : 's'} detected.` : 'No unprocessed context hints.'}</p>
        {contexts.length > 0 && <ul className="mt-3 space-y-2">{contexts.map((context) => <li key={context.id} className="flex items-center justify-between rounded-lg bg-[var(--card-bg)] px-3 py-2 text-xs text-[var(--text-primary)]"><span>{context.category} · {context.sender_role}</span><button type="button" onClick={() => void deleteContext(context.id)} className="text-[var(--text-secondary)] underline">Delete</button></li>)}</ul>}
        <button type="button" onClick={() => void askGuardian()} disabled={aiLoading || contextCount === 0} className="mt-3 rounded-full bg-[#8774E1] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{aiLoading ? 'Thinking...' : 'Ask AI'}</button>
        {aiResponse && <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-primary)]">{aiResponse}</p>}
      </section>}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? <div className="flex h-full items-center justify-center text-center text-[var(--text-secondary)]"><p>Say hello to your love ❤️</p></div> : messages.map((message) => {
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
                      ? 'rounded-[18px] rounded-br-[4px] bg-[#8774E1] text-white'
                      : 'rounded-[18px] rounded-bl-[4px] bg-[#181818] text-white'
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
                    <div className="space-y-2"><audio controls src={message.media_url} className="h-8 max-w-full" /><button type="button" onClick={() => void handleTranscribe(message)} className="inline-flex items-center gap-1 text-xs text-[var(--accent-2)] hover:underline"><Captions className="h-3.5 w-3.5" />{message.transcript ? 'Refresh transcript' : 'Transcribe'}</button>{message.transcript ? <p className="rounded-lg bg-black/10 p-2 text-xs leading-relaxed text-[var(--text-secondary)]">{message.transcript}</p> : null}</div>
                  )}
                  {message.message_type === 'photo' && message.media_url && (
                    <Image
                      src={message.media_url}
                      alt="Chat photo"
                      width={640}
                      height={480}
                      unoptimized
                      className="max-w-full rounded-lg"
                    />
                  )}
                  {message.message_type === 'video' && message.media_url && (
                    <video controls src={message.media_url} className="rounded-lg max-w-full" />
                  )}
                  {message.message_type === 'audio' && message.media_url && (
                    <audio controls src={message.media_url} className="h-8" />
                  )}
                  {message.message_type === 'sticker' && (
                    <span className="text-4xl">{message.content}</span>
                  )}
                  {message.message_type === 'gif' && message.media_url && (
                    <Image
                      src={message.media_url}
                      alt="GIF"
                      width={480}
                      height={480}
                      unoptimized
                      className="max-w-full rounded-lg"
                    />
                  )}
                  {message.message_type === 'file' && (
                    <div className="flex items-center gap-2">
                      <Paperclip className="h-4 w-4" />
                      <span className="text-sm">{message.content}</span>
                    </div>
                  )}
                  {message.message_type === 'location' && message.location_payload && (
                    <a href={`https://www.google.com/maps?q=${message.location_payload.latitude},${message.location_payload.longitude}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl bg-[var(--bg-3)] p-3 text-sm hover:bg-[var(--accent-1)]/10"><MapPin className="h-5 w-5 text-[var(--accent-1)]" /><span><strong>Shared location</strong><br />{message.location_payload.latitude.toFixed(5)}, {message.location_payload.longitude.toFixed(5)} · ±{Math.round(message.location_payload.accuracy ?? 0)}m</span></a>
                  )}
                  {message.message_type === 'sos' && message.location_payload && (
                    <a href={`https://www.google.com/maps?q=${message.location_payload.latitude},${message.location_payload.longitude}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl border border-red-400/40 bg-red-500/15 p-3 text-sm text-red-100 hover:bg-red-500/25"><MapPin className="h-5 w-5 text-red-300" /><span><strong>🆘 Emergency SOS</strong><br />Open the sender’s current location.</span></a>
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
          <button type="button" onClick={handleSendLocation} className="p-2 rounded-xl hover:bg-[var(--bg-2)] text-[var(--text-secondary)]" aria-label="Send current location"><MapPin className="h-5 w-5" /></button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 rounded-full border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-4 py-2 text-sm text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8774E1]"
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
    </div>
  )
}

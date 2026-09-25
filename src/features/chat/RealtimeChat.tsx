'use client'
/* eslint-disable @next/next/no-img-element -- Chat attachments use user-provided URLs and GIF media. */

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { Heart, Paperclip, Reply as ReplyIcon, MapPin, Captions, Sparkles, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getCoupleStatus } from '@/lib/couples'
import { encryptMessage, decryptMessage, deriveChatKey } from '@/lib/chatEncryption'
import { resolveChatMediaUrl } from '@/lib/chatMedia'
import { getCachedDecryptedUrl } from '@/lib/mediaEncryption'
import { detectContextKeywords } from '@/features/ai-guardian/context/detector'
import { enqueueMessage, processQueue, getQueueCount } from '@/lib/offline-queue'
import ChatInputBar from './ChatInputBar'

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
  media_mime_type?: string | null
  media_duration: number | null
  encrypted: boolean
  reply_to: string | null
  created_at: string
  edited_at: string | null
  deleted_at: string | null
  delivered_at: string | null
  seen_at: string | null
  location_payload?: { latitude: number; longitude: number; accuracy?: number; label?: string } | null
  transcript?: string | null
}

type StickerSelection = { emoji: string }
type GifSelection = { url: string }

function isExternalUrl(value: string | null | undefined): boolean {
  if (!value) return false
  return value.startsWith('http://') || value.startsWith('https://')
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
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [contextCount, setContextCount] = useState(0)
  const [contexts, setContexts] = useState<Array<{ id: string; category: string; sender_role: string; matched_keywords: string[] }>>([])
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [aiResponse, setAiResponse] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [oldestCreatedAt, setOldestCreatedAt] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  // Main Chat Initialization & Realtime Subscription
  useEffect(() => {
    let isMounted = true

    const initChat = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setCurrentUserId(user.id)

      const { couple } = await getCoupleStatus()
      if (!couple) return
      setCoupleId(couple.id)

      // Load AI Context
      const { data: contextRows, count } = await supabase
        .from('ai_context_memory')
        .select('id,category,sender_role,matched_keywords', { count: 'exact' })
        .eq('user_id', user.id)
        .is('processed_at', null)
        .gte('expires_at', new Date().toISOString())
      setContextCount(count ?? 0)
      setContexts((contextRows ?? []) as typeof contexts)

      // Load Initial Messages
      const { data: loadedMessages } = await supabase
        .from('messages')
        .select('*')
        .eq('couple_id', couple.id)
        .order('created_at', { ascending: false })
        .limit(50)

      const chatKey = await deriveChatKey(couple.id)
      const decryptedMessages = await Promise.all(
        (loadedMessages || []).map(async (msg: Message) => {
          let mediaUrl = msg.media_url
          try {
            if (isExternalUrl(msg.media_url)) {
              mediaUrl = msg.message_type === 'voice'
                ? await resolveChatMediaUrl(msg.media_url, 'voice')
                : msg.message_type === 'photo'
                  ? await resolveChatMediaUrl(msg.media_url, 'photo')
                  : msg.media_url
            } else if (msg.media_url) {
              const mimeType = msg.media_mime_type || (msg.message_type === 'voice' ? 'audio/m4a' : 'image/jpeg')
              const bucket = msg.message_type === 'voice' ? 'voice_messages' : 'chat_photos'
              mediaUrl = await getCachedDecryptedUrl(couple.id, bucket, msg.media_url, mimeType)
            }
          } catch {
            mediaUrl = null
          }
          if (msg.encrypted && msg.content) {
            try {
              const decrypted = await decryptMessage(msg.content, chatKey, couple.id)
              return { ...msg, content: decrypted, media_url: mediaUrl }
            } catch {
              return { ...msg, media_url: mediaUrl }
            }
          }
          return { ...msg, media_url: mediaUrl }
        })
      )

      const activeMessages = decryptedMessages.filter(msg => !msg.deleted_at)
      const sortedMessages = activeMessages.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      setMessages(sortedMessages)

      // Mark messages as seen
      const partnerMessages = activeMessages.filter(
        msg => msg.sender_id !== user.id && !msg.seen_at
      )
      if (partnerMessages.length > 0) {
        void supabase
          .from('messages')
          .update({ seen_at: new Date().toISOString() })
          .in('id', partnerMessages.map(m => m.id))
      }

      if (loadedMessages && loadedMessages.length > 0) {
        setOldestCreatedAt(loadedMessages[loadedMessages.length - 1].created_at)
        setHasMore(loadedMessages.length === 50)
      } else {
        setHasMore(false)
      }

      // Setup Realtime Channel (✅ No infinite loop, proper cleanup)
      const channel = supabase
        .channel(`chat-${couple.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `couple_id=eq.${couple.id}` },
          async (payload) => {
            const rawMessage = payload.new as Message
            let mediaUrl = rawMessage.media_url
            try {
              if (isExternalUrl(rawMessage.media_url)) {
                mediaUrl = rawMessage.message_type === 'voice'
                  ? await resolveChatMediaUrl(rawMessage.media_url, 'voice')
                  : rawMessage.message_type === 'photo'
                    ? await resolveChatMediaUrl(rawMessage.media_url, 'photo')
                    : rawMessage.media_url
              } else if (rawMessage.media_url) {
                const mimeType = rawMessage.media_mime_type || (rawMessage.message_type === 'voice' ? 'audio/m4a' : 'image/jpeg')
                const bucket = rawMessage.message_type === 'voice' ? 'voice_messages' : 'chat_photos'
                mediaUrl = await getCachedDecryptedUrl(couple.id, bucket, rawMessage.media_url, mimeType)
              }
            } catch {
              mediaUrl = null
            }
            const newMessage = { ...rawMessage, media_url: mediaUrl }

            if (newMessage.encrypted && newMessage.content) {
              try {
                const decrypted = await decryptMessage(newMessage.content, chatKey, couple.id)
                setMessages((prev) => prev.some((message) => message.id === newMessage.id)
                  ? prev.map((message) => message.id === newMessage.id ? { ...message, ...newMessage, content: decrypted } : message)
                  : [...prev, { ...newMessage, content: decrypted }])
              } catch {
                setMessages((prev) => prev.some((message) => message.id === newMessage.id) ? prev : [...prev, newMessage])
              }
            } else {
              setMessages((prev) => prev.some((message) => message.id === newMessage.id) ? prev : [...prev, newMessage])
            }
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'messages', filter: `couple_id=eq.${couple.id}` },
          async (payload) => {
            const rawMessage = payload.new as Message
            let mediaUrl = rawMessage.media_url
            try {
              if (isExternalUrl(rawMessage.media_url)) {
                mediaUrl = rawMessage.message_type === 'voice'
                  ? await resolveChatMediaUrl(rawMessage.media_url, 'voice')
                  : rawMessage.message_type === 'photo'
                    ? await resolveChatMediaUrl(rawMessage.media_url, 'photo')
                    : rawMessage.media_url
              } else if (rawMessage.media_url) {
                const mimeType = rawMessage.media_mime_type || (rawMessage.message_type === 'voice' ? 'audio/m4a' : 'image/jpeg')
                const bucket = rawMessage.message_type === 'voice' ? 'voice_messages' : 'chat_photos'
                mediaUrl = await getCachedDecryptedUrl(couple.id, bucket, rawMessage.media_url, mimeType)
              }
            } catch {
              mediaUrl = null
            }
            setMessages((current) => current.map((message) => message.id === rawMessage.id ? { ...message, ...rawMessage, media_url: mediaUrl } : message))
          }
        )
        .subscribe() // ✅ Subscribe is called only once, at the end.

      if (isMounted) {
        channelRef.current = channel
      } else {
        void supabase.removeChannel(channel)
      }
    }

    void initChat()

    return () => {
      isMounted = false
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [])

  // Online/Offline Detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      if (coupleId) {
        void processQueue(supabase, coupleId).then((processed) => {
          if (processed > 0) void getQueueCount().then(setPendingCount)
        })
      }
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    setIsOnline(navigator.onLine)

    if (coupleId) void getQueueCount().then(setPendingCount)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [coupleId])

  const loadMoreMessages = async () => {
    if (!coupleId || !oldestCreatedAt || loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const { data: olderMessages } = await supabase
        .from('messages')
        .select('*')
        .eq('couple_id', coupleId)
        .lt('created_at', oldestCreatedAt)
        .order('created_at', { ascending: false })
        .limit(50)

      if (olderMessages && olderMessages.length > 0) {
        const chatKey = await deriveChatKey(coupleId)
        const decryptedMessages = await Promise.all(
          olderMessages.map(async (msg: Message) => {
            let mediaUrl = msg.media_url
            try {
              mediaUrl = msg.message_type === 'voice'
                ? await resolveChatMediaUrl(msg.media_url, 'voice')
                : msg.message_type === 'photo'
                  ? await resolveChatMediaUrl(msg.media_url, 'photo')
                  : msg.media_url
            } catch { mediaUrl = null }
            if (msg.encrypted && msg.content) {
              try {
                const decrypted = await decryptMessage(msg.content, chatKey, coupleId)
                return { ...msg, content: decrypted, media_url: mediaUrl }
              } catch { return { ...msg, media_url: mediaUrl } }
            }
            return { ...msg, media_url: mediaUrl }
          })
        )
        setMessages((prev) => [...decryptedMessages.reverse(), ...prev])
        setOldestCreatedAt(olderMessages[olderMessages.length - 1].created_at)
        setHasMore(olderMessages.length === 50)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Error loading more messages:', error)
    } finally {
      setLoadingMore(false)
    }
  }

  const handleSend = async (text = input) => {
    if (!text.trim() || !coupleId || !currentUserId) return
    const messageText = text.trim()
    const chatKey = await deriveChatKey(coupleId)
    const encryptedContent = await encryptMessage(messageText, chatKey)

    if (!isOnline) {
      await enqueueMessage({ id: crypto.randomUUID(), couple_id: coupleId, sender_id: currentUserId, content: encryptedContent, message_type: 'text', encrypted: true, reply_to: null, created_at: new Date().toISOString(), timestamp: Date.now() })
      setPendingCount(await getQueueCount())
      setInput('')
      return
    }

    const { data: savedMessage, error } = await supabase.from('messages').insert({ couple_id: coupleId, sender_id: currentUserId, content: encryptedContent, message_type: 'text', encrypted: true }).select('id').single()
    if (error || !savedMessage) {
      await enqueueMessage({ id: crypto.randomUUID(), couple_id: coupleId, sender_id: currentUserId, content: encryptedContent, message_type: 'text', encrypted: true, reply_to: null, created_at: new Date().toISOString(), timestamp: Date.now() })
      setPendingCount(await getQueueCount())
      return
    }

    const detected = detectContextKeywords(messageText)
    if (detected.length) {
      await supabase.from('ai_context_memory').insert(detected.map((item) => ({ user_id: currentUserId, couple_id: coupleId, source_message_id: savedMessage.id, category: item.category, sender_role: 'her', context_text: encryptedContent, matched_keywords: item.matchedKeywords })))
      setContextCount((count) => count + detected.length)
    }
    setInput('')
  }

  const askGuardian = async () => {
    setAiLoading(true)
    try {
      const response = await fetch('/api/ai/guardian', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'Please review my recent context and give me a gentle, practical suggestion.' }) })
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
        const { error } = await supabase.from('messages').insert({ couple_id: coupleId, sender_id: currentUserId, content: `Location pin · ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`, message_type: 'location', location_payload: { latitude, longitude, accuracy }, encrypted: false })
        if (error) console.error('Error sending location:', error)
      },
      () => alert('Location permission is required to send a location pin.'),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    )
  }

  const handleVoiceMessage = async (recording: { blob: Blob; duration: number }) => {
    if (!coupleId || !currentUserId) return
    const { data: message, error } = await supabase.from('messages').insert({ couple_id: coupleId, sender_id: currentUserId, message_type: 'voice', media_duration: recording.duration, encrypted: false }).select().single()
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
    const { data: message, error } = await supabase.from('messages').insert({ couple_id: coupleId, sender_id: currentUserId, message_type: 'photo', encrypted: false }).select().single()
    if (error || !message) return
    const { uploadChatPhoto } = await import('@/lib/imageCompressor')
    const mediaUrl = await uploadChatPhoto(compressed.blob, coupleId, message.id)
    await supabase.from('messages').update({ media_url: mediaUrl }).eq('id', message.id)
  }

  const handleStickerSelect = async (sticker: StickerSelection) => {
    if (!coupleId || !currentUserId) return
    const { error } = await supabase.from('messages').insert({ couple_id: coupleId, sender_id: currentUserId, content: sticker.emoji, message_type: 'sticker', encrypted: false })
    if (error) console.error('Error sending sticker:', error)
    setShowStickerPicker(false)
  }

  const handleGIFSelect = async (gif: GifSelection) => {
    if (!coupleId || !currentUserId) return
    const { data: message, error } = await supabase.from('messages').insert({ couple_id: coupleId, sender_id: currentUserId, message_type: 'gif', encrypted: false }).select().single()
    if (error || !message) return
    await supabase.from('messages').update({ media_url: gif.url }).eq('id', message.id)
    setShowGIFPicker(false)
  }

  const handleFileUpload = async (fileInfo: { url: string; type: string; name: string; size: number; path?: string; mimeType?: string }) => {
    try {
      if (!coupleId || !currentUserId) return
      let messageType: 'photo' | 'video' | 'audio' | 'file' = 'file'
      if (fileInfo.type.startsWith('image/')) messageType = 'photo'
      else if (fileInfo.type.startsWith('video/')) messageType = 'video'
      else if (fileInfo.type.startsWith('audio/')) messageType = 'audio'
      const { error } = await supabase.from('messages').insert({ couple_id: coupleId, sender_id: currentUserId, content: fileInfo.name, media_url: fileInfo.url, message_type: messageType, media_mime_type: fileInfo.mimeType, encrypted: false })
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
    const { error } = await supabase.from('messages').insert({ couple_id: coupleId, sender_id: currentUserId, content: encryptedContent, message_type: 'text', reply_to: replyData.replyTo, encrypted: true })
    if (error) console.error('Error sending reply:', error)
  }

  const handleMessageLongPress = (message: Message) => {
    setSelectedMessage(message)
    setShowReplyThread(true)
  }

  const handleEditMessageSync = async (message: Message) => {
    if (!message.content || !coupleId || !currentUserId) return
    setEditContent(message.content)
    setShowEditModal(true)
    setShowReplyThread(false)
  }

  const handleDeleteMessageSync = async (message: Message) => {
    if (!confirm('Delete this message?')) return
    const { error } = await supabase.from('messages').update({ deleted_at: new Date().toISOString() }).eq('id', message.id)
    if (error) console.error('Failed to delete message:', error)
    else {
      setShowReplyThread(false)
      setSelectedMessage(null)
    }
  }

  const saveEdit = async () => {
    if (!selectedMessage || !editContent.trim() || !coupleId) return
    const chatKey = await deriveChatKey(coupleId)
    const encryptedContent = await encryptMessage(editContent.trim(), chatKey)
    const { error } = await supabase.from('messages').update({ content: encryptedContent, edited_at: new Date().toISOString() }).eq('id', selectedMessage.id)
    if (error) console.error('Failed to edit message:', error)
    else {
      setShowEditModal(false)
      setSelectedMessage(null)
      setEditContent('')
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!coupleId) {
    return (
      <div className="flex items-center justify-center h-[600px] glass-card">
        <p className="text-text-2">Link with your partner to start chatting</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[600px] glass-card">
      <div role="status" aria-live="polite" className="sr-only">
        {messages.length > 0 && `Latest message from ${messages[messages.length - 1].sender_id === currentUserId ? 'you' : 'your partner'}`}
      </div>
      <header className="flex items-center gap-3 border-b border-accent-1/20 bg-card px-4 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-pill bg-accent-1 text-lg text-white"><Heart className="h-5 w-5 fill-current" /></div>
        <div><p className="font-semibold text-text-1">Your love</p><p className="text-xs text-emerald-400">{isOnline ? 'Online' : 'Offline'}{pendingCount > 0 && ` (${pendingCount} pending)`}</p></div>
        <button type="button" onClick={() => setShowAIPanel((open) => !open)} className="ml-auto inline-flex items-center gap-1 rounded-pill border border-accent-1/20 px-3 py-1.5 text-xs text-text-1" aria-label="Open AI Guardian">
          <Sparkles className="h-3.5 w-3.5" /> AI {contextCount > 0 ? `•${contextCount}` : ''}
        </button>
      </header>
      {loadError && <div role="alert" className="border-b border-error/30 bg-error/10 px-4 py-2 text-sm text-error">{loadError}</div>}
      {showAIPanel && <section className="border-b border-accent-1/20 bg-card p-4">
        <div className="flex items-center justify-between"><p className="text-sm font-semibold text-text-1">AI Guardian context</p><button type="button" onClick={() => setShowAIPanel(false)} aria-label="Close AI Guardian"><X className="h-4 w-4 text-text-2" /></button></div>
        <p className="mt-2 text-xs text-text-2">{contextCount ? `${contextCount} unprocessed context hint${contextCount === 1 ? '' : 's'} detected.` : 'No unprocessed context hints.'}</p>
        {contexts.length > 0 && <ul className="mt-3 space-y-2">{contexts.map((context) => <li key={context.id} className="flex items-center justify-between rounded-input bg-card px-3 py-2 text-xs text-text-1"><span>{context.category} · {context.sender_role}</span><button type="button" onClick={() => void deleteContext(context.id)} className="text-text-2 underline">Delete</button></li>)}</ul>}
        <button type="button" onClick={() => void askGuardian()} disabled={aiLoading || contextCount === 0} className="mt-3 rounded-pill bg-accent-1 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{aiLoading ? 'Thinking...' : 'Ask AI'}</button>
        {aiResponse && <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-text-1">{aiResponse}</p>}
      </section>}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {hasMore && (
          <div className="flex justify-center py-2">
            <button type="button" onClick={() => void loadMoreMessages()} disabled={loadingMore} className="rounded-pill bg-card px-4 py-2 text-xs text-text-2 disabled:opacity-50">
              {loadingMore ? 'Loading...' : 'Load more messages'}
            </button>
          </div>
        )}
        {messages.length === 0 ? <div className="flex h-full items-center justify-center text-center text-text-2"><p>Say hello to your love <Heart className="inline h-4 w-4" /></p></div> : messages.map((message) => {
          const replyToMessage = message.reply_to ? messages.find((m) => m.id === message.reply_to) : null
          return (
            <div key={message.id} className={`flex ${message.sender_id === currentUserId ? 'justify-end' : 'justify-start'} group`}>
              <div className="flex flex-col gap-1">
                <div className={`max-w-[70%] rounded-btn px-4 py-2 ${message.sender_id === currentUserId ? 'rounded-[18px] rounded-br-[4px] bg-accent-1 text-white' : 'rounded-[18px] rounded-bl-[4px] bg-card text-text-1'}`} onContextMenu={(e) => { e.preventDefault(); handleMessageLongPress(message) }}>
                  {replyToMessage && (
                    <div className="mb-2 pb-2 border-b border-accent-1/20">
                      <p className="text-xs text-text-2 mb-1">Replying to {replyToMessage.sender_id === currentUserId ? 'yourself' : 'partner'}</p>
                      <p className="text-xs text-text-2 line-clamp-1">{replyToMessage.message_type === 'text' ? replyToMessage.content : 'Message'}</p>
                    </div>
                  )}
                  {message.message_type === 'text' && <p className="text-sm">{message.content}</p>}
                  {message.message_type === 'voice' && message.media_url && (
                    <div className="space-y-2"><audio controls src={message.media_url} className="h-8 max-w-full" /><button type="button" onClick={() => void handleTranscribe(message)} className="inline-flex items-center gap-1 text-xs text-accent-2 hover:underline"><Captions className="h-3.5 w-3.5" />{message.transcript ? 'Refresh transcript' : 'Transcribe'}</button>{message.transcript ? <p className="rounded-lg bg-black/10 p-2 text-xs leading-relaxed text-text-2">{message.transcript}</p> : null}</div>
                  )}
                  {message.message_type === 'photo' && message.media_url && <Image src={message.media_url} alt="Chat photo" width={640} height={480} unoptimized className="max-w-full rounded-lg" />}
                  {message.message_type === 'video' && message.media_url && <video controls src={message.media_url} className="rounded-lg max-w-full" />}
                  {message.message_type === 'audio' && message.media_url && <audio controls src={message.media_url} className="h-8" />}
                  {message.message_type === 'sticker' && <span className="text-4xl">{message.content}</span>}
                  {message.message_type === 'gif' && message.media_url && <Image src={message.media_url} alt="GIF" width={480} height={480} unoptimized className="max-w-full rounded-lg" />}
                  {message.message_type === 'file' && <div className="flex items-center gap-2"><Paperclip className="h-4 w-4" /><span className="text-sm">{message.content}</span></div>}
                  {message.message_type === 'location' && message.location_payload && <a href={`https://www.google.com/maps?q=${message.location_payload.latitude},${message.location_payload.longitude}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-input bg-soft-tint p-3 text-sm hover:bg-accent-1/10"><MapPin className="h-5 w-5 text-accent-1" /><span><strong>Shared location</strong><br />{message.location_payload.latitude.toFixed(5)}, {message.location_payload.longitude.toFixed(5)} · ±{Math.round(message.location_payload.accuracy ?? 0)}m</span></a>}
                  {message.message_type === 'sos' && message.location_payload && <a href={`https://www.google.com/maps?q=${message.location_payload.latitude},${message.location_payload.longitude}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl border border-red-400/40 bg-red-500/15 p-3 text-sm text-red-100 hover:bg-red-500/25"><MapPin className="h-5 w-5 text-red-300" /><span><strong>🆘 Emergency SOS</strong><br />Open the sender’s current location.</span></a>}
                  <div className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-70">
                    <span>{new Date(message.created_at).toLocaleTimeString()}</span>
                    {message.edited_at && <span className="text-accent-2">(edited)</span>}
                    {message.sender_id === currentUserId && (
                      <span className="flex items-center gap-0.5">
                        {message.seen_at ? <span className="text-blue-400">✓✓</span> : message.delivered_at ? <span>✓✓</span> : <span>✓</span>}
                      </span>
                    )}
                    <span aria-hidden="true" />
                  </div>
                </div>
                <div className="hidden items-center justify-end gap-1 text-xs" aria-hidden="true" />
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button type="button" onClick={() => { setSelectedMessage(message); setShowReplyThread(true); }} className="p-1 rounded-pill bg-accent-1/10 hover:bg-accent-1/20 text-accent-1">
                    <ReplyIcon className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      <ChatInputBar
        onSend={(text) => void handleSend(text)}
        onVoiceRecord={() => setShowVoiceRecorder(true)}
        onPhotoSelect={() => setShowPhotoShare(true)}
        onStickerSelect={() => setShowStickerPicker(true)}
        onGIFSelect={() => setShowGIFPicker(true)}
        onFileSelect={() => setShowFileUpload(true)}
        onLocationSend={handleSendLocation}
      />

      {showVoiceRecorder && <VoiceMessageRecorder onClose={() => setShowVoiceRecorder(false)} onRecord={handleVoiceMessage} />}
      {showPhotoShare && <PhotoShare onClose={() => setShowPhotoShare(false)} onPhotoSelect={handlePhotoMessage} />}
      {showStickerPicker && <StickerPicker onStickerSelect={handleStickerSelect} onClose={() => setShowStickerPicker(false)} />}
      {showGIFPicker && <GIFPicker onGIFSelect={handleGIFSelect} onClose={() => setShowGIFPicker(false)} />}
      {showFileUpload && <FileUpload onFileUpload={handleFileUpload} onClose={() => setShowFileUpload(false)} coupleId={coupleId ?? ''} />}
      {showReplyThread && selectedMessage && (
        <ReplyThread message={selectedMessage} currentUserId={currentUserId} onReply={handleReply} onEdit={handleEditMessageSync} onDelete={handleDeleteMessageSync} onClose={() => { setShowReplyThread(false); setSelectedMessage(null); }} />
      )}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-modal border border-accent-1/20 bg-card shadow-[0_20px_40px_rgba(19,10,33,0.28)]">
            <div className="flex items-center justify-between border-b border-accent-1/20 p-4">
              <h2 className="text-lg font-serif text-text-1">Edit Message</h2>
              <button type="button" onClick={() => { setShowEditModal(false); setSelectedMessage(null); setEditContent(''); }} className="rounded-full p-2 text-text-2 hover:bg-accent-1/10 hover:text-accent-1 transition">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={4} className="w-full rounded-input border-2 border-accent-1/20 bg-card px-4 py-3 text-sm text-text-1 placeholder:text-text-2/50 resize-none focus:outline-none focus:ring-2 focus:ring-accent-1/50" />
              <div className="flex gap-2">
                <button type="button" onClick={saveEdit} disabled={!editContent.trim()} className="flex-1 rounded-btn bg-gradient-to-r from-accent-1 to-accent-2 px-6 py-3 text-base font-medium text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">Save</button>
                <button type="button" onClick={() => { setShowEditModal(false); setSelectedMessage(null); setEditContent(''); }} className="flex-1 rounded-btn border border-accent-1/30 px-6 py-3 text-base font-medium text-text-1 hover:bg-accent-1/10 transition">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

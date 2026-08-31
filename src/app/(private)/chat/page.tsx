'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Home, Image, Mic, Phone, Send, Video } from 'lucide-react'
import ChatBubble from '@/features/chat/ChatBubble'
import Link from 'next/link'
import { supabase, isSupabaseConfigured, getCurrentUserId, type Message } from '@/lib/supabase'

type ChatMessage = Message & {
  profiles?: { full_name?: string | null }
}

const formatChatTimestamp = (iso: string) => {
  const date = new Date(iso)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfYesterday.getDate() - 1)

  const isToday = date >= startOfToday
  const isYesterday = date >= startOfYesterday && date < startOfToday

  const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  if (isToday) return `Today ${time}`
  if (isYesterday) return `Yesterday ${time}`
  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${time}`
}

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatPageSkeleton />}>
      <ChatPageContent />
    </Suspense>
  )
}

function ChatPageContent() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [partnerOnline, setPartnerOnline] = useState(false)
  const [partnerLastSeen, setPartnerLastSeen] = useState<string | null>(null)
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null)
  const [messageReactions, setMessageReactions] = useState<Record<string, Record<string, number>>>({})
  const [isRecording, setIsRecording] = useState(false)
  const [recordingError, setRecordingError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const popSoundRef = useRef<HTMLAudioElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const partnerName = useMemo(() => 'Partner', [])

  useEffect(() => {
    const audio = new Audio('/sounds/pop.wav')
    audio.volume = 0.35
    audio.onerror = () => {}
    popSoundRef.current = audio
  }, [])

  useEffect(() => {
    const bootstrap = async () => {
      const userId = await getCurrentUserId()
      setCurrentUserId(userId)
      if (!userId) {
        setIsLoading(false)
        return
      }

      const { data: coupleData, error: coupleError } = await supabase
        .from('couple_links')
        .select('id')
        .or(`inviter_id.eq.${userId},accepted_by.eq.${userId}`)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (coupleError || !coupleData) {
        setIsLoading(false)
        return
      }

      setCoupleId(coupleData.id)

      const { data: chatData, error: chatError } = await supabase
        .from('chat_messages')
        .select('*, profiles:sender_id(full_name)')
        .eq('couple_id', coupleData.id)
        .order('created_at', { ascending: true })

      if (!chatError && chatData) {
        setMessages(chatData as ChatMessage[])
      }
      setIsLoading(false)
    }

    bootstrap().catch(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured || !coupleId || !currentUserId) return

    const channel = supabase
      .channel(`chat:${coupleId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `couple_id=eq.${coupleId}` },
        (payload) => {
          const nextMessage = payload.new as ChatMessage
          setMessages((prev) => [...prev, nextMessage])
        }
      )
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState() as Record<string, Array<{ user_id?: string; last_seen?: string }>>
        const partnerEntry = Object.values(state)
          .flat()
          .find((entry) => entry.user_id && entry.user_id !== currentUserId)

        setPartnerOnline(Boolean(partnerEntry))
        setPartnerLastSeen(partnerEntry?.last_seen ?? null)
      })
      .subscribe()

    void channel.track({ user_id: currentUserId, last_seen: new Date().toISOString() })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [coupleId, currentUserId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const uploadMedia = async (file: File, kind: 'image' | 'voice') => {
    if (!currentUserId || !coupleId) return null

    const extension = kind === 'image' ? 'png' : file.name.endsWith('.webm') ? 'webm' : 'mp3'
    const storagePath = `${currentUserId}/${Date.now()}-${kind}.${extension}`

    try {
      const { data, error } = await supabase.storage.from('chat-media').upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'application/octet-stream',
      })

      if (error) {
        throw error
      }

      const { data: publicData } = supabase.storage.from('chat-media').getPublicUrl(data?.path ?? storagePath)
      return publicData.publicUrl
    } catch {
      return null
    }
  }

  const sendMessage = async () => {
    if (!currentUserId || !coupleId) return

    const text = input.trim()
    const mediaUrl = selectedImage ? await uploadMedia(selectedImage, 'image') : null

    if (!text && !mediaUrl) {
      return
    }

    setInput('')
    setSelectedImage(null)
    setSelectedImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    try {
      if (popSoundRef.current) {
        popSoundRef.current.currentTime = 0
        popSoundRef.current.play().catch(() => {})
      }
    } catch {
      // ignore
    }

    setIsTyping(true)
    setTimeout(() => setIsTyping(false), 700)

    const { error } = await supabase.from('chat_messages').insert({
      sender_id: currentUserId,
      couple_id: coupleId,
      content: text || 'Shared a memory',
      visibility: 'shared',
      reply_to_id: replyTo?.id ?? null,
      media_type: selectedImage ? 'image' : 'none',
      media_url: mediaUrl,
    })

    if (error) {
      setRecordingError('We could not send your message. Please try again.')
    }

    setReplyTo(null)
  }

  const handleReact = (messageId: string, emoji: string) => {
    setMessageReactions((prev) => ({
      ...prev,
      [messageId]: {
        ...(prev[messageId] ?? {}),
        [emoji]: (prev[messageId]?.[emoji] ?? 0) + 1,
      },
    }))
  }

  const handleImagePick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setSelectedImage(file)
    setSelectedImagePreview(URL.createObjectURL(file))
  }

  const handleVoiceToggle = async () => {
    if (!currentUserId || !coupleId) return

    if (isRecording) {
      if (!mediaRecorderRef.current) {
        setIsRecording(false)
        return
      }

      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
      setIsRecording(false)
      return
    }

    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setRecordingError('Voice notes are not supported in this browser.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      audioChunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' })
        const mediaUrl = await uploadMedia(file, 'voice')

        if (!mediaUrl) {
          setRecordingError('Voice note upload failed. Please try again.')
          return
        }

        const { error } = await supabase.from('chat_messages').insert({
          sender_id: currentUserId,
          couple_id: coupleId,
          content: input.trim() || 'Voice note',
          visibility: 'shared',
          media_type: 'voice',
          media_url: mediaUrl,
          reply_to_id: replyTo?.id ?? null,
        })

        if (error) {
          setRecordingError('We could not save your voice note. Please try again.')
        }

        setReplyTo(null)
        setRecordingError(null)
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
      setRecordingError(null)
    } catch {
      setRecordingError('Microphone access is blocked or unavailable.')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void sendMessage()
    }
  }

  const partnerStatus = partnerOnline
    ? 'Online now'
    : partnerLastSeen
      ? `Last seen ${formatChatTimestamp(partnerLastSeen)}`
      : 'Offline'

  return (
    <div className="min-h-screen max-w-3xl">
      <div className="mb-4 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 transition-colors hover:text-[var(--text-primary)]"
        >
          <Home size={11} /> Home
        </Link>
        <ChevronRight size={11} />
        <span className="text-[var(--text-primary)]">Whispers</span>
      </div>

      <h1
        className="mb-1 text-3xl font-bold text-[var(--text-primary)]"
        style={{ fontFamily: "'Playfair Display',serif" }}
      >
        Whispers
      </h1>
      <p className="mb-6 text-sm text-[var(--text-secondary)]">
        A quiet place for just the two of you.
      </p>

      <div className="overflow-hidden rounded-3xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] shadow-sm backdrop-blur">
        <div className="flex items-center justify-between border-b border-[var(--accent-1)]/15 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-1)] to-[var(--accent-2)] text-sm font-bold text-[var(--text-primary)]">
              M
            </div>
            <div>
              <div className="text-sm font-semibold text-[var(--text-primary)]">{partnerName}</div>
              <div className="flex items-center gap-1 text-xs text-[var(--accent-1)]">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent-1)]" />
                {partnerStatus}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[var(--text-secondary)]">
            <button
              type="button"
              aria-label="Start phone call"
              className="transition-colors hover:text-[var(--text-primary)]"
            >
              <Phone size={16} />
            </button>
            <button
              type="button"
              aria-label="Start video call"
              className="transition-colors hover:text-[var(--text-primary)]"
            >
              <Video size={16} />
            </button>
          </div>
        </div>

        <div className="flex h-96 flex-col gap-4 overflow-y-auto px-5 py-5">
          {!isLoading && messages.length === 0 && (
            <div className="text-center text-xs uppercase tracking-widest text-[var(--text-secondary)]">
              New conversation
            </div>
          )}
          {replyTo && (
            <div className="mb-3 flex items-center justify-between rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] px-3 py-2 text-xs text-[var(--text-primary)]">
              <span className="truncate">Replying to: {replyTo.content.slice(0, 42)}</span>
              <button type="button" onClick={() => setReplyTo(null)} className="ml-2 text-[var(--text-secondary)]">
                Clear
              </button>
            </div>
          )}
          {selectedImagePreview && (
            <div className="mb-3 rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] p-2">
              <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                <span>Selected image</span>
                <button type="button" onClick={() => setSelectedImage(null)} className="text-[var(--text-primary)]">
                  Remove
                </button>
              </div>
              <img src={selectedImagePreview} alt="Selected attachment preview" className="max-h-40 rounded-xl object-cover" />
            </div>
          )}
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const sender = msg.sender_id === currentUserId ? 'me' : 'her'
              const replyTarget = msg.reply_to_id ? messages.find((entry) => entry.id === msg.reply_to_id) : null
              return (
                <ChatBubble
                  key={msg.id}
                  text={msg.content}
                  sender={sender}
                  timestamp={formatChatTimestamp(msg.created_at)}
                  mediaType={msg.media_type ?? 'none'}
                  mediaUrl={msg.media_url ?? null}
                  replyContext={replyTarget?.content ? replyTarget.content.slice(0, 40) : null}
                  reactions={messageReactions[msg.id] ?? {}}
                  reactionOptions={['❤️', '😂', '🔥', '💡', '🙏']}
                  onReact={(emoji) => handleReact(msg.id, emoji)}
                  onReply={() => setReplyTo(msg)}
                  seen={sender === 'me'}
                />
              )
            })}
          </AnimatePresence>
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex justify-start"
              >
                <div className="rounded-2xl rounded-bl-none bg-[var(--card-bg-strong)] px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.12 }}
                        className="block h-2 w-2 rounded-full bg-[var(--accent-1)]"
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        {recordingError && (
          <div className="mt-3 rounded-2xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {recordingError}
          </div>
        )}

        <div className="mt-3 flex items-center gap-3 border-t border-[var(--accent-1)]/15 px-4 py-3">
          <div className="flex flex-1 items-center gap-2 rounded-full border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] px-4 py-2.5">
            <span
              className="cursor-pointer text-lg text-[var(--text-secondary)]"
              aria-hidden="true"
            >
              ☺
            </span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write something sweet.."
              className="flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
            />
          </div>
          <button
            type="button"
            aria-label="Attach image"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-8 w-8 items-center justify-center text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          >
            <Image size={16} />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
          <button
            type="button"
            aria-label="Record voice message"
            onClick={() => void handleVoiceToggle()}
            className={`flex h-8 w-8 items-center justify-center transition-colors ${
              isRecording ? 'text-red-300' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Mic size={16} />
          </button>
          <motion.button
            type="button"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => void sendMessage()}
            disabled={!input.trim() && !selectedImage && !isRecording}
            aria-label="Send message"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-2)] to-[var(--accent-1)] text-[var(--text-primary)] shadow-md disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send size={14} />
          </motion.button>
        </div>
      </div>
    </div>
  )
}
function ChatPageSkeleton() {
  return (
    <div className="min-h-screen max-w-3xl p-4">
      <div className="mb-4 h-5 w-32 animate-pulse rounded-full bg-[var(--card-bg-strong)]" />
      <div className="mb-4 h-10 w-48 animate-pulse rounded-full bg-[var(--card-bg-strong)]" />
      <div className="rounded-3xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-4">
        <div className="mb-4 h-16 animate-pulse rounded-2xl bg-[var(--card-bg-strong)]" />
        <div className="space-y-3">
          <div className="h-12 animate-pulse rounded-2xl bg-[var(--card-bg-strong)]" />
          <div className="h-12 animate-pulse rounded-2xl bg-[var(--card-bg-strong)]" />
          <div className="h-12 w-3/4 animate-pulse rounded-2xl bg-[var(--card-bg-strong)]" />
        </div>
      </div>
    </div>
  )
}

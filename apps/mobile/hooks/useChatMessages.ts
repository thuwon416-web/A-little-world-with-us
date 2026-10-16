/**
 * useChatMessages
 *
 * Subscribes to the WatermelonDB `messages` table ordered by `created_at`
 * and returns a deserialized, decrypted array of `ChatMessage` objects.
 *
 * Keeps all WatermelonDB subscription logic out of the chat screen component
 * so the screen stays focused on presentation and user interactions.
 */
import { Q } from '@nozbe/watermelondb'
import { useEffect, useState } from 'react'

import type { ChatMessage } from '@/components/ChatBubble'
import { database } from '@/database'
import { deriveChatKey, decryptMessage } from '@/lib/chatEncryption'
import { downloadDecryptAndCache, downloadDriveMemoryAndCache, guessMimeTypeFromPath } from '@/lib/mediaEncryption'
import { getChatMediaUrl } from '@/services/chatMedia'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RawChatRecord = { id: string; _get: (column: string) => unknown }
type MessageLocation = { latitude: number; longitude: number; accuracy?: number }
type MediaBucket = 'chat_photos' | 'voice_messages' | 'chat_files'
export type ChatMessageType = 'voice' | 'photo' | 'sticker' | 'gif' | 'file' | 'video' | 'audio' | 'location' | 'sos' | 'text'

// ---------------------------------------------------------------------------
// Pure helpers (all pure, no side-effects)
// ---------------------------------------------------------------------------

function isExternalUrl(value: string | null | undefined): boolean {
  if (!value) return false
  return value.startsWith('http://') || value.startsWith('https://')
}

export function formatMessageTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Now'
  const now = new Date()
  const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  if (diffHours < 24) return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function parseMessageLocation(value: unknown): MessageLocation | null {
  if (typeof value !== 'string' || !value) return null
  try { return JSON.parse(value) as MessageLocation } catch { return null }
}

export function normalizeMessageType(value: unknown): ChatMessageType {
  switch (value) {
    case 'voice': case 'photo': case 'sticker': case 'gif':
    case 'file': case 'video': case 'audio': case 'location': case 'sos':
      return value
    default: return 'text'
  }
}

function getMediaBucket(type: ChatMessageType): MediaBucket | null {
  switch (type) {
    case 'photo': return 'chat_photos'
    case 'voice': case 'audio': return 'voice_messages'
    case 'file': return 'chat_files'
    default: return null
  }
}

async function resolveMessageMediaUrl(
  mediaUrl: unknown,
  bucket: MediaBucket | null,
  coupleId: string | null,
  storageProvider?: unknown,
  storageFileId?: unknown,
  mimeType?: unknown
): Promise<string | null> {
  if (storageProvider === 'google_drive' && typeof storageFileId === 'string' && storageFileId) {
    try {
      return await downloadDriveMemoryAndCache(storageFileId, typeof mimeType === 'string' ? mimeType : 'application/octet-stream')
    } catch { return null }
  }
  if (bucket && typeof mediaUrl === 'string') {
    if (isExternalUrl(mediaUrl)) return getChatMediaUrl(bucket, mediaUrl)
    if (coupleId) return downloadDecryptAndCache(coupleId, bucket, mediaUrl, guessMimeTypeFromPath(mediaUrl))
    return getChatMediaUrl(bucket, mediaUrl)
  }
  return typeof mediaUrl === 'string' ? mediaUrl : null
}

async function deserializeChatMessage(
  record: RawChatRecord,
  userId: string | undefined,
  coupleId: string | null
): Promise<ChatMessage> {
  const serializedLocation = record._get('location_payload')
  const location = parseMessageLocation(serializedLocation)
  const content = record._get('content')
  const createdAt = record._get('created_at')
  const mediaUrl = record._get('media_url')
  const mediaDuration = record._get('media_duration')
  const replyTo = record._get('reply_to')
  const encrypted = record._get('encrypted')
  const encryptionVersion = record._get('encryption_version')
  let displayContent = typeof content === 'string' ? content : ''

  if (encrypted && encryptionVersion && coupleId && typeof content === 'string') {
    try {
      const key = await deriveChatKey(coupleId)
      displayContent = await decryptMessage(content, key, coupleId)
    } catch (error) {
      console.error('Failed to decrypt message:', error)
      displayContent = '[Encrypted message]'
    }
  }

  const normalizedType = normalizeMessageType(record._get('message_type'))
  const resolvedMediaUrl = await resolveMessageMediaUrl(
    mediaUrl,
    getMediaBucket(normalizedType),
    coupleId,
    record._get('media_storage_provider'),
    record._get('media_storage_file_id'),
    record._get('media_mime_type')
  )

  return {
    id: record.id,
    sender: (record._get('sender_id') === userId ? 'me' : 'them') as 'me' | 'them',
    content: displayContent,
    senderId: typeof record._get('sender_id') === 'string' ? (record._get('sender_id') as string) : '',
    text: displayContent,
    time: formatMessageTime(
      typeof createdAt === 'number' ? new Date(createdAt).toISOString() : new Date().toISOString()
    ),
    type: normalizedType,
    messageType: normalizedType,
    mediaUrl: resolvedMediaUrl,
    mediaPath: typeof mediaUrl === 'string' ? mediaUrl : null,
    editedAt: typeof record._get('edited_at') === 'string' ? (record._get('edited_at') as string) : null,
    transcript: typeof record._get('transcript') === 'string' ? (record._get('transcript') as string) : null,
    mediaDuration: typeof mediaDuration === 'number' ? mediaDuration : null,
    replyTo: typeof replyTo === 'string' ? replyTo : null,
    createdAt: typeof createdAt === 'number' ? new Date(createdAt).toISOString() : new Date().toISOString(),
    location,
  }
}

async function deserializeChatMessages(
  records: RawChatRecord[],
  userId: string | undefined,
  coupleId: string | null
): Promise<ChatMessage[]> {
  const visibleRecords = records.filter((record) => !record._get('deleted_at'))
  return Promise.all(visibleRecords.map((record) => deserializeChatMessage(record, userId, coupleId)))
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Subscribes to WatermelonDB messages (sorted ascending) and returns a live,
 * decrypted array. Re-runs deserialization whenever the DB emits or `coupleId`
 * / `userId` change.
 */
export function useChatMessages(userId: string | undefined, coupleId: string | null): ChatMessage[] {
  const [messages, setMessages] = useState<ChatMessage[]>([])

  useEffect(() => {
    const subscription = database
      .get('messages')
      .query(Q.sortBy('created_at', 'asc'))
      .observe()
      .subscribe((records) => {
        const rawRecords = records.map((record) => record as unknown as RawChatRecord)
        void deserializeChatMessages(rawRecords, userId, coupleId).then(setMessages)
      })

    return () => subscription.unsubscribe()
  }, [userId, coupleId])

  return messages
}

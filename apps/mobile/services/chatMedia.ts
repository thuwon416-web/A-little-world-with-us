import type { ChatAttachment } from '@/components/chat/chat-types'
import { encryptMedia } from '@/lib/mediaEncryption'
import { supabase } from '@/lib/supabase'

export type ChatMediaBucket = 'chat_photos' | 'voice_messages' | 'chat_files'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

// In-memory cache for signed URLs with expiry
// 500-entry limit prevents memory leak (cache evicts oldest entries)
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>()

function validateAttachment(attachment: ChatAttachment) {
  const type = attachment.mimeType.toLowerCase()
  if (attachment.size !== undefined && attachment.size > MAX_FILE_SIZE) {
    throw new Error('File too large. Files must be 5 MB or smaller.')
  }
  if (
    !ALLOWED_IMAGE_TYPES.includes(type) &&
    type !== 'application/pdf' &&
    !type.startsWith('audio/')
  ) {
    throw new Error('Unsupported file type. Choose an image, PDF, or audio file.')
  }
}

export function getBucketForMimeType(mimeType: string): ChatMediaBucket {
  const normalizedMimeType = mimeType.toLowerCase()
  if (normalizedMimeType.startsWith('audio/')) return 'voice_messages'
  if (normalizedMimeType.startsWith('image/')) return 'chat_photos'
  return 'chat_files'
}

function extensionFor(name: string, mimeType: string) {
  const fromName = name.split('.').pop()?.toLowerCase()
  if (fromName && fromName.length <= 8) return fromName
  return mimeType.split('/')[1]?.split(';')[0] || 'bin'
}

export async function uploadChatMedia(
  userId: string,
  coupleId: string,
  messageId: string,
  attachment: ChatAttachment
) {
  validateAttachment(attachment)
  const bucket = getBucketForMimeType(attachment.mimeType)
  const response = await fetch(attachment.uri)
  if (!response.ok) throw new Error('Unable to read the selected attachment.')
  const body = await response.arrayBuffer()
  if (body.byteLength > MAX_FILE_SIZE) {
    throw new Error('File too large. Files must be 5 MB or smaller.')
  }
  const path = `${userId}/${messageId}.${extensionFor(attachment.name, attachment.mimeType)}`

  // Encrypt before upload
  const encrypted = await encryptMedia(new Uint8Array(body), coupleId)

  const { error } = await supabase.storage.from(bucket).upload(path, encrypted, {
    contentType: 'application/octet-stream',
    upsert: false,
  })
  if (error) throw new Error(error.message)
  return { path, mimeType: attachment.mimeType }
}

export async function getChatMediaUrl(bucket: ChatMediaBucket, path: string | null) {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path

  const cacheKey = `${bucket}:${path}`
  const now = Date.now()
  const FIVE_MINUTES_MS = 5 * 60 * 1000

  // Check cache with 5-minute buffer before expiry
  const cached = signedUrlCache.get(cacheKey)
  if (cached) {
    if (cached.expiresAt <= now) {
      signedUrlCache.delete(cacheKey)
    } else if (cached.expiresAt > now + FIVE_MINUTES_MS) {
      return cached.url
    }
  }

  // Enforce cache size limit to prevent memory leak
  while (signedUrlCache.size >= 500) {
    const firstKey = signedUrlCache.keys().next().value
    if (!firstKey) break
    signedUrlCache.delete(firstKey)
  }

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60)
  if (error || !data?.signedUrl) return null

  // Cache with 55-minute expiry (5-minute buffer)
  signedUrlCache.set(cacheKey, {
    url: data.signedUrl,
    expiresAt: now + 55 * 60 * 1000,
  })

  return data.signedUrl
}

export async function deleteChatMedia(bucket: ChatMediaBucket, path: string | null) {
  if (!path || /^https?:\/\//i.test(path)) return
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) throw new Error(error.message)
}

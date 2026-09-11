import { supabase } from '@/lib/supabase'
import type { ChatAttachment } from '@/components/chat/chat-types'

export type ChatMediaBucket = 'chat_photos' | 'voice_messages' | 'chat_files'

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
  messageId: string,
  attachment: ChatAttachment
) {
  const bucket = getBucketForMimeType(attachment.mimeType)
  const response = await fetch(attachment.uri)
  if (!response.ok) throw new Error('Unable to read the selected attachment.')
  const body = await response.arrayBuffer()
  const path = `${userId}/${messageId}.${extensionFor(attachment.name, attachment.mimeType)}`
  const { error } = await supabase.storage.from(bucket).upload(path, body, {
    contentType: attachment.mimeType,
    upsert: false,
  })
  if (error) throw new Error(error.message)
  return path
}

export async function getChatMediaUrl(bucket: ChatMediaBucket, path: string | null) {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60)
  if (error || !data?.signedUrl) return null
  return data.signedUrl
}

export async function deleteChatMedia(bucket: ChatMediaBucket, path: string | null) {
  if (!path || /^https?:\/\//i.test(path)) return
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) throw new Error(error.message)
}

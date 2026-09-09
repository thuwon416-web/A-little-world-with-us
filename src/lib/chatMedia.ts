import { supabase } from '@/lib/supabase'

type PrivateChatMediaType = 'voice' | 'photo'

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value)
}

/**
 * Resolves only paths written by the current private-media implementation.
 * Legacy external URLs remain untouched so existing GIF/file messages keep
 * working. Signed links are deliberately short lived and never written back
 * to the database.
 */
export async function resolveChatMediaUrl(
  value: string | null,
  type: PrivateChatMediaType
): Promise<string | null> {
  if (!value || isHttpUrl(value)) return value

  const bucket = type === 'voice' ? 'voice_messages' : 'chat_photos'
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(value, 60 * 60)
  if (error || !data?.signedUrl) return null
  return data.signedUrl
}

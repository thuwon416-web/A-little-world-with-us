import { deriveChatKey } from './chatEncryption'
import { supabase } from './supabase'

// ═══════════════════════════════════════════════════════════
// Media Encryption — End-to-End
//
// Format: [version=2][iv_12_bytes][ciphertext]
// Algorithm: AES-GCM
// Key: derived from couple_id (same as chat)
// ═══════════════════════════════════════════════════════════

const MEDIA_VERSION = 2
const IV_LENGTH = 12

export async function encryptMedia(
  blob: Blob,
  coupleId: string
): Promise<Blob> {
  const key = await deriveChatKey(coupleId)
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const plaintext = await blob.arrayBuffer()

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plaintext
  )

  const result = new Uint8Array(1 + IV_LENGTH + ciphertext.byteLength)
  result[0] = MEDIA_VERSION
  result.set(iv, 1)
  result.set(new Uint8Array(ciphertext), 1 + IV_LENGTH)

  return new Blob([result], { type: 'application/octet-stream' })
}

export async function decryptMedia(
  encryptedBlob: Blob,
  coupleId: string,
  originalMimeType: string
): Promise<Blob> {
  const buffer = await encryptedBlob.arrayBuffer()
  const bytes = new Uint8Array(buffer)

  const version = bytes[0]
  if (version !== MEDIA_VERSION) {
    throw new Error(`Unsupported media version: ${version}`)
  }

  const iv = bytes.slice(1, 1 + IV_LENGTH)
  const ciphertext = bytes.slice(1 + IV_LENGTH)

  const key = await deriveChatKey(coupleId)
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  )

  return new Blob([plaintext], { type: originalMimeType })
}

// ═══════════════════════════════════════════════════════════
// Fallback-aware decrypt: if file is not encrypted, return as-is
// (for backward compat with existing unencrypted media)
// ═══════════════════════════════════════════════════════════

export async function decryptMediaSafe(
  blob: Blob,
  coupleId: string,
  originalMimeType: string
): Promise<Blob> {
  try {
    return await decryptMedia(blob, coupleId, originalMimeType)
  } catch (err) {
    // Assume legacy unencrypted file
    console.warn('[Media] Fallback to plaintext (legacy):', err)
    return blob
  }
}

// ═══════════════════════════════════════════════════════════
// Upload helper
// ═══════════════════════════════════════════════════════════

export async function encryptAndUpload(
  file: File | Blob,
  coupleId: string,
  bucket: string,
  path: string,
  options?: { cacheControl?: string; upsert?: boolean }
): Promise<{ path: string; mimeType: string }> {
  const mimeType = (file as File).type || 'application/octet-stream'
  const encrypted = await encryptMedia(file, coupleId)

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, encrypted, {
      contentType: 'application/octet-stream',
      upsert: options?.upsert ?? false,
      cacheControl: options?.cacheControl,
    })
  if (error) throw error

  return { path, mimeType }
}

// ═══════════════════════════════════════════════════════════
// Download helper — returns decrypted Blob
// ═══════════════════════════════════════════════════════════

export async function downloadAndDecrypt(
  coupleId: string,
  bucket: string,
  path: string,
  mimeType: string
): Promise<Blob> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .download(path)
  if (error) throw error

  return decryptMediaSafe(data, coupleId, mimeType)
}

// ═══════════════════════════════════════════════════════════
// Object URL helper — for <img src>, <video src>, etc.
// ═══════════════════════════════════════════════════════════

export async function getDecryptedObjectUrl(
  coupleId: string,
  bucket: string,
  path: string,
  mimeType: string
): Promise<string> {
  const blob = await downloadAndDecrypt(coupleId, bucket, path, mimeType)
  return URL.createObjectURL(blob)
}

// ═══════════════════════════════════════════════════════════
// Cached Decrypted URLs (web only)
// ═══════════════════════════════════════════════════════════

const urlCache = new Map<string, string>()

export async function getCachedDecryptedUrl(
  coupleId: string,
  bucket: string,
  path: string,
  mimeType: string
): Promise<string> {
  const key = `${bucket}/${path}`
  const cached = urlCache.get(key)
  if (cached) return cached
  const url = await getDecryptedObjectUrl(coupleId, bucket, path, mimeType)
  urlCache.set(key, url)
  return url
}

export function revokeDecryptedUrl(bucket: string, path: string) {
  const key = `${bucket}/${path}`
  const url = urlCache.get(key)
  if (url) {
    URL.revokeObjectURL(url)
    urlCache.delete(key)
  }
}

// ═══════════════════════════════════════════════════════════
// Extension fallback — for gallery (no DB mime_type)
// ═══════════════════════════════════════════════════════════

export function guessMimeTypeFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    webm: 'video/webm',
    m4a: 'audio/m4a',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    pdf: 'application/pdf',
  }
  return map[ext] ?? 'application/octet-stream'
}

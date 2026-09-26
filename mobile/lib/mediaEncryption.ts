import { gcm } from '@noble/ciphers/aes.js'
import * as Crypto from 'expo-crypto'
import * as FileSystem from 'expo-file-system/legacy'

import { deriveChatKey } from './chatEncryption'
import { supabase } from './supabase'

const MEDIA_VERSION = 2
const IV_LENGTH = 12

export async function encryptMedia(data: Uint8Array, coupleId: string): Promise<Uint8Array> {
  const key = await deriveChatKey(coupleId)
  const iv = await Crypto.getRandomBytesAsync(IV_LENGTH)
  const cipher = gcm(key, iv)
  const ciphertext = cipher.encrypt(data)

  const result = new Uint8Array(1 + IV_LENGTH + ciphertext.length)
  result[0] = MEDIA_VERSION
  result.set(iv, 1)
  result.set(ciphertext, 1 + IV_LENGTH)
  return result
}

export async function decryptMedia(encrypted: Uint8Array, coupleId: string): Promise<Uint8Array> {
  const version = encrypted[0]
  if (version !== MEDIA_VERSION) {
    throw new Error(`Unsupported media version: ${version}`)
  }
  const iv = encrypted.slice(1, 1 + IV_LENGTH)
  const ciphertext = encrypted.slice(1 + IV_LENGTH)

  const key = await deriveChatKey(coupleId)
  const cipher = gcm(key, iv)
  return cipher.decrypt(ciphertext)
}

export async function decryptMediaSafe(
  encrypted: Uint8Array,
  coupleId: string
): Promise<Uint8Array> {
  if (encrypted[0] !== MEDIA_VERSION) return encrypted
  return decryptMedia(encrypted, coupleId)
}

// ═══════════════════════════════════════════════════════════
// Mobile: Download, decrypt, and cache to file system
// ═══════════════════════════════════════════════════════════

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

export async function downloadDecryptAndCache(
  coupleId: string,
  bucket: string,
  path: string,
  mimeType: string
): Promise<string> {
  const { data, error } = await supabase.storage.from(bucket).download(path)
  if (error) throw error

  const arrayBuffer = await data.arrayBuffer()
  const encrypted = new Uint8Array(arrayBuffer)
  const decrypted = await decryptMediaSafe(encrypted, coupleId)

  const cacheDir = FileSystem.cacheDirectory!
  const fileName = path.split('/').pop() ?? 'file'
  const cachePath = `${cacheDir}${fileName}`

  await FileSystem.writeAsStringAsync(
    cachePath,
    arrayBufferToBase64(new Uint8Array(decrypted).buffer),
    {
    encoding: FileSystem.EncodingType.Base64,
    }
  )

  return `file://${cachePath}`
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

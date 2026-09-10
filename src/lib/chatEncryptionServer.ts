const PREFIX = 'a-little-world-with-us-chat-'

export async function decryptChatMessageServer(encrypted: string, coupleId: string): Promise<string> {
  const encoder = new TextEncoder()
  const material = await crypto.subtle.importKey('raw', encoder.encode(PREFIX + coupleId), 'PBKDF2', false, ['deriveKey'])
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: encoder.encode(coupleId), iterations: 100000, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  )
  const bytes = Uint8Array.from(Buffer.from(encrypted, 'base64'))
  return new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(0, 12) }, key, bytes.slice(12)))
}

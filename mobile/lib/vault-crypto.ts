import * as Crypto from 'expo-crypto'

const PBKDF2_ITERATIONS = 100_000
const IV_LENGTH = 12
const SALT_LENGTH = 16
const BACKUP_WORDS = [
  'amber',
  'apple',
  'bamboo',
  'candle',
  'cedar',
  'cloud',
  'coral',
  'dawn',
  'ember',
  'forest',
  'garden',
  'harbor',
  'honey',
  'lantern',
  'meadow',
  'moon',
  'olive',
  'pearl',
  'petal',
  'river',
  'saffron',
  'silver',
  'summer',
  'willow',
]

function getSubtle(): SubtleCrypto {
  // Expo Crypto supplies secure randomness; PBKDF2/AES-GCM use the platform Web Crypto
  // implementation so their parameters and output remain compatible with the Web app.
  const subtle = globalThis.crypto?.subtle
  if (!subtle) {
    throw new Error('Mobile Web Crypto support is required for Vault encryption')
  }
  return subtle
}

function bytesToBase64(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
}

function base64ToBytes(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0))
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return Uint8Array.from(bytes).buffer
}

async function randomBytes(length: number): Promise<Uint8Array> {
  return Crypto.getRandomBytesAsync(length)
}

export function b64encode(data: Uint8Array): string {
  return bytesToBase64(data)
}

export function b64decode(value: string): Uint8Array {
  return base64ToBytes(value)
}

export function generateSalt(): string {
  return bytesToBase64(Crypto.getRandomBytes(SALT_LENGTH))
}

export async function deriveKeyFromPassphrase(
  passphrase: string,
  salt: string
): Promise<CryptoKey> {
  const subtle = getSubtle()
  const material = await subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase.normalize('NFKC')),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: toArrayBuffer(base64ToBytes(salt)),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function generateMasterKey(): Promise<Uint8Array> {
  return randomBytes(32)
}

async function importRawKey(bytes: Uint8Array, usages: KeyUsage[]): Promise<CryptoKey> {
  return getSubtle().importKey('raw', toArrayBuffer(bytes), { name: 'AES-GCM' }, false, usages)
}

export async function wrapMasterKey(
  masterKey: Uint8Array,
  wrappingKey: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const iv = await randomBytes(IV_LENGTH)
  const encrypted = await getSubtle().encrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(iv) },
    wrappingKey,
    toArrayBuffer(masterKey)
  )
  return { ciphertext: bytesToBase64(new Uint8Array(encrypted)), iv: bytesToBase64(iv) }
}

export async function unwrapMasterKey(
  ciphertext: string,
  iv: string,
  wrappingKey: CryptoKey
): Promise<Uint8Array> {
  return new Uint8Array(
    await getSubtle().decrypt(
      { name: 'AES-GCM', iv: toArrayBuffer(base64ToBytes(iv)) },
      wrappingKey,
      toArrayBuffer(base64ToBytes(ciphertext))
    )
  )
}

export async function encryptCredential(
  data: object,
  masterKey: Uint8Array
): Promise<{ encryptedPayload: string; iv: string }> {
  const iv = await randomBytes(IV_LENGTH)
  const key = await importRawKey(masterKey, ['encrypt'])
  const encrypted = await getSubtle().encrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(iv) },
    key,
    toArrayBuffer(new TextEncoder().encode(JSON.stringify(data)))
  )
  return { encryptedPayload: bytesToBase64(new Uint8Array(encrypted)), iv: bytesToBase64(iv) }
}

export async function decryptCredential(
  encryptedPayload: string,
  iv: string,
  masterKey: Uint8Array
): Promise<object> {
  const key = await importRawKey(masterKey, ['decrypt'])
  const decrypted = await getSubtle().decrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(base64ToBytes(iv)) },
    key,
    toArrayBuffer(base64ToBytes(encryptedPayload))
  )
  return JSON.parse(new TextDecoder().decode(decrypted)) as object
}

export function generateBackupKeyPhrase(): string[] {
  const random = Crypto.getRandomBytes(12)
  return Array.from({ length: 12 }, (_, index) => BACKUP_WORDS[random[index] % BACKUP_WORDS.length])
}

export async function deriveKeyFromBackupPhrase(
  phrase: string[],
  salt: string
): Promise<CryptoKey> {
  return deriveKeyFromPassphrase(phrase.join(' '), salt)
}

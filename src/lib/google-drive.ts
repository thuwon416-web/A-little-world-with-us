import 'server-only'

import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const DRIVE_API = 'https://www.googleapis.com/drive/v3/files'
const DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3/files'

function required(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Missing environment variable: ${name}`)
  return value
}

function encryptionKey(): Buffer {
  const raw = required('GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY')
  if (!/^[0-9a-fA-F]{64}$/.test(raw)) {
    throw new Error('GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY must be 64 hex characters.')
  }
  return Buffer.from(raw, 'hex')
}

function adminClient(): SupabaseClient {
  return createClient(required('NEXT_PUBLIC_SUPABASE_URL'), required('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function encrypt(value: string): { ciphertext: string; iv: string } {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return {
    ciphertext: Buffer.concat([encrypted, tag]).toString('base64'),
    iv: iv.toString('base64'),
  }
}

function decrypt(ciphertext: string, iv: string): string {
  const payload = Buffer.from(ciphertext, 'base64')
  const tag = payload.subarray(-16)
  const encrypted = payload.subarray(0, -16)
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(iv, 'base64'))
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
}

function stateSecret(): Buffer {
  return Buffer.from(required('GOOGLE_OAUTH_STATE_SECRET'), 'utf8')
}

export function createOAuthState(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ userId, exp: Date.now() + 10 * 60 * 1000 })).toString('base64url')
  const signature = createHmac('sha256', stateSecret()).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

export function verifyOAuthState(state: string, userId: string): boolean {
  const [payload, signature] = state.split('.')
  if (!payload || !signature) return false
  const expected = createHmac('sha256', stateSecret()).update(payload).digest('base64url')
  if (signature.length !== expected.length) return false
  const valid = timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  if (!valid) return false
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { userId?: string; exp?: number }
    return parsed.userId === userId && typeof parsed.exp === 'number' && parsed.exp > Date.now()
  } catch {
    return false
  }
}

function requireTimingSafeEqual(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && require('node:crypto').timingSafeEqual(a, b)
}

export async function exchangeCode(code: string): Promise<{
  access_token: string
  refresh_token?: string
  expires_in?: number
  scope?: string
}> {
  const body = new URLSearchParams({
    code,
    client_id: required('GOOGLE_CLIENT_ID'),
    client_secret: required('GOOGLE_CLIENT_SECRET'),
    redirect_uri: required('GOOGLE_DRIVE_REDIRECT_URI'),
    grant_type: 'authorization_code',
  })
  const response = await fetch(TOKEN_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })
  const data = (await response.json()) as Record<string, unknown>
  if (!response.ok || typeof data.access_token !== 'string') throw new Error('Google OAuth token exchange failed.')
  return {
    access_token: data.access_token,
    refresh_token: typeof data.refresh_token === 'string' ? data.refresh_token : undefined,
    expires_in: typeof data.expires_in === 'number' ? data.expires_in : undefined,
    scope: typeof data.scope === 'string' ? data.scope : undefined,
  }
}

async function getConnection(userId: string) {
  const { data, error } = await adminClient().from('google_drive_connections').select('*').eq('user_id', userId).maybeSingle()
  if (error) throw error
  return data
}

export async function saveConnection(userId: string, token: Awaited<ReturnType<typeof exchangeCode>>) {
  const access = encrypt(token.access_token)
  const refresh = token.refresh_token ? encrypt(token.refresh_token) : null
  const existing = await getConnection(userId)
  if (!token.refresh_token && existing?.refresh_token_enc && existing.refresh_token_iv) {
    refresh?.ciphertext
    const payload = {
      user_id: userId,
      access_token_enc: access.ciphertext,
      access_token_iv: access.iv,
      refresh_token_enc: existing.refresh_token_enc,
      refresh_token_iv: existing.refresh_token_iv,
      expires_at: token.expires_in ? new Date(Date.now() + token.expires_in * 1000).toISOString() : null,
      scope: token.scope ?? existing.scope ?? DRIVE_SCOPE,
    }
    const { error } = await adminClient().from('google_drive_connections').upsert(payload)
    if (error) throw error
    return
  }
  const { error } = await adminClient().from('google_drive_connections').upsert({
    user_id: userId,
    access_token_enc: access.ciphertext,
    access_token_iv: access.iv,
    refresh_token_enc: refresh?.ciphertext ?? null,
    refresh_token_iv: refresh?.iv ?? null,
    expires_at: token.expires_in ? new Date(Date.now() + token.expires_in * 1000).toISOString() : null,
    scope: token.scope ?? DRIVE_SCOPE,
  })
  if (error) throw error
}

async function refreshAccessToken(userId: string, connection: Record<string, unknown>) {
  const encryptedRefresh = connection.refresh_token_enc
  const refreshIv = connection.refresh_token_iv
  if (typeof encryptedRefresh !== 'string' || typeof refreshIv !== 'string') return null
  const refreshToken = decrypt(encryptedRefresh, refreshIv)
  const body = new URLSearchParams({
    client_id: required('GOOGLE_CLIENT_ID'),
    client_secret: required('GOOGLE_CLIENT_SECRET'),
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  })
  const response = await fetch(TOKEN_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })
  const data = (await response.json()) as Record<string, unknown>
  if (!response.ok || typeof data.access_token !== 'string') throw new Error('Google Drive access token refresh failed.')
  const access = encrypt(data.access_token)
  await adminClient().from('google_drive_connections').update({
    access_token_enc: access.ciphertext,
    access_token_iv: access.iv,
    expires_at: typeof data.expires_in === 'number' ? new Date(Date.now() + data.expires_in * 1000).toISOString() : null,
  }).eq('user_id', userId)
  return data.access_token
}

export async function getDriveAccessToken(userId: string): Promise<string> {
  const connection = await getConnection(userId)
  if (!connection) throw new Error('Google Drive is not connected.')
  const expiresAt = typeof connection.expires_at === 'string' ? Date.parse(connection.expires_at) : 0
  if (expiresAt > Date.now() + 60_000) return decrypt(connection.access_token_enc, connection.access_token_iv)
  const refreshed = await refreshAccessToken(userId, connection)
  if (refreshed) return refreshed
  return decrypt(connection.access_token_enc, connection.access_token_iv)
}

export async function uploadDriveFile(userId: string, file: File, folderId?: string) {
  const accessToken = await getDriveAccessToken(userId)
  const metadata: Record<string, unknown> = { name: file.name, mimeType: file.type || 'application/octet-stream' }
  if (folderId) metadata.parents = [folderId]
  const boundary = `drive-${randomBytes(12).toString('hex')}`
  const bytes = new Uint8Array(await file.arrayBuffer())
  const encoder = new TextEncoder()
  const prefix = encoder.encode(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`)
  const suffix = encoder.encode(`\r\n--${boundary}--`)
  const body = new Uint8Array(prefix.length + bytes.length + suffix.length)
  body.set(prefix, 0); body.set(bytes, prefix.length); body.set(suffix, prefix.length + bytes.length)
  const response = await fetch(DRIVE_UPLOAD_API + '?uploadType=multipart&fields=id,name,mimeType,webViewLink,webContentLink', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  })
  const data = await response.json()
  if (!response.ok) throw new Error(typeof data?.error?.message === 'string' ? data.error.message : 'Google Drive upload failed.')
  return data as { id: string; name: string; mimeType?: string; webViewLink?: string; webContentLink?: string }
}

export async function listDriveFile(userId: string, fileId: string) {
  const accessToken = await getDriveAccessToken(userId)
  const response = await fetch(`${DRIVE_API}/${encodeURIComponent(fileId)}?fields=id,name,mimeType,size,webViewLink,webContentLink,thumbnailLink`, { headers: { Authorization: `Bearer ${accessToken}` } })
  const data = await response.json()
  if (!response.ok) throw new Error(typeof data?.error?.message === 'string' ? data.error.message : 'Google Drive file lookup failed.')
  return data
}

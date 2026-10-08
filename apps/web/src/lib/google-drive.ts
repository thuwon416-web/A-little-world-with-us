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

export type OAuthState = { userId: string; exp: number; returnOrigin?: string }

export function createOAuthState(userId: string, returnOrigin?: string): string {
  const payload = Buffer.from(JSON.stringify({ userId, exp: Date.now() + 10 * 60 * 1000, returnOrigin })).toString('base64url')
  const signature = createHmac('sha256', stateSecret()).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

export function parseOAuthState(state: string): OAuthState | null {
  const [payload, signature] = state.split('.')
  if (!payload || !signature) return null
  const expected = createHmac('sha256', stateSecret()).update(payload).digest('base64url')
  if (signature.length !== expected.length) return null
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Partial<OAuthState>
    if (typeof parsed.userId !== 'string' || typeof parsed.exp !== 'number' || parsed.exp <= Date.now()) return null
    if (parsed.returnOrigin !== undefined && typeof parsed.returnOrigin !== 'string') return null
    return { userId: parsed.userId, exp: parsed.exp, returnOrigin: parsed.returnOrigin }
  } catch {
    return null
  }
}

export function verifyOAuthState(state: string, userId: string): boolean {
  return parseOAuthState(state)?.userId === userId
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
  const { error: updateError } = await adminClient().from('google_drive_connections').update({
    access_token_enc: access.ciphertext,
    access_token_iv: access.iv,
    expires_at: typeof data.expires_in === 'number' ? new Date(Date.now() + data.expires_in * 1000).toISOString() : null,
  }).eq('user_id', userId)
  if (updateError) throw updateError
  return data.access_token
}

export async function getDriveAccessToken(userId: string): Promise<string> {
  const connection = await getConnection(userId)
  if (!connection) throw new Error('Google Drive is not connected.')
  const expiresAt = typeof connection.expires_at === 'string' ? Date.parse(connection.expires_at) : 0
  if (expiresAt > Date.now() + 60_000) return decrypt(connection.access_token_enc, connection.access_token_iv)
  const refreshed = await refreshAccessToken(userId, connection)
  if (refreshed) return refreshed
  throw new Error('Google Drive connection needs to be reconnected.')
}

async function driveFetch(userId: string, input: string, init: RequestInit = {}) {
  let accessToken = await getDriveAccessToken(userId)
  let response = await fetch(input, {
    ...init,
    headers: { ...(init.headers ?? {}), Authorization: `Bearer ${accessToken}` },
  })
  if (response.status !== 401) return response

  const connection = await getConnection(userId)
  const refreshed = connection ? await refreshAccessToken(userId, connection) : null
  if (!refreshed) return response
  accessToken = refreshed
  response = await fetch(input, {
    ...init,
    headers: { ...(init.headers ?? {}), Authorization: `Bearer ${accessToken}` },
  })
  return response
}

function isTrustedDriveUploadSessionUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && (url.hostname === 'www.googleapis.com' || url.hostname.endsWith('.googleapis.com'))
  } catch {
    return false
  }
}

export async function uploadDriveFile(userId: string, file: File, folderId?: string) {
  const accessToken = await getDriveAccessToken(userId)
  const mimeType = file.type || 'application/octet-stream'
  const metadata: Record<string, unknown> = { name: file.name, mimeType }
  if (folderId) metadata.parents = [folderId]

  // Drive recommends resumable uploads for files above 5 MB and for
  // network-sensitive clients. This also avoids multipart's small-file limit.
  const initResponse = await driveFetch(userId, DRIVE_UPLOAD_API + '?uploadType=resumable', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': mimeType,
      'X-Upload-Content-Length': String(file.size),
    },
    body: JSON.stringify(metadata),
  })
  if (!initResponse.ok) {
    const data = await initResponse.json().catch(() => null)
    throw new Error(typeof data?.error?.message === 'string' ? data.error.message : 'Google Drive upload initialization failed.')
  }

  const sessionUrl = initResponse.headers.get('location')
  if (!sessionUrl || !isTrustedDriveUploadSessionUrl(sessionUrl)) {
    throw new Error('Google Drive returned an invalid upload session.')
  }

  let response = await fetch(sessionUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': mimeType,
      'Content-Length': String(file.size),
    },
    body: await file.arrayBuffer(),
  })
  if (response.status === 401) {
    const connection = await getConnection(userId)
    const refreshed = connection ? await refreshAccessToken(userId, connection) : null
    if (refreshed) {
      response = await fetch(sessionUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${refreshed}`,
          'Content-Type': mimeType,
          'Content-Length': String(file.size),
        },
        body: await file.arrayBuffer(),
      })
    }
  }
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(typeof data?.error?.message === 'string' ? data.error.message : 'Google Drive upload failed.')
  }
  return data as { id: string; name: string; mimeType?: string; webViewLink?: string; webContentLink?: string }
}
export async function listDriveFile(userId: string, fileId: string) {
  const response = await driveFetch(userId, `${DRIVE_API}/${encodeURIComponent(fileId)}?fields=id,name,mimeType,size,webViewLink,webContentLink,thumbnailLink`)
  const data = await response.json()
  if (!response.ok) throw new Error(typeof data?.error?.message === 'string' ? data.error.message : 'Google Drive file lookup failed.')
  return data
}


export async function downloadDriveFile(userId: string, fileId: string) {
  const response = await driveFetch(userId, `${DRIVE_API}/${encodeURIComponent(fileId)}?alt=media`)
  if (!response.ok) throw new Error('Google Drive file download failed.')
  return response
}

export async function disconnectDrive(userId: string) {
  const connection = await getConnection(userId)
  if (!connection) return
  const encryptedRefresh = connection.refresh_token_enc
  const refreshIv = connection.refresh_token_iv
  if (typeof encryptedRefresh === 'string' && typeof refreshIv === 'string') {
    try {
      const refreshToken = decrypt(encryptedRefresh, refreshIv)
      await fetch('https://oauth2.googleapis.com/revoke?token=' + encodeURIComponent(refreshToken), { method: 'POST' })
    } catch {
      // Local credentials are still removed even if Google revocation is unavailable.
    }
  }
  const { error } = await adminClient().from('google_drive_connections').delete().eq('user_id', userId)
  if (error) throw error
}

export async function getDriveFileAccess(userId: string, fileId: string) {
  const { data: memory, error: memoryError } = await adminClient()
    .from('memories')
    .select('couple_id,user_id')
    .eq('drive_file_id', fileId)
    .maybeSingle()
  if (memoryError) throw memoryError
  if (!memory?.couple_id || !memory.user_id) return null

  const { data: link, error: linkError } = await adminClient()
    .from('couple_links')
    .select('id')
    .eq('couple_id', memory.couple_id)
    .eq('status', 'accepted')
    .or(`inviter_id.eq.${userId},accepted_by.eq.${userId}`)
    .maybeSingle()
  if (linkError) throw linkError
  if (!link) return null

  return {
    ownerId: memory.user_id as string,
    canDelete: memory.user_id === userId,
  }
}

export async function assertDriveFileAccessible(userId: string, fileId: string) {
  return Boolean(await getDriveFileAccess(userId, fileId))
}

export async function deleteDriveFile(userId: string, fileId: string) {
  const response = await driveFetch(userId, `${DRIVE_API}/${encodeURIComponent(fileId)}`, {
    method: 'DELETE',
  })
  if (!response.ok && response.status !== 404) throw new Error('Google Drive file deletion failed.')
}

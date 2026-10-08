import * as Crypto from 'expo-crypto'
import * as SecureStore from 'expo-secure-store'

import { supabase } from '@/lib/supabase'

const TOKEN_KEY = 'a-little-world-with-us-google-drive-token-v1'
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
const DRIVE_FILES_ENDPOINT = 'https://www.googleapis.com/drive/v3/files'
const DRIVE_UPLOAD_ENDPOINT = 'https://www.googleapis.com/upload/drive/v3/files'
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file'

type StoredToken = {
  accessToken: string
  refreshToken?: string
  expiresAt: number
  scope?: string
  tokenType?: string
}

export type DriveFile = {
  id: string
  name: string
  mimeType: string
  size?: string
  webViewLink?: string
  thumbnailLink?: string
  createdTime?: string
  modifiedTime?: string
}

export const GOOGLE_DRIVE_SCOPE = DRIVE_SCOPE

export function getGoogleDriveClientId() {
  return (
    process.env.EXPO_PUBLIC_GOOGLE_DRIVE_ANDROID_CLIENT_ID ??
    process.env.EXPO_PUBLIC_GOOGLE_DRIVE_IOS_CLIENT_ID ??
    process.env.EXPO_PUBLIC_GOOGLE_DRIVE_CLIENT_ID ??
    ''
  )
}

export function getGoogleDriveClientIdForPlatform(platform: 'android' | 'ios') {
  return (
    (platform === 'android'
      ? process.env.EXPO_PUBLIC_GOOGLE_DRIVE_ANDROID_CLIENT_ID
      : process.env.EXPO_PUBLIC_GOOGLE_DRIVE_IOS_CLIENT_ID) ??
    process.env.EXPO_PUBLIC_GOOGLE_DRIVE_CLIENT_ID ??
    ''
  )
}

export function getGoogleDriveRedirectUri() {
  return 'com.alittleworldwithus.app://oauth2redirect'
}

const MAX_DRIVE_PAGE_SIZE = 100
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024

function validateClientId(clientId: string) {
  if (!clientId.trim()) throw new Error('Google Drive OAuth client ID is not configured.')
}

function validateFileId(fileId: string) {
  if (!/^[A-Za-z0-9_-]+$/.test(fileId)) throw new Error('Invalid Google Drive file ID.')
}

function randomUrlSafeValue() {
  return `${Crypto.randomUUID().replace(/-/g, '')}${Crypto.randomUUID().replace(/-/g, '')}`
}

async function createPkceChallenge(verifier: string) {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    verifier,
    { encoding: Crypto.CryptoEncoding.BASE64 }
  )
  return digest.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export async function createGoogleDriveAuthorizationUrl(clientId: string) {
  validateClientId(clientId)
  const codeVerifier = randomUrlSafeValue()
  const codeChallenge = await createPkceChallenge(codeVerifier)
  const state = randomUrlSafeValue()
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getGoogleDriveRedirectUri(),
    response_type: 'code',
    scope: DRIVE_SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
  })
  return {
    url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    codeVerifier,
    state,
  }
}

async function readToken(): Promise<StoredToken | null> {
  const raw = await SecureStore.getItemAsync(TOKEN_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredToken
  } catch {
    await SecureStore.deleteItemAsync(TOKEN_KEY)
    return null
  }
}

async function writeToken(token: StoredToken, previous?: StoredToken | null) {
  const next: StoredToken = {
    ...token,
    refreshToken: token.refreshToken ?? previous?.refreshToken,
    scope: token.scope ?? previous?.scope,
    tokenType: token.tokenType ?? previous?.tokenType,
  }
  await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(next))
  return next
}

export async function exchangeGoogleDriveCode(
  clientId: string,
  code: string,
  codeVerifier: string
) {
  const body = new URLSearchParams({
    client_id: clientId,
    code,
    code_verifier: codeVerifier,
    redirect_uri: getGoogleDriveRedirectUri(),
    grant_type: 'authorization_code',
  })
  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const data = (await response.json()) as Record<string, unknown>
  if (!response.ok || typeof data.access_token !== 'string') {
    throw new Error(
      typeof data.error_description === 'string'
        ? data.error_description
        : 'Google Drive authorization failed.'
    )
  }
  const expiresIn = typeof data.expires_in === 'number' ? data.expires_in : 3600
  return writeToken({
    accessToken: data.access_token,
    refreshToken: typeof data.refresh_token === 'string' ? data.refresh_token : undefined,
    expiresAt: Date.now() + expiresIn * 1000,
    scope: typeof data.scope === 'string' ? data.scope : DRIVE_SCOPE,
    tokenType: typeof data.token_type === 'string' ? data.token_type : 'Bearer',
  }, await readToken())
}

export async function hasGoogleDriveConnection() {
  return Boolean(await readToken())
}

export async function disconnectGoogleDrive() {
  await SecureStore.deleteItemAsync(TOKEN_KEY)
}

export async function getGoogleDriveAccessToken(clientId: string) {
  const stored = await readToken()
  if (!stored) throw new Error('Google Drive is not connected.')

  if (stored.expiresAt > Date.now() + 60_000) return stored.accessToken
  if (!stored.refreshToken) {
    await disconnectGoogleDrive()
    throw new Error('Google Drive authorization expired. Please connect again.')
  }

  const body = new URLSearchParams({
    client_id: clientId,
    refresh_token: stored.refreshToken,
    grant_type: 'refresh_token',
  })
  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const data = (await response.json()) as Record<string, unknown>
  if (!response.ok || typeof data.access_token !== 'string') {
    await disconnectGoogleDrive()
    throw new Error('Google Drive authorization expired. Please connect again.')
  }
  const expiresIn = typeof data.expires_in === 'number' ? data.expires_in : 3600
  const refreshed = await writeToken({
    accessToken: data.access_token,
    refreshToken: stored.refreshToken,
    expiresAt: Date.now() + expiresIn * 1000,
    scope: typeof data.scope === 'string' ? data.scope : stored.scope,
    tokenType: typeof data.token_type === 'string' ? data.token_type : stored.tokenType,
  }, stored)
  return refreshed.accessToken
}

async function driveRequest(url: string, clientId: string, init?: RequestInit) {
  const accessToken = await getGoogleDriveAccessToken(clientId)
  return fetch(url, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

export async function listGoogleDriveFiles(clientId: string, pageSize = MAX_DRIVE_PAGE_SIZE) {
  validateClientId(clientId)
  const params = new URLSearchParams({
    q: 'trashed = false',
    pageSize: String(Math.min(Math.max(pageSize, 1), MAX_DRIVE_PAGE_SIZE)),
    orderBy: 'modifiedTime desc',
    fields: 'files(id,name,mimeType,size,webViewLink,thumbnailLink,createdTime,modifiedTime)',
  })
  const response = await driveRequest(`${DRIVE_FILES_ENDPOINT}?${params.toString()}`, clientId)
  if (!response.ok) throw new Error(await readDriveError(response))
  const payload = (await response.json()) as { files?: DriveFile[] }
  return payload.files ?? []
}

export async function createGoogleDriveFolder(clientId: string, name: string) {
  validateClientId(clientId)
  const safeName = name.trim()
  if (!safeName) throw new Error('Google Drive folder name is required.')
  const response = await driveRequest(DRIVE_FILES_ENDPOINT, clientId, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: safeName, mimeType: 'application/vnd.google-apps.folder' }),
  })
  if (!response.ok) throw new Error(await readDriveError(response))
  return (await response.json()) as DriveFile
}

export async function uploadGoogleDriveFile(
  clientId: string,
  uri: string,
  name: string,
  mimeType: string,
  parentId?: string
) {
  const fileResponse = await fetch(uri)
  if (!fileResponse.ok) throw new Error('Unable to read the selected media file.')
  const blob = await fileResponse.blob()
  if (blob.size > MAX_UPLOAD_BYTES) throw new Error('Selected media is larger than the 25 MB mobile Drive limit.')
  const metadata = { name, mimeType, ...(parentId ? { parents: [parentId] } : {}) }
  const boundary = `awlu_${Date.now().toString(36)}`
  const body = new Blob([
    `--${boundary}\r\n`,
    'Content-Type: application/json; charset=UTF-8\r\n\r\n',
    JSON.stringify(metadata),
    `\r\n--${boundary}\r\n`,
    `Content-Type: ${mimeType}\r\n\r\n`,
    blob,
    `\r\n--${boundary}--`,
  ])
  const response = await driveRequest(
    `${DRIVE_UPLOAD_ENDPOINT}?uploadType=multipart&fields=id,name,mimeType,size,webViewLink,thumbnailLink,createdTime,modifiedTime`,
    clientId,
    {
      method: 'POST',
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      body,
    }
  )
  if (!response.ok) throw new Error(await readDriveError(response))
  return (await response.json()) as DriveFile
}

export async function downloadGoogleDriveFile(
  clientId: string,
  fileId: string,
  mimeType = 'application/octet-stream'
) {
  validateClientId(clientId)
  validateFileId(fileId)
  const response = await driveRequest(
    `${DRIVE_FILES_ENDPOINT}/${encodeURIComponent(fileId)}?alt=media`,
    clientId
  )
  if (!response.ok) throw new Error(await readDriveError(response))
  return {
    blob: await response.blob(),
    mimeType: response.headers.get('content-type') ?? mimeType,
  }
}

async function readDriveError(response: Response) {
  try {
    const payload = (await response.json()) as { error?: { message?: string } }
    return payload.error?.message ?? `Google Drive request failed (${response.status}).`
  } catch {
    return `Google Drive request failed (${response.status}).`
  }
}

export async function getSharedDriveStatus() {
  const webUrl = process.env.EXPO_PUBLIC_WEB_URL?.replace(/\/$/, '')
  if (!webUrl) return false
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return false
  const response = await fetch(`${webUrl}/api/drive/status`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  })
  if (!response.ok) return false
  const body = (await response.json()) as { connected?: boolean }
  return body.connected === true
}

export async function deleteSharedDriveFile(fileId: string) {
  validateFileId(fileId)
  const webUrl = process.env.EXPO_PUBLIC_WEB_URL?.replace(/\/$/, '')
  if (!webUrl) throw new Error('The shared web service URL is not configured.')
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Please sign in again.')
  const response = await fetch(`${webUrl}/api/drive/delete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ fileId }),
  })
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error || 'Google Drive file deletion failed.')
  }
}


export type SharedDriveMemoryUpload = {
  file: DriveFile
  memory: { id: string; created_at: string }
}

export async function uploadSharedDriveMemory(
  uri: string,
  name: string,
  mimeType: string,
  coupleId: string
): Promise<SharedDriveMemoryUpload> {
  const webUrl = process.env.EXPO_PUBLIC_WEB_URL?.replace(/\/$/, '')
  if (!webUrl) throw new Error('The shared web service URL is not configured.')
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Please sign in again.')
  const source = await fetch(uri)
  if (!source.ok) throw new Error('Unable to read the selected media file.')
  const blob = await source.blob()
  const form = new FormData()
  form.append('file', blob, name)
  form.append('coupleId', coupleId)
  form.append('title', 'A memory together')
  form.append('caption', 'A memory together')
  form.append('category', 'favorite')
  form.append('date', new Date().toISOString().slice(0, 10))
  const response = await fetch(`${webUrl}/api/drive/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.access_token}` },
    body: form,
  })
  const body = (await response.json()) as {
    file?: DriveFile
    memory?: { id: string; created_at: string }
    error?: string
  }
  if (!response.ok || !body.file?.id || !body.memory?.id) {
    throw new Error(body.error || 'Google Drive memory upload failed.')
  }
  return { file: body.file, memory: body.memory }
}

export async function uploadSharedDriveFile(
  uri: string,
  name: string,
  mimeType: string
) {
  const webUrl = process.env.EXPO_PUBLIC_WEB_URL?.replace(/\/$/, '')
  if (!webUrl) throw new Error('The shared web service URL is not configured.')
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Please sign in again.')
  const source = await fetch(uri)
  if (!source.ok) throw new Error('Unable to read the selected media file.')
  const blob = await source.blob()
  const form = new FormData()
  form.append('file', blob, name)
  const response = await fetch(`${webUrl}/api/drive/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.access_token}` },
    body: form,
  })
  const body = (await response.json()) as { file?: DriveFile; error?: string }
  if (!response.ok || !body.file?.id) {
    throw new Error(body.error || 'Google Drive upload failed.')
  }
  return body.file
}

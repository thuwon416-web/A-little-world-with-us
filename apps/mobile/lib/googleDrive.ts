import * as AuthSession from 'expo-auth-session'
import * as SecureStore from 'expo-secure-store'

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

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: TOKEN_ENDPOINT,
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
  return AuthSession.makeRedirectUri({
    scheme: 'com.alittleworldwithus.app',
    path: 'oauth2redirect',
  })
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

async function writeToken(response: AuthSession.TokenResponse, previous?: StoredToken | null) {
  const token: StoredToken = {
    accessToken: response.accessToken,
    refreshToken: response.refreshToken ?? previous?.refreshToken,
    expiresAt: (response.issuedAt + response.expiresIn) * 1000,
    scope: response.scope ?? previous?.scope,
    tokenType: response.tokenType ?? previous?.tokenType,
  }
  await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(token))
  return token
}

export async function saveGoogleDriveToken(response: AuthSession.TokenResponse) {
  return writeToken(response, await readToken())
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

  const response = await AuthSession.refreshAsync(
    {
      clientId,
      refreshToken: stored.refreshToken,
      scopes: [DRIVE_SCOPE],
    },
    { tokenEndpoint: TOKEN_ENDPOINT }
  )
  const refreshed = await writeToken(response, stored)
  return refreshed.accessToken
}

async function driveRequest(
  url: string,
  clientId: string,
  init?: RequestInit
): Promise<Response> {
  const accessToken = await getGoogleDriveAccessToken(clientId)
  let response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (response.status === 401) {
    const refreshedToken = await getGoogleDriveAccessToken(clientId)
    response = await fetch(url, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        Authorization: `Bearer ${refreshedToken}`,
      },
    })
  }

  return response
}

export async function listGoogleDriveFiles(clientId: string, pageSize = 100) {
  const params = new URLSearchParams({
    q: "trashed = false",
    pageSize: String(Math.min(Math.max(pageSize, 1), 1000)),
    orderBy: 'modifiedTime desc',
    fields: 'files(id,name,mimeType,size,webViewLink,thumbnailLink,createdTime,modifiedTime)',
  })
  const response = await driveRequest(
    `${DRIVE_FILES_ENDPOINT}?${params.toString()}`,
    clientId
  )
  if (!response.ok) throw new Error(await readDriveError(response))
  const payload = (await response.json()) as { files?: DriveFile[] }
  return payload.files ?? []
}

export async function createGoogleDriveFolder(clientId: string, name: string) {
  const response = await driveRequest(DRIVE_FILES_ENDPOINT, clientId, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      mimeType: 'application/vnd.google-apps.folder',
    }),
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

  const metadata = {
    name,
    mimeType,
    ...(parentId ? { parents: [parentId] } : {}),
  }
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
  const response = await driveRequest(
    `${DRIVE_FILES_ENDPOINT}/${encodeURIComponent(fileId)}?alt=media`,
    clientId
  )
  if (!response.ok) throw new Error(await readDriveError(response))
  const blob = await response.blob()
  return {
    blob,
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

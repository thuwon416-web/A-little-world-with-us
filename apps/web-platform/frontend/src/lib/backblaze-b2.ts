import 'server-only'

import { createHash } from 'node:crypto'

type B2Auth = {
  apiUrl: string
  downloadUrl: string
  authorizationToken: string
}

type B2UploadTarget = {
  uploadUrl: string
  authorizationToken: string
}

let authCache: { value: B2Auth; expiresAt: number } | null = null

function env(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

function configured() {
  return Boolean(
    process.env.B2_APPLICATION_KEY_ID &&
      process.env.B2_APPLICATION_KEY &&
      process.env.B2_BUCKET_ID &&
      process.env.B2_BUCKET_NAME
  )
}

async function authorize(): Promise<B2Auth> {
  if (authCache && authCache.expiresAt > Date.now() + 60_000) return authCache.value

  const credentials = Buffer.from(
    `${env('B2_APPLICATION_KEY_ID')}:${env('B2_APPLICATION_KEY')}`
  ).toString('base64')

  const response = await fetch('https://api.backblazeb2.com/b2api/v4/b2_authorize_account', {
    headers: { Authorization: `Basic ${credentials}` },
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(`B2 authorization failed with status ${response.status}`)

  const data = (await response.json()) as {
    apiInfo?: { storageApi?: { apiUrl?: string; downloadUrl?: string } }
    authorizationToken?: string
  }
  const storage = data.apiInfo?.storageApi
  if (!storage?.apiUrl || !storage.downloadUrl || !data.authorizationToken) {
    throw new Error('B2 returned an invalid authorization response')
  }

  const value = {
    apiUrl: storage.apiUrl,
    downloadUrl: storage.downloadUrl,
    authorizationToken: data.authorizationToken,
  }
  authCache = { value, expiresAt: Date.now() + 23 * 60 * 60 * 1000 }
  return value
}

async function getUploadTarget(auth: B2Auth): Promise<B2UploadTarget> {
  const response = await fetch(
    `${auth.apiUrl}/b2api/v4/b2_get_upload_url?bucketId=${encodeURIComponent(env('B2_BUCKET_ID'))}`,
    { headers: { Authorization: auth.authorizationToken }, cache: 'no-store' }
  )
  if (!response.ok) throw new Error(`B2 upload target request failed with status ${response.status}`)
  const data = (await response.json()) as Partial<B2UploadTarget>
  if (!data.uploadUrl || !data.authorizationToken) throw new Error('B2 returned an invalid upload target')
  return data as B2UploadTarget
}

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._/-]/g, '_').replace(/^\/+/, '').slice(0, 900)
}

export async function getB2UploadTarget(input: {
  objectName: string
  contentType: string
  contentLength: number
  sha1: string
}) {
  if (!configured()) throw new Error('B2 is not configured')
  const auth = await authorize()
  const target = await getUploadTarget(auth)
  return {
    ...target,
    objectName: safeName(input.objectName),
    contentType: input.contentType || 'application/octet-stream',
    contentLength: input.contentLength,
    sha1: input.sha1,
  }
}

export async function uploadToB2(file: Blob, objectName: string, contentType: string) {
  if (!configured()) throw new Error('B2 is not configured')
  const bytes = new Uint8Array(await file.arrayBuffer())
  const sha1 = createHash('sha1').update(bytes).digest('hex')
  const auth = await authorize()
  const target = await getUploadTarget(auth)

  const response = await fetch(target.uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: target.authorizationToken,
      'X-Bz-File-Name': encodeURIComponent(safeName(objectName)),
      'Content-Type': contentType || 'application/octet-stream',
      'Content-Length': String(bytes.byteLength),
      'X-Bz-Content-Sha1': sha1,
      'X-Bz-Info-src_last_modified_millis': String(Date.now()),
    },
    body: bytes,
  })
  if (!response.ok) throw new Error(`B2 upload failed with status ${response.status}`)
  const data = (await response.json()) as { fileId?: string; fileName?: string; contentLength?: number }
  if (!data.fileId || !data.fileName) throw new Error('B2 returned an invalid upload response')
  return { fileId: data.fileId, fileName: data.fileName, size: data.contentLength ?? bytes.byteLength, sha1 }
}

export async function getB2DownloadUrl(fileName: string, validSeconds = 900) {
  if (!configured()) throw new Error('B2 is not configured')
  const auth = await authorize()
  const response = await fetch(`${auth.apiUrl}/b2api/v4/b2_get_download_authorization`, {
    method: 'POST',
    headers: { Authorization: auth.authorizationToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bucketId: env('B2_BUCKET_ID'),
      fileNamePrefix: safeName(fileName),
      validDurationInSeconds: validSeconds,
    }),
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(`B2 download authorization failed with status ${response.status}`)
  const data = (await response.json()) as { authorizationToken?: string }
  if (!data.authorizationToken) throw new Error('B2 returned an invalid download authorization')
  return `${auth.downloadUrl}/file/${encodeURIComponent(env('B2_BUCKET_NAME'))}/${safeName(fileName).split('/').map(encodeURIComponent).join('/')}`
    + `?Authorization=${encodeURIComponent(data.authorizationToken)}`
}

export function isB2Configured() {
  return configured()
}

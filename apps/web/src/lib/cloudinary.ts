import 'server-only'

import { createHash, randomUUID } from 'node:crypto'

type CloudinaryUploadResult = {
  asset_id: string
  public_id: string
  secure_url: string
  resource_type: string
  format?: string
  bytes: number
  width?: number
  height?: number
  duration?: number
}

function requiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

function signParams(params: Record<string, string>): string {
  const apiSecret = requiredEnv('CLOUDINARY_API_SECRET')
  const serialized = Object.entries(params)
    .filter(([, value]) => value !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&')
  return createHash('sha1').update(serialized + apiSecret).digest('hex')
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  )
}

export async function uploadMemoryToCloudinary(
  file: File,
  coupleId: string
): Promise<CloudinaryUploadResult> {
  const cloudName = requiredEnv('CLOUDINARY_CLOUD_NAME')
  const apiKey = requiredEnv('CLOUDINARY_API_KEY')
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const publicId = `memory-${randomUUID()}`
  const folder = `couples/${coupleId}/memories`

  const signedParams = {
    folder,
    public_id: publicId,
    timestamp,
  }

  const body = new FormData()
  body.append('file', file)
  body.append('api_key', apiKey)
  body.append('folder', folder)
  body.append('public_id', publicId)
  body.append('timestamp', timestamp)
  body.append('signature', signParams(signedParams))

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/auto/upload`,
    { method: 'POST', body }
  )

  if (!response.ok) {
    throw new Error(`Cloudinary upload failed with status ${response.status}`)
  }

  const data = (await response.json()) as Partial<CloudinaryUploadResult>
  if (!data.asset_id || !data.public_id || !data.secure_url || typeof data.bytes !== 'number') {
    throw new Error('Cloudinary returned an invalid upload response')
  }

  return data as CloudinaryUploadResult
}

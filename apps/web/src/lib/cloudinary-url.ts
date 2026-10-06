import 'server-only'

import { createHash } from 'node:crypto'

function env(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

export function createPrivateCloudinaryUrl(publicId: string, format: string = 'webp', expiresInSeconds = 3600): string {
  const cloudName = env('CLOUDINARY_CLOUD_NAME')
  const apiKey = env('CLOUDINARY_API_KEY')
  const secret = env('CLOUDINARY_API_SECRET')
  const timestamp = Math.floor(Date.now() / 1000)
  const expiresAt = timestamp + expiresInSeconds
  const stringToSign = [
    `expires_at=${expiresAt}`,
    `format=${format}`,
    `public_id=${publicId}`,
    `timestamp=${timestamp}`,
  ].sort().join('&')
  const signature = createHash('sha256').update(stringToSign + secret).digest('hex')
  const params = new URLSearchParams({
    timestamp: String(timestamp),
    public_id: publicId,
    format,
    expires_at: String(expiresAt),
    signature,
    api_key: apiKey,
  })
  return `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/download?${params.toString()}`
}

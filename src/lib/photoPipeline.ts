/**
 * Photo Pipeline - Complete
 * EXIF strip, thumbnail generation, compression, ZIP export
 */

import JSZip from 'jszip'

export interface ProcessedImage {
  blob: Blob
  url: string
  width: number
  height: number
  exifStripped: boolean
}

/**
 * Strip EXIF data from image (privacy protection)
 */
export async function stripEXIF(file: File): Promise<Blob> {
  const img = new Image()
  const url = URL.createObjectURL(file)

  return new Promise((resolve) => {
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height

      const ctx = canvas.getContext('2d')
      ctx?.drawImage(img, 0, 0)

      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
      }, 'image/jpeg', 0.9)

      URL.revokeObjectURL(url)
    }

    img.src = url
  })
}

/**
 * Generate thumbnail from image
 */
export async function generateThumbnail(
  file: File | Blob,
  maxSize: number = 400
): Promise<Blob> {
  const img = new Image()
  const url = file instanceof File ? URL.createObjectURL(file) : URL.createObjectURL(file)

  return new Promise((resolve) => {
    img.onload = () => {
      let width = img.width
      let height = img.height

      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height)
        width = Math.floor(width * ratio)
        height = Math.floor(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      ctx?.drawImage(img, 0, 0, width, height)

      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
      }, 'image/webp', 0.8)

      URL.revokeObjectURL(url)
    }

    img.src = url
  })
}

/**
 * Compress image to WebP format
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1920,
  quality: number = 0.8
): Promise<ProcessedImage> {
  const img = new Image()
  const url = URL.createObjectURL(file)

  return new Promise((resolve, reject) => {
    img.onload = () => {
      let width = img.width
      let height = img.height

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = Math.floor(width * ratio)
        height = Math.floor(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      ctx?.drawImage(img, 0, 0, width, height)

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Compression failed'))
          return
        }

        const processedUrl = URL.createObjectURL(blob)
        resolve({
          blob,
          url: processedUrl,
          width,
          height,
          exifStripped: true,
        })
      }, 'image/webp', quality)

      URL.revokeObjectURL(url)
    }

    img.onerror = () => reject(new Error('Image load failed'))
    img.src = url
  })
}

/**
 * Export multiple photos as ZIP file
 */
export async function exportPhotosAsZIP(
  photos: Array<{ url: string; filename: string }>
): Promise<Blob> {
  const zip = new JSZip()

  for (const photo of photos) {
    const response = await fetch(photo.url)
    const blob = await response.blob()
    zip.file(photo.filename, blob)
  }

  return await zip.generateAsync({ type: 'blob' })
}

/**
 * Calculate storage quota usage
 */
export async function getStorageQuotaUsage(): Promise<{
  usage: number
  quota: number
  percentUsed: number
}> {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate()
    const usage = estimate.usage || 0
    const quota = estimate.quota || 0
    const percentUsed = quota > 0 ? (usage / quota) * 100 : 0

    return { usage, quota, percentUsed }
  }

  return { usage: 0, quota: 0, percentUsed: 0 }
}

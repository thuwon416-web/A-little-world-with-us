/**
 * Image Compression for Chat Photos
 * Converts to WebP and compresses
 */

export interface CompressedImage {
  blob: Blob
  url: string
  width: number
  height: number
}

export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1920,
  quality: number = 0.8
): Promise<CompressedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      // Calculate new dimensions
      let width = img.width
      let height = img.height

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = Math.floor(width * ratio)
        height = Math.floor(height * ratio)
      }

      // Create canvas
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas not supported'))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      // Convert to WebP
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Compression failed'))
            return
          }

          const compressedUrl = URL.createObjectURL(blob)
          resolve({ blob, url: compressedUrl, width, height })
        },
        'image/webp',
        quality
      )

      URL.revokeObjectURL(url)
    }

    img.onerror = () => {
      reject(new Error('Image load failed'))
    }

    img.src = url
  })
}

export async function uploadChatPhoto(
  blob: Blob,
  coupleId: string,
  messageId: string
): Promise<string> {
  const { supabase } = await import('./supabase')
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const fileName = `${coupleId}/${messageId}-${Date.now()}.webp`

  const { error } = await supabase.storage
    .from('chat_photos')
    .upload(fileName, blob, {
      contentType: 'image/webp',
      upsert: false,
    })

  if (error) throw error

  const { data: urlData } = supabase.storage
    .from('chat_photos')
    .getPublicUrl(fileName)

  return urlData.publicUrl
}

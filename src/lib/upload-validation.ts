export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const

export const ALLOWED_FILE_TYPES = [...ALLOWED_IMAGE_TYPES, 'application/pdf'] as const

type UploadValidationOptions = {
  imagesOnly?: boolean
}

export function validateUpload(
  file: Pick<File, 'name' | 'size' | 'type'>,
  options: UploadValidationOptions = {}
): { valid: boolean; error?: string } {
  if (file.size > MAX_UPLOAD_SIZE) {
    return {
      valid: false,
      error: `${file.name}: files must be 5 MB or smaller.`,
    }
  }

  const type = file.type.toLowerCase()
  if (!type || !ALLOWED_FILE_TYPES.includes(type as (typeof ALLOWED_FILE_TYPES)[number])) {
    return {
      valid: false,
      error: `${file.name}: unsupported file type. Choose a JPEG, PNG, WebP, GIF, or PDF.`,
    }
  }

  if (options.imagesOnly && !ALLOWED_IMAGE_TYPES.includes(type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return {
      valid: false,
      error: `${file.name}: choose a JPEG, PNG, WebP, or GIF image.`,
    }
  }

  return { valid: true }
}

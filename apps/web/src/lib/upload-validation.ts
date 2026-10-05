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

const MAGIC_SIGNATURES: Record<string, (bytes: Uint8Array) => boolean> = {
  'image/jpeg': (bytes) => bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  'image/png': (bytes) =>
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a,
  'image/webp': (bytes) =>
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50,
  'image/gif': (bytes) =>
    bytes.length >= 6 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38 &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) &&
    bytes[5] === 0x61,
  'application/pdf': (bytes) =>
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d,
}

export async function validateUploadContent(
  file: File,
  options: UploadValidationOptions = {}
): Promise<{ valid: boolean; error?: string }> {
  const result = validateUpload(file, options)
  if (!result.valid) return result

  const signature = MAGIC_SIGNATURES[file.type.toLowerCase()]
  if (!signature) return { valid: false, error: `${file.name}: unsupported file signature.` }

  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer())
  if (!signature(bytes)) {
    return {
      valid: false,
      error: `${file.name}: file contents do not match the declared file type.`,
    }
  }

  return { valid: true }
}

export function validateMemoryMetadata(input: {
  title: string
  caption: string
  category: string
  date: string
}): { valid: boolean; error?: string } {
  if (input.title.length < 1 || input.title.length > 120) {
    return { valid: false, error: 'Title must be between 1 and 120 characters.' }
  }
  if (input.caption.length > 2000) {
    return { valid: false, error: 'Caption must be 2,000 characters or fewer.' }
  }
  if (!/^(favorite|travel|ritual|journal)$/.test(input.category)) {
    return { valid: false, error: 'Invalid memory category.' }
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    return { valid: false, error: 'Invalid memory date.' }
  }
  const parsed = new Date(`${input.date}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== input.date) {
    return { valid: false, error: 'Invalid memory date.' }
  }
  return { valid: true }
}

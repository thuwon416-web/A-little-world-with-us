import { describe, expect, it } from 'vitest'
import { validateMemoryMetadata, validateUpload, validateUploadContent } from './upload-validation'

function file(bytes: number[], type: string, name = 'upload.bin'): File {
  return new File([new Uint8Array(bytes)], name, { type })
}

describe('upload validation', () => {
  it('rejects files larger than the configured limit', () => {
    const result = validateUpload(
      { name: 'large.jpg', size: 5 * 1024 * 1024 + 1, type: 'image/jpeg' }
    )
    expect(result.valid).toBe(false)
  })

  it('rejects a MIME-spoofed image', async () => {
    const result = await validateUploadContent(file([0x25, 0x50, 0x44, 0x46, 0x2d], 'image/jpeg', 'spoof.jpg'), { imagesOnly: true })
    expect(result.valid).toBe(false)
  })

  it('accepts a real JPEG signature', async () => {
    const result = await validateUploadContent(file([0xff, 0xd8, 0xff, 0xe0], 'image/jpeg', 'photo.jpg'), { imagesOnly: true })
    expect(result.valid).toBe(true)
  })

  it('rejects PDFs for memory image uploads', async () => {
    const result = await validateUploadContent(file([0x25, 0x50, 0x44, 0x46, 0x2d], 'application/pdf', 'doc.pdf'), { imagesOnly: true })
    expect(result.valid).toBe(false)
  })

  it('validates memory metadata bounds and category', () => {
    expect(validateMemoryMetadata({
      title: 'A memory',
      caption: 'A caption',
      category: 'favorite',
      date: '2026-10-05',
    }).valid).toBe(true)

    expect(validateMemoryMetadata({
      title: '',
      caption: '',
      category: 'favorite',
      date: '2026-10-05',
    }).valid).toBe(false)

    expect(validateMemoryMetadata({
      title: 'A memory',
      caption: 'A caption',
      category: 'unknown',
      date: '2026-10-05',
    }).valid).toBe(false)
  })
})

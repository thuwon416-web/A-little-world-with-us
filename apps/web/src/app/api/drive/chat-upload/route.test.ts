import { describe, expect, it, vi, beforeEach } from 'vitest'

const { getUser, from, getOrCreateDriveRootFolder, getOrCreateDriveFolder, uploadDriveFile, checkRateLimit } = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  getOrCreateDriveRootFolder: vi.fn(),
  getOrCreateDriveFolder: vi.fn(),
  uploadDriveFile: vi.fn(),
  checkRateLimit: vi.fn(),
}))

vi.mock('@/lib/supabase-server', () => ({
  createServerClient: async () => ({ auth: { getUser }, from }),
}))
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ auth: { getUser }, from })),
}))
vi.mock('@/lib/google-drive', () => ({ getOrCreateDriveRootFolder, getOrCreateDriveFolder, uploadDriveFile }))
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit }))

import { POST } from './route'

function imageFile() {
  const bytes = new Uint8Array([
    0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0,
    0x57, 0x45, 0x42, 0x50, 0,
  ])
  return new File([bytes], 'chat.webp', { type: 'image/webp' })
}

describe('POST /api/drive/chat-upload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    checkRateLimit.mockResolvedValue({ allowed: true, resetTime: Date.now() + 60000 })
    getOrCreateDriveRootFolder.mockResolvedValue({ id: 'root-1' })
    getOrCreateDriveFolder.mockImplementation(async (_userId: string, name: string) => ({ id: 'folder-' + name }))
    uploadDriveFile.mockResolvedValue({ id: 'drive-chat-1', name: 'chat.webp', mimeType: 'image/webp' })
    const coupleQuery = {
      select: vi.fn(() => coupleQuery),
      eq: vi.fn(() => coupleQuery),
      or: vi.fn(() => coupleQuery),
      maybeSingle: vi.fn(async () => ({ data: { id: 'link-1' }, error: null })),
    }
    from.mockReturnValue(coupleQuery)
  })

  it('requires an image and couple id', async () => {
    const response = await POST(new Request('https://a-little-world-with-us.vercel.app/api/drive/chat-upload', {
      method: 'POST',
      body: new FormData(),
    }))
    expect(response.status).toBe(400)
  })

  it('uploads an authorized image into the Drive chat path', async () => {
    const form = new FormData()
    form.set('coupleId', 'couple-1')
    form.set('file', imageFile())
    const response = await POST(new Request('https://a-little-world-with-us.vercel.app/api/drive/chat-upload', {
      method: 'POST',
      body: form,
    }))
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ storageProvider: 'google_drive', storageFileId: 'drive-chat-1' })
    expect(uploadDriveFile).toHaveBeenCalled()
  })
})

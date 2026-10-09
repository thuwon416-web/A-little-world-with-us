// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from 'vitest'

const { getUser, uploadDriveFile, deleteDriveFile, deleteDriveFolder, getOrCreateDriveCoupleFolder, getOrCreateDriveFolder, checkRateLimit, isSameOriginRequest, from } = vi.hoisted(() => ({
  getUser: vi.fn(),
  uploadDriveFile: vi.fn(),
  deleteDriveFile: vi.fn(),
  deleteDriveFolder: vi.fn(),
  getOrCreateDriveCoupleFolder: vi.fn(),
  getOrCreateDriveFolder: vi.fn(),
  checkRateLimit: vi.fn(),
  isSameOriginRequest: vi.fn(),
  from: vi.fn(),
}))

vi.mock('@/lib/supabase-server', () => ({
  createServerClient: async () => ({ auth: { getUser }, from }),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ auth: { getUser }, from })),
}))

vi.mock('@/lib/google-drive', () => ({
  uploadDriveFile,
  deleteDriveFile,
  deleteDriveFolder,
  getOrCreateDriveCoupleFolder,
  getOrCreateDriveFolder,
}))

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit,
}))
vi.mock('@/lib/csrf', () => ({ isSameOriginRequest }))

import { POST } from './route'

function makeSupabase({ couple = { id: 'link-1' }, memory = { id: 'memory-1', created_at: 'now' }, memoryError = null } = {}) {
  const coupleQuery = {
    select: vi.fn(() => coupleQuery),
    eq: vi.fn(() => coupleQuery),
    or: vi.fn(() => coupleQuery),
    maybeSingle: vi.fn(async () => ({ data: couple, error: null })),
  }
  const memoryQuery = {
    insert: vi.fn(() => memoryQuery),
    select: vi.fn(() => memoryQuery),
    single: vi.fn(async () => ({ data: memory, error: memoryError })),
  }
  from.mockImplementation((table: string) => table === 'couple_links' ? coupleQuery : memoryQuery)
  return { coupleQuery, memoryQuery }
}

function imageFile() {
  const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xd9])
  return new File([bytes], 'memory.jpg', { type: 'image/jpeg' })
}

describe('POST /api/drive/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isSameOriginRequest.mockReturnValue(true)
    getUser.mockResolvedValue({ data: { user: null } })
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4, resetTime: Date.now() + 60000 })
    uploadDriveFile.mockResolvedValue({ id: 'drive-1', mimeType: 'image/jpeg' })
    deleteDriveFile.mockResolvedValue(undefined)
    deleteDriveFolder.mockResolvedValue(undefined)
    getOrCreateDriveCoupleFolder.mockResolvedValue({ id: 'couple-folder-1' })
    getOrCreateDriveFolder.mockImplementation(async (_userId: string, name: string) => ({ id: 'folder-' + name }))
    makeSupabase()
  })

  it('requires authentication', async () => {
    const response = await POST(new Request('https://a-little-world-with-us.vercel.app/api/drive/upload', { method: 'POST' }))
    expect(response.status).toBe(401)
  })

  it('rejects requests over the per-user upload limit before reading the file', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    checkRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetTime: 123 })
    const response = await POST(new Request('https://a-little-world-with-us.vercel.app/api/drive/upload', { method: 'POST' }))
    expect(response.status).toBe(429)
    expect(uploadDriveFile).not.toHaveBeenCalled()
  })

  it('requires a file and couple id', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    const form = new FormData()
    const response = await POST(new Request('https://a-little-world-with-us.vercel.app/api/drive/upload', {
      method: 'POST',
      body: form,
    }))
    expect(response.status).toBe(400)
  })

  it('rejects callers who are not members of the accepted couple', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    makeSupabase({ couple: null })
    const form = new FormData()
    form.set('file', imageFile())
    form.set('coupleId', 'couple-1')
    const response = await POST(new Request('https://a-little-world-with-us.vercel.app/api/drive/upload', {
      method: 'POST',
      body: form,
    }))
    expect(response.status).toBe(403)
    expect(uploadDriveFile).not.toHaveBeenCalled()
  })

  it('rolls back the Drive object when metadata persistence fails', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    makeSupabase({ memory: null, memoryError: { message: 'insert failed' } })
    const form = new FormData()
    form.set('file', imageFile())
    form.set('coupleId', 'couple-1')
    form.set('title', 'Our memory')
    form.set('caption', 'A test')
    form.set('category', 'favorite')
    form.set('date', '2026-10-08')
    const response = await POST(new Request('https://a-little-world-with-us.vercel.app/api/drive/upload', {
      method: 'POST',
      body: form,
    }))
    expect(response.status).toBe(400)
    expect(deleteDriveFile).toHaveBeenCalledWith('user-1', 'drive-1')
  })
})

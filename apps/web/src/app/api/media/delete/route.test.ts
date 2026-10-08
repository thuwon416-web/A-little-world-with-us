import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getUser, from, deleteDriveFile, deleteCloudinaryAsset, isSameOriginRequest, checkRateLimit } = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  deleteDriveFile: vi.fn(),
  deleteCloudinaryAsset: vi.fn(),
  isSameOriginRequest: vi.fn(),
  checkRateLimit: vi.fn(),
}))

vi.mock('@/lib/supabase-server', () => ({
  createServerClient: async () => ({ auth: { getUser }, from }),
}))
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ auth: { getUser }, from })),
}))
vi.mock('@/lib/google-drive', () => ({ deleteDriveFile }))
vi.mock('@/lib/cloudinary', () => ({ deleteCloudinaryAsset }))
vi.mock('@/lib/csrf', () => ({ isSameOriginRequest }))
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit }))

import { POST } from './route'

function memoryQuery(memory: any) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    maybeSingle: vi.fn().mockResolvedValue({ data: memory, error: null }),
    delete: vi.fn(() => query),
  }
  return query
}

describe('POST /api/media/delete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isSameOriginRequest.mockReturnValue(true)
    getUser.mockResolvedValue({ data: { user: null } })
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 9, resetTime: Date.now() + 60000 })
    deleteDriveFile.mockResolvedValue(undefined)
    deleteCloudinaryAsset.mockResolvedValue(undefined)
    from.mockReturnValue(memoryQuery(null))
  })

  it('rejects cross-origin deletion before session access', async () => {
    isSameOriginRequest.mockReturnValue(false)
    const response = await POST(new Request('https://a-little-world-with-us.vercel.app/api/media/delete', { method: 'POST' }))
    expect(response.status).toBe(403)
    expect(getUser).not.toHaveBeenCalled()
  })

  it('requires authentication', async () => {
    const response = await POST(new Request('https://a-little-world-with-us.vercel.app/api/media/delete', {
      method: 'POST',
      body: JSON.stringify({ memoryId: 'memory-1' }),
      headers: { 'content-type': 'application/json' },
    }))
    expect(response.status).toBe(401)
  })

  it('rate limits deletion before reading memory data', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    checkRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetTime: 123 })
    const response = await POST(new Request('https://a-little-world-with-us.vercel.app/api/media/delete', {
      method: 'POST',
      body: JSON.stringify({ memoryId: 'memory-1' }),
      headers: { 'content-type': 'application/json' },
    }))
    expect(response.status).toBe(429)
    expect(from).not.toHaveBeenCalled()
  })

  it('blocks deletion by a different memory owner', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    from.mockReturnValue(memoryQuery({
      id: 'memory-1',
      user_id: 'owner-1',
      storage_provider: 'google_drive',
      drive_file_id: 'drive-1',
    }))
    const response = await POST(new Request('https://a-little-world-with-us.vercel.app/api/media/delete', {
      method: 'POST',
      body: JSON.stringify({ memoryId: 'memory-1' }),
      headers: { 'content-type': 'application/json' },
    }))
    expect(response.status).toBe(403)
    expect(deleteDriveFile).not.toHaveBeenCalled()
  })

  it('deletes an owned Drive-backed memory asset', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    const query = memoryQuery({
      id: 'memory-1',
      user_id: 'user-1',
      storage_provider: 'google_drive',
      drive_file_id: 'drive-1',
    })
    from.mockReturnValue(query)
    const response = await POST(new Request('https://a-little-world-with-us.vercel.app/api/media/delete', {
      method: 'POST',
      body: JSON.stringify({ memoryId: 'memory-1' }),
      headers: { 'content-type': 'application/json' },
    }))
    expect(response.status).toBe(200)
    expect(deleteDriveFile).toHaveBeenCalledWith('user-1', 'drive-1')
  })
})

import { describe, expect, it, vi, beforeEach } from 'vitest'

const { getUser, getDriveFileAccess, listDriveFile, downloadDriveFile, checkRateLimit, logEvent } = vi.hoisted(() => ({
  getUser: vi.fn(),
  getDriveFileAccess: vi.fn(),
  listDriveFile: vi.fn(),
  downloadDriveFile: vi.fn(),
  checkRateLimit: vi.fn(),
  logEvent: vi.fn(),
}))

vi.mock('@/lib/supabase-server', () => ({
  createServerClient: async () => ({ auth: { getUser } }),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ auth: { getUser } })),
}))

vi.mock('@/lib/google-drive', () => ({
  getDriveFileAccess,
  listDriveFile,
  downloadDriveFile,
}))

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit,
}))
vi.mock('@/lib/observability', () => ({ logEvent }))

import { GET } from './route'

describe('GET /api/drive/file', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getUser.mockResolvedValue({ data: { user: null } })
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 29, resetTime: Date.now() + 60000 })
    logEvent.mockResolvedValue(undefined)
  })

  it('requires authentication', async () => {
    const response = await GET(new Request('https://a-little-world-with-us.vercel.app/api/drive/file?fileId=file-1'))
    expect(response.status).toBe(401)
  })

  it('rejects malformed file ids before calling Drive', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    const response = await GET(new Request('https://a-little-world-with-us.vercel.app/api/drive/file?fileId=bad%2Fid'))
    expect(response.status).toBe(400)
    expect(getDriveFileAccess).not.toHaveBeenCalled()
  })

  it('returns 429 when the per-file rate limit is exceeded', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    checkRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetTime: 123 })
    const response = await GET(new Request('https://a-little-world-with-us.vercel.app/api/drive/file?fileId=file-1'))
    expect(response.status).toBe(429)
    expect(getDriveFileAccess).not.toHaveBeenCalled()
  })

  it('enforces ownership/access before reading a file', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    getDriveFileAccess.mockResolvedValue(null)
    const response = await GET(new Request('https://a-little-world-with-us.vercel.app/api/drive/file?fileId=file-1'))
    expect(response.status).toBe(404)
    expect(listDriveFile).not.toHaveBeenCalled()
    expect(downloadDriveFile).not.toHaveBeenCalled()
    expect(logEvent).toHaveBeenCalledWith('drive_media_access_denied', expect.objectContaining({ user_id: 'user-1' }))
  })

  it('logs accepted-member reads of orphaned media as a distinct event', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'partner-1' } } })
    getDriveFileAccess.mockResolvedValue({ ownerId: null, accessUserId: 'partner-1', canDelete: false, readOnlyOrphaned: true, recordType: 'memory', recordId: 'memory-1' })
    listDriveFile.mockResolvedValue({ id: 'file-1', name: 'memory.jpg' })
    const response = await GET(new Request('https://a-little-world-with-us.vercel.app/api/drive/file?fileId=file-1'))
    expect(response.status).toBe(200)
    expect(logEvent).toHaveBeenCalledWith('drive_orphan_media_access', expect.objectContaining({ user_id: 'partner-1', access_mode: 'metadata' }))
  })

  it('returns metadata for an authorized file', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    getDriveFileAccess.mockResolvedValue({ ownerId: 'owner-1', canDelete: true })
    listDriveFile.mockResolvedValue({ id: 'file-1', name: 'memory.jpg' })
    const response = await GET(new Request('https://a-little-world-with-us.vercel.app/api/drive/file?fileId=file-1'))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ file: { id: 'file-1', name: 'memory.jpg' }, readOnlyOrphaned: false })
    expect(listDriveFile).toHaveBeenCalledWith('owner-1', 'file-1')
  })
})

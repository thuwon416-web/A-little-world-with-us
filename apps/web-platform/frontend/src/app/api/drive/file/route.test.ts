import { describe, expect, it, vi, beforeEach } from 'vitest'

const { getUser, getDriveFileAccess, listDriveFile, downloadDriveFile, checkRateLimit, logDriveMediaAccess } = vi.hoisted(() => ({
  getUser: vi.fn(),
  getDriveFileAccess: vi.fn(),
  listDriveFile: vi.fn(),
  downloadDriveFile: vi.fn(),
  checkRateLimit: vi.fn(),
  logDriveMediaAccess: vi.fn(),
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
  logDriveMediaAccess,
}))

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit,
}))

import { GET } from './route'

describe('GET /api/drive/file', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getUser.mockResolvedValue({ data: { user: null } })
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 29, resetTime: Date.now() + 60000 })
    logDriveMediaAccess.mockResolvedValue(undefined)
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
    expect(logDriveMediaAccess).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1', outcome: 'denied', orphaned: false }))
  })

  it('logs accepted-member reads of orphaned media as a distinct event', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'partner-1' } } })
    getDriveFileAccess.mockResolvedValue({ ownerId: null, accessUserId: 'partner-1', canDelete: false, readOnlyOrphaned: true, recordType: 'memory', recordId: 'memory-1' })
    listDriveFile.mockResolvedValue({ id: 'file-1', name: 'memory.jpg' })
    const response = await GET(new Request('https://a-little-world-with-us.vercel.app/api/drive/file?fileId=file-1'))
    expect(response.status).toBe(200)
    expect(logDriveMediaAccess).toHaveBeenCalledWith(expect.objectContaining({ userId: 'partner-1', action: 'read', outcome: 'allowed', orphaned: true }))
  })

  it('returns file bytes to an accepted partner only when Drive authorizes the orphan read', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'partner-1' } } })
    getDriveFileAccess.mockResolvedValue({ ownerId: null, accessUserId: 'partner-1', canDelete: false, readOnlyOrphaned: true, recordType: 'message', recordId: 'message-1' })
    downloadDriveFile.mockResolvedValue(new Response('authorized file bytes', { status: 200 }))
    const response = await GET(new Request('https://a-little-world-with-us.vercel.app/api/drive/file?fileId=file-1&download=1'))
    expect(response.status).toBe(200)
    expect(await response.text()).toBe('authorized file bytes')
    expect(downloadDriveFile).toHaveBeenCalledWith('partner-1', 'file-1')
    expect(logDriveMediaAccess).toHaveBeenCalledWith(expect.objectContaining({ userId: 'partner-1', orphaned: true, outcome: 'allowed' }))
  })

  it('does not return bytes when the caller has no accepted couple membership', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'stranger-1' } } })
    getDriveFileAccess.mockResolvedValue(null)
    const response = await GET(new Request('https://a-little-world-with-us.vercel.app/api/drive/file?fileId=file-1&download=1'))
    expect(response.status).toBe(404)
    expect(await response.text()).not.toContain('authorized file bytes')
    expect(downloadDriveFile).not.toHaveBeenCalled()
  })

  it('denies orphaned reads when the caller is not an accepted member and audits the attempt', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'stranger-1' } } })
    getDriveFileAccess.mockResolvedValue({ ownerId: null, accessUserId: null, canDelete: false, readOnlyOrphaned: true, accessDenied: true, recordType: 'memory', recordId: 'memory-1' })
    const response = await GET(new Request('https://a-little-world-with-us.vercel.app/api/drive/file?fileId=file-1&download=1'))
    expect(response.status).toBe(404)
    expect(downloadDriveFile).not.toHaveBeenCalled()
    expect(logDriveMediaAccess).toHaveBeenCalledWith(expect.objectContaining({ userId: 'stranger-1', outcome: 'denied', orphaned: true }))
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

import { describe, expect, it, vi, beforeEach } from 'vitest'

const { getUser, getDriveFileAccess, deleteDriveFile, checkRateLimit, isSameOriginRequest, from, logDriveMediaAccess } = vi.hoisted(() => ({
  getUser: vi.fn(),
  getDriveFileAccess: vi.fn(),
  deleteDriveFile: vi.fn(),
  checkRateLimit: vi.fn(),
  isSameOriginRequest: vi.fn(),
  from: vi.fn(),
  logDriveMediaAccess: vi.fn(),
}))

vi.mock('@/lib/supabase-server', () => ({
  createServerClient: async () => ({ auth: { getUser }, from }),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ auth: { getUser }, from })),
}))

vi.mock('@/lib/google-drive', () => ({
  getDriveFileAccess,
  deleteDriveFile,
  logDriveMediaAccess,
}))

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit,
}))
vi.mock('@/lib/csrf', () => ({ isSameOriginRequest }))


import { POST } from './route'

describe('POST /api/drive/delete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isSameOriginRequest.mockReturnValue(true)
    logDriveMediaAccess.mockResolvedValue(undefined)
    getUser.mockResolvedValue({ data: { user: null } })
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 9, resetTime: Date.now() + 60000 })
    from.mockImplementation(() => ({
      update: vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) })),
      delete: vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) })),
    }))
  })

  it('requires authentication', async () => {
    const response = await POST(new Request('https://a-little-world-with-us.vercel.app/api/drive/delete', {
      method: 'POST',
      body: JSON.stringify({ fileId: 'file-1' }),
    }))
    expect(response.status).toBe(401)
  })

  it('rejects malformed file ids', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    const response = await POST(new Request('https://a-little-world-with-us.vercel.app/api/drive/delete', {
      method: 'POST',
      body: JSON.stringify({ fileId: '../file' }),
      headers: { 'content-type': 'application/json' },
    }))
    expect(response.status).toBe(400)
    expect(getDriveFileAccess).not.toHaveBeenCalled()
  })

  it('blocks deletion when the caller is not the memory owner', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    getDriveFileAccess.mockResolvedValue({ ownerId: 'owner-1', canDelete: false })
    const response = await POST(new Request('https://a-little-world-with-us.vercel.app/api/drive/delete', {
      method: 'POST',
      body: JSON.stringify({ fileId: 'file-1' }),
      headers: { 'content-type': 'application/json' },
    }))
    expect(response.status).toBe(403)
    expect(deleteDriveFile).not.toHaveBeenCalled()
  })

  it('logs and rejects deletion of orphaned media', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'partner-1' } } })
    getDriveFileAccess.mockResolvedValue({ ownerId: null, canDelete: false, readOnlyOrphaned: true, recordType: 'memory', recordId: 'memory-1' })
    const response = await POST(new Request('https://a-little-world-with-us.vercel.app/api/drive/delete', { method: 'POST', body: JSON.stringify({ fileId: 'file-1' }), headers: { 'content-type': 'application/json' } }))
    expect(response.status).toBe(403)
    expect(deleteDriveFile).not.toHaveBeenCalled()
    expect(logDriveMediaAccess).toHaveBeenCalledWith(expect.objectContaining({ userId: 'partner-1', action: 'delete', outcome: 'denied', orphaned: true }))
  })

  it('denies deletion when no accepted couple member can resolve the file', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'stranger-1' } } })
    getDriveFileAccess.mockResolvedValue(null)
    const response = await POST(new Request('https://a-little-world-with-us.vercel.app/api/drive/delete', { method: 'POST', body: JSON.stringify({ fileId: 'file-1' }), headers: { 'content-type': 'application/json' } }))
    expect(response.status).toBe(404)
    expect(deleteDriveFile).not.toHaveBeenCalled()
  })

  it('denies and audits orphaned deletion attempts from non-members', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'stranger-1' } } })
    getDriveFileAccess.mockResolvedValue({ ownerId: null, canDelete: false, readOnlyOrphaned: true, accessDenied: true, recordType: 'memory', recordId: 'memory-1' })
    const response = await POST(new Request('https://a-little-world-with-us.vercel.app/api/drive/delete', { method: 'POST', body: JSON.stringify({ fileId: 'file-1' }), headers: { 'content-type': 'application/json' } }))
    expect(response.status).toBe(404)
    expect(deleteDriveFile).not.toHaveBeenCalled()
    expect(logDriveMediaAccess).toHaveBeenCalledWith(expect.objectContaining({ userId: 'stranger-1', action: 'delete', outcome: 'denied', orphaned: true }))
  })

  it('deletes an authorized file', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    getDriveFileAccess.mockResolvedValue({ ownerId: 'user-1', canDelete: true, recordType: 'memory', recordId: 'memory-1' })
    deleteDriveFile.mockResolvedValue(undefined)
    const response = await POST(new Request('https://a-little-world-with-us.vercel.app/api/drive/delete', {
      method: 'POST',
      body: JSON.stringify({ fileId: 'file-1' }),
      headers: { 'content-type': 'application/json' },
    }))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ deleted: true, recordType: 'memory' })
    expect(deleteDriveFile).toHaveBeenCalledWith('user-1', 'file-1')
  })
})

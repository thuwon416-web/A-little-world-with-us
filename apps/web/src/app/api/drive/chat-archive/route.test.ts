// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  getUser,
  from,
  getOrCreateDriveCoupleFolder,
  getOrCreateDriveFolder,
  findDriveChildFile,
  downloadDriveFile,
  updateDriveFileContent,
  uploadDriveFile,
  checkRateLimit,
  isSameOriginRequest,
} = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  getOrCreateDriveCoupleFolder: vi.fn(),
  getOrCreateDriveFolder: vi.fn(),
  findDriveChildFile: vi.fn(),
  downloadDriveFile: vi.fn(),
  updateDriveFileContent: vi.fn(),
  uploadDriveFile: vi.fn(),
  checkRateLimit: vi.fn(),
  isSameOriginRequest: vi.fn(),
}))

vi.mock('@/lib/supabase-server', () => ({
  createServerClient: async () => ({ auth: { getUser }, from }),
}))
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ auth: { getUser }, from })),
}))
vi.mock('@/lib/google-drive', () => ({
  getOrCreateDriveCoupleFolder,
  getOrCreateDriveFolder,
  findDriveChildFile,
  downloadDriveFile,
  updateDriveFileContent,
  uploadDriveFile,
}))
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit }))
vi.mock('@/lib/csrf', () => ({ isSameOriginRequest }))

import { POST } from './route'

function request(body: unknown) {
  return new Request('https://a-little-world-with-us.vercel.app/api/drive/chat-archive', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/drive/chat-archive', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isSameOriginRequest.mockReturnValue(true)
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    checkRateLimit.mockResolvedValue({ allowed: true, resetTime: Date.now() + 60_000 })
    getOrCreateDriveCoupleFolder.mockResolvedValue({ id: 'couple-folder' })
    getOrCreateDriveFolder.mockImplementation(async (_userId: string, name: string) => ({ id: `folder-${name}` }))
    findDriveChildFile.mockResolvedValue(null)
    uploadDriveFile.mockResolvedValue({ id: 'archive-file', name: '2026-10-09.json', mimeType: 'application/json' })
    from.mockImplementation((table: string) => {
      if (table === 'couple_links') {
        const query = {
          select: vi.fn(() => query),
          eq: vi.fn(() => query),
          or: vi.fn(() => query),
          maybeSingle: vi.fn(async () => ({ data: { id: 'link-1' }, error: null })),
        }
        return query
      }
      return { upsert: vi.fn(async () => ({ error: null })) }
    })
  })

  it('blocks cross-origin archive writes before authentication', async () => {
    isSameOriginRequest.mockReturnValue(false)
    const response = await POST(request({ coupleId: 'couple-1', date: '2026-10-09', messages: [] }))
    expect(response.status).toBe(403)
    expect(getUser).not.toHaveBeenCalled()
  })

  it('rejects impossible calendar dates', async () => {
    const response = await POST(request({ coupleId: 'couple-1', date: '2026-02-31', messages: [] }))
    expect(response.status).toBe(400)
    expect(getOrCreateDriveCoupleFolder).not.toHaveBeenCalled()
  })

  it('writes a daily archive to the accepted couple Drive folder', async () => {
    const response = await POST(request({ coupleId: 'couple-1', date: '2026-10-09', messages: [] }))
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ messageCount: 0, file: { id: 'archive-file' } })
    expect(getOrCreateDriveCoupleFolder).toHaveBeenCalledWith('user-1', 'couple-1')
    expect(uploadDriveFile).toHaveBeenCalled()
  })
})

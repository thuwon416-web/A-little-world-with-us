import { describe, expect, it, vi, beforeEach } from 'vitest'

const { getUser, from, getOrCreateDriveRootFolder, listDriveChildren, checkRateLimit } = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  getOrCreateDriveRootFolder: vi.fn(),
  listDriveChildren: vi.fn(),
  checkRateLimit: vi.fn(),
}))

vi.mock('@/lib/supabase-server', () => ({
  createServerClient: async () => ({ auth: { getUser }, from }),
}))
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ auth: { getUser }, from })),
}))
vi.mock('@/lib/google-drive', () => ({ getOrCreateDriveRootFolder, listDriveChildren }))
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit }))

import { POST } from './route'

function setup() {
  const coupleQuery = {
    select: vi.fn(() => coupleQuery),
    eq: vi.fn(() => coupleQuery),
    or: vi.fn(() => coupleQuery),
    maybeSingle: vi.fn(async () => ({ data: { id: 'link-1' }, error: null })),
  }
  const memoryQuery = {
    select: vi.fn(() => memoryQuery),
    eq: vi.fn(() => memoryQuery),
    maybeSingle: vi.fn(async () => ({ data: null, error: null })),
    insert: vi.fn(() => memoryQuery),
    update: vi.fn(() => memoryQuery),
    single: vi.fn(async () => ({ data: { id: 'memory-1' }, error: null })),
  }
  from.mockImplementation((table: string) => table === 'couple_links' ? coupleQuery : memoryQuery)
  return { coupleQuery, memoryQuery }
}

describe('POST /api/drive/sync-memories', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    checkRateLimit.mockResolvedValue({ allowed: true, resetTime: Date.now() + 60000 })
    getOrCreateDriveRootFolder.mockResolvedValue({ id: 'root-1', name: 'A Little World With Us' })
    listDriveChildren.mockResolvedValue({ files: [] })
    setup()
  })

  it('requires a couple id', async () => {
    const response = await POST(new Request('https://a-little-world-with-us.vercel.app/api/drive/sync-memories', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    }))
    expect(response.status).toBe(400)
  })

  it('does not import chat folders as memories', async () => {
    listDriveChildren
      .mockResolvedValueOnce({
        files: [
          { id: 'chat-1', name: 'Chat', mimeType: 'application/vnd.google-apps.folder' },
          { id: 'kalaw-1', name: 'Kalaw 2026', mimeType: 'application/vnd.google-apps.folder' },
        ],
      })
      .mockResolvedValueOnce({
        files: [{ id: 'photo-1', name: 'sunset.jpg', mimeType: 'image/jpeg', modifiedTime: '2026-10-08T12:00:00Z' }],
      })

    const response = await POST(new Request('https://a-little-world-with-us.vercel.app/api/drive/sync-memories', {
      method: 'POST',
      body: JSON.stringify({ coupleId: 'couple-1' }),
      headers: { 'Content-Type': 'application/json' },
    }))
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ scanned: 1, imported: 1 })
  })
})

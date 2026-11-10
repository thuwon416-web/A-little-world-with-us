import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createServerClient, isSameOriginRequest, checkRateLimit, verifyB2Upload, isB2Configured, getUser, maybeSingle } = vi.hoisted(() => ({
  createServerClient: vi.fn(), isSameOriginRequest: vi.fn(), checkRateLimit: vi.fn(), verifyB2Upload: vi.fn(), isB2Configured: vi.fn(), getUser: vi.fn(), maybeSingle: vi.fn(),
}))
vi.mock('@/lib/supabase-server', () => ({ createServerClient }))
vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn() }))
vi.mock('@/lib/csrf', () => ({ isSameOriginRequest }))
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit }))
vi.mock('@/lib/backblaze-b2', () => ({ verifyB2Upload, isB2Configured }))
import { POST } from './route'

function request(body: unknown) { return new Request('https://example.test/api/media/b2-verify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }) }
const body = { coupleId: 'couple-1', fileId: 'file-1', objectName: 'couples/couple-1/large-media/user-1/file.mp4', contentLength: 100, sha1: 'a'.repeat(40), expiresAt: Date.now() + 60000, signature: 'signed' }

describe('POST /api/media/b2-verify', () => {
  beforeEach(() => {
    vi.clearAllMocks(); isSameOriginRequest.mockReturnValue(true); isB2Configured.mockReturnValue(true); checkRateLimit.mockResolvedValue({ allowed: true });
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } }); maybeSingle.mockResolvedValue({ data: { id: 'link-1' } });
    createServerClient.mockResolvedValue({ auth: { getUser }, from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ or: () => ({ maybeSingle }) }) }) }) }) })
    verifyB2Upload.mockResolvedValue(true)
  })
  it('verifies server-side object metadata before client may persist the media reference', async () => {
    const response = await POST(request(body)); expect(response.status).toBe(200); expect(await response.json()).toEqual({ verified: true })
    expect(verifyB2Upload).toHaveBeenCalledWith(expect.objectContaining({ fileId: 'file-1', userId: 'user-1', coupleId: 'couple-1', sha1: body.sha1 }))
  })
  it('rejects failed B2 verification', async () => {
    verifyB2Upload.mockResolvedValue(false)
    const response = await POST(request(body)); expect(response.status).toBe(403)
  })
})

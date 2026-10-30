// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  createServerClient,
  isSameOriginRequest,
  checkRateLimit,
  getB2UploadTarget,
  isB2Configured,
} = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  isSameOriginRequest: vi.fn(),
  checkRateLimit: vi.fn(),
  getB2UploadTarget: vi.fn(),
  isB2Configured: vi.fn(),
}))

vi.mock('@/lib/supabase-server', () => ({ createServerClient }))
vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn() }))
vi.mock('@/lib/csrf', () => ({ isSameOriginRequest }))
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit }))
vi.mock('@/lib/backblaze-b2', () => ({ getB2UploadTarget, isB2Configured }))

import { POST } from './route'

function createSupabase(user: { id: string } | null, coupleLink: { id: string } | null) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    or: vi.fn(() => query),
    maybeSingle: vi.fn().mockResolvedValue({ data: coupleLink }),
  }
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
    from: vi.fn(() => query),
    query,
  }
}

const validBody = {
  coupleId: 'couple-1',
  fileName: 'birthday-video.mp4',
  contentType: 'video/mp4',
  contentLength: 50 * 1024 * 1024 + 1,
  sha1: 'a'.repeat(40),
}

function request(body: unknown = validBody) {
  return new Request('https://a-little-world-with-us.vercel.app/api/media/b2-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('B2 large-media upload authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isSameOriginRequest.mockReturnValue(true)
    checkRateLimit.mockResolvedValue({ allowed: true })
    isB2Configured.mockReturnValue(true)
    getB2UploadTarget.mockResolvedValue({
      uploadUrl: 'https://b2.example/upload',
      authorizationToken: 'temporary-upload-token',
      objectName: 'couples/couple-1/large-media/user-1/file.mp4',
    })
  })

  it('rejects cross-origin upload requests before authentication', async () => {
    isSameOriginRequest.mockReturnValue(false)
    const response = await POST(request())

    expect(response.status).toBe(403)
    expect(createServerClient).not.toHaveBeenCalled()
    expect(getB2UploadTarget).not.toHaveBeenCalled()
  })

  it('rejects unauthenticated callers before rate limiting or storage access', async () => {
    createServerClient.mockReturnValue(createSupabase(null, null))
    const response = await POST(request())

    expect(response.status).toBe(401)
    expect(checkRateLimit).not.toHaveBeenCalled()
    expect(getB2UploadTarget).not.toHaveBeenCalled()
  })

  it('rejects files outside the large-media size and SHA-1 constraints', async () => {
    createServerClient.mockReturnValue(createSupabase({ id: 'user-1' }, { id: 'link-1' }))
    const response = await POST(request({ ...validBody, contentLength: 1024, sha1: 'invalid' }))

    expect(response.status).toBe(400)
    expect(getB2UploadTarget).not.toHaveBeenCalled()
  })

  it('rejects callers who are not members of the requested accepted couple', async () => {
    const supabase = createSupabase({ id: 'user-1' }, null)
    createServerClient.mockReturnValue(supabase)
    const response = await POST(request())

    expect(response.status).toBe(403)
    expect(supabase.query.maybeSingle).toHaveBeenCalled()
    expect(getB2UploadTarget).not.toHaveBeenCalled()
  })

  it('returns a scoped temporary upload target to an accepted couple member', async () => {
    createServerClient.mockReturnValue(createSupabase({ id: 'user-1' }, { id: 'link-1' }))
    const response = await POST(request())
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.provider).toBe('backblaze_b2')
    expect(getB2UploadTarget).toHaveBeenCalledWith(expect.objectContaining({
      objectName: expect.stringMatching(/^couples\\/couple-1\\/large-media\\/user-1\\//),
      contentType: 'video/mp4',
      contentLength: validBody.contentLength,
      sha1: validBody.sha1,
    }))
  })
})

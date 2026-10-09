// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createServerClient, isSameOriginRequest, checkRateLimit } = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  isSameOriginRequest: vi.fn(),
  checkRateLimit: vi.fn(),
}))

vi.mock('@/lib/supabase-server', () => ({ createServerClient }))
vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn() }))
vi.mock('@/lib/csrf', () => ({ isSameOriginRequest }))
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit }))
vi.mock('@/lib/google-drive', () => ({ uploadDriveFile: vi.fn() }))
vi.mock('@/lib/cloudinary-url', () => ({ createPrivateCloudinaryUrl: vi.fn() }))
vi.mock('@/lib/backblaze-b2', () => ({ getB2DownloadUrl: vi.fn() }))

import { POST } from './route'

describe('Drive memory export CSRF protection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isSameOriginRequest.mockReturnValue(false)
  })

  it('rejects cross-origin exports before authentication or provider access', async () => {
    const request = new Request('https://a-little-world-with-us.vercel.app/api/drive/export-memory', { method: 'POST', body: JSON.stringify({ memoryId: 'memory-1' }), headers: { 'Content-Type': 'application/json' } })
    const response = await POST(request)
    expect(response.status).toBe(403)
    expect(createServerClient).not.toHaveBeenCalled()
  })
})

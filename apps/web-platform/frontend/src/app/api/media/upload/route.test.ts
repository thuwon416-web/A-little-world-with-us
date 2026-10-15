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
vi.mock('@/lib/upload-validation', () => ({ MAX_MEMORY_IMAGE_SIZE: 1024, validateMemoryMetadata: vi.fn(), validateUploadContent: vi.fn() }))
vi.mock('@/lib/observability', () => ({ logEvent: vi.fn() }))
vi.mock('@/lib/cloudinary', () => ({ deleteCloudinaryAsset: vi.fn(), isCloudinaryConfigured: vi.fn(), uploadMemoryToCloudinary: vi.fn() }))

import { POST } from './route'

describe('memory upload CSRF protection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isSameOriginRequest.mockReturnValue(false)
  })

  it('rejects cross-origin uploads before authentication or storage access', async () => {
    const request = new Request('https://a-little-world-with-us.vercel.app/api/media/upload', { method: 'POST' })
    const response = await POST(request)
    expect(response.status).toBe(403)
    expect(createServerClient).not.toHaveBeenCalled()
  })
})

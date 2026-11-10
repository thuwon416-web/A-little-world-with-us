// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createHmac } from 'node:crypto'

vi.mock('server-only', () => ({}))
import type { verifyB2Upload as VerifyB2Upload } from './backblaze-b2'
let verifyB2Upload: typeof VerifyB2Upload

const secret = 'test-only-signing-secret'
const objectName = 'couples/couple-1/large-media/user-1/file.mp4'
const input = {
  fileId: 'file-1', objectName, userId: 'user-1', coupleId: 'couple-1',
  contentLength: 123, sha1: 'a'.repeat(40), expiresAt: Date.now() + 60_000,
}

function signatureFor(value: typeof input) {
  return createHmac('sha256', secret)
    .update([value.objectName, value.userId, value.coupleId, String(value.contentLength), value.sha1, String(value.expiresAt)].join('\\n'))
    .digest('base64url')
}

describe('verifyB2Upload signed object scope', () => {
  beforeEach(async () => {
    vi.resetModules()
    ;({ verifyB2Upload } = await import('./backblaze-b2'))
    vi.stubEnv('B2_APPLICATION_KEY_ID', 'test-key-id')
    vi.stubEnv('B2_APPLICATION_KEY', 'test-key')
    vi.stubEnv('B2_BUCKET_ID', 'bucket-1')
    vi.stubEnv('B2_BUCKET_NAME', 'private-bucket')
    vi.stubEnv('B2_UPLOAD_SIGNING_SECRET', secret)
  })

  it('rejects tampered object names before looking up a B2 file', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ apiInfo: { storageApi: { apiUrl: 'https://api.example', downloadUrl: 'https://download.example' } }, authorizationToken: 'server-token' }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const result = await verifyB2Upload({ ...input, objectName: 'couples/other/large-media/user-1/file.mp4', signature: signatureFor(input) })
    expect(result).toBe(false)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('rejects invalid signatures and does not accept client-changed metadata', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ apiInfo: { storageApi: { apiUrl: 'https://api.example', downloadUrl: 'https://download.example' } }, authorizationToken: 'server-token' }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const result = await verifyB2Upload({ ...input, contentLength: input.contentLength + 1, signature: signatureFor(input) })
    expect(result).toBe(false)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('accepts only a matching signed path and matching B2 object metadata', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ apiInfo: { storageApi: { apiUrl: 'https://api.example', downloadUrl: 'https://download.example' } }, authorizationToken: 'server-token' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ bucketId: 'bucket-1', fileName: objectName, contentLength: input.contentLength, contentSha1: input.sha1 }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const result = await verifyB2Upload({ ...input, signature: signatureFor(input) })
    expect(result).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})

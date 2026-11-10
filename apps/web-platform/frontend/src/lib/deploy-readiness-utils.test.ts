import { describe, expect, it } from 'vitest'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { isCronAuthMatrixValid, isDriveOrphanAccessMatrixValid, isSafeStagingUrl, isScopedB2ObjectName } from '../../../../../scripts/deploy-readiness-utils'

describe('deploy readiness smoke-test helpers', () => {
  it('accepts HTTPS staging hosts and rejects Production or insecure URLs', () => {
    expect(isSafeStagingUrl('https://preview-example.vercel.app')).toBe(true)
    expect(isSafeStagingUrl('https://a-little-world-with-us.vercel.app')).toBe(false)
    expect(isSafeStagingUrl('http://localhost:3000')).toBe(false)
    expect(isSafeStagingUrl('not a URL')).toBe(false)
  })

  it('requires a couple-scoped B2 object path', () => {
    expect(isScopedB2ObjectName('couples/couple-1/large-media/user-1/file.bin', 'couple-1')).toBe(true)
    expect(isScopedB2ObjectName('couples/couple-2/large-media/user-1/file.bin', 'couple-1')).toBe(false)
    expect(isScopedB2ObjectName(undefined, 'couple-1')).toBe(false)
  })

  it('validates expected cron and Drive orphan HTTP status matrices', () => {
    expect(isCronAuthMatrixValid(200, 401)).toBe(true)
    expect(isCronAuthMatrixValid(500, 401)).toBe(false)
    expect(isDriveOrphanAccessMatrixValid(200, 404)).toBe(true)
    expect(isDriveOrphanAccessMatrixValid(200, 200)).toBe(false)
  })

  it('keeps the preflight shell script syntactically valid', () => {
    const script = resolve(process.cwd(), '../../../scripts/preflight-deploy.sh')
    const result = spawnSync('bash', ['-n', script], { encoding: 'utf8' })
    expect(result.status, result.stderr).toBe(0)
  })
})

import { describe, expect, it } from 'vitest'
import { escapeTelegramHtml } from './telegram'

describe('escapeTelegramHtml', () => {
  it('escapes HTML metacharacters and quotes', () => {
    expect(escapeTelegramHtml('<script>alert("x")</script> & \'ok\'')).toBe('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;ok&#39;')
  })
  it('preserves ordinary text', () => {
    expect(escapeTelegramHtml('Safety check-in')).toBe('Safety check-in')
  })
})

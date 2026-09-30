import { extractYouTubeId, getYouTubeThumbnail } from './watchTogether'
import { describe, expect, it } from 'vitest'

describe('YouTube helpers', () => {
  it.each([
    'https://www.youtube.com/watch?v=abc12345678',
    'https://youtu.be/abc12345678',
    'https://www.youtube.com/embed/abc12345678',
  ])('extracts an ID from %s', (url) => {
    expect(extractYouTubeId(url)).toBe('abc12345678')
  })

  it('accepts raw IDs and rejects invalid input', () => {
    expect(extractYouTubeId('abc12345678')).toBe('abc12345678')
    expect(extractYouTubeId('not a YouTube URL')).toBeNull()
  })

  it('builds the standard thumbnail URL', () => {
    expect(getYouTubeThumbnail('abc12345678')).toBe(
      'https://img.youtube.com/vi/abc12345678/hqdefault.jpg'
    )
  })
})

import { describe, expect, it } from 'vitest'
import { themes, sizes } from '@/lib/theme-tokens'

function luminance(hex: string): number {
  const value = hex.replace('#', '')
  const channels = value.length === 3
    ? value.split('').map((channel) => Number.parseInt(channel + channel, 16) / 255)
    : [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16) / 255)

  const linear = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  )

  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722
}

function contrast(foreground: string, background: string): number {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a)
  return (lighter + 0.05) / (darker + 0.05)
}

describe('shared theme accessibility', () => {
  it.each(Object.entries(themes))('%s keeps UI text readable', (_name, theme) => {
    const textColors = [
      theme.text1,
      theme.text2,
      theme.label,
      theme.accent1,
      theme.success,
      theme.warning,
      theme.error,
    ]

    for (const foreground of textColors) {
      expect(Math.min(
        contrast(foreground, theme.bg),
        contrast(foreground, theme.card),
      )).toBeGreaterThanOrEqual(4.5)
    }

    expect(contrast(theme.accentForeground, theme.accent1)).toBeGreaterThanOrEqual(4.5)
  })

  it('keeps the smallest shared text size readable', () => {
    expect(sizes.text.xs).toBeGreaterThanOrEqual(12)
  })
})

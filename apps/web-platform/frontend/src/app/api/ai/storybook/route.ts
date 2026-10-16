import { type NextRequest, NextResponse } from 'next/server'
import { isSameOriginRequest } from '@/lib/csrf'
import { z } from 'zod'
import { logAiUsage } from '@/lib/ai/usage-log'
import { AI_PROVIDER_PROFILES, generateAiResponse } from '@/lib/ai/providers'
import {
  AI_COMPLETION_BUDGET,
  optionalString,
  withAiRouteAuth,
} from '@/lib/ai/route-helpers'

const storybookSchema = z.object({
  partner1: optionalString(100),
  partner2: optionalString(100),
  memoryContext: optionalString(1500),
  theme: z.enum(['ghibli_anime', 'fairy_tale', 'modern_romance', 'watercolor']).default('ghibli_anime'),
})

export async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    return await withAiRouteAuth(async (authReq, { userId }) => {
      const body = await authReq.json()
      const validated = storybookSchema.parse(body)

      const p1 = validated.partner1 || 'Partner A'
      const p2 = validated.partner2 || 'Partner B'
      const context = validated.memoryContext || 'A peaceful sunny afternoon walking together hand in hand.'
      const theme = validated.theme

      const prompt = `Write an enchanting, poetic couple storybook chapter about ${p1} and ${p2}.
Theme: ${theme}.
Memory context: ${context}.
Format the output with:
1. Title
2. Narrative Story (3-4 paragraphs)
3. Moral/Heartfelt closing quote.`

      const generated = await generateAiResponse({
        allowedProviders: AI_PROVIDER_PROFILES.relationshipWriting,
        maxTokens: AI_COMPLETION_BUDGET,
        messages: [
          {
            role: 'system',
            content: 'You are a warm, imaginative children\'s storybook and couple memoir author. Write romantic, gentle, and heartwarming stories.',
          },
          { role: 'user', content: prompt },
        ],
      })

      const storyContent = generated.content

      // Generate zero-cost Pollinations FLUX illustration URL
      const visualStyle = theme === 'ghibli_anime'
        ? 'Studio Ghibli aesthetic, anime couple, lush green field, vibrant soft colors, high quality digital painting'
        : 'whimsical storybook illustration, soft warm pastel colors, fairy tale, beautiful romantic couple'
      const imagePrompt = encodeURIComponent(`Romantic couple in love, ${visualStyle}, warm sunset light`)
      const illustrationUrl = `https://image.pollinations.ai/prompt/${imagePrompt}?width=1024&height=1024&model=flux&nologo=true`

      void logAiUsage({
        userId,
        endpoint: 'storybook',
        provider: generated.provider,
        status: 'success',
        promptLength: prompt.length,
        responseLength: storyContent.length,
      })

      return NextResponse.json({
        status: 'success',
        theme,
        story: storyContent,
        illustration_url: illustrationUrl,
      })
    })(req)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Storybook error:', error)
    return NextResponse.json({ error: 'Failed to generate storybook chapter' }, { status: 500 })
  }
}

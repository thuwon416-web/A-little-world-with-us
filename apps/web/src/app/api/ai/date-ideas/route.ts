import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { filterByPrivacy, PrivacySettingsUnavailableError } from '@/lib/ai/privacy-guard'
import { AI_PROVIDER_PROFILES, generateAiResponse } from '@/lib/ai/providers'
import {
  AI_COMPLETION_BUDGET,
  optionalString,
  withAiRouteAuth,
} from '@/lib/ai/route-helpers'

// Validation schema
const dateIdeasSchema = z.object({
  budget: optionalString(200),
  location: optionalString(200),
  interests: optionalString(500),
})

const generatedDateIdeasSchema = z.array(z.object({
  title: z.string(),
  description: z.string(),
  estimatedCost: z.string(),
  duration: z.string(),
}))

export async function POST(req: NextRequest) {
  try {
    return await withAiRouteAuth(async (req, { userId }) => {

    // 3. Parse and validate request
    const body = await req.json()
    const validated = dateIdeasSchema.parse(body)
    const permitted = await filterByPrivacy(userId, {
      location: validated.location,
      finance: validated.budget,
    })
    if (
      validated.location !== undefined &&
      validated.budget !== undefined &&
      permitted.location === undefined &&
      permitted.finance === undefined
    ) {
      return NextResponse.json(
        { error: 'Enable AI Location or Finance access to use both details for date ideas.' },
        { status: 403 }
      )
    }
    const location = permitted.location
    const budget = permitted.finance

    const generated = await generateAiResponse({
      allowedProviders: AI_PROVIDER_PROFILES.planning,
      maxTokens: AI_COMPLETION_BUDGET,
      messages: [
        { role: 'system', content: 'Generate 5 creative date ideas. Return JSON array with title, description, estimatedCost, duration. Be romantic and practical. Return JSON only.' },
        { role: 'user', content: `Budget: ${budget || 'not specified'}\\nLocation: ${location || 'not specified'}\\nInterests: ${validated.interests || 'not specified'}` },
      ],
    })
    let dateIdeas: z.infer<typeof generatedDateIdeasSchema>
    try {
      dateIdeas = generatedDateIdeasSchema.parse(JSON.parse(generated.content))
    } catch (error) {
      console.error('Date ideas AI response parsing failed:', error)
      return NextResponse.json({ error: 'AI service returned an invalid response.' }, { status: 502 })
    }

    return NextResponse.json({ dateIdeas })

    })(req)
  } catch (error) {
    if (error instanceof PrivacySettingsUnavailableError) {
      console.error('Date ideas privacy lookup failed:', error)
      return NextResponse.json({ error: 'Could not load AI privacy settings.' }, { status: 503 })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Date Ideas error')
    return NextResponse.json({ error: 'Failed to generate date ideas' }, { status: 500 })
  }
}

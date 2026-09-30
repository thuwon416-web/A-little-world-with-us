import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { filterByPrivacy, PrivacySettingsUnavailableError } from '@/lib/ai/privacy-guard'
import {
  AI_COMPLETION_BUDGET,
  getAiResponseText,
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

    const apiKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY
    
    if (!apiKey) {
      return NextResponse.json({ 
        dateIdeas: [
          {
            title: 'Picnic in the Park',
            description: 'Pack a romantic picnic with your favorite foods and enjoy it in a local park',
            estimatedCost: '$20-50',
            duration: '2-3 hours'
          },
          {
            title: 'Home Movie Marathon',
            description: 'Create a cozy movie night at home with snacks and your favorite films',
            estimatedCost: '$10-20',
            duration: '3-4 hours'
          },
          {
            title: 'Cooking Adventure',
            description: 'Try cooking a new recipe together at home',
            estimatedCost: '$30-60',
            duration: '1-2 hours'
          },
          {
            title: 'Stargazing',
            description: 'Find a spot away from city lights and enjoy the night sky together',
            estimatedCost: 'Free',
            duration: '1-2 hours'
          },
          {
            title: 'Art and Wine',
            description: 'Visit a local art gallery or museum together',
            estimatedCost: '$15-40',
            duration: '2-3 hours'
          }
        ]
      })
    }

    let response: Response
    
    if (process.env.GROQ_API_KEY) {
      response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-20b',
          messages: [
            {
              role: 'system',
              content: 'Generate 5 creative date ideas. Return JSON array with: title, description, estimatedCost, duration. Be romantic and practical.',
            },
            {
              role: 'user',
              content: `Budget: ${budget}, Location: ${location}, Interests: ${validated.interests}`,
            },
          ],
          // nosemgrep
          max_tokens: AI_COMPLETION_BUDGET,
        }),
      })
    } else {
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ 
            parts: [{ 
              text: `Generate 5 creative date ideas. Return JSON array with: title, description, estimatedCost, duration. Be romantic and practical. Budget: ${budget}, Location: ${location}, Interests: ${validated.interests}`
            }] 
          }],
        }),
      })
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: 'AI service unavailable' },
        { status: 503 }
      )
    }

    const data = await response.json()
    
    const provider = process.env.GROQ_API_KEY ? 'groq' : 'gemini'
    let dateIdeas: z.infer<typeof generatedDateIdeasSchema>
    try {
      const text = getAiResponseText(data, provider, '')
      dateIdeas = generatedDateIdeasSchema.parse(JSON.parse(text))
    } catch (error) {
      console.error('Date ideas AI response parsing failed:', error)
      return NextResponse.json(
        { error: 'AI service returned an invalid response.' },
        { status: 502 }
      )
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

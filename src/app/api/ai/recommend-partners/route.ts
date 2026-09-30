import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  AI_COMPLETION_BUDGET,
  getAiResponseText,
  withAiRouteAuth,
} from '@/lib/ai/route-helpers'

// Validation schema
const recommendPartnersSchema = z.object({
  preferences: z.record(z.string().max(50), z.string().max(200)).refine((value) => Object.keys(value).length <= 20).optional(),
})

const generatedRecommendationsSchema = z.array(z.object({
  category: z.string(),
  name: z.string(),
  description: z.string(),
  reason: z.string(),
}))

export async function POST(req: NextRequest) {
  try {
    return await withAiRouteAuth(async (req) => {

    // 3. Parse and validate request
    const body = await req.json()
    const validated = recommendPartnersSchema.parse(body)

    // Use AI API for relationship activity recommendations
    const apiKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY
    
    if (!apiKey) {
      return NextResponse.json({ 
        recommendations: [
          {
            category: 'Quality Time',
            name: 'Movie Night',
            description: 'Watch a romantic movie together at home',
            reason: 'Perfect for cozy evenings and bonding'
          },
          {
            category: 'Adventure',
            name: 'Nature Walk',
            description: 'Take a walk in a nearby park or nature trail',
            reason: 'Great for conversations and fresh air'
          },
          {
            category: 'Creative',
            name: 'Cook Together',
            description: 'Prepare a meal together from scratch',
            reason: 'Builds teamwork and creates memories'
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
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: 'You are a relationship activity recommender for couples. Recommend 3-5 couple activities based on preferences. Return JSON array with: category, name, description, reason. Keep it romantic and practical.',
            },
            {
              role: 'user',
              content: `Recommend couple activities for: ${JSON.stringify(validated.preferences)}`,
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
              text: `You are a relationship activity recommender for couples. Recommend 3-5 couple activities based on preferences. Return JSON array with: category, name, description, reason. Keep it romantic and practical. Preferences: ${JSON.stringify(validated.preferences)}` 
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
    let recommendations: z.infer<typeof generatedRecommendationsSchema>
    try {
      const text = getAiResponseText(data, provider, '')
      recommendations = generatedRecommendationsSchema.parse(JSON.parse(text))
    } catch (error) {
      console.error('AI recommendations response parsing failed:', error)
      return NextResponse.json(
        { error: 'AI service returned an invalid response.' },
        { status: 502 }
      )
    }

    return NextResponse.json({ recommendations })

    })(req)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    console.error('AI Recommendations error')
    return NextResponse.json({ error: 'Failed to get recommendations' }, { status: 500 })
  }
}

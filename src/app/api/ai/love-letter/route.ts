import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { logAiUsage } from '@/lib/ai/usage-log'
import {
  AI_COMPLETION_BUDGET,
  getAiResponseText,
  optionalString,
  withAiRouteAuth,
} from '@/lib/ai/route-helpers'

// Validation schema
const loveLetterSchema = z.object({
  partnerName: optionalString(200),
  relationshipLength: optionalString(100),
  specialMemories: optionalString(1000),
  tone: optionalString(100),
})

export async function POST(req: NextRequest) {
  try {
    return await withAiRouteAuth(async (req, { userId }) => {

    // 3. Parse and validate request
    const body = await req.json()
    const validated = loveLetterSchema.parse(body)
    // The user supplied these details directly; privacy scopes govern stored context, not explicit prompts.

    const apiKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY
    
    if (!apiKey) {
      return NextResponse.json({ 
        loveLetter: `Dear ${validated.partnerName || 'My Love'},\n\nI wanted to take a moment to tell you how much you mean to me. ${validated.relationshipLength ? `After ${validated.relationshipLength} together,` : ''} my love for you grows stronger every day.\n\n${validated.specialMemories ? `I cherish the memories we've created together, especially ${validated.specialMemories}.` : 'Every moment with you is precious to me.'}\n\nYou are my rock, my best friend, and my greatest blessing. I look forward to creating many more beautiful memories with you.\n\nForever yours,\nWith all my love`
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
              content: 'Write a heartfelt love letter. Return as plain text. Be romantic, sincere, and personal.',
            },
            {
              role: 'user',
              content: `Write a love letter to ${validated.partnerName}. Relationship: ${validated.relationshipLength}. Memories: ${validated.specialMemories}. Tone: ${validated.tone}`,
            },
          ],
          // nosemgrep
          max_tokens: AI_COMPLETION_BUDGET,
        }),
      })
    } else {
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ 
            parts: [{ 
              text: `Write a heartfelt love letter. Return as plain text. Be romantic, sincere, and personal. Write a love letter to ${validated.partnerName}. Relationship: ${validated.relationshipLength}. Memories: ${validated.specialMemories}. Tone: ${validated.tone}` 
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
    const loveLetter = getAiResponseText(data, provider, 'Unable to generate love letter.')

    void logAiUsage({
      userId,
      endpoint: 'love-letter',
      provider: process.env.GROQ_API_KEY ? 'groq' : 'gemini',
      status: 'success',
      promptLength: (validated.partnerName?.length ?? 0) + (validated.relationshipLength?.length ?? 0) + (validated.specialMemories?.length ?? 0) + (validated.tone?.length ?? 0),
      responseLength: loveLetter.length,
    })

    return NextResponse.json({ loveLetter })

    })(req)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Love Letter error')
    return NextResponse.json({ error: 'Failed to generate love letter' }, { status: 500 })
  }
}

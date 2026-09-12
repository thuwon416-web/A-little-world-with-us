import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/rate-limit'

// Validation schema
const loveLetterSchema = z.object({
  partnerName: z.string().max(200).optional(),
  relationshipLength: z.string().max(100).optional(),
  specialMemories: z.string().max(1000).optional(),
  tone: z.string().max(100).optional(),
})

export async function POST(req: NextRequest) {
  try {
    // 1. Session verification
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll()
          },
          setAll() {
            // Handle cookie updates if needed
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = user.id

    // 2. Rate limiting
    const rateLimitResult = await checkRateLimit(userId, 10, 60000)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429 }
      )
    }

    // 3. Parse and validate request
    const body = await req.json()
    const validated = loveLetterSchema.parse(body)

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
          max_tokens: 1000,
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
    
    let loveLetter = ''
    
    if (process.env.GROQ_API_KEY) {
      loveLetter = data.choices?.[0]?.message?.content || 'Unable to generate love letter.'
    } else {
      loveLetter = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to generate love letter.'
    }

    return NextResponse.json({ loveLetter })

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

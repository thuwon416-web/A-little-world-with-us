import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { context } = await req.json()

    const apiKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY
    
    if (!apiKey) {
      return NextResponse.json({ 
        suggestions: [
          `Good morning, my love! 💕 Just wanted to start your day knowing how much you mean to me.`,
          `Thinking of you and smiling. Hope your day is as wonderful as you are!`,
          `You make my world brighter just by being in it. Can't wait to see you later!`,
          `Every morning I wake up grateful to have you in my life. You're amazing!`,
          `Sending you love and good vibes for the day ahead. You've got this!`
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
              content: 'Generate 5 romantic message suggestions. Return JSON array of strings. Be sweet, thoughtful, and appropriate for the context.',
            },
            {
              role: 'user',
              content: `Generate message suggestions for: ${context}`,
            },
          ],
          max_tokens: 600,
        }),
      })
    } else {
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ 
            parts: [{ 
              text: `Generate 5 romantic message suggestions. Return JSON array of strings. Be sweet, thoughtful, and appropriate for the context. Context: ${context}` 
            }] 
          }],
        }),
      })
    }

    const data = await response.json()
    
    let suggestions: string[] = []
    
    if (process.env.GROQ_API_KEY) {
      try {
        suggestions = JSON.parse(data.choices?.[0]?.message?.content || '[]')
      } catch {
        suggestions = []
      }
    } else {
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]'
      try {
        suggestions = JSON.parse(text)
      } catch {
        suggestions = []
      }
    }

    return NextResponse.json({ suggestions })

  } catch (error) {
    console.error('Message Suggestions error:', error)
    return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 })
  }
}

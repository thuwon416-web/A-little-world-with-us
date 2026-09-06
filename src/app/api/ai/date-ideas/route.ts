import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { budget, location, interests } = await req.json()

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
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: 'Generate 5 creative date ideas. Return JSON array with: title, description, estimatedCost, duration. Be romantic and practical.',
            },
            {
              role: 'user',
              content: `Budget: ${budget}, Location: ${location}, Interests: ${interests}`,
            },
          ],
          max_tokens: 800,
        }),
      })
    } else {
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ 
            parts: [{ 
              text: `Generate 5 creative date ideas. Return JSON array with: title, description, estimatedCost, duration. Be romantic and practical. Budget: ${budget}, Location: ${location}, Interests: ${interests}` 
            }] 
          }],
        }),
      })
    }

    const data = await response.json()
    
    let dateIdeas: any[] = []
    
    if (process.env.GROQ_API_KEY) {
      try {
        dateIdeas = JSON.parse(data.choices?.[0]?.message?.content || '[]')
      } catch {
        dateIdeas = []
      }
    } else {
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]'
      try {
        dateIdeas = JSON.parse(text)
      } catch {
        dateIdeas = []
      }
    }

    return NextResponse.json({ dateIdeas })

  } catch (error) {
    console.error('Date Ideas error:', error)
    return NextResponse.json({ error: 'Failed to generate date ideas' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { partnerName, relationshipLength, specialMemories, tone } = await req.json()

    const apiKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY
    
    if (!apiKey) {
      return NextResponse.json({ 
        loveLetter: `Dear ${partnerName || 'My Love'},\n\nI wanted to take a moment to tell you how much you mean to me. ${relationshipLength ? `After ${relationshipLength} together,` : ''} my love for you grows stronger every day.\n\n${specialMemories ? `I cherish the memories we've created together, especially ${specialMemories}.` : 'Every moment with you is precious to me.'}\n\nYou are my rock, my best friend, and my greatest blessing. I look forward to creating many more beautiful memories with you.\n\nForever yours,\nWith all my love`
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
              content: `Write a love letter to ${partnerName}. Relationship: ${relationshipLength}. Memories: ${specialMemories}. Tone: ${tone}`,
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
              text: `Write a heartfelt love letter. Return as plain text. Be romantic, sincere, and personal. Write a love letter to ${partnerName}. Relationship: ${relationshipLength}. Memories: ${specialMemories}. Tone: ${tone}` 
            }] 
          }],
        }),
      })
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
    console.error('Love Letter error:', error)
    return NextResponse.json({ error: 'Failed to generate love letter' }, { status: 500 })
  }
}

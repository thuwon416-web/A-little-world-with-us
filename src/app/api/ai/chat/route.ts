import { NextRequest, NextResponse } from 'next/server'

async function callGemini(message: string) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured')
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: message }] }],
    }),
  })
  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response'
}

async function callOpenRouter(message: string) {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured')
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/gpt-3.5-turbo',
      messages: [{ role: 'user', content: message }],
    }),
  })
  const data = await response.json()
  return data.choices?.[0]?.message?.content || 'No response'
}

async function callHuggingFace(message: string) {
  const apiKey = process.env.HUGGINGFACE_API_KEY
  if (!apiKey) {
    throw new Error('HUGGINGFACE_API_KEY not configured')
  }

  const response = await fetch('https://api-inference.huggingface.co/models/gpt2', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: message }),
  })
  const data = await response.json()
  return data?.generated_text || 'No response'
}

export async function POST(req: NextRequest) {
  try {
    const { message, provider } = await req.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    let response: string

    switch (provider) {
      case 'gemini':
        response = await callGemini(message)
        break
      case 'openrouter':
        response = await callOpenRouter(message)
        break
      case 'huggingface':
        response = await callHuggingFace(message)
        break
      default:
        response = await callGemini(message)
    }

    return NextResponse.json({
      response,
      provider: provider || 'gemini',
    })

  } catch (error) {
    console.error('AI API error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

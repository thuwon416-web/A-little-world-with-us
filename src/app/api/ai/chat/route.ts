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
      contents: [{ parts: [{ text: `You are a helpful relationship assistant for "A Little World With Us" app. Help users with love advice, date ideas, and relationship tips. Be warm, supportive, and romantic. User says: ${message}` }] }],
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
      messages: [
        {
          role: 'system',
          content: 'You are a helpful relationship assistant for "A Little World With Us" app. Help users with love advice, date ideas, and relationship tips. Be warm, supportive, and romantic.'
        },
        { role: 'user', content: message }
      ],
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

async function callGroq(message: string) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured')
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful relationship assistant for "A Little World With Us" app. Help users with love advice, date ideas, and relationship tips. Be warm, supportive, and romantic.',
        },
        {
          role: 'user',
          content: message,
        },
      ],
      max_tokens: 500,
    }),
  })

  const data = await response.json()
  return data.choices?.[0]?.message?.content || 'No response'
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
      case 'groq':
        response = await callGroq(message)
        break
      default:
        // Try Groq first, then fallback to Gemini
        try {
          response = await callGroq(message)
        } catch {
          try {
            response = await callGemini(message)
          } catch {
            response = 'Sorry, I need an AI API key to function. Please configure GROQ_API_KEY or GEMINI_API_KEY in your environment.'
          }
        }
    }

    return NextResponse.json({
      response,
      provider: provider || 'groq',
    })

  } catch (error) {
    console.error('AI API error:', error)
    return NextResponse.json({ response: 'Sorry, I encountered an error. Please try again.' })
  }
}

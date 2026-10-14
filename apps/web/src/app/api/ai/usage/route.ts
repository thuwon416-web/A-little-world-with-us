import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const env = process.env

  const providersConfig = {
    groq: Boolean(env.GROQ_API_KEY?.trim() && !env.GROQ_API_KEY.startsWith('your_')),
    gemini: Boolean(env.GEMINI_API_KEY?.trim() && !env.GEMINI_API_KEY.startsWith('your_')),
    openrouter: Boolean(env.OPENROUTER_API_KEY?.trim() && !env.OPENROUTER_API_KEY.startsWith('your_')),
    mistral: Boolean(env.MISTRAL_API_KEY?.trim() && !env.MISTRAL_API_KEY.startsWith('your_')),
    cohere: Boolean(env.COHERE_API_KEY?.trim() && !env.COHERE_API_KEY.startsWith('your_')),
    voyage: Boolean(env.VOYAGE_API_KEY?.trim() && !env.VOYAGE_API_KEY.startsWith('your_')),
    nvidia: Boolean(env.NVIDIA_API_KEY?.trim() && !env.NVIDIA_API_KEY.startsWith('your_')),
    cloudflare: Boolean((env.CLOUDFLARE_API_KEY?.trim() || env.CLOUDFLARE_API_TOKEN?.trim()) && !env.CLOUDFLARE_API_KEY?.startsWith('your_')),
  }

  const providers: Record<string, any> = {}
  for (const [prov, configured] of Object.entries(providersConfig)) {
    providers[prov] = {
      configured,
      status: configured ? 'active' : 'unconfigured',
      calls_today: 0,
      total_calls: 0,
      errors_today: 0,
      last_used: null,
    }
  }

  const summary = {
    project: 'A-Little-World-With-Us',
    timestamp: new Date().toISOString(),
    date: new Date().toISOString().substring(0, 10),
    total_calls_today: 0,
    active_chains: {
      chat_priority: ['groq', 'gemini', 'openrouter', 'mistral', 'cohere', 'nvidia', 'cloudflare'],
      rag_priority: ['voyage', 'cohere'],
      korean_learning_priority: ['gemini', 'groq', 'openrouter'],
    },
    providers,
  }

  return NextResponse.json(summary)
}

export type AiProvider =
  | 'groq'
  | 'gemini'
  | 'openrouter'
  | 'mistral'
  | 'cohere'
  | 'cerebras'
  | 'nvidia'
  | 'huggingface'
  | 'cloudflare'

export interface AiMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface GenerateOptions {
  messages: AiMessage[]
  maxTokens?: number
  provider?: AiProvider
}

export interface AiGeneration {
  content: string
  provider: AiProvider
}

const fallbackOrder: AiProvider[] = [
  'groq',
  'gemini',
  'openrouter',
  'mistral',
  'cohere',
  'cerebras',
  'nvidia',
  'huggingface',
  'cloudflare',
]

const openAiCompatibleProviders: Partial<Record<AiProvider, { key: string; endpoint: string; model: string }>> = {
  groq: {
    key: 'GROQ_API_KEY',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.1-8b-instant',
  },
  openrouter: {
    key: 'OPENROUTER_API_KEY',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'openai/gpt-4o-mini',
  },
  mistral: {
    key: 'MISTRAL_API_KEY',
    endpoint: 'https://api.mistral.ai/v1/chat/completions',
    model: 'mistral-small-latest',
  },
  cerebras: {
    key: 'CEREBRAS_API_KEY',
    endpoint: 'https://api.cerebras.ai/v1/chat/completions',
    model: 'llama3.1-8b',
  },
  nvidia: {
    key: 'NVIDIA_API_KEY',
    endpoint: 'https://integrate.api.nvidia.com/v1/chat/completions',
    model: 'meta/llama-3.1-8b-instruct',
  },
  huggingface: {
    key: 'HUGGINGFACE_API_KEY',
    endpoint: 'https://router.huggingface.co/v1/chat/completions',
    model: 'openai/gpt-oss-120b:fastest',
  },
}

function getModel(provider: AiProvider, defaultModel: string) {
  return process.env[`AI_${provider.toUpperCase()}_MODEL`] || defaultModel
}

async function parseJson(response: Response): Promise<Record<string, unknown>> {
  return response.json() as Promise<Record<string, unknown>>
}

function getOpenAiContent(data: Record<string, unknown>): string | undefined {
  const choices = data.choices as Array<{ message?: { content?: string } }> | undefined
  return choices?.[0]?.message?.content
}

async function callOpenAiCompatible(
  provider: Exclude<AiProvider, 'gemini' | 'cohere' | 'cloudflare'>,
  messages: AiMessage[],
  maxTokens: number
): Promise<string> {
  const config = openAiCompatibleProviders[provider]
  if (!config || !process.env[config.key]) throw new Error(`${provider} is not configured`)

  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env[config.key]}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: getModel(provider, config.model), messages, max_tokens: maxTokens }),
    signal: AbortSignal.timeout(20_000),
  })
  if (!response.ok) throw new Error(`${provider} request failed with ${response.status}`)
  const content = getOpenAiContent(await parseJson(response))
  if (!content) throw new Error(`${provider} returned no content`)
  return content
}

async function callGemini(messages: AiMessage[], maxTokens: number): Promise<string> {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('gemini is not configured')
  const prompt = messages.map((message) => `${message.role}: ${message.content}`).join('\n\n')
  const model = getModel('gemini', 'gemini-2.0-flash')
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: maxTokens } }),
    signal: AbortSignal.timeout(20_000),
  })
  if (!response.ok) throw new Error(`gemini request failed with ${response.status}`)
  const data = await parseJson(response)
  const candidates = data.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }> | undefined
  const content = candidates?.[0]?.content?.parts?.[0]?.text
  if (!content) throw new Error('gemini returned no content')
  return content
}

async function callCohere(messages: AiMessage[], maxTokens: number): Promise<string> {
  const key = process.env.COHERE_API_KEY
  if (!key) throw new Error('cohere is not configured')
  const response = await fetch('https://api.cohere.com/v2/chat', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: getModel('cohere', 'command-a-03-2025'), messages, max_tokens: maxTokens }),
    signal: AbortSignal.timeout(20_000),
  })
  if (!response.ok) throw new Error(`cohere request failed with ${response.status}`)
  const data = await parseJson(response)
  const message = data.message as { content?: Array<{ text?: string }> } | undefined
  const content = message?.content?.[0]?.text
  if (!content) throw new Error('cohere returned no content')
  return content
}

async function callCloudflare(messages: AiMessage[], maxTokens: number): Promise<string> {
  const key = process.env.CLOUDFLARE_API_KEY
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  if (!key || !accountId) throw new Error('cloudflare is not configured')
  const model = getModel('cloudflare', '@cf/meta/llama-3.1-8b-instruct')
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, max_tokens: maxTokens }),
    signal: AbortSignal.timeout(20_000),
  })
  if (!response.ok) throw new Error(`cloudflare request failed with ${response.status}`)
  const data = await parseJson(response)
  const result = data.result as { response?: string } | undefined
  if (!result?.response) throw new Error('cloudflare returned no content')
  return result.response
}

export async function generateAiResponse({ messages, maxTokens = 600, provider }: GenerateOptions): Promise<AiGeneration> {
  const providers = provider
    ? [provider, ...fallbackOrder.filter((candidate) => candidate !== provider)]
    : fallbackOrder

  for (const candidate of providers) {
    try {
      const content = candidate === 'gemini'
        ? await callGemini(messages, maxTokens)
        : candidate === 'cohere'
          ? await callCohere(messages, maxTokens)
          : candidate === 'cloudflare'
            ? await callCloudflare(messages, maxTokens)
            : await callOpenAiCompatible(candidate, messages, maxTokens)
      return { content, provider: candidate }
    } catch (error) {
      console.warn(`AI provider ${candidate} unavailable`, error instanceof Error ? error.message : 'unknown error')
    }
  }

  throw new Error('No configured AI provider could generate a response')
}

export function isAiProvider(value: string | undefined): value is AiProvider {
  return value !== undefined && fallbackOrder.includes(value as AiProvider)
}

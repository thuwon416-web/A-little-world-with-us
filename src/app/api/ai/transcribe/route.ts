import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/rate-limit'

const messageIdSchema = z.string().uuid()
const maxAudioBytes = 25 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!process.env.GROQ_API_KEY) return NextResponse.json({ error: 'Voice transcription is not configured yet.' }, { status: 503 })

    const limit = await checkRateLimit(`ai-transcribe:${user.id}`, 5, 60_000)
    if (!limit.allowed) return NextResponse.json({ error: 'Please wait before transcribing another voice note.' }, { status: 429 })

    const form = await request.formData()
    const messageId = messageIdSchema.parse(form.get('messageId'))
    const audio = form.get('audio')
    if (!(audio instanceof File) || !audio.type.startsWith('audio/')) return NextResponse.json({ error: 'Upload an audio recording to transcribe.' }, { status: 400 })
    if (audio.size > maxAudioBytes) return NextResponse.json({ error: 'Voice recordings must be 25 MB or smaller.' }, { status: 413 })

    // RLS verifies that the requester belongs to the voice message's accepted couple.
    const { data: message, error: messageError } = await supabase.from('messages').select('id').eq('id', messageId).eq('message_type', 'voice').maybeSingle()
    if (messageError || !message) return NextResponse.json({ error: 'Voice message not found.' }, { status: 404 })

    const groqForm = new FormData()
    groqForm.set('file', audio, audio.name || 'voice-message.webm')
    groqForm.set('model', process.env.GROQ_TRANSCRIPTION_MODEL || 'whisper-large-v3-turbo')
    groqForm.set('response_format', 'json')
    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST', headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` }, body: groqForm, signal: AbortSignal.timeout(45_000),
    })
    if (!response.ok) return NextResponse.json({ error: 'Transcription service is unavailable.' }, { status: 503 })
    const result = await response.json() as { text?: string }
    const transcript = result.text?.trim()
    if (!transcript) return NextResponse.json({ error: 'No speech was detected in this recording.' }, { status: 422 })

    const { error: updateError } = await supabase.from('messages').update({ transcript }).eq('id', messageId)
    if (updateError) return NextResponse.json({ error: 'Unable to save the transcript.' }, { status: 500 })
    return NextResponse.json({ transcript })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Invalid transcription request.' }, { status: 400 })
    console.error('Voice transcription error:', error)
    return NextResponse.json({ error: 'Unable to transcribe this voice message.' }, { status: 500 })
  }
}

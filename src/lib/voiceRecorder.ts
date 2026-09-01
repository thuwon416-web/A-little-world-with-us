/**
 * Voice Message Recording
 * Uses MediaRecorder API
 */

export interface VoiceRecording {
  blob: Blob
  url: string
  duration: number
}

export async function recordVoice(
  onStop: (recording: VoiceRecording) => void,
  onError: (error: Error) => void,
  maxDuration: number = 300 // 5 minutes
): Promise<() => void> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const mediaRecorder = new MediaRecorder(stream)
  const chunks: Blob[] = []
  const startTime = Date.now()

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) {
      chunks.push(e.data)
    }
  }

  mediaRecorder.onstop = () => {
    const blob = new Blob(chunks, { type: 'audio/webm' })
    const url = URL.createObjectURL(blob)
    const duration = Math.floor((Date.now() - startTime) / 1000)

    onStop({ blob, url, duration })

    // Stop all tracks
    stream.getTracks().forEach((track) => track.stop())
  }

  mediaRecorder.onerror = () => {
    onError(new Error('Recording failed'))
    stream.getTracks().forEach((track) => track.stop())
  }

  mediaRecorder.start()

  // Auto-stop at max duration
  setTimeout(() => {
    if (mediaRecorder.state === 'recording') {
      mediaRecorder.stop()
    }
  }, maxDuration * 1000)

  // Return stop function
  return () => {
    if (mediaRecorder.state === 'recording') {
      mediaRecorder.stop()
    }
  }
}

export async function uploadVoiceRecording(
  blob: Blob,
  coupleId: string,
  messageId: string
): Promise<string> {
  const { supabase } = await import('./supabase')
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const fileName = `${coupleId}/${messageId}-${Date.now()}.webm`

  const { error } = await supabase.storage
    .from('voice_messages')
    .upload(fileName, blob, {
      contentType: 'audio/webm',
      upsert: false,
    })

  if (error) throw error

  const { data: urlData } = supabase.storage
    .from('voice_messages')
    .getPublicUrl(fileName)

  return urlData.publicUrl
}

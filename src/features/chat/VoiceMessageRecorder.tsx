'use client'

import { useState } from 'react'
import { Mic, Square, X } from 'lucide-react'
import { recordVoice } from '@/lib/voiceRecorder'

interface Props {
  onClose: () => void
  onRecord: (recording: { blob: Blob; duration: number }) => void
}

export default function VoiceMessageRecorder({ onClose, onRecord }: Props) {
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const handleStartRecording = async () => {
    try {
      setIsRecording(true)
      setDuration(0)

      const timer = setInterval(() => {
        setDuration((d) => d + 1)
      }, 1000)

      const stopRecording = await recordVoice(
        (recording) => {
          clearInterval(timer)
          onRecord(recording)
          onClose()
        },
        (err) => {
          setError(err.message)
          setIsRecording(false)
        }
      )

      // Store stop function for manual stop
      ;(window as any).stopVoiceRecording = stopRecording
    } catch (err) {
      setError('Failed to start recording')
      setIsRecording(false)
    }
  }

  const handleStopRecording = () => {
    ;(window as any).stopVoiceRecording?.()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="glass-card p-6 max-w-sm w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Voice Message
          </h3>
          <button onClick={onClose} className="text-[var(--text-secondary)]">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        <div className="text-center py-8">
          {isRecording ? (
            <>
              <div className="text-4xl font-bold text-[var(--accent-1)] mb-4">
                {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')}
              </div>
              <button
                onClick={handleStopRecording}
                className="p-4 rounded-full bg-red-500 text-white"
              >
                <Square className="h-8 w-8" />
              </button>
              <p className="text-sm text-[var(--text-secondary)] mt-2">
                Tap to stop
              </p>
            </>
          ) : (
            <>
              <button
                onClick={handleStartRecording}
                className="p-4 rounded-full bg-[var(--button-bg)] text-[var(--text-primary)]"
              >
                <Mic className="h-8 w-8" />
              </button>
              <p className="text-sm text-[var(--text-secondary)] mt-2">
                Tap to record
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

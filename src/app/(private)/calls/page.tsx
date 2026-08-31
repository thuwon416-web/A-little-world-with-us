'use client'

import { useEffect, useState } from 'react'
import { Camera, Mic, Phone, PhoneOff, Video } from 'lucide-react'

export default function CallsPage() {
  const [callState, setCallState] = useState<'idle' | 'calling' | 'in-call'>('idle')
  const [isMuted, setIsMuted] = useState(false)
  const [isVideo, setIsVideo] = useState(true)
  const [durationSeconds, setDurationSeconds] = useState(0)

  useEffect(() => {
    if (callState !== 'in-call') {
      setDurationSeconds(0)
      return
    }

    const timer = window.setInterval(() => {
      setDurationSeconds((prev) => prev + 1)
    }, 1000)

    return () => window.clearInterval(timer)
  }, [callState])

  const formatDuration = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const startCall = (type: 'audio' | 'video') => {
    setIsVideo(type === 'video')
    setCallState('calling')
    window.setTimeout(() => setCallState('in-call'), 850)
  }

  const endCall = () => {
    setCallState('idle')
    setIsMuted(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Calls</p>
        <h1 className="mt-2 text-3xl font-serif text-[var(--text-primary)]">Stay close, even apart</h1>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[30px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Current call</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">KoKo</h2>
            </div>
            <div className="rounded-full bg-[var(--accent-1)]/12 px-3 py-1 text-xs font-medium text-[var(--accent-1)]">
              {callState === 'idle' ? 'Ready' : callState === 'calling' ? 'Calling...' : 'Live'}
            </div>
          </div>

          <div className="mt-6 rounded-[28px] border border-[var(--accent-1)]/15 bg-[radial-gradient(circle_at_top,_rgba(255,107,157,0.22),_rgba(15,8,26,0.8)_58%)] p-8">
            <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-full bg-[var(--card-bg-strong)] text-[var(--accent-1)] shadow-[0_0_30px_rgba(255,107,157,0.3)]">
              {isVideo ? <Video className="h-16 w-16" /> : <Phone className="h-16 w-16" />}
            </div>
            <div className="mt-5 text-center">
              <p className="text-sm text-[var(--text-secondary)]">{isVideo ? 'Video call' : 'Audio call'}</p>
              <p className="mt-1 text-xl font-semibold text-[var(--text-primary)]">
                {callState === 'idle' ? 'Waiting for a call' : formatDuration(durationSeconds)}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setIsMuted((prev) => !prev)}
              className="rounded-full border border-white/10 bg-[var(--card-bg-strong)] px-4 py-3 text-sm text-[var(--text-primary)]"
            >
              <span className="inline-flex items-center gap-2"><Mic className="h-4 w-4" /> {isMuted ? 'Unmute' : 'Mute'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsVideo((prev) => !prev)}
              className="rounded-full border border-white/10 bg-[var(--card-bg-strong)] px-4 py-3 text-sm text-[var(--text-primary)]"
            >
              <span className="inline-flex items-center gap-2"><Camera className="h-4 w-4" /> {isVideo ? 'Video on' : 'Video off'}</span>
            </button>
            {callState !== 'idle' && (
              <button
                type="button"
                onClick={endCall}
                className="rounded-full bg-red-500 px-4 py-3 text-sm font-medium text-white"
              >
                <span className="inline-flex items-center gap-2"><PhoneOff className="h-4 w-4" /> End call</span>
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[24px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Quick actions</p>
            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={() => startCall('audio')}
                className="flex w-full items-center justify-between rounded-2xl bg-[var(--card-bg-strong)] px-4 py-3 text-left text-[var(--text-primary)]"
              >
                <span className="inline-flex items-center gap-2"><Phone className="h-4 w-4 text-[var(--accent-1)]" /> Audio call</span>
                <span className="text-xs text-[var(--text-secondary)]">1 tap</span>
              </button>
              <button
                type="button"
                onClick={() => startCall('video')}
                className="flex w-full items-center justify-between rounded-2xl bg-[var(--card-bg-strong)] px-4 py-3 text-left text-[var(--text-primary)]"
              >
                <span className="inline-flex items-center gap-2"><Video className="h-4 w-4 text-[var(--accent-2)]" /> Video call</span>
                <span className="text-xs text-[var(--text-secondary)]">HD</span>
              </button>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-[var(--card-bg)] p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Recent calls</p>
            <ul className="mt-4 space-y-3 text-sm text-[var(--text-primary)]">
              <li className="flex items-center justify-between rounded-xl bg-[var(--card-bg-strong)] px-3 py-2">
                <span>Last night</span>
                <span className="text-[var(--text-secondary)]">07:24</span>
              </li>
              <li className="flex items-center justify-between rounded-xl bg-[var(--card-bg-strong)] px-3 py-2">
                <span>Morning check-in</span>
                <span className="text-[var(--text-secondary)]">03:11</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

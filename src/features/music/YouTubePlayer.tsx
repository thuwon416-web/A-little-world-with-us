'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, Pause, Play, Volume2, VolumeX } from 'lucide-react'
import type { YouTubePlayerProps } from './music-types'

export type { YouTubePlayerProps }

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`
}

export function YouTubePlayer({
  videoId,
  title = 'YouTube music player',
  autoplay = false,
  onStateChange,
  className = '',
}: YouTubePlayerProps) {
  const frameRef = useRef<HTMLIFrameElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [playing, setPlaying] = useState(autoplay)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(70)
  const [elapsed, setElapsed] = useState(0)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const validId = useMemo(() => /^[A-Za-z0-9_-]{11}$/.test(videoId), [videoId])
  const sendCommand = useCallback((func: string, args: unknown[] = []) => {
    frameRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func, args }),
      'https://www.youtube.com'
    )
  }, [])

  useEffect(() => {
    const handleMessage = (event: MessageEvent<string>) => {
      if (!event.origin.includes('youtube.com')) return
      try {
        const message = JSON.parse(event.data) as { event?: string; info?: { duration?: number; currentTime?: number; playerState?: number } }
        if (message.event !== 'infoDelivery' || !message.info) return
        if (typeof message.info.duration === 'number' && message.info.duration > 0) setDuration(message.info.duration)
        if (typeof message.info.currentTime === 'number') setElapsed(message.info.currentTime)
        if (typeof message.info.playerState === 'number') onStateChange?.(message.info.playerState)
        if (message.info.playerState === 1) setPlaying(true)
        if (message.info.playerState === 2) setPlaying(false)
        if (message.info.playerState === 0) {
          setPlaying(false)
        }
      } catch {
        // Ignore non-JSON messages sent by the embedded player.
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onStateChange])

  useEffect(() => {
    setPlaying(autoplay)
    setElapsed(0)
    setError(validId ? null : 'Enter a valid YouTube video ID or URL.')
  }, [autoplay, validId, videoId])

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (playing) {
      timerRef.current = setInterval(() => {
        setElapsed((current) => {
          const next = current + 1
          if (duration > 0 && next >= duration) {
            setPlaying(false)
            return duration
          }
          return next
        })
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [duration, playing])

  const togglePlaying = () => {
    if (!validId) return
    const next = !playing
    setPlaying(next)
    sendCommand(next ? 'playVideo' : 'pauseVideo')
  }

  const seek = (next: number) => {
    setElapsed(next)
    sendCommand('seekTo', [next, true])
  }

  const changeVolume = (next: number) => {
    setVolume(next)
    setMuted(next === 0)
    sendCommand('setVolume', [next])
  }

  if (error) {
    return (
      <div className={`rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100 ${className}`}>
        <div className="flex items-center gap-2 font-medium"><AlertCircle className="h-4 w-4" /> Unable to play this video</div>
        <p className="mt-1 text-xs opacity-80">{error}</p>
      </div>
    )
  }

  return (
    <div className={`overflow-hidden rounded-2xl border border-[var(--accent-1)]/20 bg-black/30 ${className}`}>
      <div className="aspect-video w-full">
        <iframe
          ref={frameRef}
          title={title}
          className="h-full w-full"
          src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0${autoplay ? '&autoplay=1' : ''}`}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          onLoad={() => {
            frameRef.current?.contentWindow?.postMessage(
              JSON.stringify({ event: 'listening', id: 1, file: 'www-widgetapi' }),
              'https://www.youtube.com'
            )
            sendCommand('addEventListener', ['onStateChange'])
            sendCommand('getDuration')
          }}
          onError={() => {
            setError('YouTube could not load this video')
          }}
        />
      </div>
      <div className="space-y-2 p-3">
        <div className="flex items-center gap-2">
          <button type="button" onClick={togglePlaying} aria-label={playing ? 'Pause' : 'Play'} className="rounded-full bg-[var(--accent-1)]/15 p-2 text-[var(--accent-1)]">
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
          </button>
          <input aria-label="Playback progress" type="range" min={0} max={duration || 100} value={Math.min(elapsed, duration || 100)} onChange={(event) => seek(Number(event.target.value))} className="min-w-0 flex-1 accent-[var(--accent-1)]" />
          <span className="min-w-[74px] text-right text-[11px] text-[var(--text-secondary)]">{formatTime(elapsed)} / {duration ? formatTime(duration) : '--:--'}</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => { setMuted(!muted); sendCommand(muted ? 'unMute' : 'mute') }} aria-label={muted ? 'Unmute' : 'Mute'} className="text-[var(--text-secondary)]">
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <input aria-label="Volume" type="range" min={0} max={100} value={muted ? 0 : volume} onChange={(event) => changeVolume(Number(event.target.value))} className="w-24 accent-[var(--accent-1)]" />
          <span className="ml-auto text-[11px] text-[var(--text-secondary)]">{formatTime(elapsed)}</span>
        </div>
      </div>
    </div>
  )
}

export default YouTubePlayer

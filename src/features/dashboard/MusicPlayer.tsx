'use client'

import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, Music, Pause, Play } from 'lucide-react'

/**
 * Floating music player toggle.
 * Uses /music/our-song.mp3 from the public folder.
 */
export default memo(function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [audioError, setAudioError] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      audioRef.current = new Audio('/music/our-song.mp3')
      audioRef.current.loop = true
    } catch {
      setAudioError(true)
    }

    return () => {
      audioRef.current?.pause()
    }
  }, [])

  const togglePlay = useCallback(async () => {
    if (!audioRef.current) {
      setAudioError(true)
      return
    }

    try {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        await audioRef.current.play()
        setIsPlaying(true)
      }
      setAudioError(false)
    } catch {
      setIsPlaying(false)
      setAudioError(true)
    }
  }, [isPlaying])

  if (!mounted) return null

  if (audioError) {
    return (
      <div className="dashboard-card-interactive dashboard-card-glow flex items-center justify-between gap-3 rounded-[1.5rem] border border-[var(--accent-1)]/20 bg-[var(--card-bg)]/60 p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-1)]/10 text-[var(--accent-1)]">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Music isn&apos;t available right now</p>
            <p className="text-xs text-[var(--text-secondary)]">Try again in a moment</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setAudioError(false)}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-1)]/25 bg-[var(--accent-1)]/10 px-3 py-2 text-sm font-medium text-[var(--text-primary)]"
        >
          Retry
          <Play className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="dashboard-card-interactive dashboard-card-glow flex items-center justify-between gap-3 rounded-[1.5rem] border border-[var(--accent-1)]/20 bg-[var(--card-bg)]/60 p-3">
      <div className="flex items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={togglePlay}
          className="glass-card relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),transparent_70%)]" />
          <AnimatePresence mode="wait">
            {isPlaying ? (
              <motion.div
                key="playing"
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
                className="relative z-10"
              >
                <Pause className="h-5 w-5 text-[var(--accent-1)]" />
              </motion.div>
            ) : (
              <motion.div
                key="paused"
                initial={{ opacity: 0, rotate: 90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: -90 }}
                className="relative z-10"
              >
                <Play className="ml-0.5 h-5 w-5 text-[var(--accent-1)]" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
            <Music className="h-3.5 w-3.5 text-[var(--accent-2)]" />
            {isPlaying ? 'Now playing' : 'Our song'}
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            {isPlaying ? 'A little world soundtrack' : 'Tap to play'}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={togglePlay}
        className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-1)]/25 bg-[var(--accent-1)]/10 px-3 py-2 text-sm font-medium text-[var(--text-primary)]"
      >
        {isPlaying ? 'Pause' : 'Play'}
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </button>
    </div>
  )
})

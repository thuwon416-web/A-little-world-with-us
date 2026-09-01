'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Sparkle } from 'lucide-react'
import AmbientBackground from '@/components/effects/ambient-background'

interface LockScreenProps {
  onUnlock: () => void
}

const CORRECT_PIN = process.env.NEXT_PUBLIC_PIN_CODE || '0202'

export default function LockScreen({ onUnlock }: LockScreenProps) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [unlocking, setUnlocking] = useState(false)
  const [particles, setParticles] = useState<
    { id: number; angle: number; distance: number; size: number }[]
  >([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleInput = (digit: string) => {
    if (pin.length >= 4 || unlocking) return
    const newPin = pin + digit
    setPin(newPin)
    setError(false)

    if (newPin.length === 4) {
      if (newPin === CORRECT_PIN) {
        // Explode particles
        const newParticles = Array.from({ length: 24 }, (_, i) => ({
          id: i,
          angle: (i / 24) * Math.PI * 2,
          distance: 120 + Math.random() * 100,
          size: 6 + Math.random() * 14,
        }))
        setParticles(newParticles)
        setUnlocking(true)
        setTimeout(onUnlock, 1400)
      } else {
        setError(true)
        setTimeout(() => setPin(''), 600)
      }
    }
  }

  const handleBackspace = () => {
    setPin(pin.slice(0, -1))
    setError(false)
  }

  const keypadButtons = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']

  return (
    <AnimatePresence>
      {!unlocking && (
        <motion.div
          exit={{ opacity: 0, scale: 1.15, filter: 'blur(30px)' }}
          transition={{ duration: 1, ease: 'easeInOut' }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
        >
          <AmbientBackground density="high" />

          {/* Glowing golden heart */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="relative mb-10"
          >
            <div className="absolute inset-0 rounded-full bg-gold/30 blur-3xl animate-glow-pulse scale-150" />
            <motion.div
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="relative"
            >
              <Heart className="w-24 h-24 text-gold fill-gold drop-shadow-[0_0_20px_rgba(255,215,0,0.6)]" />
            </motion.div>
          </motion.div>

          {/* Title in glowing Dancing Script */}
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="font-script text-6xl md:text-7xl gold-text mb-3 animate-gold-glow"
          >
            A Little World With Us
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-rose-blush/70 text-sm mb-12 font-sans tracking-wide"
          >
            Enter your secret code to unlock our world
          </motion.p>

          {/* PIN dots */}
          <motion.div
            animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="flex gap-5 mb-10"
          >
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`pin-dot ${pin.length > i ? 'filled' : ''} ${
                  error ? '!border-destructive !bg-destructive' : ''
                }`}
              />
            ))}
          </motion.div>

          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={pin}
            onChange={() => {}}
            className="sr-only"
            aria-label="PIN input"
          />

          {/* Keypad */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="grid grid-cols-3 gap-4"
          >
            {keypadButtons.map((btn, i) => {
              if (btn === '') return <div key={i} />
              return (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.88 }}
                  whileHover={{ scale: 1.08 }}
                  onClick={() => (btn === '⌫' ? handleBackspace() : handleInput(btn))}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full glass-card flex items-center justify-center text-2xl font-light text-rose-blush hover:bg-gold/10 hover:glow-gold transition-all duration-300"
                >
                  {btn}
                </motion.button>
              )
            })}
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: error ? 1 : 0 }}
            className="text-rose-deep text-sm mt-6 font-sans"
          >
            {error ? 'Wrong code, my love. Try again 💕' : ''}
          </motion.p>

          <p className="absolute bottom-8 text-xs text-rose-blush/40 font-sans">
            Hint: our month together 💝
          </p>
        </motion.div>
      )}

      {/* Particle explosion on unlock */}
      {unlocking && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.4 }}
        >
          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="absolute"
          >
            <Heart className="w-24 h-24 text-gold fill-gold drop-shadow-[0_0_40px_rgba(255,215,0,0.8)]" />
          </motion.div>

          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{
                x: Math.cos(p.angle) * p.distance,
                y: Math.sin(p.angle) * p.distance,
                opacity: 0,
                scale: 0.3,
                rotate: Math.random() * 360,
              }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="absolute"
            >
              {p.id % 3 === 0 ? (
                <Sparkle className="text-gold" style={{ width: p.size, height: p.size }} />
              ) : (
                <Heart
                  className="text-gold fill-gold/60"
                  style={{ width: p.size, height: p.size }}
                />
              )}
            </motion.div>
          ))}

          {/* Expanding golden ring */}
          <motion.div
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 8, opacity: 0 }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
            className="absolute w-32 h-32 rounded-full border-2 border-gold"
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

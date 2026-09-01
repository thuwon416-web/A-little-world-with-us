'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Delete } from 'lucide-react'

interface PinLockProps {
  correctPin: string
  onSuccess: () => void
  maxAttempts?: number
  autoLockMs?: number
}

/**
 * Animated PIN lock screen with haptic feedback and heart unlock animation.
 */
export default function PinLock({
  correctPin,
  onSuccess,
  maxAttempts = 5,
  autoLockMs = 300000,
}: PinLockProps) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [lockedUntil, setLockedUntil] = useState<number | null>(null)

  useEffect(() => {
    if (!lockedUntil) return

    const timeout = window.setTimeout(() => {
      setIsLocked(false)
      setLockedUntil(null)
    }, autoLockMs)

    return () => window.clearTimeout(timeout)
  }, [lockedUntil, autoLockMs])

  const handleNumber = (num: string) => {
    if (pin.length < 4 && !isUnlocked && !isLocked) {
      const newPin = pin + num
      setPin(newPin)
      setError(false)

      if (newPin.length === 4) {
        if (newPin === correctPin) {
          setIsUnlocked(true)
          setTimeout(onSuccess, 1500)
        } else {
          const nextAttempts = attempts + 1
          setAttempts(nextAttempts)
          setError(true)

          if (nextAttempts >= maxAttempts) {
            setIsLocked(true)
            setLockedUntil(Date.now() + autoLockMs)
            setPin('')
            return
          }

          setTimeout(() => setPin(''), 500)
        }
      }
    }
  }

  const handleDelete = () => {
    if (!isUnlocked && !isLocked) {
      setPin(pin.slice(0, -1))
      setError(false)
    }
  }

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del']

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 relative">
      {/* Floating background hearts */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: '100vh', x: `${Math.random() * 100}%` }}
            animate={{ opacity: [0, 0.3, 0], y: '-20vh' }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              delay: i * 1.5,
              ease: 'linear',
            }}
            className="absolute"
          >
            <Heart className="w-8 h-8 text-[var(--accent-1)]/30 fill-current" />
          </motion.div>
        ))}
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-12 z-10"
      >
        {isLocked && (
          <p className="mb-4 text-sm text-[var(--text-secondary)]">
            Locked for {Math.ceil(autoLockMs / 60000)} minute{Math.ceil(autoLockMs / 60000) > 1 ? 's' : ''}
          </p>
        )}
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
        >
          <Heart className="w-20 h-20 text-[var(--accent-1)] mx-auto mb-6 fill-current drop-shadow-lg" />
        </motion.div>
        <h1 className="font-dancing text-5xl text-[var(--accent-2)] mb-3 drop-shadow-sm">
          A Little World With Us
        </h1>
        <p className="text-sm opacity-70 tracking-wide">Enter PIN to unlock our world</p>
      </motion.div>

      {/* PIN Dots */}
      <motion.div
        animate={error ? { x: [-12, 12, -12, 12, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="flex gap-5 mb-12 z-10"
      >
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            animate={
              i < pin.length
                ? { scale: [1, 1.3, 1], backgroundColor: '#FFB6C1' }
                : { scale: 1 }
            }
            className={`w-5 h-5 rounded-full border-2 transition-colors duration-300 ${
              i < pin.length
                ? 'bg-[var(--accent-1)] border-[var(--accent-1)] shadow-[0_0_10px_rgba(255,182,193,0.6)]'
                : 'border-[var(--accent-1)]/20 bg-transparent'
            }`}
          />
        ))}
      </motion.div>

      {/* Unlock overlay */}
      <AnimatePresence>
        {isUnlocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-2)]/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.5, 1.2] }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              <Heart className="w-32 h-32 text-[var(--accent-1)] fill-current drop-shadow-[0_0_30px_rgba(255,182,193,0.8)]" />
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute mt-40 font-dancing text-3xl text-[var(--accent-2)]"
            >
              Welcome back, my love
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-xs z-10">
        {keys.map((key, idx) => (
          <motion.button
            key={idx}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => (key === 'del' ? handleDelete() : key && handleNumber(key))}
            disabled={!key || isUnlocked || isLocked}
            className={`aspect-square rounded-2xl text-2xl font-semibold flex items-center justify-center transition-all ${
              key === ''
                ? 'pointer-events-none opacity-0'
                : 'glass-card hover:bg-[var(--card-bg)] active:bg-[var(--card-bg)]/40 shadow-lg'
            }`}
          >
            {key === 'del' ? <Delete className="w-7 h-7 opacity-80" /> : key}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
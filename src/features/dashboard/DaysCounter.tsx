'use client'

import { memo, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { calculateDaysTogether, getRelationshipStartDate } from '@/lib/relationship-days'

/**
 * Displays total days together since the anniversary date.
 * Includes a pulsing heart animation.
 */
export default memo(function DaysCounter() {
  const [days, setDays] = useState(0)

  useEffect(() => {
    setDays(calculateDaysTogether())
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className="glass-card p-8 text-center relative overflow-hidden"
    >
      {/* Decorative heart */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        className="absolute top-4 right-4 text-[var(--accent-1)]/40"
      >
        <Heart className="w-10 h-10 fill-current" />
      </motion.div>

      <h2 className="font-dancing text-3xl text-[var(--accent-2)] mb-1">Days Together</h2>
      <p className="text-xs opacity-60 mb-6 uppercase tracking-widest">Since {getRelationshipStartDate()}</p>

      <div className="flex items-center justify-center gap-3">
        <motion.span
          key={days}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-6xl font-bold text-[var(--accent-1)] drop-shadow-sm"
        >
          {days}
        </motion.span>
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
        >
          <Heart className="w-8 h-8 text-[var(--accent-1)] fill-current" />
        </motion.div>
      </div>

      <p className="mt-4 text-sm opacity-70 font-light">Every day with you is a blessing</p>
    </motion.div>
  )
})

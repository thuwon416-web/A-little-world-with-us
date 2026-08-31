'use client'

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface CountdownProps {
  targetDate: string // ISO date string, e.g. "2026-09-10"
  label: string
  icon?: React.ReactNode // optional ဖြစ်ပါတယ်
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

const RollingNumber = memo(function RollingNumber({ value }: { value: number }) {
  const prev = useRef<number>(value)
  useEffect(() => {
    prev.current = value
  }, [value])

  return (
    <div className="overflow-hidden h-10 w-12 flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={value}
          initial={{ y: -12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 12, opacity: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="text-2xl font-bold text-[var(--accent-1)]"
        >
          {String(value).padStart(2, '0')}
        </motion.div>
      </AnimatePresence>
    </div>
  )
})

/**
 * Reusable countdown timer that automatically rolls over to next year
 * if the target date has already passed.
 */
export default memo(function Countdown({ targetDate, label, icon = '🎂' }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  const calculate = useCallback(() => {
    const now = new Date()
    const target = new Date(targetDate)

    target.setFullYear(now.getFullYear())
    if (target < now) {
      target.setFullYear(now.getFullYear() + 1)
    }

    const diff = target.getTime() - now.getTime()

    setTimeLeft({
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    })
  }, [targetDate])

  useEffect(() => {
    calculate()
    const interval = setInterval(calculate, 1000)
    return () => clearInterval(interval)
  }, [calculate])

  const units = useMemo(
    () => [
      { value: timeLeft.days, label: 'Days' },
      { value: timeLeft.hours, label: 'Hrs' },
      { value: timeLeft.minutes, label: 'Min' },
      { value: timeLeft.seconds, label: 'Sec' },
    ],
    [timeLeft.days, timeLeft.hours, timeLeft.minutes, timeLeft.seconds]
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className="glass-card p-4 text-center relative"
    >
      <div className="flex justify-center mb-2 text-[var(--accent-2)]">{icon}</div>
      <h3 className="font-dancing text-lg mb-3 text-[var(--accent-2)]/90">{label}</h3>

      <div className="grid grid-cols-4 gap-3 items-center justify-center">
        {units.map((unit) => (
          <div key={unit.label} className="flex flex-col items-center">
            <RollingNumber value={unit.value} />
            <span className="text-[10px] uppercase tracking-wider opacity-60 mt-1">{unit.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
})

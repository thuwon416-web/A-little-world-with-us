'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Clock3, Sparkles } from 'lucide-react'

type Alarm = {
  id: string
  label: string
  time: string
  active: boolean
}

const starterAlarms: Alarm[] = [
  { id: 'a1', label: 'Good morning love', time: '08:00', active: true },
  { id: 'a2', label: 'Check in reminder', time: '18:30', active: false },
]

export default function MemoryAlarm() {
  const [alarms, setAlarms] = useState<Alarm[]>(starterAlarms)
  const [label, setLabel] = useState('')
  const [time, setTime] = useState('08:00')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('memory-alarm')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length) {
          setAlarms(parsed)
        }
      }
    } catch {
      // ignore gracefully
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('memory-alarm', JSON.stringify(alarms))
  }, [alarms])

  const toggleAlarm = (id: string) => {
    setAlarms((current) =>
      current.map((alarm) => (alarm.id === id ? { ...alarm, active: !alarm.active } : alarm))
    )
  }

  const addAlarm = () => {
    const value = label.trim()
    if (!value || !time) return

    setAlarms((current) => [
      ...current,
      { id: `alarm-${Date.now()}`, label: value, time, active: true },
    ])
    setLabel('')
    setTime('08:00')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-accent-2">
        <Clock3 className="h-5 w-5" />
        <h3 className="font-dancing text-2xl">Memory Alarm</h3>
      </div>

      <div className="space-y-2">
        {alarms.map((alarm) => (
          <motion.button
            key={alarm.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => toggleAlarm(alarm.id)}
            className={`w-full rounded-btn border p-3 text-left transition ${
              alarm.active
                ? 'border-accent-1/20 bg-soft-tint'
                : 'border-accent-1/20 bg-card/25'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-text-1">{alarm.label}</span>
              <span className="text-[9px] uppercase tracking-[0.18em] text-text-1/60">
                {alarm.active ? 'on' : 'off'}
              </span>
            </div>
            <p className="mt-1 text-sm text-text-1/75">{alarm.time}</p>
          </motion.button>
        ))}
      </div>

      <div className="space-y-2 rounded-btn border border-accent-1/20 bg-card/15 p-3">
        <input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="Alarm label"
          className="w-full rounded-input border border-accent-1/20 bg-card px-3 py-2 text-sm text-text-1 placeholder:text-text-1/40"
        />
        <div className="flex gap-2">
          <input
            type="time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
            className="w-full rounded-input border border-accent-1/20 bg-card px-3 py-2 text-sm text-text-1"
          />
          <button onClick={addAlarm} className="glass-button px-3 py-2 text-sm">
            Add
          </button>
        </div>
      </div>

      <div className="rounded-btn border border-accent-1/20 bg-gradient-to-r from-accent-2 to-accent-1 p-3 text-sm text-text-1/80">
        <div className="mb-1 flex items-center gap-2 font-medium text-accent-2">
          <Sparkles className="h-4 w-4" />
          Gentle reminder
        </div>
        <p>Some memories deserve to be revisited at the same hour they were first made.</p>
      </div>
    </div>
  )
}

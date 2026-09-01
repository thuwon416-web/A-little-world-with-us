'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Bell,
  Heart,
  Lock,
  MoonStar,
  Sparkles,
  Star,
  ShieldCheck,
  CalendarHeart,
  Gift,
  Zap,
} from 'lucide-react'

type AccessLevel = 'Full' | 'Guest' | 'Secret'
type OccasionMode = 'Birthday' | 'Anniversary' | 'Just Because' | 'Normal'

const compliments = [
  'I love how your laugh makes the whole room feel softer.',
  'You make ordinary moments feel like little celebrations.',
  'I admire how gentle and thoughtful you are with everyone you love.',
  'You have the kind of warmth that makes people feel safe and seen.',
  'The way you love me feels like home.',
]

const horoscopeNotes = [
  'Your connection is glowing today—keep the little gestures going.',
  'The universe is nudging you toward a softer, more honest conversation.',
  'Today favors patience, kindness, and one sincere compliment.',
  'A small surprise or quiet check-in could deepen your bond beautifully.',
]

const loveLanguages = ['Words', 'Touch', 'Time', 'Acts', 'Gifts'] as const

export default function DailyHarmonyCenter() {
  const [accessLevel, setAccessLevel] = useState<AccessLevel>('Full')
  const [incognitoMode, setIncognitoMode] = useState(false)
  const [notifications, setNotifications] = useState({
    daily: true,
    birthday: true,
    anniversary: true,
    checkin: false,
  })
  const [occasionMode, setOccasionMode] = useState<OccasionMode>('Normal')
  const [compliment, setCompliment] = useState(compliments[0])
  const [horoscope, setHoroscope] = useState(horoscopeNotes[0])
  const [languageCounts, setLanguageCounts] = useState<Record<string, number>>({
    Words: 2,
    Touch: 1,
    Time: 3,
    Acts: 2,
    Gifts: 1,
  })

  useEffect(() => {
    const storedAccess = localStorage.getItem('a-little-world-with-us-access') as AccessLevel | null
    const storedMode = localStorage.getItem('a-little-world-with-us-incognito')
    const storedNotifications = localStorage.getItem('a-little-world-with-us-notifications')
    const storedOccasion = localStorage.getItem('a-little-world-with-us-occasion') as OccasionMode | null
    const storedLanguageCounts = localStorage.getItem('a-little-world-with-us-love-language')

    if (storedAccess) setAccessLevel(storedAccess)
    if (storedMode) setIncognitoMode(storedMode === 'true')
    if (storedNotifications) setNotifications(JSON.parse(storedNotifications))
    if (storedOccasion) setOccasionMode(storedOccasion)
    if (storedLanguageCounts) setLanguageCounts(JSON.parse(storedLanguageCounts))
  }, [])

  useEffect(() => {
    localStorage.setItem('a-little-world-with-us-access', accessLevel)
    localStorage.setItem('a-little-world-with-us-incognito', String(incognitoMode))
    localStorage.setItem('a-little-world-with-us-notifications', JSON.stringify(notifications))
    localStorage.setItem('a-little-world-with-us-occasion', occasionMode)
    localStorage.setItem('a-little-world-with-us-love-language', JSON.stringify(languageCounts))
  }, [accessLevel, incognitoMode, notifications, occasionMode, languageCounts])

  const todayWidgets = useMemo(
    () => [
      { label: 'Cycle', value: 'Day 12' },
      { label: 'Countdown', value: '12 days' },
      { label: 'Question', value: 'Daily' },
      { label: 'Photo', value: 'Saved' },
    ],
    []
  )

  const generateCompliment = () => {
    const next = compliments[Math.floor(Math.random() * compliments.length)]
    setCompliment(next)
  }

  const generateHoroscope = () => {
    const next = horoscopeNotes[Math.floor(Math.random() * horoscopeNotes.length)]
    setHoroscope(next)
  }

  const addLanguageUsage = (key: string) => {
    setLanguageCounts((prev) => ({
      ...prev,
      [key]: (prev[key] ?? 0) + 1,
    }))
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass-card rounded-3xl p-4">
          <div className="flex items-center gap-2 text-[var(--accent-2)] mb-3">
            <Bell className="w-5 h-5" />
            <h3 className="font-dancing text-2xl">Daily Notifications</h3>
          </div>

          <div className="space-y-2">
            {Object.entries(notifications).map(([key, enabled]) => (
              <label
                key={key}
                className="flex items-center justify-between rounded-2xl bg-[var(--card-bg)] px-3 py-2 text-sm"
              >
                <span className="capitalize">{key}</span>
                <button
                  type="button"
                  onClick={() =>
                    setNotifications((prev) => ({
                      ...prev,
                      [key]: !prev[key as keyof typeof prev],
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${enabled ? 'bg-[var(--accent-1)]' : 'bg-[var(--bg-2)]'}`}
                  aria-label={`Toggle ${key} notification`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-[var(--card-bg)] transition ${enabled ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
              </label>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-3xl p-4">
          <div className="flex items-center gap-2 text-[var(--accent-2)] mb-3">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="font-dancing text-2xl">Access & Privacy</h3>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            {(['Full', 'Guest', 'Secret'] as AccessLevel[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setAccessLevel(value)}
                className={`rounded-2xl px-2 py-2 text-xs font-medium transition ${
                  accessLevel === value
                    ? 'bg-[var(--accent-1)] text-[var(--text-primary)] shadow-md'
                    : 'bg-[var(--card-bg)] text-[var(--text-primary)]'
                }`}
              >
                {value}
              </button>
            ))}
          </div>

          <label className="flex items-center justify-between rounded-2xl bg-[var(--card-bg)] px-3 py-2 text-sm">
            <span className="flex items-center gap-2">
              <MoonStar className="w-4 h-4" /> Incognito mode
            </span>
            <button
              type="button"
              onClick={() => setIncognitoMode((value) => !value)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${incognitoMode ? 'bg-[var(--accent-1)]' : 'bg-[var(--bg-2)]'}`}
              aria-label="Toggle incognito mode"
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-[var(--card-bg)] transition ${incognitoMode ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
          </label>

          <div className="mt-3 rounded-2xl bg-[var(--card-bg)]/25 p-3 text-sm">
            <div className="mb-1 flex items-center gap-2 text-[var(--accent-1)]">
              <Lock className="w-4 h-4" /> Biometric Login
            </div>
            <p className="opacity-75">
              Touch ID / Face ID setup ready for a secure, romantic vault login.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass-card rounded-3xl p-4">
          <div className="flex items-center gap-2 text-[var(--accent-2)] mb-3">
            <CalendarHeart className="w-5 h-5" />
            <h3 className="font-dancing text-2xl">Special Occasion Modes</h3>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            {(['Normal', 'Birthday', 'Anniversary', 'Just Because'] as OccasionMode[]).map(
              (value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setOccasionMode(value)}
                  className={`rounded-2xl px-2 py-2 text-xs font-medium transition ${
                    occasionMode === value
                      ? 'bg-[var(--accent-2)]/80 text-[var(--text-primary)]'
                      : 'bg-[var(--card-bg)] text-[var(--text-primary)]'
                  }`}
                >
                  {value}
                </button>
              )
            )}
          </div>

          <div className="rounded-2xl bg-[var(--card-bg)]/25 p-3 text-sm leading-relaxed">
            {occasionMode === 'Birthday' &&
              'Birthday mode is active: the home screen glows brighter, the countdown gets playful, and the celebration feels extra personal.'}
            {occasionMode === 'Anniversary' &&
              'Anniversary mode is on: a heartfelt message is queued and every memory feels more cinematic and treasured.'}
            {occasionMode === 'Just Because' &&
              'Just because mode is live: a surprise note, a tiny delight, and a spontaneous smile are the focus.'}
            {occasionMode === 'Normal' &&
              'A calm, everyday rhythm is active—simple rituals and thoughtful check-ins are doing the magic.'}
          </div>
        </div>

        <div className="glass-card rounded-3xl p-4">
          <div className="flex items-center gap-2 text-[var(--accent-2)] mb-3">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-dancing text-2xl">Random Compliment</h3>
          </div>

          <motion.div
            layout
            className="rounded-2xl bg-[var(--card-bg)]/25 p-3 text-sm leading-relaxed mb-3"
          >
            {compliment}
          </motion.div>
          <button
            type="button"
            onClick={generateCompliment}
            className="glass-button w-full text-sm"
          >
            New compliment
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_1.05fr]">
        <div className="glass-card rounded-3xl p-4">
          <div className="flex items-center gap-2 text-[var(--accent-2)] mb-3">
            <Gift className="w-5 h-5" />
            <h3 className="font-dancing text-2xl">Home Screen Widgets</h3>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {todayWidgets.map((widget) => (
              <div key={widget.label} className="rounded-2xl bg-[var(--card-bg)]/25 p-3">
                <div className="text-[10px] uppercase tracking-[0.2em] opacity-60">
                  {widget.label}
                </div>
                <div className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                  {widget.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-3xl p-4">
          <div className="flex items-center gap-2 text-[var(--accent-2)] mb-3">
            <Star className="w-5 h-5" />
            <h3 className="font-dancing text-2xl">Relationship Horoscope</h3>
          </div>

          <motion.div
            layout
            className="rounded-2xl bg-[var(--card-bg)]/25 p-3 text-sm leading-relaxed mb-3"
          >
            {horoscope}
          </motion.div>
          <button type="button" onClick={generateHoroscope} className="glass-button w-full text-sm">
            Refresh reading
          </button>
        </div>
      </div>

      <div className="glass-card rounded-3xl p-4">
        <div className="flex items-center gap-2 text-[var(--accent-2)] mb-3">
          <Heart className="w-5 h-5" />
          <h3 className="font-dancing text-2xl">Love Language Tracker</h3>
        </div>

        <div className="grid gap-3 md:grid-cols-5">
          {loveLanguages.map((language) => (
            <div key={language} className="rounded-2xl bg-[var(--card-bg)]/25 p-3 text-center">
              <div className="text-[10px] uppercase tracking-[0.2em] opacity-60">{language}</div>
              <div className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                {languageCounts[language] ?? 0}
              </div>
              <button
                type="button"
                onClick={() => addLanguageUsage(language)}
                className="mt-3 glass-button w-full px-2 py-1 text-[10px]"
              >
                +1 today
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between rounded-2xl bg-[var(--accent-1)]/10 px-3 py-2 text-sm">
          <span>Daily connection score</span>
          <span className="font-semibold text-[var(--text-primary)]">
            {Math.min(
              100,
              Object.values(languageCounts).reduce((sum, value) => sum + value, 0) * 6
            )}
            %
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-[var(--accent-1)]/30 bg-gradient-to-r from-[var(--accent-1)]/10 to-[var(--accent-2)]/10 p-3 text-sm">
        <span className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[var(--accent-1)]" /> Ready for the next romantic surprise.
        </span>
        <button type="button" className="glass-button px-3 py-2 text-[11px]">
          Launch surprise
        </button>
      </div>
    </div>
  )
}

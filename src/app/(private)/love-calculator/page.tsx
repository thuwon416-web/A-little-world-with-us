'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ChevronRight, Heart, Home, Shuffle } from 'lucide-react'
import LoveCalculator from '@/features/games/LoveCalculator'

const factors = ['Chemistry', 'Trust', 'Humor', 'Romance', 'Shared dreams']

export default function LoveCalculatorPage() {
  const [her, setHer] = useState('Meera')
  const [me, setMe] = useState('Aarav')
  const [values, setValues] = useState([92, 96, 88, 94, 90])
  const average = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
  const circumference = 2 * Math.PI * 54
  const offset = circumference - (average / 100) * circumference

  const randomize = () => setValues(factors.map(() => Math.floor(Math.random() * 30) + 70))

  return (
    <div className="min-h-screen max-w-4xl">
      <div className="mb-4 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 hover:text-[var(--text-primary)]"
        >
          <Home size={11} /> Home
        </Link>
        <ChevronRight size={11} />
        <span className="text-[var(--text-primary)]">Love Calculator</span>
      </div>
      <h1
        className="mb-1 text-3xl font-bold text-[var(--text-primary)]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Love Calculator
      </h1>
      <p className="mb-6 text-sm text-[var(--text-secondary)]">
        A completely unscientific, deeply romantic look at the two of you.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="rounded-3xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-6">
            <div className="mb-4 text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">
              Who&apos;s calculating?
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                ['Their name', her, setHer],
                ['Your name', me, setMe],
              ].map(([label, value, setter]) => (
                <label key={label as string} className="text-xs text-[var(--text-secondary)]">
                  <span className="mb-1.5 block">{label as string}</span>
                  <input
                    value={value as string}
                    onChange={(event) => (setter as (next: string) => void)(event.target.value)}
                    className="w-full rounded-xl border border-[var(--accent-1)]/15 bg-[var(--card-bg-strong)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-1)]"
                  />
                </label>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="mb-0.5 text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">
                  Rate your love
                </div>
                <div
                  className="text-lg font-semibold text-[var(--text-primary)]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Five little sliders
                </div>
              </div>
              <button
                type="button"
                onClick={randomize}
                className="flex items-center gap-1.5 rounded-full bg-[var(--bg-3)] px-3 py-1.5 text-xs font-medium text-[var(--accent-1)]"
              >
                <Shuffle size={11} /> Random
              </button>
            </div>
            <div className="flex flex-col gap-5">
              {factors.map((factor, index) => (
                <label key={factor}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">{factor}</span>
                    <span className="font-semibold text-[var(--text-primary)]">
                      {values[index]}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={values[index]}
                    onChange={(event) =>
                      setValues((current) =>
                        current.map((value, item) =>
                          item === index ? Number(event.target.value) : value
                        )
                      )
                    }
                    className="w-full accent-[var(--accent-1)]"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center rounded-3xl border border-[var(--accent-1)]/20 bg-[var(--bg-3)] p-6">
          <div className="mb-5 self-start text-[10px] uppercase tracking-widest text-[var(--accent-1)]">
            ✨ Result
          </div>
          <div className="mb-6 flex items-center gap-2">
            <span className="rounded-full bg-[var(--accent-1)]/20 px-3 py-1 text-sm font-medium text-[var(--accent-1)]">
              {her || 'Them'}
            </span>
            <Heart className="h-4 w-4 fill-current text-[var(--accent-1)]" />
            <span className="rounded-full bg-[var(--accent-2)]/25 px-3 py-1 text-sm font-medium text-[var(--accent-2)]">
              {me || 'You'}
            </span>
          </div>
          <div className="relative mb-5">
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle
                cx="70"
                cy="70"
                r="54"
                fill="none"
                stroke="var(--accent-1)"
                strokeOpacity="0.2"
                strokeWidth="12"
              />
              <circle
                cx="70"
                cy="70"
                r="54"
                fill="none"
                stroke="var(--accent-1)"
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                transform="rotate(-90 70 70)"
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div
                className="text-4xl font-bold text-[var(--text-primary)]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {average}
                <span className="text-xl font-normal">%</span>
              </div>
              <div className="text-[9px] uppercase tracking-widest text-[var(--text-secondary)]">
                Compatibility
              </div>
            </div>
          </div>
          <div className="text-center">
            <div
              className="mb-1 text-lg font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              A love that lasts. ❤️
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Based on 5 totally-not-scientific factors.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-5">
        <LoveCalculator />
      </div>
    </div>
  )
}

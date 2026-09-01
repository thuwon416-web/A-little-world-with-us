'use client'

import { useState, useEffect } from 'react'
import { Star, Heart, Sparkles } from 'lucide-react'
import {
  calculateWesternSign,
  calculateChineseSign,
  calculateMyanmarDay,
  calculateNumerology,
  formatWesternSign,
  formatChineseSign,
  type AstrologyProfile,
} from '@/lib/astrology'
import { insertRow, readRows } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'

const ZODIAC_EMOJIS: Record<string, string> = {
  Aries: '♈',
  Taurus: '♉',
  Gemini: '♊',
  Cancer: '♋',
  Leo: '♌',
  Virgo: '♍',
  Libra: '♎',
  Scorpio: '♏',
  Sagittarius: '♐',
  Capricorn: '♑',
  Aquarius: '♒',
  Pisces: '♓',
}

const CHINESE_EMOJIS: Record<string, string> = {
  Rat: '🐀',
  Ox: '🐂',
  Tiger: '🐅',
  Rabbit: '🐇',
  Dragon: '🐉',
  Snake: '🐍',
  Horse: '🐎',
  Goat: '🐐',
  Monkey: '🐒',
  Rooster: '🐓',
  Dog: '🐕',
  Pig: '🐖',
}

export default function AstrologyWidget() {
  const [profile, setProfile] = useState<AstrologyProfile | null>(null)
  const [synastryScore, setSynastryScore] = useState<number | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [birthDate, setBirthDate] = useState('')

  useEffect(() => {
    loadProfiles()
  }, [])

  const loadProfiles = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const profiles = await readRows('astrology_profiles', '*', {
      column: 'created_at',
      ascending: false,
    }) as any[]

    if (profiles.length > 0) {
      const myProfile = profiles.find((p: any) => p.user_id === user.id)
      if (myProfile) {
        setProfile({
          birthDate: new Date((myProfile as any).birth_date),
          westernSign: (myProfile as any).western_sign,
          chineseSign: (myProfile as any).chinese_sign,
          myanmarDay: (myProfile as any).myanmar_day,
          numerologyNumber: (myProfile as any).numerology_number,
        })
      }

      const partner = profiles.find((p: any) => p.user_id !== user.id)
      if (partner) {
        setSynastryScore((partner as any).synastry_score || null)
      }
    }
  }

  const handleSave = async () => {
    if (!birthDate) return

    const date = new Date(birthDate)
    const newProfile: AstrologyProfile = {
      birthDate: date,
      westernSign: calculateWesternSign(date),
      chineseSign: calculateChineseSign(date),
      myanmarDay: calculateMyanmarDay(date),
      numerologyNumber: calculateNumerology(date),
    }

    await insertRow('astrology_profiles', {
      birth_date: date.toISOString().split('T')[0],
      western_sign: newProfile.westernSign,
      chinese_sign: newProfile.chineseSign,
      myanmar_day: newProfile.myanmarDay,
      numerology_number: newProfile.numerologyNumber,
    })

    setProfile(newProfile)
    setIsEditing(false)
  }

  if (!profile) {
    return (
      <div className="glass-card p-5">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <Star className="h-5 w-5 text-[var(--accent-1)]" />
          Astrology
        </h3>
        {isEditing ? (
          <div className="space-y-3">
            <div>
              <label className="text-sm text-[var(--text-secondary)]">Birth date</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-3 py-2 text-sm text-[var(--text-primary)]"
              />
            </div>
            <button
              onClick={handleSave}
              className="w-full rounded-xl bg-[var(--button-bg)] px-3 py-2 text-sm font-medium text-[var(--text-primary)]"
            >
              Save
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="w-full rounded-xl border border-dashed border-[var(--accent-1)]/30 bg-[var(--bg-2)] px-3 py-4 text-sm text-[var(--text-secondary)]"
          >
            + Add your birth date
          </button>
        )}
      </div>
    )
  }

  const western = formatWesternSign(profile.westernSign)
  const chinese = formatChineseSign(profile.chineseSign)

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <Star className="h-5 w-5 text-[var(--accent-1)]" />
          Astrology
        </h3>
        <button
          onClick={() => setIsEditing(true)}
          className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          Edit
        </button>
      </div>

      <div className="space-y-4">
        {/* Western Zodiac */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--text-secondary)]">Western Sign</p>
            <p className="text-sm font-medium text-[var(--text-primary)]">{western.en}</p>
            <p className="text-xs text-[var(--text-secondary)]">{western.mm}</p>
          </div>
          <div className="text-2xl">{ZODIAC_EMOJIS[profile.westernSign] || '✨'}</div>
        </div>

        {/* Chinese Zodiac */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--text-secondary)]">Chinese Sign</p>
            <p className="text-sm font-medium text-[var(--text-primary)]">{chinese.en}</p>
            <p className="text-xs text-[var(--text-secondary)]">{chinese.mm}</p>
          </div>
          <div className="text-2xl">{CHINESE_EMOJIS[profile.chineseSign] || '🐉'}</div>
        </div>

        {/* Myanmar Day */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--text-secondary)]">Myanmar Day</p>
            <p className="text-sm font-medium text-[var(--text-primary)]">{profile.myanmarDay}</p>
          </div>
        </div>

        {/* Numerology */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--text-secondary)]">Life Path Number</p>
            <p className="text-sm font-medium text-[var(--text-primary)]">{profile.numerologyNumber}</p>
          </div>
        </div>

        {/* Synastry Score */}
        {synastryScore !== null && (
          <div className="rounded-xl bg-gradient-to-r from-[var(--accent-2)]/20 to-[var(--accent-1)]/20 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="h-4 w-4 text-[var(--accent-1)]" />
              <p className="text-xs font-medium text-[var(--text-primary)]">Compatibility</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold text-[var(--accent-1)]">{synastryScore}%</div>
              <Sparkles className="h-5 w-5 text-[var(--accent-1)]" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

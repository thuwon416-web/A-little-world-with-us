'use client'
import { useState, useEffect } from 'react'
import { getCurrentUserId } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'

const moods = [
  { emoji: '😍', label: 'Loving', value: 5 },
  { emoji: '😊', label: 'Happy', value: 4 },
  { emoji: '😐', label: 'Neutral', value: 3 },
  { emoji: '😔', label: 'Sad', value: 2 },
  { emoji: '😤', label: 'Upset', value: 1 },
]

export default function MoodTracker() {
  const [selectedMood, setSelectedMood] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [history, setHistory] = useState<any[]>([])
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const loadUserId = async () => {
      const id = await getCurrentUserId()
      setUserId(id)
    }
    loadUserId()
  }, [])

  useEffect(() => {
    if (userId) {
      loadHistory()
    }
  }, [userId])

  const loadHistory = async () => {
    if (!userId) return

    const { data } = await supabase
      .from('mood_logs')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(7)

    setHistory(data || [])
  }

  const submitMood = async () => {
    if (selectedMood === null || !userId) return

    await supabase.from('mood_logs').insert({
      user_id: userId,
      mood: selectedMood,
      note,
      date: new Date().toISOString(),
    })

    setSelectedMood(null)
    setNote('')
    loadHistory()
  }

  return (
    <div className="p-6 space-y-6">
      <section className="rounded-[32px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-6 shadow-[0_18px_42px_rgba(0,0,0,0.12)]">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Intimacy</p>
        <h1 className="mt-3 text-3xl font-serif text-[var(--text-primary)]">💕 Mood Tracker</h1>
      </section>

      {/* Mood Selection */}
      <div className="grid grid-cols-5 gap-2">
        {moods.map(mood => (
          <button
            key={mood.value}
            onClick={() => setSelectedMood(mood.value)}
            className={`p-4 rounded-xl border-2 ${
              selectedMood === mood.value
                ? 'border-[var(--accent-1)] bg-[var(--accent-1)]/10'
                : 'border-[var(--accent-1)]/20 bg-[var(--card-bg)]'
            }`}
          >
            <div className="text-3xl mb-1">{mood.emoji}</div>
            <div className="text-xs text-[var(--text-secondary)]">{mood.label}</div>
          </button>
        ))}
      </div>

      {/* Note */}
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="How are you feeling? (optional)"
        rows={3}
        className="w-full px-4 py-2 rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
      />

      {/* Submit */}
      <button
        onClick={submitMood}
        disabled={selectedMood === null}
        className="w-full bg-[var(--accent-1)] text-[var(--bg-color)] py-3 rounded-xl font-bold disabled:opacity-50"
      >
        Log Mood
      </button>

      {/* History */}
      {history.length > 0 && (
        <div className="rounded-[24px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-5">
          <h3 className="font-bold text-xl mb-4 text-[var(--text-primary)]">Recent Moods</h3>
          <div className="space-y-2">
            {history.map(log => (
              <div key={log.id} className="flex items-center gap-2">
                <span className="text-xl">{moods.find(m => m.value === log.mood)?.emoji}</span>
                <span className="text-sm text-[var(--text-secondary)]">{new Date(log.date).toLocaleDateString()}</span>
                {log.note && <span className="text-[var(--text-secondary)] text-sm">- {log.note}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { X, Check, Droplets, Thermometer, Scale, Activity, Coffee } from 'lucide-react'

interface DailyLogModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate?: Date | null
}

export default function DailyLogModal({ isOpen, onClose, selectedDate }: DailyLogModalProps) {
  const [mood, setMood] = useState('')
  const [symptoms, setSymptoms] = useState<string[]>([])
  const [sex, setSex] = useState<string[]>([])
  const [water, setWater] = useState(0)
  const [weight, setWeight] = useState('')
  const [temp, setTemp] = useState('')
  const [notes, setNotes] = useState('')
  const [ovulationTest, setOvulationTest] = useState<'Positive' | 'Negative' | 'Did not take'>('Did not take')
  const [activities, setActivities] = useState<string[]>([])
  const [other, setOther] = useState<string[]>([])
  const [medicationTaken, setMedicationTaken] = useState<boolean | null>(null)

  const moodOptions = [
    { emoji: '😐', label: 'Calm', labelMy: 'ငြိမ်သက်' },
    { emoji: '😊', label: 'Happy', labelMy: 'ပျော်ရွှင်' },
    { emoji: '⚡', label: 'Energetic', labelMy: 'စွမ်းအားတော်' },
    { emoji: '🥺', label: 'Sad', labelMy: 'စိတ်ညစ်' },
    { emoji: '😡', label: 'Irritated', labelMy: 'စိတ်ဒေါသ' },
  ]

  const symptomOptions = [
    { icon: '🤕', label: 'Cramps', labelMy: 'ကိုက်ခဲ' },
    { icon: '🫁', label: 'Tender breasts', labelMy: 'ရင်သားနာ' },
    { icon: '🤕', label: 'Headache', labelMy: 'ခေါင်းကိုက်' },
    { icon: '🔴', label: 'Acne', labelMy: 'မျက်နှာတွင်ပြည်' },
    { icon: '😴', label: 'Fatigue', labelMy: 'ပင်နိုင်း' },
    { icon: '🌙', label: 'Insomnia', labelMy: 'မအိပ်ရ' },
    { icon: '🎈', label: 'Bloating', labelMy: 'ဖောရောင်' },
  ]

  const sexOptions = [
    "Didn&apos;t have sex",
    'Protected sex',
    'Unprotected sex',
    'Oral sex',
    'Anal sex',
    'Masturbation',
    'Orgasm',
    'High sex drive',
  ]

  const activityOptions = [
    'Yoga',
    'Gym',
    'Swimming',
    'Running',
    'Cycling',
    'Walking',
  ]

  const otherOptions = [
    'Travel',
    'Stress',
    'Meditation',
    'Journaling',
    'Alcohol',
  ]

  const toggleArray = (array: string[], value: string, setter: (arr: string[]) => void) => {
    if (array.includes(value)) {
      setter(array.filter((item) => item !== value))
    } else {
      setter([...array, value])
    }
  }

  const handleSave = () => {
    // In production, this would save to Supabase
    // console.log({
    //   date: selectedDate || new Date(),
    //   mood,
    //   symptoms,
    //   sex,
    //   water,
    //   weight,
    //   temp,
    //   notes,
    //   ovulationTest,
    //   activities,
    //   other,
    //   medicationTaken,
    // })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[28px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] shadow-[0_20px_40px_rgba(19,10,33,0.28)]">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-6">
          <div>
            <h2 className="text-xl font-serif text-[var(--text-primary)]">Daily Log</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              {selectedDate ? selectedDate.toLocaleDateString() : new Date().toLocaleDateString()}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[var(--text-secondary)] hover:bg-[var(--accent-1)]/10 hover:text-[var(--accent-1)] transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          {/* Mood */}
          <div>
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">Mood</h3>
            <div className="flex flex-wrap gap-2">
              {moodOptions.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setMood(option.label)}
                  className={`flex-1 min-w-[100px] p-3 rounded-xl border-2 transition ${
                    mood === option.label
                      ? 'border-purple-500 bg-purple-500/10 text-purple-500'
                      : 'border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] hover:border-[var(--accent-1)]/40'
                  }`}
                >
                  <span className="text-2xl">{option.emoji}</span>
                  <p className="text-xs font-medium mt-1">{option.label}</p>
                  <p className="text-[10px] text-[var(--text-secondary)]">{option.labelMy}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Symptoms */}
          <div>
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">Symptoms</h3>
            <div className="flex flex-wrap gap-2">
              {symptomOptions.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => toggleArray(symptoms, option.label, setSymptoms)}
                  className={`flex-1 min-w-[120px] p-3 rounded-xl border-2 transition ${
                    symptoms.includes(option.label)
                      ? 'border-rose-500 bg-rose-500/10 text-rose-500'
                      : 'border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] hover:border-[var(--accent-1)]/40'
                  }`}
                >
                  <span className="text-2xl">{option.icon}</span>
                  <p className="text-xs font-medium mt-1">{option.label}</p>
                  <p className="text-[10px] text-[var(--text-secondary)]">{option.labelMy}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Sex & Sex Drive */}
          <div>
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">Sex & Sex Drive</h3>
            <div className="flex flex-wrap gap-2">
              {sexOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleArray(sex, option, setSex)}
                  className={`px-4 py-2 rounded-full border-2 text-sm transition ${
                    sex.includes(option)
                      ? 'border-pink-500 bg-pink-500/10 text-pink-500'
                      : 'border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] hover:border-[var(--accent-1)]/40'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Medication (OC) */}
          <div>
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">Medication (Birth Control)</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMedicationTaken(true)}
                className={`flex-1 p-3 rounded-xl border-2 transition ${
                  medicationTaken === true
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
                    : 'border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] hover:border-[var(--accent-1)]/40'
                }`}
              >
                <Check className="h-4 w-4 mx-auto mb-1" />
                <p className="text-xs font-medium">Taken on time</p>
              </button>
              <button
                type="button"
                onClick={() => setMedicationTaken(false)}
                className={`flex-1 p-3 rounded-xl border-2 transition ${
                  medicationTaken === false
                    ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                    : 'border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] hover:border-[var(--accent-1)]/40'
                }`}
              >
                <Activity className="h-4 w-4 mx-auto mb-1" />
                <p className="text-xs font-medium">Yesterday&apos;s pill</p>
              </button>
            </div>
          </div>

          {/* Water Intake */}
          <div>
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2">
              <Droplets className="h-4 w-4 text-blue-500" />
              Water Intake
            </h3>
            <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)]">
              <button
                type="button"
                onClick={() => setWater((w) => Math.max(0, w - 8))}
                className="w-10 h-10 rounded-full bg-[var(--accent-1)]/10 hover:bg-[var(--accent-1)]/20 text-[var(--accent-1)] flex items-center justify-center text-xl font-bold transition"
              >
                -
              </button>
              <div className="flex-1 text-center">
                <p className="text-2xl font-bold text-[var(--text-primary)]">{water}</p>
                <p className="text-xs text-[var(--text-secondary)]">/ 72 fl oz</p>
              </div>
              <button
                type="button"
                onClick={() => setWater((w) => w + 8)}
                className="w-10 h-10 rounded-full bg-[var(--accent-1)]/10 hover:bg-[var(--accent-1)]/20 text-[var(--accent-1)] flex items-center justify-center text-xl font-bold transition"
              >
                +
              </button>
            </div>
          </div>

          {/* Weight & Temperature */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2">
                <Scale className="h-4 w-4 text-purple-500" />
                Weight
              </h3>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Enter weight (lbs)"
                className="w-full rounded-xl border-2 border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent-1)]/50"
              />
            </div>
            <div>
              <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-rose-500" />
                Temperature
              </h3>
              <input
                type="number"
                value={temp}
                onChange={(e) => setTemp(e.target.value)}
                placeholder="Enter temp (°F)"
                className="w-full rounded-xl border-2 border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent-1)]/50"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
              className="w-full rounded-xl border-2 border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-1)]/50"
              rows={3}
            />
          </div>

          {/* Ovulation Test */}
          <div>
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">Ovulation Test</h3>
            <div className="flex gap-2">
              {(['Positive', 'Negative', 'Did not take'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setOvulationTest(option)}
                  className={`flex-1 p-3 rounded-xl border-2 text-sm transition ${
                    ovulationTest === option
                      ? option === 'Positive'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
                        : option === 'Negative'
                        ? 'border-rose-500 bg-rose-500/10 text-rose-500'
                        : 'border-[var(--accent-1)]/30 bg-[var(--accent-1)]/10 text-[var(--accent-1)]'
                      : 'border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] hover:border-[var(--accent-1)]/40'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Physical Activity */}
          <div>
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-500" />
              Physical Activity
            </h3>
            <div className="flex flex-wrap gap-2">
              {activityOptions.map((activity) => (
                <button
                  key={activity}
                  type="button"
                  onClick={() => toggleArray(activities, activity, setActivities)}
                  className={`px-4 py-2 rounded-full border-2 text-sm transition ${
                    activities.includes(activity)
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
                      : 'border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] hover:border-[var(--accent-1)]/40'
                  }`}
                >
                  {activity}
                </button>
              ))}
            </div>
          </div>

          {/* Other */}
          <div>
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2">
              <Coffee className="h-4 w-4 text-amber-500" />
              Other
            </h3>
            <div className="flex flex-wrap gap-2">
              {otherOptions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleArray(other, item, setOther)}
                  className={`px-4 py-2 rounded-full border-2 text-sm transition ${
                    other.includes(item)
                      ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                      : 'border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] hover:border-[var(--accent-1)]/40'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSave}
            className="w-full rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-4 text-base font-medium text-white transition hover:opacity-90"
          >
            Save Log
          </button>
        </div>
      </div>
    </div>
  )
}

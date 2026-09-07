'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Check, Droplets, Thermometer, Scale, Activity, Coffee } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getActiveCareCoupleLinkId, saveDailyLog, type DailyLog } from '@/lib/care-data'

interface DailyLogModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate?: Date | null
  onLogSaved?: () => void
}

export default function DailyLogModal({ isOpen, onClose, selectedDate, onLogSaved }: DailyLogModalProps) {
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
  const [isSaving, setIsSaving] = useState(false)

  const moodOptions = [
    { emoji: '😐', label: 'Calm', labelMy: 'ငြိမ်သက်' },
    { emoji: '😊', label: 'Happy', labelMy: 'ပျော်ရွှင်' },
    { emoji: '⚡', label: 'Energetic', labelMy: 'စွမ်းအားတော်' },
    { emoji: '😜', label: 'Frisky', labelMy: 'စိတ်လှုပ်ရှား' },
    { emoji: '🥺', label: 'Sad', labelMy: 'စိတ်ညစ်' },
    { emoji: '😟', label: 'Anxious', labelMy: 'စိုးရိမ်' },
    { emoji: '😶', label: 'Mood swings', labelMy: 'စိတ်အပြောင်းအလဲ' },
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
    { icon: '🩸', label: 'Spotting', labelMy: 'သွေးစက်' },
    { icon: '🔥', label: 'Hot flashes', labelMy: 'ကိုယ်ပူ' },
    { icon: '💧', label: 'Vaginal dryness', labelMy: 'ခြောက်သွေ့' },
    { icon: '⚡', label: 'Abdominal pain', labelMy: 'ဗိုက်နာ' },
  ]

  const sexOptions = [
    "Didn't have sex",
    'Protected sex',
    'Unprotected sex',
    'Oral sex',
    'Anal sex',
    'Masturbation',
    'Sensual touch',
    'Sex toys',
    'Orgasm',
    'No orgasm',
    'High sex drive',
    'Neutral sex drive',
    'Low sex drive',
  ]

  const activityOptions = ['Yoga', 'Gym', 'Swimming', 'Running', 'Cycling', 'Walking']
  const otherOptions = ['Travel', 'Stress', 'Meditation', 'Journaling', 'Alcohol']
  const dischargeOptions = ['No discharge', 'Creamy', 'Watery', 'Sticky', 'Egg white', 'Spotting', 'Unusual']
  const digestionOptions = ['Nausea', 'Bloating', 'Constipation', 'Diarrhea']
  const pregnancyTestOptions = ['Did not take test', 'Positive pregnancy test', 'Negative pregnancy test', 'Faint line']

  const toggleArray = (array: string[], value: string, setter: (arr: string[]) => void) => {
    if (array.includes(value)) {
      setter(array.filter((item) => item !== value))
    } else {
      setter([...array, value])
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Please log in to save logs')
        return
      }

      const logData: DailyLog = {
        user_id: user.id,
        couple_id: await getActiveCareCoupleLinkId(user.id),
        log_date: (selectedDate || new Date()).toISOString().split('T')[0],
        mood: mood || undefined,
        symptoms: symptoms.length > 0 ? symptoms : undefined,
        sex: sex.length > 0 ? sex : undefined,
        medication_taken: medicationTaken ?? undefined,
        water_intake: water,
        weight: weight ? parseFloat(weight) : undefined,
        temperature: temp ? parseFloat(temp) : undefined,
        notes: notes || undefined,
        ovulation_test: ovulationTest || undefined,
        activities: activities.length > 0 ? activities : undefined,
        other_tags: other.length > 0 ? other : undefined,
      }

      await saveDailyLog(logData)
      alert('Daily log saved successfully! 💜')
      onClose()
      onLogSaved?.()
    } catch (error) {
      console.error('Error saving log:', error)
      alert('Failed to save log. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="glass-card-solid max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px]"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] p-6">
          <div>
            <h2 className="font-serif text-xl text-[var(--text-primary)]">Daily Log</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              {selectedDate ? selectedDate.toLocaleDateString() : new Date().toLocaleDateString()}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[var(--text-secondary)] transition hover:bg-[var(--accent-1)]/10 hover:text-[var(--accent-1)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          {/* Mood */}
          <div>
            <h3 className="mb-3 text-sm font-medium text-[var(--text-primary)]">Mood</h3>
            <div className="flex flex-wrap gap-2">
              {moodOptions.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setMood(option.label)}
                  className={`flex-1 min-w-[100px] rounded-xl border p-3 transition ${
                    mood === option.label
                      ? 'border-[var(--accent-1)] bg-[var(--accent-1)]/15 text-[var(--accent-1)] shadow-[0_0_15px_rgba(255,107,157,0.3)]'
                      : 'border-[var(--accent-1)]/20 bg-[var(--card-bg)] hover:border-[var(--accent-1)]/50'
                  }`}
                >
                  <span className="text-2xl">{option.emoji}</span>
                  <p className="mt-1 text-xs font-medium">{option.label}</p>
                  <p className="text-[10px] text-[var(--text-secondary)]">{option.labelMy}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Symptoms */}
          <div>
            <h3 className="mb-3 text-sm font-medium text-[var(--text-primary)]">Symptoms</h3>
            <div className="flex flex-wrap gap-2">
              {symptomOptions.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => toggleArray(symptoms, option.label, setSymptoms)}
                  className={`flex-1 min-w-[120px] rounded-xl border p-3 transition ${
                    symptoms.includes(option.label)
                      ? 'border-[var(--accent-1)] bg-[var(--accent-1)]/15 text-[var(--accent-1)]'
                      : 'border-[var(--accent-1)]/20 bg-[var(--card-bg)] hover:border-[var(--accent-1)]/50'
                  }`}
                >
                  <span className="text-2xl">{option.icon}</span>
                  <p className="mt-1 text-xs font-medium">{option.label}</p>
                  <p className="text-[10px] text-[var(--text-secondary)]">{option.labelMy}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Sex & Sex Drive */}
          <div>
            <h3 className="mb-3 text-sm font-medium text-[var(--text-primary)]">Sex & Sex Drive</h3>
            <div className="flex flex-wrap gap-2">
              {sexOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleArray(sex, option, setSex)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    sex.includes(option)
                      ? 'border-[var(--accent-1)] bg-[var(--accent-1)]/15 text-[var(--accent-1)]'
                      : 'border-[var(--accent-1)]/20 bg-[var(--card-bg)] hover:border-[var(--accent-1)]/50'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Tag Sections */}
          <TagSection title="Discharge" options={dischargeOptions} selected={other} onToggle={(value) => toggleArray(other, value, setOther)} prefix="Discharge: " />
          <TagSection title="Digestion & stool" options={digestionOptions} selected={other} onToggle={(value) => toggleArray(other, value, setOther)} prefix="Digestion: " />
          <TagSection title="Pregnancy test" options={pregnancyTestOptions} selected={other} onToggle={(value) => toggleArray(other, value, setOther)} prefix="Pregnancy test: " />

          {/* Medication (OC) */}
          <div>
            <h3 className="mb-3 text-sm font-medium text-[var(--text-primary)]">Medication (Birth Control)</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMedicationTaken(true)}
                className={`flex-1 rounded-xl border p-3 transition ${
                  medicationTaken === true
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-500'
                    : 'border-[var(--accent-1)]/20 bg-[var(--card-bg)] hover:border-[var(--accent-1)]/40'
                }`}
              >
                <Check className="h-4 w-4 mx-auto mb-1" />
                <p className="text-xs font-medium">Taken on time</p>
              </button>
              <button
                type="button"
                onClick={() => setMedicationTaken(false)}
                className={`flex-1 rounded-xl border p-3 transition ${
                  medicationTaken === false
                    ? 'border-amber-500 bg-amber-500/15 text-amber-500'
                    : 'border-[var(--accent-1)]/20 bg-[var(--card-bg)] hover:border-[var(--accent-1)]/40'
                }`}
              >
                <Activity className="h-4 w-4 mx-auto mb-1" />
                <p className="text-xs font-medium">Yesterday's pill</p>
              </button>
            </div>
          </div>

          {/* Water Intake */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
              <Droplets className="h-4 w-4 text-blue-400" />
              Water Intake
            </h3>
            <div className="flex items-center gap-4 rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-4">
              <button
                type="button"
                onClick={() => setWater((w) => Math.max(0, w - 8))}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-1)]/10 text-xl font-bold text-[var(--accent-1)] transition hover:bg-[var(--accent-1)]/20"
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
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-1)]/10 text-xl font-bold text-[var(--accent-1)] transition hover:bg-[var(--accent-1)]/20"
              >
                +
              </button>
            </div>
          </div>

          {/* Weight & Temperature */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                <Scale className="h-4 w-4 text-purple-400" />
                Weight
              </h3>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Enter weight (lbs)"
                className="glass-input w-full rounded-xl px-4 py-3 text-sm"
              />
            </div>
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                <Thermometer className="h-4 w-4 text-[var(--accent-1)]" />
                Temperature
              </h3>
              <input
                type="number"
                value={temp}
                onChange={(e) => setTemp(e.target.value)}
                placeholder="Enter temp (°F)"
                className="glass-input w-full rounded-xl px-4 py-3 text-sm"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <h3 className="mb-3 text-sm font-medium text-[var(--text-primary)]">Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
              className="glass-input w-full resize-none rounded-xl px-4 py-3 text-sm"
              rows={3}
            />
          </div>

          {/* Ovulation Test */}
          <div>
            <h3 className="mb-3 text-sm font-medium text-[var(--text-primary)]">Ovulation Test</h3>
            <div className="flex gap-2">
              {(['Positive', 'Negative', 'Did not take'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setOvulationTest(option)}
                  className={`flex-1 rounded-xl border p-3 text-sm transition ${
                    ovulationTest === option
                      ? option === 'Positive'
                        ? 'border-emerald-500 bg-emerald-500/15 text-emerald-500'
                        : option === 'Negative'
                          ? 'border-rose-500 bg-rose-500/15 text-rose-500'
                          : 'border-[var(--accent-1)]/30 bg-[var(--accent-1)]/10 text-[var(--accent-1)]'
                      : 'border-[var(--accent-1)]/20 bg-[var(--card-bg)] hover:border-[var(--accent-1)]/40'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Physical Activity */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
              <Activity className="h-4 w-4 text-emerald-500" />
              Physical Activity
            </h3>
            <div className="flex flex-wrap gap-2">
              {activityOptions.map((activity) => (
                <button
                  key={activity}
                  type="button"
                  onClick={() => toggleArray(activities, activity, setActivities)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    activities.includes(activity)
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-500'
                      : 'border-[var(--accent-1)]/20 bg-[var(--card-bg)] hover:border-[var(--accent-1)]/40'
                  }`}
                >
                  {activity}
                </button>
              ))}
            </div>
          </div>

          {/* Other */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
              <Coffee className="h-4 w-4 text-amber-500" />
              Other
            </h3>
            <div className="flex flex-wrap gap-2">
              {otherOptions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleArray(other, item, setOther)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    other.includes(item)
                      ? 'border-amber-500 bg-amber-500/15 text-amber-500'
                      : 'border-[var(--accent-1)]/20 bg-[var(--card-bg)] hover:border-[var(--accent-1)]/40'
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
            disabled={isSaving}
            className="glass-button flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 text-base font-medium text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                Saving...
              </>
            ) : (
              'Save Log'
            )}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function TagSection({ title, options, selected, onToggle, prefix }: { title: string; options: string[]; selected: string[]; onToggle: (value: string) => void; prefix: string }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-medium text-[var(--text-primary)]">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const value = `${prefix}${option}`
          return (
            <button
              key={option}
              type="button"
              onClick={() => onToggle(value)}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                selected.includes(value)
                  ? 'border-violet-500 bg-violet-500/15 text-violet-500'
                  : 'border-[var(--accent-1)]/20 bg-[var(--card-bg)] hover:border-[var(--accent-1)]/40'
              }`}
            >
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Plus, Check, Activity, Zap, Droplets, Wind, Frown } from 'lucide-react'

interface SymptomsTrackerProps { selectedDate?: Date | null }
interface Symptom { id: string; name: string; nameMy: string; icon: any; logged: boolean }

export default function SymptomsTracker({ selectedDate }: SymptomsTrackerProps) {
  const [symptoms, setSymptoms] = useState<Symptom[]>([
    { id: 'cramps', name: 'Cramps', nameMy: 'ကိုက်ခဲမှု', icon: Activity, logged: false },
    { id: 'bloating', name: 'Bloating', nameMy: 'ဖောရောင်မှု', icon: Wind, logged: false },
    { id: 'discharge', name: 'Discharge', nameMy: 'အဖြူဆင်းမှု', icon: Droplets, logged: false },
    { id: 'mood', name: 'Mood Changes', nameMy: 'စိတ်အပြောင်းအလဲ', icon: Frown, logged: false },
    { id: 'energy', name: 'Energy Level', nameMy: 'အားအင်', icon: Zap, logged: false },
  ])
  const [energyLevel, setEnergyLevel] = useState(5)
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)

  const toggleSymptom = (id: string) => setSymptoms(symptoms.map(s => s.id === id ? { ...s, logged: !s.logged } : s))
  const handleSave = () => { setShowSaveSuccess(true); setTimeout(() => setShowSaveSuccess(false), 2000) }

  return (
    <div className="rounded-[24px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[var(--accent-1)]/15 p-2 text-[var(--accent-1)]"><Plus className="h-5 w-5" /></div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Symptoms</p>
            <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">{selectedDate ? selectedDate.toLocaleDateString() : 'Today'}</p>
          </div>
        </div>
        <button type="button" onClick={handleSave} className="rounded-full bg-[var(--accent-1)] px-4 py-2 text-sm font-medium text-[var(--bg-color)] transition hover:opacity-90">
          {showSaveSuccess ? <span className="flex items-center gap-1"><Check className="h-4 w-4" />Saved</span> : 'Save'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {symptoms.map((symptom) => {
          const Icon = symptom.icon
          return (
            <button key={symptom.id} type="button" onClick={() => toggleSymptom(symptom.id)}
              className={`rounded-xl border-2 p-3 text-left transition-all ${symptom.logged ? 'border-[var(--accent-1)] bg-[var(--accent-1)]/10' : 'border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] hover:border-[var(--accent-1)]/40'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`h-4 w-4 ${symptom.logged ? 'text-[var(--accent-1)]' : 'text-[var(--text-secondary)]'}`} />
                {symptom.logged && <Check className="h-3 w-3 text-[var(--accent-1)]" />}
              </div>
              <p className="text-xs font-medium text-[var(--text-primary)]">{symptom.name}</p>
              <p className="text-[10px] text-[var(--text-secondary)]">{symptom.nameMy}</p>
            </button>
          )
        })}
      </div>

      <div className="rounded-2xl border border-[var(--accent-2)]/20 bg-[var(--card-bg-strong)] p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-[var(--accent-2)]" /><p className="text-xs text-[var(--text-secondary)]">Energy Level</p></div>
          <span className="text-sm font-medium text-[var(--text-primary)]">{energyLevel <= 2 ? 'Low' : energyLevel <= 4 ? 'Medium' : energyLevel <= 6 ? 'Normal' : energyLevel <= 8 ? 'High' : 'Very High'}</span>
        </div>
        <input type="range" min="1" max="10" value={energyLevel} onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[var(--accent-2)]" />
        <div className="flex justify-between mt-2 text-xs text-[var(--text-secondary)]"><span>Low</span><span>High</span></div>
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] p-4">
        <p className="text-xs text-[var(--text-secondary)] mb-2">Notes</p>
        <textarea placeholder="Add any additional notes..." rows={3}
          className="glass-input w-full resize-none rounded-xl p-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50" />
      </div>
    </div>
  )
}

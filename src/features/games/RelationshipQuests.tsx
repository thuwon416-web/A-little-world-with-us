'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Gift } from 'lucide-react'

type Quest = {
  id: string
  title: string
  reward: number
  done?: boolean
}

const defaultQuests: Quest[] = [
  { id: 'coffee-date', title: 'Plan a cozy coffee date', reward: 20, done: false },
  { id: 'compliment', title: 'Give a genuine compliment', reward: 15, done: false },
  { id: 'memory', title: 'Share a sweet memory with each other', reward: 25, done: false },
  { id: 'night-out', title: 'Pick a little adventure for tonight', reward: 30, done: false },
]

export default function RelationshipQuests() {
  const [quests, setQuests] = useState<Quest[]>(defaultQuests)

  useEffect(() => {
    const stored = localStorage.getItem('relationship-quests')
    if (stored) {
      setQuests(JSON.parse(stored))
    }
  }, [])

  const toggleQuest = (id: string) => {
    const updated = quests.map((quest) =>
      quest.id === id ? { ...quest, done: !quest.done } : quest
    )
    setQuests(updated)
    localStorage.setItem('relationship-quests', JSON.stringify(updated))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[var(--accent-2)]">
        <Gift className="w-5 h-5" />
        <h3 className="font-dancing text-2xl">Relationship Quests</h3>
      </div>

      <div className="space-y-3">
        {quests.map((quest) => (
          <motion.div
            key={quest.id}
            layout
            className={`glass-card p-3 rounded-2xl ${quest.done ? 'ring-1 ring-[var(--accent-1)]/50' : ''}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium">{quest.title}</div>
                <div className="text-[11px] opacity-60">Reward: {quest.reward} love points</div>
              </div>
              <button
                onClick={() => toggleQuest(quest.id)}
                className="glass-button px-3 py-2 text-[11px]"
              >
                {quest.done ? 'Done' : 'Mark done'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { wellnessBoards } from '@/data/wellness-boards'
import WellnessBoard from '@/components/wellness/WellnessBoard'

type TabId = 'physical' | 'mental' | 'relationship'

const tabs = [
  { id: 'physical' as TabId, label: 'Physical Health', labelMy: 'ရုပ်ပိုင်းဆိုင်ရာ ကျန်းမာရေး' },
  { id: 'mental' as TabId, label: 'Mental Wellness', labelMy: 'စိတ်ပိုင်းဆိုင်ရာ ကျန်းမာရေး' },
  { id: 'relationship' as TabId, label: 'Relationship', labelMy: 'ဆက်ဆံရေး' },
]

export default function WellnessPage() {
  const [activeTab, setActiveTab] = useState<TabId>('physical')

  const filteredBoards = wellnessBoards.filter(board => board.category === activeTab)

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 animate-fade-in">
      <header>
        <h1
          className="text-4xl text-[var(--text-primary)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Wellness Boards
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          20 curated boards for emotional wellness
        </p>
      </header>

      <nav className="flex gap-2 overflow-x-auto pb-2" aria-label="Wellness categories">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm transition ${
              activeTab === tab.id
                ? 'border-[var(--accent-1)]/40 bg-[var(--accent-1)]/20 text-[var(--accent-1)]'
                : 'border-[var(--accent-1)]/20 bg-[var(--card-bg)] text-[var(--text-secondary)] hover:bg-[var(--accent-1)]/10'
            }`}
            aria-selected={activeTab === tab.id}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredBoards.map((board) => (
          <WellnessBoard key={board.id} board={board} />
        ))}
      </section>
    </main>
  )
}

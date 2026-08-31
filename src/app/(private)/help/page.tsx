'use client'

import { HelpCircle, Search, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import KeyboardShortcutsHelp from '@/components/shared/KeyboardShortcutsHelp'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { trackFeatureUsage } from '@/lib/analytics'

const faqItems = [
  {
    question: 'How do I invite my partner?',
    answer:
      'Open the couple-linking flow from the app or dashboard and share the invite link with your partner.',
  },
  {
    question: 'Can I use this app offline?',
    answer:
      'The app includes PWA support and a service worker, so key pages can remain available when your connection is weak.',
  },
  {
    question: 'How do I change the theme?',
    answer:
      'Use the theme panel in Settings or the quick theme control in the sidebar to switch between moods.',
  },
  {
    question: 'Where do I find wellness activities?',
    answer:
      'Open the Wellness tab from the home navigation, where the board collection is grouped in themed sections.',
  },
]

export default function HelpPage() {
  const [query, setQuery] = useState('')
  const [showShortcuts, setShowShortcuts] = useState(true)
  const searchRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    trackFeatureUsage('help_page')
  }, [])

  useKeyboardShortcuts([
    {
      key: 'k',
      ctrlOrMeta: true,
      description: 'Focus search',
      action: () => searchRef.current?.focus(),
    },
    {
      key: '/',
      ctrlOrMeta: true,
      description: 'Toggle shortcuts',
      action: () => setShowShortcuts((current) => !current),
    },
  ])

  const filteredFaq = useMemo(() => {
    if (!query.trim()) return faqItems

    return faqItems.filter(({ question, answer }) => {
      const haystack = `${question} ${answer}`.toLowerCase()
      return haystack.includes(query.trim().toLowerCase())
    })
  }, [query])

  return (
    <main className="space-y-6 p-4 md:p-6">
      <section className="rounded-[32px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-6 shadow-[0_18px_42px_rgba(0,0,0,0.12)]">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-1)]/10 text-[var(--accent-1)]">
            <HelpCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Support</p>
            <h1 className="mt-1 text-3xl font-serif text-[var(--text-primary)]">Help & FAQ</h1>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[28px] border border-white/10 bg-[var(--card-bg)] p-5">
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-[var(--text-secondary)]" />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search help articles"
              className="w-full rounded-full border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] py-3 pl-11 pr-4 text-sm text-[var(--text-primary)] outline-none ring-0 placeholder:text-[var(--text-secondary)]"
            />
          </div>

          <div className="space-y-3">
            {filteredFaq.length > 0 ? (
              filteredFaq.map(({ question, answer }) => (
                <div key={question} className="rounded-[22px] border border-white/10 bg-[var(--card-bg-strong)] p-4">
                  <p className="font-medium text-[var(--text-primary)]">{question}</p>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">{answer}</p>
                </div>
              ))
            ) : (
              <div className="rounded-[22px] border border-dashed border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] p-4 text-sm text-[var(--text-secondary)]">
                No matches found. Try another keyword.
              </div>
            )}
          </div>
        </section>

        <div className="space-y-5">
          {showShortcuts ? <KeyboardShortcutsHelp /> : null}

          <div className="rounded-[28px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-2)]/10 text-[var(--accent-2)]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Need more help?</p>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Contact support</h2>
              </div>
            </div>

            <p className="mt-4 text-sm text-[var(--text-secondary)]">
              Send a message through the support link for issues, setup help, or feature requests.
            </p>

            <a
              href="mailto:support@ourforever.app"
              className="mt-4 inline-flex rounded-full bg-[var(--accent-1)] px-4 py-2 text-sm font-medium text-[var(--bg-color)]"
            >
              support@ourforever.app
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}

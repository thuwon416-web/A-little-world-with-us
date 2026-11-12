'use client'

import { HelpCircle, Search, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'

import KeyboardShortcutsHelp from '@/components/shared/KeyboardShortcutsHelp'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { trackFeatureUsage } from '@/lib/analytics'

const FAQ_COUNT = 8

export default function HelpPage() {
  const { t } = useLanguage()
  const faqItems = Array.from({ length: FAQ_COUNT }, (_, index) => ({ question: t(`Help.faqs.${index}.0`), answer: t(`Help.faqs.${index}.1`) }))
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
      description: t('Help.focusSearch'),
      action: () => searchRef.current?.focus(),
    },
    {
      key: '/',
      ctrlOrMeta: true,
      description: t('Help.toggleShortcuts'),
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
    <div className="space-y-6 p-4 md:p-6">
      <section className="rounded-panel border border-accent-1/20 bg-card p-6 shadow-[0_18px_42px_rgba(0,0,0,0.12)]">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-1/10 text-accent-1">
            <HelpCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-text-2">
              Support
            </p>
            <h1 className="mt-1 text-3xl font-serif text-text-1">{t('Help.title')}</h1>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-panel border border-border/20 bg-card p-5">
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-text-2" />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('Help.search')}
              className="min-h-11 w-full rounded-full border border-accent-1/20 bg-card py-3 pl-11 pr-4 text-sm text-text-1 outline-none ring-0 placeholder:text-text-2"
            />
          </div>

          <div className="space-y-3">
            {filteredFaq.length > 0 ? (
              filteredFaq.map(({ question, answer }) => (
                <details
                  key={question}
                  className="rounded-card border border-border/20 bg-card p-4"
                >
                  <summary className="cursor-pointer font-medium text-text-1 marker:text-accent-1">{question}</summary>
                  <p className="mt-2 text-sm text-text-2">{answer}</p>
                </details>
              ))
            ) : (
              <div className="rounded-[22px] border border-dashed border-accent-1/20 bg-card p-4 text-sm text-text-2">
                {t('Help.noMatches')}
              </div>
            )}
          </div>
        </section>

        <div className="space-y-5">
          {showShortcuts ? <KeyboardShortcutsHelp /> : null}

          <div className="rounded-modal border border-accent-1/20 bg-card p-5">
            <h2 className="text-lg font-semibold text-text-1">{t('Help.troubleshooting')}</h2>
            <div className="mt-4 space-y-3 text-sm">
              <p>
                <strong className="text-text-1">{t('Help.cannotLogin')}</strong> {t('Help.loginHelp')}
              </p>
              <p>
                <strong className="text-text-1">{t('Help.cannotLink')}</strong> {t('Help.linkHelp')}
              </p>
              <p>
                <strong className="text-text-1">{t('Help.slowApp')}</strong> {t('Help.slowHelp')}
              </p>
              <p>
                <strong className="text-text-1">{t('Help.notifications')}</strong> {t('Help.notificationsHelp')}
              </p>
              <p>
                <strong className="text-text-1">{t('Help.location')}</strong> {t('Help.locationHelp')}
              </p>
              <p>
                <strong className="text-text-1">{t('Help.ai')}</strong> {t('Help.aiHelp')}
              </p>
            </div>
          </div>

          <div className="rounded-modal border border-accent-1/20 bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-2/10 text-accent-2">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-text-2">
                  Need more help?
                </p>
                <h2 className="text-lg font-semibold text-text-1">
                  Contact support
                </h2>
              </div>
            </div>

            <p className="mt-4 text-sm text-text-2">
              {t('Help.contactCopy')}
            </p>

            <a
              href="mailto:support@alittleworldwithus.com"
              className="mt-4 inline-flex min-h-11 items-center rounded-full bg-accent-1 px-4 py-2 text-sm font-medium text-white font-semibold shadow-sm"
            >
              support@alittleworldwithus.com
            </a>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <Link href="/about" className="text-accent-1 hover:underline">
                About & FAQ
              </Link>
              <Link href="/privacy" className="text-accent-1 hover:underline">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-accent-1 hover:underline">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

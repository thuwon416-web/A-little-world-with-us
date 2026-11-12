import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  Bot,
  Camera,
  Heart,
  Mail,
  MessageCircle,
  MoonStar,
  NotebookText,
  Palette,
  Target,
} from 'lucide-react'

export default function About() {
  const { t } = useLanguage()
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8 animate-fade-in">
      <section className="rounded-panel border border-accent-1/20 bg-card p-6 shadow-[0_18px_42px_rgba(0,0,0,0.12)]">
        <p className="text-xs uppercase tracking-[0.22em] text-text-2">{t('About.title')}</p>
        <h1 className="mt-3 text-3xl font-serif text-text-1">{t('About.ourWorld')}</h1>
      </section>

      <div className="space-y-6">
        <p className="text-lg text-text-2 leading-relaxed">
          {t('About.intro')}
        </p>

        <section className="rounded-card border border-border/20 bg-card p-5">
          <h2 className="font-bold text-xl mb-4 text-text-1">{t('About.appInformation')}</h2>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-text-2">{t('About.appName')}</dt>
              <dd className="font-medium text-text-1">A Little World With Us</dd>
            </div>
            <div>
              <dt className="text-text-2">{t('About.version')}</dt>
              <dd className="font-medium text-text-1">1.0.0</dd>
            </div>
            <div>
              <dt className="text-text-2">{t('About.platform')}</dt>
              <dd className="font-medium text-text-1">Web + Android</dd>
            </div>
            <div>
              <dt className="text-text-2">{t('About.lastUpdated')}</dt>
              <dd className="font-medium text-text-1">September 12, 2026</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-[24px] border border-border/20 bg-card p-5">
          <h2 className="font-bold text-xl mb-4 text-text-1">{t('About.features')}</h2>
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-text-1">
              <Camera className="h-5 w-5 text-accent-1" />
              <span>{t('About.featureItems.0')}</span>
            </li>
            <li className="flex items-center gap-3 text-text-1">
              <Target className="h-5 w-5 text-accent-1" />
              <span>{t('About.featureItems.1')}</span>
            </li>
            <li className="flex items-center gap-3 text-text-1">
              <MessageCircle className="h-5 w-5 text-accent-1" />
              <span>{t('About.featureItems.2')}</span>
            </li>
            <li className="flex items-center gap-3 text-text-1">
              <NotebookText className="h-5 w-5 text-accent-1" />
              <span>{t('About.featureItems.3')}</span>
            </li>
            <li className="flex items-center gap-3 text-text-1">
              <Mail className="h-5 w-5 text-accent-1" />
              <span>{t('About.featureItems.4')}</span>
            </li>
            <li className="flex items-center gap-3 text-text-1">
              <MoonStar className="h-5 w-5 text-accent-1" />
              <span>{t('About.featureItems.5')}</span>
            </li>
            <li className="flex items-center gap-3 text-text-1">
              <Palette className="h-5 w-5 text-accent-1" />
              <span>{t('About.featureItems.6')}</span>
            </li>
            <li className="flex items-center gap-3 text-text-1">
              <Bot className="h-5 w-5 text-accent-1" />
              <span>{t('About.featureItems.7')}</span>
            </li>
          </ul>
        </section>

        <section className="rounded-[24px] border border-border/20 bg-card p-5">
          <h2 className="font-bold text-xl mb-4 text-text-1">{t('About.support')}</h2>
          <p className="text-text-2 leading-relaxed">
            {t('About.supportCopy')}
          </p>
          <Link
            href="/help"
            className="mt-4 inline-flex rounded-full bg-accent-1 px-4 py-2 text-sm font-medium text-white font-semibold shadow-sm"
          >
            Visit Help & FAQ
          </Link>
        </section>

        <section className="rounded-[24px] border border-border/20 bg-card p-5">
          <h2 className="font-bold text-xl mb-4 text-text-1">
            {t('About.faq')}
          </h2>
          <div className="space-y-3 text-sm">
            {[
              [t('About.faqItems.0.0'), t('About.faqItems.0.1')],
              [t('About.faqItems.1.0'), t('About.faqItems.1.1')],
              [t('About.faqItems.2.0'), t('About.faqItems.2.1')],
              [t('About.faqItems.3.0'), t('About.faqItems.3.1')],
              [t('About.faqItems.4.0'), t('About.faqItems.4.1')],
              [t('About.faqItems.5.0'), t('About.faqItems.5.1')]
            ]
            ].map(([question, answer]) => (
              <details key={question} className="rounded-xl border border-border/30 p-3">
                <summary className="cursor-pointer font-semibold text-text-1 marker:text-accent-1">{question}</summary>
                <p className="mt-2 text-text-2">{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="rounded-[24px] border border-border/20 bg-card p-5">
          <h2 className="font-bold text-xl mb-4 text-text-1">{t('About.mission')}</h2>
          <p className="text-text-2 leading-relaxed">
            {t('About.missionCopy')}
          </p>
        </section>

        <section className="rounded-[24px] border border-border/20 bg-card p-5">
          <h2 className="font-bold text-xl mb-4 text-text-1">{t('About.builtWithLove')}</h2>
          <p className="flex items-center gap-2 text-text-2 leading-relaxed">
            <Heart className="h-4 w-4 text-accent-1" />
            <span>{t('About.builtCopy')}</span>
          </p>
        </section>
      </div>
    </div>
  )
}

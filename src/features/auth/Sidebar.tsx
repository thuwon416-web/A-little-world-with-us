'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LogOut, Calendar, Camera, HeartPulse, HelpCircle, Home, Info,
  Leaf, LockKeyhole, MapPin, MessageCircleHeart, Gamepad2, Music,
  PhoneCall, Settings, Sparkles, Star, MonitorPlay, Infinity,
  Languages, Users, Shield, FileText,
} from 'lucide-react'
import ThemeToggle from '@/components/shared/ThemeToggle'
import { useLanguage } from '@/contexts/LanguageContext'
import { supabase } from '@/lib/supabase'
import { removeBrowserPushSubscription } from '@/lib/notifications'

const navGroups = [
  {
    label: 'Home',
    items: [
      { href: '/dashboard', key: 'home', icon: Home },
    ],
  },
  {
    label: 'Connection',
    items: [
      { href: '/chat', key: 'whispers', icon: MessageCircleHeart },
      { href: '/calls', key: 'calls', icon: PhoneCall },
      { href: '/location', key: 'location', icon: MapPin },
      { href: '/couple-linking', key: 'coupleLinking', icon: Users },
    ],
  },
  {
    label: 'Memories',
    items: [
      { href: '/memories', key: 'memories', icon: Camera },
    ],
  },
  {
    label: 'Plans',
    items: [
      { href: '/calendar', key: 'plans', icon: Calendar },
    ],
  },
  {
    label: 'Care & Play',
    items: [
      { href: '/care', key: 'care', icon: HeartPulse },
      { href: '/wellness', key: 'wellness', icon: Leaf },
      { href: '/watch-together', key: 'watchTogether', icon: MonitorPlay },
      { href: '/learning', key: 'learning', icon: Languages },
      { href: '/games', key: 'games', icon: Gamepad2 },
      { href: '/music', key: 'music', icon: Music },
      { href: '/astrology', key: 'astrology', icon: Star },
      { href: '/ai', key: 'ai', icon: Sparkles },
    ],
  },
  {
    label: 'Account',
    items: [
      { href: '/vault', key: 'vault', icon: LockKeyhole },
      { href: '/settings', key: 'settings', icon: Settings },
      { href: '/about', key: 'about', icon: Info },
      { href: '/help', key: 'help', icon: HelpCircle },
      { href: '/privacy', key: 'privacy', icon: Shield },
      { href: '/terms', key: 'terms', icon: FileText },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { t } = useLanguage()

  return (
    <aside aria-label="Main sidebar" className="flex h-full w-full flex-col rounded-panel border border-accent-1/20 bg-card px-3 py-6 shadow-lg backdrop-blur-xl">
      <Link href="/dashboard" className="mb-7 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-btn bg-gradient-to-br from-accent-1 to-accent-2 text-lg">
          <Infinity size={22} aria-hidden="true" />
        </div>

        <div>
          <p
            className="text-lg text-text-1"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            A Little World with Us
          </p>
          <p className="text-[10px] text-text-2">KoKo × Pu Tuu</p>
        </div>
      </Link>

      <nav aria-label="Main navigation" className="flex flex-1 flex-col gap-2 overflow-y-auto">
        {navGroups.map(({ label, items }) => (
          <details key={label} open={items.some(({ href }) => pathname === href)} className="group/nav rounded-xl">
            <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-text-2 hover:bg-soft-tint [&::-webkit-details-marker]:hidden">
              {label}
              <span aria-hidden="true" className="transition-transform group-open/nav:rotate-180">⌄</span>
            </summary>
            <div className="flex flex-col gap-1 pt-1">
              {items.map(({ href, key, icon: Icon }) => {
                const active = pathname === href

                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                      active
                        ? 'bg-accent-1/15 font-medium text-accent-1'
                        : 'text-text-2 hover:bg-soft-tint hover:text-text-1'
                    }`}
                  >
                    <Icon size={17} />
                    {t(`nav.${key}`)}
                  </Link>
                )
              })}
            </div>
          </details>
        ))}
      </nav>

      <button
        type="button"
        onClick={async () => {
          try {
            await removeBrowserPushSubscription()
          } catch (error) {
            console.warn('Unable to clear this browser push subscription:', error)
          }
          await supabase.auth.signOut()
          window.location.href = '/login'
        }}
        className="mt-2 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-text-2 hover:bg-soft-tint hover:text-text-1"
      >
        <LogOut size={17} /> {t('nav.logout')}
      </button>

      <div className="mt-5 rounded-btn border border-accent-1/15 bg-card p-3">
        <div className="mb-1 flex items-center gap-1 text-[10px] text-text-2">
          <Sparkles size={11} />
          {t('nav.todaysWhisper')}
        </div>
        <p className="text-xs italic leading-relaxed text-text-1">
          “You are my favorite hello and hardest goodbye.”
        </p>
      </div>

      <div className="mt-4 px-2">
        <ThemeToggle />
      </div>
    </aside>
  )
}

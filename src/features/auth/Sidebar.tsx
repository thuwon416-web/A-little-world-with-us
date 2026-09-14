'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LogOut,
  Calendar,
  Camera,
  DollarSign,
  HeartPulse,
  HelpCircle,
  Home,
  Info,
  Image,
  Leaf,
  LockKeyhole,
  MapPin,
  MessageCircleHeart,
  Gamepad2,
  Music,
  PhoneCall,
  Settings,
  Sparkles,
  Star,
  MonitorPlay,
  BookHeart,
  Infinity,
} from 'lucide-react'
import ThemeToggle from '@/components/shared/ThemeToggle'
import { useLanguage } from '@/contexts/LanguageContext'
import { supabase } from '@/lib/supabase'

const baseNavItems = [
  { href: '/dashboard', key: 'home', icon: Home },
  { href: '/memories', key: 'memories', icon: Camera },
  { href: '/our-story', key: 'ourStory', icon: BookHeart },
  { href: '/chat', key: 'whispers', icon: MessageCircleHeart },
  { href: '/calls', key: 'calls', icon: PhoneCall },
  { href: '/care', key: 'care', icon: HeartPulse },
  { href: '/wellness', key: 'wellness', icon: Leaf },
  { href: '/calendar', key: 'plans', icon: Calendar },
  { href: '/astrology', key: 'astrology', icon: Star },
  { href: '/ai', key: 'ai', icon: Sparkles },
  { href: '/vault', key: 'vault', icon: LockKeyhole },
  { href: '/finance', key: 'finance', icon: DollarSign },
  { href: '/watch-together', key: 'watchTogether', icon: MonitorPlay },
  { href: '/games', key: 'games', icon: Gamepad2 },
  { href: '/music', key: 'music', icon: Music },
  { href: '/gallery', key: 'gallery', icon: Image },
  { href: '/location', key: 'location', icon: MapPin },
  { href: '/settings', key: 'settings', icon: Settings },
]

const infoNavItems = [
  { href: '/about', key: 'about', icon: Info },
  { href: '/help', key: 'help', icon: HelpCircle },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { t } = useLanguage()
  const navItems = [...baseNavItems, ...infoNavItems]

  return (
    <aside className="flex h-full w-full flex-col rounded-3xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] px-3 py-6 shadow-lg backdrop-blur-xl">
      <Link href="/dashboard" className="mb-7 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent-1)] to-[var(--accent-2)] text-lg">
          <Infinity size={22} aria-hidden="true" />
        </div>

        <div>
          <p
            className="text-lg text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            A Little World with Us
          </p>
          <p className="text-[10px] text-[var(--text-secondary)]">KoKo × Pu Tuu</p>
        </div>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map(({ href, key, icon: Icon }) => {
          const active = pathname === href

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
                active
                  ? 'bg-[var(--accent-1)]/15 font-medium text-[var(--accent-1)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-3)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Icon size={17} />
              {t(`nav.${key}`)}
            </Link>
          )
        })}
      </nav>

      <button
        type="button"
        onClick={async () => {
          await supabase.auth.signOut()
          window.location.href = '/login'
        }}
        className="mt-2 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-3)] hover:text-[var(--text-primary)]"
      >
        <LogOut size={17} /> {t('nav.logout')}
      </button>

      <div className="mt-5 rounded-2xl border border-[var(--accent-1)]/15 bg-[var(--card-bg-strong)] p-3">
        <div className="mb-1 flex items-center gap-1 text-[10px] text-[var(--text-secondary)]">
          <Sparkles size={11} />
          {t('nav.todaysWhisper')}
        </div>
        <p className="text-xs italic leading-relaxed text-[var(--text-primary)]">
          “You are my favorite hello and hardest goodbye.”
        </p>
      </div>

      <div className="mt-4 px-2">
        <ThemeToggle />
      </div>
    </aside>
  )
}

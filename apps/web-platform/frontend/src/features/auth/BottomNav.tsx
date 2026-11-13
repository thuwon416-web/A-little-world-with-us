'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Heart,
  HelpCircle,
  Home,
  Info,
  LogOut,
  MessageCircleHeart,
  MoreHorizontal,
  Sparkles,
  MapPin,
  Phone,
  Cpu,
  Calendar,
  Lock,
  Settings,
  X,
  MonitorPlay,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { removeBrowserPushSubscription } from '@/lib/notifications'
import { useLanguage } from '@/contexts/LanguageContext'

const navItems = [
  { href: '/dashboard', labelKey: 'home', icon: Home },
  { href: '/memories', labelKey: 'memories', icon: Heart },
  { href: '/care', labelKey: 'care', icon: Sparkles },
  { href: '/chat', labelKey: 'whispers', icon: MessageCircleHeart },
]

const moreGroups = [
  {
    nameKey: 'groupPlans',
    pages: [
      { labelKey: 'calls', href: '/calls', icon: Phone },
      { labelKey: 'plans', href: '/calendar', icon: Calendar },
      { labelKey: 'wellness', href: '/wellness', icon: Sparkles },
    ],
  },
  {
    nameKey: 'groupCarePlay',
    pages: [
      { labelKey: 'ai', href: '/ai', icon: Cpu },
      { labelKey: 'watchTogether', href: '/watch-together', icon: MonitorPlay },
      { labelKey: 'learning', href: '/learning', icon: Sparkles },
      { labelKey: 'games', href: '/games', icon: Heart },
      { labelKey: 'music', href: '/music', icon: Heart },
      { labelKey: 'astrology', href: '/astrology', icon: Sparkles },
    ],
  },
  {
    nameKey: 'groupAccount',
    pages: [
      { labelKey: 'vault', href: '/vault', icon: Lock },
      { labelKey: 'settings', href: '/settings', icon: Settings },
      { labelKey: 'about', href: '/about', icon: Info },
      { labelKey: 'help', href: '/help', icon: HelpCircle },
      { labelKey: 'location', href: '/location', icon: MapPin },
    ],
  },
]

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useLanguage()
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [canViewLocation, setCanViewLocation] = useState(false)

  useEffect(() => {
    let active = true
    void supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        if (active) setCanViewLocation(false)
        return
      }
      const { data: link } = await supabase
        .from('couple_links')
        .select('inviter_id')
        .or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`)
        .eq('status', 'accepted')
        .maybeSingle()
      if (active) setCanViewLocation(link?.inviter_id === user.id)
    })
    return () => {
      active = false
    }
  }, [])

  const handleExit = async () => {
    try {
      await removeBrowserPushSubscription()
    } catch (error) {
      console.warn('Unable to clear this browser push subscription:', error)
    }
    await supabase.auth.signOut()
    router.replace('/login')
    router.refresh()
  }

  return (
    <>
      <nav aria-label={t('nav.navigationLabel')} className="flex items-center justify-around border-t border-accent-1/20 bg-card px-2 py-2.5 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur-xl">
        {navItems.map(({ href, labelKey, icon: Icon }) => {
          const active = pathname === href

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`flex min-w-14 flex-col items-center gap-1 rounded-xl px-2 py-1 text-xs transition ${
                active ? 'text-accent-1' : 'text-text-2'
              }`}
            >
              <Icon size={19} />
              <span>{t(`nav.${labelKey}`)}</span>
            </Link>
          )
        })}

        <button
          type="button"
          onClick={() => setMoreMenuOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={moreMenuOpen}
          className={`flex min-w-14 flex-col items-center gap-1 rounded-xl px-2 py-1 text-xs transition ${
            pathname === '/planning' ? 'text-accent-1' : 'text-text-2'
          }`}
          aria-label={t('nav.more')}
        >
          <MoreHorizontal size={20} />
          <span>{t('nav.more')}</span>
        </button>

        <button
          type="button"
          onClick={handleExit}
          className="flex min-w-12 flex-col items-center gap-1 rounded-xl px-2 py-1 text-xs text-text-2 transition hover:text-accent-1"
          aria-label={t('nav.logout')}
        >
          <LogOut size={18} />
          <span>{t('nav.logout')}</span>
        </button>
      </nav>

      {moreMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-2 backdrop-blur-sm" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setMoreMenuOpen(false) }}>
          <section role="dialog" aria-modal="true" aria-labelledby="mobile-more-title" className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-card p-6 pb-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 id="mobile-more-title" className="text-lg font-semibold text-text-1">{t('nav.more')}</h2>
              <button
                type="button"
                onClick={() => setMoreMenuOpen(false)}
                className="rounded-full p-2 hover:bg-accent-1/10"
                aria-label={t('Settings.closePINSetup')}
              >
                <X size={20} className="text-text-1" />
              </button>
            </div>

            <div className="space-y-3">
              {moreGroups.map((group) => {
                const pages = group.pages.filter((page) => page.href !== '/location' || canViewLocation)
                return (
                  <details key={group.nameKey} open={pages.some((page) => pathname === page.href)} className="rounded-xl border border-accent-1/15">
                    <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-text-1">{t(`nav.${group.nameKey}`)}</summary>
                    <div className="grid grid-cols-2 gap-2 px-3 pb-3">
                      {pages.map((page) => (
                        <Link
                          key={page.href}
                          href={page.href}
                          onClick={() => setMoreMenuOpen(false)}
                          aria-current={pathname === page.href ? 'page' : undefined}
                          className="flex min-h-16 items-center gap-2 rounded-btn border border-accent-1/20 bg-card p-3 transition hover:bg-card/60"
                        >
                          <page.icon size={20} className="shrink-0 text-accent-1" />
                          <span className="text-xs font-medium text-text-1">{t(`nav.${page.labelKey}`)}</span>
                        </Link>
                      ))}
                    </div>
                  </details>
                )
              })}
            </div>

            <button
              type="button"
              onClick={handleExit}
              className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-error/20 py-3 text-sm font-medium text-error transition hover:bg-error/30"
            >
              <LogOut size={16} />
              {t('nav.logout')}
            </button>
          </section>
        </div>
      )}
    </>
  )
}

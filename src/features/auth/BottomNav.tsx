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
  DollarSign,
  X,
  MonitorPlay,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { removeBrowserPushSubscription } from '@/lib/notifications'

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/memories', label: 'Memories', icon: Heart },
  { href: '/care', label: 'Care', icon: Sparkles },
  { href: '/chat', label: 'Chat', icon: MessageCircleHeart },
]

const moreGroups = [
  {
    name: 'Our Journey',
    pages: [
      { name: 'Our Story', href: '/our-story', icon: Heart },
      { name: 'Memory Map', href: '/memories/map', icon: MapPin },
      { name: 'Gallery', href: '/gallery', icon: Heart },
    ],
  },
  {
    name: 'Daily',
    pages: [
      { name: 'Calls', href: '/calls', icon: Phone },
      { name: 'Plans', href: '/calendar', icon: Calendar },
      { name: 'Wellness', href: '/wellness', icon: Sparkles },
    ],
  },
  {
    name: 'Play and Explore',
    pages: [
      { name: 'AI Companion', href: '/ai', icon: Cpu },
      { name: 'Watch Together', href: '/watch-together', icon: MonitorPlay },
      { name: 'Learning', href: '/learning', icon: Sparkles },
      { name: 'Games', href: '/games', icon: Heart },
      { name: 'Music', href: '/music', icon: Heart },
      { name: 'Astrology', href: '/astrology', icon: Sparkles },
    ],
  },
  {
    name: 'Settings and Help',
    pages: [
      { name: 'Vault', href: '/vault', icon: Lock },
      { name: 'Finance', href: '/finance', icon: DollarSign },
      { name: 'Settings', href: '/settings', icon: Settings },
      { name: 'About', href: '/about', icon: Info },
      { name: 'Help', href: '/help', icon: HelpCircle },
      { name: 'Location', href: '/location', icon: MapPin },
    ],
  },
]

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    void supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
      setIsAdmin(data?.role === 'admin')
    })
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
      <nav aria-label="Primary navigation" className="flex items-center justify-around border-t border-accent-1/20 bg-card px-2 py-2.5 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur-xl">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href

          return (
            <Link
              key={href}
              href={href}
              className={`flex min-w-14 flex-col items-center gap-1 rounded-xl px-2 py-1 text-[10px] transition ${
                active ? 'text-accent-1' : 'text-text-2'
              }`}
            >
              <Icon size={19} />
              <span>{label}</span>
            </Link>
          )
        })}

        <button
          type="button"
          onClick={() => setMoreMenuOpen(true)}
          className={`flex min-w-14 flex-col items-center gap-1 rounded-xl px-2 py-1 text-[10px] transition ${
            pathname === '/planning' ? 'text-accent-1' : 'text-text-2'
          }`}
          aria-label="More menu"
        >
          <MoreHorizontal size={20} />
          <span>More</span>
        </button>

        <button
          type="button"
          onClick={handleExit}
          className="flex min-w-12 flex-col items-center gap-1 rounded-xl px-2 py-1 text-[10px] text-text-2 transition hover:text-accent-1"
          aria-label="Lock and exit"
        >
          <LogOut size={18} />
          <span>Exit</span>
        </button>
      </nav>

      {/* More Menu Modal */}
      {moreMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm">
          <div className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-card p-6 pb-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-1">More</h2>
              <button
                onClick={() => setMoreMenuOpen(false)}
                className="rounded-full p-2 hover:bg-accent-1/10"
                aria-label="Close menu"
              >
                <X size={20} className="text-text-1" />
              </button>
            </div>

            <div className="space-y-3">
              {moreGroups.map((group) => {
                const pages = group.pages.filter((page) => page.href !== '/location' || isAdmin)
                return (
                  <details key={group.name} open={pages.some((page) => pathname === page.href)} className="rounded-xl border border-accent-1/15">
                    <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-text-1">{group.name}</summary>
                    <div className="grid grid-cols-2 gap-2 px-3 pb-3">
                      {pages.map((page) => (
                        <Link
                          key={page.name}
                          href={page.href}
                          onClick={() => setMoreMenuOpen(false)}
                          className="flex min-h-16 items-center gap-2 rounded-btn border border-accent-1/20 bg-card p-3 transition hover:bg-card/60"
                        >
                          <page.icon size={20} className="shrink-0 text-accent-1" />
                          <span className="text-xs font-medium text-text-1">{page.name}</span>
                        </Link>
                      ))}
                    </div>
                  </details>
                )
              })}
            </div>

            <button
              onClick={handleExit}
              className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-error/20 py-3 text-sm font-medium text-error transition hover:bg-error/30"
            >
              <LogOut size={16} />
              Exit App
            </button>
          </div>
        </div>
      )}
    </>
  )
}

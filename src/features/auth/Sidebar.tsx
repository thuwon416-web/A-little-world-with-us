'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Bell,
  CalendarDays,
  Gamepad2,
  Heart,
  Home,
  LockKeyhole,
  MapPin,
  MessageCircleHeart,
  PhoneCall,
  Sparkles,
  Star,
  Shield,
} from 'lucide-react'
import ThemeToggle from '@/components/shared/ThemeToggle'
import { supabase } from '@/lib/supabase'

const baseNavItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/memories', label: 'Memories', icon: Heart },
  { href: '/chat', label: 'Whispers', icon: MessageCircleHeart },
  { href: '/plans', label: 'Plans', icon: CalendarDays },
  { href: '/care', label: 'Care', icon: Heart },
  { href: '/astrology', label: 'Astrology', icon: Star },
  { href: '/calls', label: 'Calls', icon: PhoneCall },
  { href: '/ai', label: 'AI', icon: Sparkles },
  { href: '/reminders', label: 'Reminders', icon: Bell },
  { href: '/wellness', label: 'Wellness', icon: Heart },
  { href: '/games', label: 'Play', icon: Gamepad2 },
  { href: '/vault', label: 'Vault', icon: LockKeyhole },
]

const adminNavItems = [
  { href: '/locations', label: 'Location', icon: MapPin },
  { href: '/admin/locations', label: 'Admin Location', icon: Shield },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkUserRole()
  }, [])

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setUserRole(null)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      setUserRole(profile?.role || 'user')
    } catch (error) {
      console.error('Failed to check user role:', error)
      setUserRole('user')
    } finally {
      setIsLoading(false)
    }
  }

  const navItems = userRole === 'admin' ? [...baseNavItems, ...adminNavItems] : baseNavItems

  if (isLoading) {
    return (
      <aside className="flex h-full w-full flex-col rounded-3xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] px-3 py-6 shadow-lg backdrop-blur-xl">
        <div className="flex h-full items-center justify-center">
          <div className="text-sm text-[var(--text-secondary)]">Loading...</div>
        </div>
      </aside>
    )
  }

  return (
    <aside className="flex h-full w-full flex-col rounded-3xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] px-3 py-6 shadow-lg backdrop-blur-xl">
      <Link href="/dashboard" className="mb-7 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent-1)] to-[var(--accent-2)] text-lg">
          ♾
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
        {navItems.map(({ href, label, icon: Icon }) => {
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
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-5 rounded-2xl border border-[var(--accent-1)]/15 bg-[var(--card-bg-strong)] p-3">
        <div className="mb-1 flex items-center gap-1 text-[10px] text-[var(--text-secondary)]">
          <Sparkles size={11} />
          Today&apos;s whisper
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

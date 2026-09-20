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

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/memories', label: 'Memories', icon: Heart },
  { href: '/care', label: 'Care', icon: Sparkles },
  { href: '/chat', label: 'Chat', icon: MessageCircleHeart },
]

const morePages = [
  { name: 'Location', href: '/location', icon: MapPin },
  { name: 'Calls', href: '/calls', icon: Phone },
  { name: 'AI', href: '/ai', icon: Cpu },
  { name: 'Plans', href: '/calendar', icon: Calendar },
  { name: 'Wellness & Play', href: '/wellness', icon: Sparkles },
  { name: 'Vault', href: '/vault', icon: Lock },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Finance', href: '/finance', icon: DollarSign },
  { name: 'Watch Together', href: '/watch-together', icon: MonitorPlay },
  { name: 'About', href: '/about', icon: Info },
  { name: 'Help', href: '/help', icon: HelpCircle },
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
    await supabase.auth.signOut()
    router.replace('/login')
    router.refresh()
  }

  return (
    <>
      <nav className="flex items-center justify-around border-t border-accent-1/20 bg-card px-2 py-2.5 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur-xl">
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
          <div className="w-full max-w-md rounded-t-3xl bg-card p-6 pb-8">
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

            <div className="grid grid-cols-2 gap-3">
              {morePages
                .filter((page) => page.href !== '/location' || isAdmin)
                .map((page) => (
                  <Link
                    key={page.name}
                    href={page.href}
                    onClick={() => setMoreMenuOpen(false)}
                    className="flex flex-col items-center gap-2 rounded-btn border border-accent-1/20 bg-card p-4 transition hover:bg-card/60"
                  >
                    <page.icon size={24} className="text-accent-1" />
                    <span className="text-xs font-medium text-text-1">
                      {page.name}
                    </span>
                  </Link>
                ))}
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

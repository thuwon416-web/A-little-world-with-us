'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Heart, Home, LogOut, MessageCircleHeart, MoreHorizontal, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/memories', label: 'Memories', icon: Heart },
  { href: '/wellness', label: 'Care', icon: Sparkles },
  { href: '/chat', label: 'Chat', icon: MessageCircleHeart },
]

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  const handleExit = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
    router.refresh()
  }

  return (
    <nav className="flex items-center justify-around border-t border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] px-2 py-2.5 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur-xl">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href

        return (
          <Link
            key={href}
            href={href}
            className={`flex min-w-14 flex-col items-center gap-1 rounded-xl px-2 py-1 text-[10px] transition ${
              active ? 'text-[var(--accent-1)]' : 'text-[var(--text-secondary)]'
            }`}
          >
            <Icon size={19} />
            <span>{label}</span>
          </Link>
        )
      })}

      <Link
        href="/planning"
        className={`flex min-w-14 flex-col items-center gap-1 rounded-xl px-2 py-1 text-[10px] transition ${
          pathname === '/planning' ? 'text-[var(--accent-1)]' : 'text-[var(--text-secondary)]'
        }`}
      >
        <MoreHorizontal size={20} />
        <span>More</span>
      </Link>

      <button
        type="button"
        onClick={handleExit}
        className="flex min-w-12 flex-col items-center gap-1 rounded-xl px-2 py-1 text-[10px] text-[var(--text-secondary)] transition hover:text-[var(--accent-1)]"
        aria-label="Lock and exit"
      >
        <LogOut size={18} />
        <span>Exit</span>
      </button>
    </nav>
  )
}

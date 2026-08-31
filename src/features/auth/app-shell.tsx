'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Sidebar from '@/features/auth/Sidebar'
import BottomNav from '@/features/auth/BottomNav'

const keyboardRoutes = [
  { key: '1', href: '/dashboard' },
  { key: '2', href: '/memories' },
  { key: '3', href: '/chat' },
  { key: '4', href: '/plans' },
  { key: '5', href: '/location' },
  { key: '6', href: '/calls' },
  { key: '7', href: '/ai' },
  { key: '8', href: '/reminders' },
  { key: '9', href: '/wellness' },
] as const

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.ctrlKey && !event.metaKey) return

      const route = keyboardRoutes.find((item) => item.key === event.key)
      if (!route) return

      event.preventDefault()
      router.push(route.href)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [router])

  return (
    <div className="min-h-screen text-[var(--text-primary)]">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-72 shrink-0 p-4 lg:flex lg:flex-col">
          <Sidebar />
        </aside>

        <main className="min-w-0 flex-1 px-4 pb-28 pt-6 md:px-6 lg:px-8 lg:pb-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mx-auto max-w-7xl"
          >
            {children}
          </motion.div>
        </main>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
        <BottomNav />
      </div>
    </div>
  )
}

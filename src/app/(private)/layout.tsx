import { Suspense } from 'react'
import AuthGuard from '@/features/auth/AuthGuard'
import AppShell from '@/features/auth/app-shell'
import { ThemeProvider } from '@/contexts/ThemeContext'

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>
        <Suspense fallback={<PrivatePageSkeleton />}>{children}</Suspense>
      </AppShell>
    </AuthGuard>
  )
}

function PrivatePageSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="h-8 w-40 animate-pulse rounded-full bg-[var(--card-bg-strong)]" />
      <div className="h-64 animate-pulse rounded-3xl bg-[var(--card-bg-strong)]" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-40 animate-pulse rounded-3xl bg-[var(--card-bg-strong)]" />
        <div className="h-40 animate-pulse rounded-3xl bg-[var(--card-bg-strong)]" />
      </div>
    </div>
  )
}

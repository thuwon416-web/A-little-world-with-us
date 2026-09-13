import type { LucideIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'glass-card flex flex-col items-center justify-center gap-4 rounded-2xl p-8 text-center',
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[var(--accent-1)]/25 bg-[var(--card-bg-strong)] text-[var(--accent-1)] shadow-[0_0_20px_rgba(184,138,229,0.12)]">
        <Icon className="h-8 w-8" aria-hidden="true" />
      </div>

      <div className="space-y-2">
        <h3 className="font-serif text-xl text-[var(--text-primary)]">{title}</h3>
        {description ? (
          <p className="max-w-md text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
        ) : null}
      </div>

      {action ? (
        <Button type="button" variant="secondary" onClick={action.onClick} className="mt-2">
          {action.label}
        </Button>
      ) : null}
    </div>
  )
}

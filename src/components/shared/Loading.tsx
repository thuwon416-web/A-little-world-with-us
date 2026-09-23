import { Spinner } from './Spinner'

export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-10 text-sm text-text-2">
      <Spinner size={18} color="rgb(var(--accent-1))" />
      <span>{label}</span>
    </div>
  )
}

export function InlineLoading({ label = 'Saving...' }: { label?: string }) {
  return (
    <div className="inline-flex items-center gap-2 text-sm text-text-2">
      <Spinner size={14} color="rgb(var(--accent-1))" />
      <span>{label}</span>
    </div>
  )
}

export function ProgressBar({ value, total = 100 }: { value: number; total?: number }) {
  const percentage = Math.min(100, Math.max(0, (value / total) * 100))

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-soft-tint/20">
      <div
        className="h-full rounded-full bg-gradient-to-r from-accent-1 via-accent-2 to-success transition-all duration-300"
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

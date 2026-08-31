import { Spinner } from './Spinner'

export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-10 text-sm text-[var(--text-secondary)]">
      <Spinner size={18} color="#d8b9c8" />
      <span>{label}</span>
    </div>
  )
}

export function InlineLoading({ label = 'Saving...' }: { label?: string }) {
  return (
    <div className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)]">
      <Spinner size={14} color="#d8b9c8" />
      <span>{label}</span>
    </div>
  )
}

export function ProgressBar({ value, total = 100 }: { value: number; total?: number }) {
  const percentage = Math.min(100, Math.max(0, (value / total) * 100))

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-gradient-to-r from-[#d8b9c8] via-[#b7c3f0] to-[#b0d8c5] transition-all duration-300"
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

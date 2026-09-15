'use client'

import { EXPENSE_CATEGORIES } from './finance-constants'

type CategoryFilterProps = {
  active: string
  onChange: (value: string) => void
}

export default function CategoryFilter({ active, onChange }: CategoryFilterProps) {
  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-max gap-2">
        {['all', ...EXPENSE_CATEGORIES.map((category) => category.value)].map((value) => {
          const label = value === 'all'
            ? 'All'
            : EXPENSE_CATEGORIES.find((category) => category.value === value)?.label ?? value
          const selected = active === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => onChange(value)}
              className={selected
                ? 'rounded-full bg-[var(--accent-1)] px-4 py-2 text-sm text-white'
                : 'rounded-full border border-[var(--accent-1)]/20 bg-[var(--card-bg)] px-4 py-2 text-sm text-[var(--text-secondary)]'}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

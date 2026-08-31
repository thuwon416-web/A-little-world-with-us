'use client'

import { Command, Search, Sparkles } from 'lucide-react'

export type ShortcutItem = {
  combo: string
  label: string
  action: string
}

const defaultShortcuts: ShortcutItem[] = [
  { combo: '⌘/Ctrl + K', label: 'Search', action: 'Focus the search box' },
  { combo: '⌘/Ctrl + B', label: 'Sidebar', action: 'Toggle the navigation panel' },
  { combo: '⌘/Ctrl + /', label: 'Help', action: 'Open shortcut list' },
  { combo: 'Esc', label: 'Close', action: 'Dismiss overlays or modals' },
]

export default function KeyboardShortcutsHelp({ shortcuts = defaultShortcuts }: { shortcuts?: ShortcutItem[] }) {
  return (
    <div className="rounded-[28px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.12)]">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent-1)]/10 text-[var(--accent-1)]">
          <Command className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Quick actions</p>
          <h2 className="mt-1 text-xl font-semibold text-[var(--text-primary)]">Keyboard shortcuts</h2>
        </div>
      </div>

      <div className="space-y-3">
        {shortcuts.map((shortcut) => (
          <div
            key={shortcut.combo}
            className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[var(--card-bg-strong)] px-3 py-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-2)]/10 text-[var(--accent-2)]">
                {shortcut.label === 'Search' ? <Search className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
              </div>
              <div>
                <p className="font-medium text-[var(--text-primary)]">{shortcut.label}</p>
                <p className="text-sm text-[var(--text-secondary)]">{shortcut.action}</p>
              </div>
            </div>

            <span className="rounded-full border border-[var(--accent-1)]/20 bg-[var(--card-bg)] px-2 py-1 text-xs font-medium text-[var(--text-primary)]">
              {shortcut.combo}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

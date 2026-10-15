'use client'

import { useEffect } from 'react'

export type ShortcutDefinition = {
  key: string
  description: string
  action: () => void
  ctrlOrMeta?: boolean
  alt?: boolean
  shift?: boolean
}

function matchesShortcut(event: KeyboardEvent, shortcut: ShortcutDefinition) {
  const isCtrlOrMeta = shortcut.ctrlOrMeta ? event.ctrlKey || event.metaKey : true
  const isAlt = shortcut.alt ? event.altKey : !event.altKey
  const isShift = shortcut.shift ? event.shiftKey : !event.shiftKey
  const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()

  return isCtrlOrMeta && isAlt && isShift && keyMatch
}

export function useKeyboardShortcuts(shortcuts: ShortcutDefinition[]) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isTyping =
        !!target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.closest('input, textarea, [contenteditable="true"]'))

      for (const shortcut of shortcuts) {
        if (!matchesShortcut(event, shortcut)) continue
        if (isTyping && !shortcut.ctrlOrMeta) continue
        event.preventDefault()
        shortcut.action()
        return
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [shortcuts])
}

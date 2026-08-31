'use client'

import { useEffect, useState } from 'react'
import { useTheme } from '@/features/auth/ThemeProvider'

export default function InteractiveCursor() {
  const { mode } = useTheme()
  const isMonochrome = mode === 'monochrome'
  const [position, setPosition] = useState({ x: 0, y: 0, visible: false })

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      setPosition({ x: event.clientX, y: event.clientY, visible: true })
    }

    const onLeave = () => setPosition((prev) => ({ ...prev, visible: false }))

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseleave', onLeave)

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <div
      aria-hidden="true"
      className={`heart-cursor ${position.visible ? 'visible' : 'hidden'}`}
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <span className={isMonochrome ? 'heart-cursor-core text-slate-200/90' : 'heart-cursor-core'}>
        ♡
      </span>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Heart, Lock, MessageSquareText, Music2, Plus } from 'lucide-react'

const actions = [
  { id: 'memory', label: 'Add memory', href: '/memories', icon: Plus },
  { id: 'chat', label: 'Send message', href: '/chat', icon: MessageSquareText },
  { id: 'vault', label: 'Open vault', href: '/vault', icon: Lock },
  { id: 'care', label: 'Check in', href: '/cycle', icon: Heart },
  { id: 'music', label: 'Play music', href: '#music', icon: Music2 },
] as const

export default function QuickActions() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="dashboard-quick-actions">
      <div className={`dashboard-quick-actions__list ${isExpanded ? 'dashboard-quick-actions__list--open' : ''}`}>
        {actions.map(({ id, label, href, icon: Icon }) => (
          <Link key={id} href={href} className="dashboard-action-item">
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </Link>
        ))}
      </div>

      <button
        type="button"
        aria-label={isExpanded ? 'Collapse quick actions' : 'Open quick actions'}
        onClick={() => setIsExpanded((current) => !current)}
        className="dashboard-fab"
      >
        <Plus className={`h-5 w-5 transition-transform duration-200 ${isExpanded ? 'rotate-45' : ''}`} />
      </button>
    </div>
  )
}

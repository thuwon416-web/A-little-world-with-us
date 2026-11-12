'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Heart, Lock, MessageSquareText, Music2, Plus } from 'lucide-react'

const actions = [
  { id: 'memory', label: 'dashboard.quickActionsMenu.addMemory', href: '/memories', icon: Plus },
  { id: 'chat', label: 'dashboard.quickActionsMenu.sendMessage', href: '/chat', icon: MessageSquareText },
  { id: 'vault', label: 'dashboard.quickActionsMenu.openVault', href: '/vault', icon: Lock },
  { id: 'care', label: 'dashboard.quickActionsMenu.checkIn', href: '/cycle', icon: Heart },
  { id: 'music', label: 'dashboard.quickActionsMenu.playMusic', href: '#music', icon: Music2 },
] as const

export default function QuickActions() {
  const { t } = useLanguage()
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="dashboard-quick-actions">
      <div className={`dashboard-quick-actions__list ${isExpanded ? 'dashboard-quick-actions__list--open' : ''}`}>
        {actions.map(({ id, label, href, icon: Icon }) => (
          <Link key={id} href={href} className="dashboard-action-item">
            <Icon className="h-4 w-4" />
            <span>{t(label)}</span>
          </Link>
        ))}
      </div>

      <button
        type="button"
        aria-label={isExpanded ? t('dashboard.quickActionsMenu.collapse') : t('dashboard.quickActionsMenu.open')}
        onClick={() => setIsExpanded((current) => !current)}
        className="dashboard-fab"
      >
        <Plus className={`h-5 w-5 transition-transform duration-200 ${isExpanded ? 'rotate-45' : ''}`} />
      </button>
    </div>
  )
}

'use client'

import { useMemo } from 'react'

export default function RelationshipStats() {
  const stats = useMemo(
    () => [
      { label: 'Days together', value: '1,025' },
      { label: 'Memories', value: '84' },
      { label: 'Messages', value: '2,134' },
      { label: 'Vault items', value: '27' },
      { label: 'Longest streak', value: '18 days' },
    ],
    []
  )

  return (
    <section className="dashboard-grid dashboard-grid--stats">
      {stats.map((stat) => (
        <div key={stat.label} className="dashboard-stat-card">
          <p className="dashboard-stat-card__label">{stat.label}</p>
          <p className="dashboard-stat-card__value">{stat.value}</p>
        </div>
      ))}
    </section>
  )
}

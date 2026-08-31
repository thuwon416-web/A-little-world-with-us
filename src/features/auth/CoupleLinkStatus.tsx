'use client'

import { useEffect, useState } from 'react'
import { getPairStatus, type CoupleLinkStatus as LinkStatus } from '@/lib/couple-link'

export default function CoupleLinkStatus() {
  const [status, setStatus] = useState<LinkStatus | 'not_linked' | null>(null)

  useEffect(() => {
    getPairStatus()
      .then((data) => setStatus(data?.status ?? 'not_linked'))
      .catch(() => setStatus('not_linked'))
  }, [])

  if (!status || status === 'not_linked') {
    return <p className="text-sm text-[var(--text-secondary)]">No couple link yet</p>
  }

  if (status === 'accepted') {
    return <p className="text-sm text-emerald-500">Couple link active</p>
  }

  if (status === 'pending') {
    return <p className="text-sm text-amber-500">Pairing request pending</p>
  }

  return <p className="text-sm text-red-500">Couple link unavailable</p>
}

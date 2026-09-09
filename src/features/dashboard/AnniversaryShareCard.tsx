'use client'

import { useEffect, useState } from 'react'
import { Download, Share2 } from 'lucide-react'
import { getCoupleStatus } from '@/lib/couples'

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
}

function createCard(name: string, anniversary: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    canvas.width = 1200
    canvas.height = 630
    const context = canvas.getContext('2d')
    if (!context) { reject(new Error('Image generation is unavailable.')); return }
    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, '#1a0b2e')
    gradient.addColorStop(0.5, '#43265e')
    gradient.addColorStop(1, '#1e1134')
    context.fillStyle = gradient
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.fillStyle = 'rgba(255, 215, 0, 0.72)'
    context.font = '34px Georgia'
    context.fillText('A LITTLE WORLD WITH US', 80, 104)
    context.fillStyle = '#fff7fa'
    context.font = '68px Georgia'
    context.fillText('Celebrating our love', 80, 245)
    context.font = '42px Georgia'
    context.fillStyle = '#ffb6c9'
    context.fillText(name || 'Our little world', 80, 324)
    context.font = '30px Georgia'
    context.fillStyle = 'rgba(255,255,255,0.8)'
    context.fillText(`Since ${formatDate(anniversary)}`, 80, 390)
    context.font = '78px Georgia'
    context.fillStyle = '#ffd700'
    context.fillText('♥', 1022, 494)
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not create your share card.')), 'image/png')
  })
}

export default function AnniversaryShareCard() {
  const [details, setDetails] = useState<{ name: string; anniversary: string } | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void getCoupleStatus().then(({ couple }) => {
      if (couple?.anniversary) setDetails({ name: couple.name ?? 'Our little world', anniversary: couple.anniversary })
    })
  }, [])

  if (!details) return null

  const share = async () => {
    setBusy(true)
    try {
      const blob = await createCard(details.name, details.anniversary)
      const file = new File([blob], 'our-anniversary.png', { type: 'image/png' })
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: 'A Little World With Us', files: [file] })
      } else {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = file.name
        link.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) window.alert(error instanceof Error ? error.message : 'Unable to create your share card.')
    } finally {
      setBusy(false)
    }
  }

  return <button type="button" onClick={() => void share()} disabled={busy} className="dashboard-share-card" aria-label="Share a private anniversary image"><Share2 className="h-4 w-4" />{busy ? 'Creating…' : 'Share anniversary card'}<Download className="h-3.5 w-3.5 opacity-70" /></button>
}

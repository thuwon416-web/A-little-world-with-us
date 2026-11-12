'use client'

import { useEffect, useState } from 'react'
import { Download, Share2 } from 'lucide-react'
import { getCoupleStatus } from '@/lib/couples'
import { useLanguage } from '@/contexts/LanguageContext'

function formatDate(value: string, locale: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(locale, { month: 'long', day: 'numeric', year: 'numeric' })
}

type ShareCardCopy = { brand: string; title: string; since: string; fallbackName: string; imageUnavailable: string; createFailed: string }

function getThemeColors() {
  const styles = getComputedStyle(document.documentElement)
  const color = (token: string, fallback: string) => {
    const value = styles.getPropertyValue(token).trim()
    if (!value) return fallback
    return value.startsWith('#') || value.startsWith('rgb') ? value : `rgb(${value})`
  }
  return {
    background: color('--bg', '#1a0b2e'),
    accent: color('--accent-1', '#bca0d4'),
    secondaryAccent: color('--accent-2', '#dcc8e8'),
    text: color('--text-1', '#fff7fa'),
  }
}

function createCard(name: string, anniversary: string, copy: ShareCardCopy, locale: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    canvas.width = 1200
    canvas.height = 630
    const context = canvas.getContext('2d')
    if (!context) { reject(new Error(copy.imageUnavailable)); return }
    const colors = getThemeColors()
    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, colors.background)
    gradient.addColorStop(0.5, colors.accent)
    gradient.addColorStop(1, colors.background)
    context.fillStyle = gradient
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.fillStyle = colors.secondaryAccent
    context.font = '34px "Noto Sans Myanmar", Georgia, serif'
    context.fillText(copy.brand, 80, 104, 1000)
    context.fillStyle = colors.text
    context.font = '68px "Noto Sans Myanmar", Georgia, serif'
    context.fillText(copy.title, 80, 245, 1000)
    context.font = '42px "Noto Sans Myanmar", Georgia, serif'
    context.fillStyle = colors.accent
    context.fillText(name || copy.fallbackName, 80, 324, 1000)
    context.font = '30px "Noto Sans Myanmar", Georgia, serif'
    context.fillStyle = colors.text
    context.fillText(copy.since.replace('{date}', formatDate(anniversary, locale)), 80, 390, 1000)
    context.font = '78px Georgia'
    context.fillStyle = colors.secondaryAccent
    context.fillText('♥', 1022, 494)
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error(copy.createFailed)), 'image/png')
  })
}

export default function AnniversaryShareCard() {
  const { language, t } = useLanguage()
  const copy: ShareCardCopy = {
    brand: t('dashboard.shareCard.brand'),
    title: t('dashboard.shareCard.title'),
    since: t('dashboard.shareCard.since'),
    fallbackName: t('dashboard.shareCard.fallbackName'),
    imageUnavailable: t('dashboard.shareCard.imageUnavailable'),
    createFailed: t('dashboard.shareCard.createFailed'),
  }
  const locale = language === 'my' ? 'my-MM' : 'en-US'
  const [details, setDetails] = useState<{ name: string; anniversary: string } | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void getCoupleStatus().then(({ couple }) => {
      if (couple?.anniversary) setDetails({ name: couple.name ?? 'Our little world', anniversary: couple.anniversary })
    })
  }, [])

  if (!details) return null

  const download = async () => {
    setBusy(true)
    try {
      const blob = await createCard(details.name, details.anniversary, copy, locale)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'our-anniversary.png'
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (error) {
      window.alert(t('dashboard.shareCard.createFailed'))
    } finally {
      setBusy(false)
    }
  }

  const share = async () => {
    setBusy(true)
    try {
      const blob = await createCard(details.name, details.anniversary, copy, locale)
      const file = new File([blob], 'our-anniversary.png', { type: 'image/png' })
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: copy.brand, files: [file] })
      } else {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = file.name
        link.click()
        window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) window.alert(t('dashboard.shareCard.unable'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => void share()} disabled={busy} className="dashboard-share-card" aria-label={t("dashboard.shareCard.share")}>
        <Share2 className="h-4 w-4" />{busy ? t('dashboard.shareCard.creating') : t('dashboard.shareCard.share')}
      </button>
      <button type="button" onClick={() => void download()} disabled={busy} className="dashboard-share-card" aria-label={t("dashboard.shareCard.download")}>
        <Download className="h-4 w-4" />Download card
      </button>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Copy, CheckCircle, AlertCircle } from 'lucide-react'
import { LoadingState } from '@/components/shared/Loading'
import { acceptPairInvite, createPairInvite, getPairStatus, type CoupleLinkStatus } from '@/lib/couple-link'
import { getCurrentUserId } from '@/lib/supabase'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { useLanguage } from '@/contexts/LanguageContext'

type PageState = 'loading' | 'linked' | 'pending' | 'create' | 'error'

export default function CoupleLinkingPage() {
  const { t } = useLanguage()
  const [state, setState] = useState<PageState>('loading')
  const [inviteCode, setInviteCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [acceptCode, setAcceptCode] = useState('')
  const [isAccepting, setIsAccepting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [lastStatusUpdatedAt, setLastStatusUpdatedAt] = useState<string | null>(null)
  const _prefersReduced = usePrefersReducedMotion()

  useEffect(() => {
    void getCurrentUserId().then(setCurrentUserId)
    void checkLinkStatus()
  }, [])

  const resolveLinkStatus = (nextStatus: CoupleLinkStatus | null, updatedAt?: string | null) => {
    if (!nextStatus) return

    const nextUpdatedAt = updatedAt ?? new Date().toISOString()
    const shouldApplyRemoteUpdate =
      !lastStatusUpdatedAt || new Date(nextUpdatedAt).getTime() >= new Date(lastStatusUpdatedAt).getTime()

    if (!shouldApplyRemoteUpdate) {
      return
    }

    setLastStatusUpdatedAt(nextUpdatedAt)
    setState(nextStatus === 'accepted' ? 'linked' : nextStatus === 'pending' ? 'pending' : 'create')
  }

  useRealtimeSync<{ status: CoupleLinkStatus; invite_code?: string | null; updated_at?: string | null }>({
    table: 'couple_links',
    filter: currentUserId ? `inviter_id=eq.${currentUserId}` : undefined,
    onChange: (row) => {
      const nextStatus = row.status
      setInviteCode((previousCode) => row.invite_code ?? previousCode)
      resolveLinkStatus(nextStatus, row.updated_at)
    },
  })

  const checkLinkStatus = async () => {
    try {
      const status = await getPairStatus()
      if (status) {
        setInviteCode(status.inviteCode ?? '')
        setLastStatusUpdatedAt((current) => current ?? new Date().toISOString())
        setState(status.status === 'accepted' ? 'linked' : 'pending')
      } else {
        setState('create')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('CoupleLink.checkError'))
      setState('error')
    }
  }

  const handleCreateInvite = async () => {
    try {
      setIsCreating(true)
      setError('')
      
      const code = await createPairInvite()
      setInviteCode(code)
      setLastStatusUpdatedAt(new Date().toISOString())
      setState('pending')
    } catch (err) {
      const message = err instanceof Error ? err.message : t('CoupleLink.createError')
      setError(message)
      setState('error')
    } finally {
      setIsCreating(false)
    }
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-card p-4 md:p-6">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="h-8 w-8 text-accent-1" />
            <h1 className="text-3xl md:text-4xl font-bold text-text-1">{t('CoupleLink.title')}</h1>
          </div>
          <p className="text-text-2">{t('CoupleLink.subtitle')}</p>
        </motion.div>

        {/* States */}
        {state === 'loading' && <LoadingStateCard />}
        {state === 'create' && (
          <CreateInviteState
            onCreateInvite={handleCreateInvite}
            isCreating={isCreating}
            acceptCode={acceptCode}
            setAcceptCode={setAcceptCode}
            isAccepting={isAccepting}
            onAccept={async () => {
              try {
                setIsAccepting(true)
                setError('')
                await acceptPairInvite(acceptCode)
                setAcceptCode('')
                await checkLinkStatus()
              } catch (err) {
                setError(err instanceof Error ? err.message : t('CoupleLink.acceptError'))
              } finally {
                setIsAccepting(false)
              }
            }}
          />
        )}
        {state === 'pending' && (
          <PendingState
            inviteCode={inviteCode}
            onCopyCode={handleCopyCode}
            copied={copied}
          />
        )}
        {state === 'linked' && <LinkedState />}
        {state === 'error' && (
          <ErrorState
            error={error}
            onRetry={checkLinkStatus}
          />
        )}
      </div>
    </div>
  )
}

function LoadingStateCard() {
  const { t } = useLanguage()
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="py-16"
    >
      <LoadingState label={t('CoupleLink.loading')} />
    </motion.div>
  )
}

function CreateInviteState({
  onCreateInvite,
  isCreating,
  acceptCode,
  setAcceptCode,
  isAccepting,
  onAccept,
}: {
  readonly onCreateInvite: () => void
  readonly isCreating: boolean
  readonly acceptCode: string
  readonly setAcceptCode: (value: string) => void
  readonly isAccepting: boolean
  readonly onAccept: () => void
}) {
  const { t } = useLanguage()
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      <div className="rounded-panel border border-accent-1/20 bg-card p-8 text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-accent-1/10 p-4">
            <Heart className="h-8 w-8 text-accent-1" />
          </div>
        </div>
        <h2 className="mb-2 text-2xl font-bold text-text-1">{t('CoupleLink.ready')}</h2>
        <p className="mb-6 text-text-2">
          {t('CoupleLink.createDescription')}
        </p>
        <button
          onClick={onCreateInvite}
          disabled={isCreating}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-accent-1 px-8 py-3 font-semibold text-white font-semibold shadow-sm transition hover:shadow-lg hover:shadow-accent-1/20 disabled:opacity-50"
        >
          {isCreating ? (
            <>
              <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              {t('CoupleLink.creating')}
            </>
          ) : (
            <>
              <Heart className="h-5 w-5" />
              {t('CoupleLink.createCode')}
            </>
          )}
        </button>
      </div>

      <div className="rounded-btn border border-accent-2/20 bg-card/50 p-6">
        <h3 className="font-semibold text-accent-2 mb-3">{t('CoupleLink.alreadyHaveCode')}</h3>
        <div className="flex gap-2">
          <input value={acceptCode} onChange={(event) => setAcceptCode(event.target.value.toUpperCase().replace(/[^A-F0-9]/g, ''))} maxLength={16} placeholder={t('CoupleLink.codePlaceholder')} className="min-w-0 flex-1 rounded-lg border border-accent-1/20 bg-card px-3 py-2 text-text-1" />
          <button type="button" onClick={onAccept} disabled={isAccepting || !/^(?:[A-F0-9]{8}|[A-F0-9]{16})$/.test(acceptCode)} className="min-h-11 rounded-lg bg-accent-1 px-4 py-2 font-semibold text-white font-semibold shadow-sm disabled:opacity-50">{isAccepting ? t('CoupleLink.linking') : t('CoupleLink.accept')}</button>
        </div>
      </div>

      <div className="rounded-btn border border-accent-2/20 bg-card/50 p-6">
        <h3 className="font-semibold text-accent-2 mb-3">{t('CoupleLink.howItWorks')}:</h3>
        <ol className="space-y-2 text-sm text-text-2">
          <li>1. {t('CoupleLink.steps.0')}</li><li>2. {t('CoupleLink.steps.1')}</li><li>3. {t('CoupleLink.steps.2')}</li><li>4. {t('CoupleLink.steps.3')}</li>
        </ol>
      </div>
    </motion.div>
  )
}

function PendingState({
  inviteCode,
  onCopyCode,
  copied,
}: {
  readonly inviteCode: string
  readonly onCopyCode: () => void
  readonly copied: boolean
}) {
  const { t } = useLanguage()
  const _prefersReduced = usePrefersReducedMotion()
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      <div className="rounded-btn border border-accent-1/20 bg-card p-8 text-center">
        <div className="mb-6 flex justify-center">
          <motion.div
            animate={_prefersReduced ? {} : { scale: [1, 1.1, 1] }}
            transition={_prefersReduced ? {} : { duration: 2, repeat: Infinity }}
            className="rounded-full bg-accent-1/10 p-4"
          >
            <Heart className="h-8 w-8 text-accent-1" />
          </motion.div>
        </div>
        <h2 className="mb-2 text-2xl font-bold text-text-1">{t('CoupleLink.inviteReady')}</h2>
        <p className="mb-6 text-text-2">
          {t('CoupleLink.shareCode')}
        </p>

        {/* Code Display */}
        <div className="mb-6 space-y-3">
          <button
            type="button"
            aria-label={t('CoupleLink.copyInviteCode')}
            onClick={onCopyCode}
            className="relative min-h-11 rounded-xl border-2 border-accent-1 bg-card/50 p-6 cursor-pointer transition hover:bg-card/80"
          >
            <span className="block font-mono text-4xl font-bold tracking-widest text-accent-1">
              {inviteCode}
            </span>
          </button>
          <button
            onClick={onCopyCode}
            className="min-h-11 w-full flex items-center justify-center gap-2 rounded-lg bg-card hover:bg-card px-4 py-3 text-text-1 transition"
          >
            <Copy className="h-4 w-4" />
            {copied ? t('CoupleLink.copied') : t('CoupleLink.copyCode')}
          </button>
        </div>

        <div className="rounded-lg bg-card/50 border border-success/20 p-4 text-sm text-success">
          <p>{t('CoupleLink.waiting')}</p>
        </div>
      </div>

      <div className="rounded-btn border border-accent-2/20 bg-card/50 p-6">
        <h3 className="font-semibold text-accent-2 mb-3">{t('CoupleLink.sharingTips')}:</h3>
        <ul className="space-y-2 text-sm text-text-2">
          <li>• {t('CoupleLink.tips.0')}</li><li>• {t('CoupleLink.tips.1')}</li><li>• {t('CoupleLink.tips.2')}</li><li>• {t('CoupleLink.tips.3')}</li>
        </ul>
      </div>
    </motion.div>
  )
}

function LinkedState() {
  const { t } = useLanguage()
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-btn border border-success/20 bg-card p-8 text-center"
    >
      <div className="mb-6 flex justify-center">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.6 }}
        >
          <CheckCircle className="h-16 w-16 text-success" />
        </motion.div>
      </div>
      <h2 className="mb-2 text-2xl font-bold text-text-1">{t('CoupleLink.connected')}</h2>
      <p className="mb-6 text-text-2">
        {t('CoupleLink.connectedDescription')}
      </p>
      <div className="flex gap-3 justify-center">
        <a
          href="/chat"
          className="rounded-lg bg-accent-1 px-6 py-2 font-semibold text-white font-semibold shadow-sm hover:shadow-lg hover:shadow-accent-1/20 transition"
        >
          Send Message
        </a>
        <a
          href="/couple-linking"
          className="rounded-lg bg-card px-6 py-2 font-semibold text-text-1 hover:bg-card transition"
        >
          Back
        </a>
      </div>
    </motion.div>
  )
}

function ErrorState({
  error,
  onRetry,
}: {
  readonly error: string
  readonly onRetry: () => void
}) {
  const { t } = useLanguage()
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-btn border border-accent-1/20 bg-card p-8 text-center"
    >
      <div className="mb-6 flex justify-center">
        <AlertCircle className="h-16 w-16 text-accent-1" />
      </div>
      <h2 className="mb-2 text-2xl font-bold text-text-1">{t('CoupleLink.somethingWrong')}</h2>
      <p className="mb-6 text-text-2">{error}</p>
      <button
        onClick={onRetry}
        className="rounded-lg bg-accent-1 px-6 py-2 font-semibold text-white font-semibold shadow-sm hover:shadow-lg hover:shadow-accent-1/20 transition"
      >
        Try Again
      </button>
    </motion.div>
  )
}

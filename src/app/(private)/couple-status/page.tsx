'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Users, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { supabase, getCurrentUserId } from '@/lib/supabase'
import { getPairStatus, type CoupleLinkStatus } from '@/lib/couple-link'

type CoupleInfo = {
  id: string
  inviter_id: string
  accepted_by: string | null
  invite_code: string
  status: CoupleLinkStatus
  created_at: string
  accepted_at: string | null
  inviter_email?: string
  acceptor_email?: string
}

export default function CoupleLinkStatusPage() {
  const [coupleInfo, setCoupleInfo] = useState<CoupleInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    loadCoupleInfo()
  }, [])

  const loadCoupleInfo = async () => {
    try {
      const userId = await getCurrentUserId()
      setCurrentUserId(userId)

      // Get couple link info
      const status = await getPairStatus()
      
      if (!status) {
        setError('No couple link found')
        setLoading(false)
        return
      }

      // Fetch full couple link details
      const { data, error: fetchError } = await supabase
        .from('couple_links')
        .select('*')
        .or(`inviter_id.eq.${userId},accepted_by.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (fetchError) {
        setError('Failed to load couple link details')
        setLoading(false)
        return
      }

      // Fetch profile info for both users
      const { data: inviterData } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', data.inviter_id)
        .single()

      let acceptorData = null
      if (data.accepted_by) {
        const { data: acceptorInfo } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', data.accepted_by)
          .single()
        acceptorData = acceptorInfo
      }

      setCoupleInfo({
        ...data,
        inviter_email: inviterData?.email,
        acceptor_email: acceptorData?.email,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load couple info')
    } finally {
      setLoading(false)
    }
  }

  const isInviter = currentUserId === coupleInfo?.inviter_id

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
            <h1 className="text-3xl md:text-4xl font-bold text-text-1">Link Status</h1>
          </div>
        </motion.div>

        {/* Content */}
        {loading && <LoadingState />}
        {error && !coupleInfo && <ErrorState error={error} onRetry={loadCoupleInfo} />}
        {coupleInfo && (
          <StatusCards
            coupleInfo={coupleInfo}
            isInviter={isInviter}
          />
        )}
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-center py-16"
    >
      <div className="h-8 w-8 rounded-full border-2 border-accent-1 border-t-transparent animate-spin" />
    </motion.div>
  )
}

function ErrorState({
  error,
  onRetry,
}: {
  error: string
  onRetry: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-btn border border-accent-1/20 bg-card p-8 text-center"
    >
      <div className="mb-6 flex justify-center">
        <XCircle className="h-16 w-16 text-accent-1" />
      </div>
      <h2 className="mb-2 text-2xl font-bold text-text-1">Error</h2>
      <p className="mb-6 text-text-2">{error}</p>
      <button
        onClick={onRetry}
        className="rounded-lg bg-accent-1 px-6 py-2 font-semibold text-white hover:shadow-lg hover:shadow-accent-1/20 transition"
      >
        Try Again
      </button>
    </motion.div>
  )
}

function StatusCards({
  coupleInfo,
  isInviter,
}: {
  coupleInfo: CoupleInfo
  isInviter: boolean
}) {
  const statusColors = {
    pending: { bg: 'var(--card-bg)', border: 'rgb(var(--accent-1))', text: 'rgb(var(--accent-2))', icon: Clock },
    accepted: { bg: 'var(--card-bg)', border: 'var(--success)', text: 'var(--success)', icon: CheckCircle2 },
    declined: { bg: 'var(--card-bg)', border: 'var(--error)', text: 'var(--error)', icon: XCircle },
    revoked: { bg: 'var(--card-bg)', border: 'var(--error)', text: 'var(--error)', icon: XCircle },
  }

  const statusConfig = statusColors[coupleInfo.status]
  const StatusIcon = statusConfig.icon

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      {/* Status Overview */}
      <div
        className="rounded-btn border p-8 text-center"
        style={{ backgroundColor: statusConfig.bg, borderColor: statusConfig.border }}
      >
        <div className="mb-4 flex justify-center">
          <StatusIcon className="h-12 w-12" style={{ color: statusConfig.text }} />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-text-1">
          {coupleInfo.status === 'pending' && 'Waiting for Acceptance'}
          {coupleInfo.status === 'accepted' && 'Connected!'}
          {coupleInfo.status === 'declined' && 'Invite Declined'}
          {coupleInfo.status === 'revoked' && 'Link Revoked'}
        </h2>
        <p style={{ color: statusConfig.text }}>
          {coupleInfo.status === 'pending' && 'Your partner hasn\'t accepted yet'}
          {coupleInfo.status === 'accepted' && 'You\'re now linked together'}
          {coupleInfo.status === 'declined' && 'This invite was declined'}
          {coupleInfo.status === 'revoked' && 'This link has been revoked'}
        </p>
      </div>

      {/* Details */}
      <div className="rounded-btn border border-accent-1/20 bg-card/50 p-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-accent-2 mb-1">Invite Code</h3>
          <p className="font-mono text-lg text-accent-1">{coupleInfo.invite_code}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-accent-2 mb-1">Created</h3>
          <p className="text-text-2">
            {new Date(coupleInfo.created_at).toLocaleDateString()} at{' '}
            {new Date(coupleInfo.created_at).toLocaleTimeString()}
          </p>
        </div>

        {coupleInfo.accepted_at && (
          <div>
            <h3 className="text-sm font-semibold text-success mb-1">Accepted</h3>
            <p className="text-text-2">
              {new Date(coupleInfo.accepted_at).toLocaleDateString()} at{' '}
              {new Date(coupleInfo.accepted_at).toLocaleTimeString()}
            </p>
          </div>
        )}
      </div>

      {/* Participants */}
      <div className="rounded-btn border border-success/20 bg-card/50 p-6">
        <h3 className="font-semibold text-success mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Participants
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-card/30 p-3">
            <div>
              <p className="text-sm text-text-2">Inviter</p>
              <p className="text-text-1">{coupleInfo.inviter_email || 'Unknown'}</p>
            </div>
            {isInviter && <span className="text-xs font-semibold text-accent-1">You</span>}
          </div>

          {coupleInfo.accepted_by && coupleInfo.acceptor_email && (
            <div className="flex items-center justify-between rounded-lg bg-card/30 p-3">
              <div>
                <p className="text-sm text-text-2">Acceptor</p>
                <p className="text-text-1">{coupleInfo.acceptor_email}</p>
              </div>
              {!isInviter && <span className="text-xs font-semibold text-success">You</span>}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <a
          href="/couple-linking"
          className="flex-1 rounded-lg bg-accent-1 px-4 py-3 text-center font-semibold text-white hover:shadow-lg hover:shadow-accent-1/20 transition"
        >
          Back to Linking
        </a>
        <a
          href="/chat"
          className="flex-1 rounded-lg bg-card px-4 py-3 text-center font-semibold text-text-1 hover:bg-card transition"
        >
          Send Message
        </a>
      </div>
    </motion.div>
  )
}

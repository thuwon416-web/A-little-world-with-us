'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Copy, CheckCircle, AlertCircle } from 'lucide-react'
import { LoadingState } from '@/components/shared/Loading'
import { createPairInvite, getPairStatus, type CoupleLinkStatus } from '@/lib/couple-link'
import { getCurrentUserId } from '@/lib/supabase'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'

type PageState = 'loading' | 'linked' | 'pending' | 'create' | 'error'

export default function CoupleLinkingPage() {
  const [state, setState] = useState<PageState>('loading')
  const [inviteCode, setInviteCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [lastStatusUpdatedAt, setLastStatusUpdatedAt] = useState<string | null>(null)

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
        setLastStatusUpdatedAt((current) => current ?? new Date().toISOString())
        setState(status.status === 'accepted' ? 'linked' : 'pending')
      } else {
        setState('create')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check link status')
      setState('error')
    }
  }

  const handleCreateInvite = async () => {
    try {
      setIsCreating(true)
      setError('')
      
      // Generate a 6-character alphanumeric code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase()
      
      await createPairInvite(code)
      setInviteCode(code)
      setLastStatusUpdatedAt(new Date().toISOString())
      setState('pending')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create invite'
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
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f13] via-[#1a1a26] to-[#0f0f13] p-4 md:p-6">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="h-8 w-8 text-[#d8b9c8]" />
            <h1 className="text-3xl md:text-4xl font-bold text-white">Couple Link</h1>
          </div>
          <p className="text-[#c9bdcf]">Connect with your partner to share experiences</p>
        </motion.div>

        {/* States */}
        {state === 'loading' && <LoadingStateCard />}
        {state === 'create' && (
          <CreateInviteState
            onCreateInvite={handleCreateInvite}
            isCreating={isCreating}
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
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="py-16"
    >
      <LoadingState label="Checking your link status..." />
    </motion.div>
  )
}

function CreateInviteState({
  onCreateInvite,
  isCreating,
}: {
  onCreateInvite: () => void
  isCreating: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      <div className="rounded-2xl border border-[#d8b9c8]/20 bg-gradient-to-br from-[#1a1a26] to-[#0f0f13] p-8 text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-[#d8b9c8]/10 p-4">
            <Heart className="h-8 w-8 text-[#d8b9c8]" />
          </div>
        </div>
        <h2 className="mb-2 text-2xl font-bold text-white">Ready to connect?</h2>
        <p className="mb-6 text-[#c9bdcf]">
          Create an invite code to share with your partner. They can use it to link their account to yours.
        </p>
        <button
          onClick={onCreateInvite}
          disabled={isCreating}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#d8b9c8] to-[#b7c3f0] px-8 py-3 font-semibold text-[#0f0f13] transition hover:shadow-lg hover:shadow-[#d8b9c8]/20 disabled:opacity-50"
        >
          {isCreating ? (
            <>
              <div className="h-4 w-4 rounded-full border-2 border-[#0f0f13] border-t-transparent animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Heart className="h-5 w-5" />
              Create Invite Code
            </>
          )}
        </button>
      </div>

      <div className="rounded-2xl border border-[#b7c3f0]/20 bg-[#1a1a26]/50 p-6">
        <h3 className="font-semibold text-[#b7c3f0] mb-3">How it works:</h3>
        <ol className="space-y-2 text-sm text-[#c9bdcf]">
          <li>1. Click &quot;Create Invite Code&quot; to generate a unique code</li>
          <li>2. Share the code with your partner</li>
          <li>3. They&apos;ll accept the link from their app</li>
          <li>4. Your accounts will be connected!</li>
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
  inviteCode: string
  onCopyCode: () => void
  copied: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      <div className="rounded-2xl border border-[#d8b9c8]/20 bg-gradient-to-br from-[#1a1a26] to-[#0f0f13] p-8 text-center">
        <div className="mb-6 flex justify-center">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="rounded-full bg-[#d8b9c8]/10 p-4"
          >
            <Heart className="h-8 w-8 text-[#d8b9c8]" />
          </motion.div>
        </div>
        <h2 className="mb-2 text-2xl font-bold text-white">Invite Code Ready!</h2>
        <p className="mb-6 text-[#c9bdcf]">
          Share this code with your partner to complete the connection.
        </p>

        {/* Code Display */}
        <div className="mb-6 space-y-3">
          <div
            onClick={onCopyCode}
            className="relative rounded-xl border-2 border-[#d8b9c8] bg-[#0f0f13]/50 p-6 cursor-pointer transition hover:bg-[#0f0f13]/80"
          >
            <div className="font-mono text-4xl font-bold tracking-widest text-[#d8b9c8]">
              {inviteCode}
            </div>
          </div>
          <button
            onClick={onCopyCode}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#2a2131] hover:bg-[#3a3141] px-4 py-3 text-[#f4edf5] transition"
          >
            <Copy className="h-4 w-4" />
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
        </div>

        <div className="rounded-lg bg-[#1c2a25]/50 border border-[#b0d8c5]/20 p-4 text-sm text-[#b0d8c5]">
          <p>Waiting for your partner to accept...</p>
        </div>
      </div>

      <div className="rounded-2xl border border-[#b7c3f0]/20 bg-[#1a1a26]/50 p-6">
        <h3 className="font-semibold text-[#b7c3f0] mb-3">Sharing tips:</h3>
        <ul className="space-y-2 text-sm text-[#c9bdcf]">
          <li>• Share via message, email, or in person</li>
          <li>• The code is case-insensitive</li>
          <li>• Each code can only be used once</li>
          <li>• You&apos;ll be notified when they accept</li>
        </ul>
      </div>
    </motion.div>
  )
}

function LinkedState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl border border-[#b0d8c5]/20 bg-gradient-to-br from-[#1a1a26] to-[#0f0f13] p-8 text-center"
    >
      <div className="mb-6 flex justify-center">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.6 }}
        >
          <CheckCircle className="h-16 w-16 text-[#b0d8c5]" />
        </motion.div>
      </div>
      <h2 className="mb-2 text-2xl font-bold text-white">Connected!</h2>
      <p className="mb-6 text-[#c9bdcf]">
        You&apos;re now linked with your partner. Start sharing experiences together.
      </p>
      <div className="flex gap-3 justify-center">
        <a
          href="/chat"
          className="rounded-lg bg-[#d8b9c8] px-6 py-2 font-semibold text-[#0f0f13] hover:shadow-lg hover:shadow-[#d8b9c8]/20 transition"
        >
          Send Message
        </a>
        <a
          href="/couple-linking"
          className="rounded-lg bg-[#2a2131] px-6 py-2 font-semibold text-[#f4edf5] hover:bg-[#3a3141] transition"
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
  error: string
  onRetry: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl border border-[#d8b9c8]/20 bg-gradient-to-br from-[#1a1a26] to-[#0f0f13] p-8 text-center"
    >
      <div className="mb-6 flex justify-center">
        <AlertCircle className="h-16 w-16 text-[#d8b9c8]" />
      </div>
      <h2 className="mb-2 text-2xl font-bold text-white">Something went wrong</h2>
      <p className="mb-6 text-[#c9bdcf]">{error}</p>
      <button
        onClick={onRetry}
        className="rounded-lg bg-[#d8b9c8] px-6 py-2 font-semibold text-[#0f0f13] hover:shadow-lg hover:shadow-[#d8b9c8]/20 transition"
      >
        Try Again
      </button>
    </motion.div>
  )
}

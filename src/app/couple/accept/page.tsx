'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Heart, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'
import { acceptPairInvite } from '@/lib/couple-link'

type PageState = 'loading' | 'input' | 'accepting' | 'success' | 'error'

export default function AcceptCoupleLinkPage() {
  const searchParams = useSearchParams()
  const [state, setState] = useState<PageState>('input')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAccept = useCallback(async (codeToAccept?: string) => {
    const finalCode = (codeToAccept || code).trim().toUpperCase()
    
    if (!finalCode) {
      setError('Please enter an invite code')
      return
    }

    try {
      setIsSubmitting(true)
      setError('')
      setState('accepting')
      
      await acceptPairInvite(finalCode)
      setState('success')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to accept invite'
      setError(message)
      setState('error')
    } finally {
      setIsSubmitting(false)
    }
  }, [code])

  useEffect(() => {
    // If code is provided in URL, auto-fill and attempt to accept
    const urlCode = searchParams.get('code')
    if (urlCode) {
      setCode(urlCode.toUpperCase())
      handleAccept(urlCode)
    }
  }, [searchParams, handleAccept])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await handleAccept()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--bg-color)] via-[var(--card-bg)] to-[var(--bg-color)] p-4 md:p-6">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="h-8 w-8 text-accent-1" />
            <h1 className="text-3xl md:text-4xl font-bold text-text-1">Accept Invite</h1>
          </div>
          <p className="text-text-2">Connect with your partner</p>
        </motion.div>

        {/* States */}
        {state === 'input' && (
          <InputState
            code={code}
            onCodeChange={setCode}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}
        {state === 'accepting' && <AcceptingState />}
        {state === 'success' && <SuccessState />}
        {state === 'error' && (
          <ErrorState
            error={error}
            onRetry={() => setState('input')}
          />
        )}
      </div>
    </div>
  )
}

function InputState({
  code,
  onCodeChange,
  onSubmit,
  isSubmitting,
}: {
  code: string
  onCodeChange: (code: string) => void
  onSubmit: (e: React.FormEvent) => void
  isSubmitting: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      <div className="rounded-btn border border-accent-1/20 bg-gradient-to-br from-[var(--card-bg)] to-[var(--bg-color)] p-8">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-accent-1/10 p-4">
            <Heart className="h-8 w-8 text-accent-1" />
          </div>
        </div>
        
        <p className="mb-8 text-center text-text-2">
          Enter the invite code your partner shared with you
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="text"
            value={code}
            onChange={(e) => onCodeChange(e.target.value.toUpperCase())}
            placeholder="Enter 6-character code"
            maxLength={6}
            className="w-full rounded-lg border border-accent-1/20 bg-card px-4 py-3 text-center font-mono text-2xl font-bold tracking-widest text-accent-1 placeholder-text-text-2 transition focus:border-accent-1 focus:outline-none focus:ring-1 focus:ring-accent-1/30"
          />
          
          <button
            type="submit"
            disabled={isSubmitting || code.length !== 6}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[var(--accent-1)] to-[var(--accent-2)] px-8 py-3 font-semibold text-white transition hover:shadow-lg hover:shadow-accent-1/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <span>Accept Invite</span>
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>
      </div>

      <div className="rounded-btn border border-accent-2/20 bg-card/50 p-6">
        <h3 className="font-semibold text-accent-2 mb-3">Need help?</h3>
        <ul className="space-y-2 text-sm text-text-2">
          <li>• Check that the code is exactly 6 characters</li>
          <li>• Make sure you&apos;re using the latest code</li>
          <li>• Ask your partner to resend if needed</li>
        </ul>
      </div>
    </motion.div>
  )
}

function AcceptingState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-16 space-y-4"
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Heart className="h-16 w-16 text-accent-1" />
      </motion.div>
      <p className="text-center text-text-2">Connecting your hearts...</p>
    </motion.div>
  )
}

function SuccessState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-btn border border-success/20 bg-gradient-to-br from-[var(--card-bg)] to-[var(--bg-color)] p-8 text-center"
    >
      <div className="mb-6 flex justify-center">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.6 }}
        >
          <CheckCircle className="h-16 w-16 text-success" />
        </motion.div>
      </div>
      <h2 className="mb-2 text-2xl font-bold text-text-1">Connected!</h2>
      <p className="mb-6 text-text-2">
        You&apos;re now linked with your partner. Welcome to A Little World With Us!
      </p>
      <button
        onClick={() => window.location.href = '/couple-linking'}
        className="rounded-lg bg-accent-1 px-8 py-3 font-semibold text-white hover:shadow-lg hover:shadow-accent-1/20 transition"
      >
        Go to Your Dashboard
      </button>
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
      className="rounded-btn border border-accent-1/20 bg-gradient-to-br from-[var(--card-bg)] to-[var(--bg-color)] p-8 text-center"
    >
      <div className="mb-6 flex justify-center">
        <AlertCircle className="h-16 w-16 text-accent-1" />
      </div>
      <h2 className="mb-2 text-2xl font-bold text-text-1">Invalid Code</h2>
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

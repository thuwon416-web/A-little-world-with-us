'use client'

import { useState, useEffect } from 'react'
import { Heart, UserPlus, Check, X, LogOut, Calendar, AlertCircle } from 'lucide-react'
import {
  getCoupleStatus,
  createCoupleAndInvite,
  acceptCoupleInvite,
  declineCoupleInvite,
  leaveCouple,
  updateCouple,
  type CoupleStatusResult,
} from '@/lib/couples'

export default function CoupleSettings() {
  const [status, setStatus] = useState<CoupleStatusResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Invite form state
  const [email, setEmail] = useState('')
  const [coupleName, setCoupleName] = useState('')
  const [inviting, setInviting] = useState(false)

  // Edit couple state
  const [editingName, setEditingName] = useState('')
  const [editingAnniversary, setEditingAnniversary] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = async () => {
    try {
      setLoading(true)
      const result = await getCoupleStatus()
      setStatus(result)
      if (result.couple) {
        setEditingName(result.couple.name || '')
        setEditingAnniversary(result.couple.anniversary || '')
      }
    } catch (err) {
      setError('Failed to load couple status')
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    try {
      setInviting(true)
      setError(null)
      await createCoupleAndInvite(email.trim(), coupleName.trim() || undefined)
      setSuccess('Invite sent successfully!')
      setEmail('')
      setCoupleName('')
      await loadStatus()
    } catch (err: any) {
      setError(err.message || 'Failed to send invite')
    } finally {
      setInviting(false)
    }
  }

  const handleAccept = async () => {
    if (!status?.invite) return

    try {
      setError(null)
      await acceptCoupleInvite(status.invite.id)
      setSuccess('You are now coupled!')
      await loadStatus()
    } catch (err: any) {
      setError(err.message || 'Failed to accept invite')
    }
  }

  const handleDecline = async () => {
    if (!status?.invite) return

    try {
      setError(null)
      await declineCoupleInvite(status.invite.id)
      setSuccess('Invite declined')
      await loadStatus()
    } catch (err: any) {
      setError(err.message || 'Failed to decline invite')
    }
  }

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this couple? This cannot be undone.')) {
      return
    }

    try {
      setError(null)
      await leaveCouple()
      setSuccess('You have left the couple')
      await loadStatus()
    } catch (err: any) {
      setError(err.message || 'Failed to leave couple')
    }
  }

  const handleUpdateCouple = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!status?.couple) return

    try {
      setSaving(true)
      setError(null)
      await updateCouple(status.couple.id, {
        name: editingName.trim() || undefined,
        anniversary: editingAnniversary || undefined,
      })
      setSuccess('Couple updated successfully!')
      await loadStatus()
    } catch (err: any) {
      setError(err.message || 'Failed to update couple')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="glass-card p-5">
        <div className="animate-pulse">
          <div className="h-5 w-1/3 rounded bg-[var(--accent-1)]/10" />
          <div className="mt-4 h-20 rounded bg-[var(--accent-1)]/10" />
        </div>
      </div>
    )
  }

  if (!status) {
    return null
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Heart className="h-5 w-5 text-[var(--accent-1)]" />
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Couple Settings</h3>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-500/10 p-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-xl bg-green-500/10 p-3 text-sm text-green-400">
          {success}
        </div>
      )}

      {/* No Couple */}
      {status.status === 'none' && (
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            You&apos;re not currently coupled with anyone. Invite your partner to start sharing your journey together.
          </p>
          <form onSubmit={handleInvite} className="space-y-3">
            <div>
              <label className="text-sm text-[var(--text-secondary)]">Partner&apos;s email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="partner@example.com"
                className="mt-1 w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-3 py-2 text-sm text-[var(--text-primary)]"
                required
              />
            </div>
            <div>
              <label className="text-sm text-[var(--text-secondary)]">Couple name (optional)</label>
              <input
                type="text"
                value={coupleName}
                onChange={(e) => setCoupleName(e.target.value)}
                placeholder="Our Little World"
                className="mt-1 w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-3 py-2 text-sm text-[var(--text-primary)]"
              />
            </div>
            <button
              type="submit"
              disabled={inviting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--button-bg)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] disabled:opacity-50"
            >
              <UserPlus className="h-4 w-4" />
              {inviting ? 'Sending invite...' : 'Send Invite'}
            </button>
          </form>
        </div>
      )}

      {/* Pending Invite */}
      {status.status === 'pending' && status.invite && (
        <div className="space-y-4">
          {status.partner ? (
            <div className="rounded-xl bg-[var(--bg-2)] p-4">
              <p className="text-sm text-[var(--text-secondary)] mb-2">
                <span className="font-medium text-[var(--text-primary)]">{status.partner.full_name || status.partner.email}</span> has invited you to be their partner.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleAccept}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-500/20 px-3 py-2 text-sm font-medium text-green-400 hover:bg-green-500/30"
                >
                  <Check className="h-4 w-4" />
                  Accept
                </button>
                <button
                  onClick={handleDecline}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500/20 px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/30"
                >
                  <X className="h-4 w-4" />
                  Decline
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">
              You have sent an invite. Waiting for your partner to accept...
            </p>
          )}
        </div>
      )}

      {/* Accepted Couple */}
      {status.status === 'accepted' && status.couple && (
        <div className="space-y-4">
          <div className="rounded-xl bg-[var(--bg-2)] p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {status.couple.name || 'My Couple'}
                </p>
                {status.partner && (
                  <p className="text-xs text-[var(--text-secondary)]">
                    Partner: {status.partner.full_name || status.partner.email}
                  </p>
                )}
              </div>
              <button
                onClick={handleLeave}
                className="flex items-center gap-1 rounded-lg bg-red-500/10 px-2 py-1 text-xs text-red-400 hover:bg-red-500/20"
              >
                <LogOut className="h-3 w-3" />
                Leave
              </button>
            </div>

            <form onSubmit={handleUpdateCouple} className="space-y-3">
              <div>
                <label className="text-xs text-[var(--text-secondary)]">Couple name</label>
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-2 py-1.5 text-sm text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--text-secondary)]">Anniversary</label>
                <input
                  type="date"
                  value={editingAnniversary}
                  onChange={(e) => setEditingAnniversary(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-2 py-1.5 text-sm text-[var(--text-primary)]"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-[var(--button-bg)] px-2 py-1.5 text-xs font-medium text-[var(--text-primary)] disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Update'}
              </button>
            </form>
          </div>

          {status.couple.anniversary && (
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <Calendar className="h-4 w-4" />
              <span>Anniversary: {new Date(status.couple.anniversary).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

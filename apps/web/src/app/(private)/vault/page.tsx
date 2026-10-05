'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useEffect, useId, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Fingerprint, KeyRound, Lock, Eye, Plus, X, Save, Sparkles } from 'lucide-react'
import VaultCard from '@/features/vault/VaultCard'
import VaultTabs, { type VaultTab } from '@/features/vault/VaultTabs'
import PasswordList from '@/features/vault/PasswordList'
import VaultSetupModal from '@/features/vault/VaultSetupModal'
import { VaultKeyProvider, useVaultKey } from '@/contexts/VaultKeyContext'
import { loadWrappedKey } from '@/lib/vault-storage'
import { getCoupleStatus } from '@/lib/couples'
import { getCurrentUserId, insertRow, type VaultItem } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

const VAULT_CATEGORIES = ['all', 'private', 'celebration', 'ritual', 'travel'] as const
type VaultCategory = (typeof VAULT_CATEGORIES)[number]
type LetterCategory = Exclude<VaultCategory, 'all'>

function isLetterCategory(value: string): value is LetterCategory {
  return value === 'private' || value === 'celebration' || value === 'ritual' || value === 'travel'
}

function isVaultItem(value: unknown): value is VaultItem {
  if (typeof value !== 'object' || value === null) return false
  return (
    'id' in value &&
    typeof value.id === 'string' &&
    'couple_id' in value &&
    typeof value.couple_id === 'string' &&
    'user_id' in value &&
    typeof value.user_id === 'string' &&
    'created_at' in value &&
    typeof value.created_at === 'string' &&
    'updated_at' in value &&
    typeof value.updated_at === 'string' &&
    'title' in value &&
    typeof value.title === 'string' &&
    'content' in value &&
    (typeof value.content === 'string' || value.content === null) &&
    'photo_url' in value &&
    (typeof value.photo_url === 'string' || value.photo_url === null) &&
    'category' in value &&
    (typeof value.category === 'string' || value.category === null) &&
    'is_locked' in value &&
    typeof value.is_locked === 'boolean' &&
    'reveal_at' in value &&
    (typeof value.reveal_at === 'string' || value.reveal_at === null)
  )
}

function VaultLockScreen({
  pin,
  isPinValid,
  unlockError,
  prefersReduced,
  onPinChange,
  onUnlock,
}: {
  pin: string
  isPinValid: boolean
  unlockError: string
  prefersReduced: boolean
  onPinChange: (value: string) => void
  onUnlock: () => void
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full rounded-[32px] border border-accent-1/20 bg-card p-7 text-center shadow-xl backdrop-blur-xl"
      >
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-accent-1 text-text-1 shadow-lg">
          <motion.div
            animate={prefersReduced ? {} : { rotate: [0, 10, -10, 0] }}
            transition={prefersReduced ? {} : { repeat: Infinity, duration: 3 }}
          >
            <Lock className="h-9 w-9" />
          </motion.div>
        </div>

        <p className="text-[10px] uppercase tracking-[0.22em] text-text-2">
          Private keepsake
        </p>
        <h1
          className="mt-2 text-4xl text-text-1"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Love Vault
        </h1>
        <p className="mt-2 text-sm text-text-2">
          Your private letters and memories, sealed until the right moment.
        </p>
        <input
          value={pin}
          onChange={(event) => onPinChange(event.target.value)}
          inputMode="numeric"
          maxLength={6}
          type="password"
          placeholder="Enter your 4-digit PIN"
          className="mt-5 w-full rounded-btn border border-accent-1/20 bg-transparent px-4 py-3 text-center text-text-1"
        />
        <p className="mt-2 text-xs text-text-2">PIN must be 4-6 digits</p>
        {unlockError ? <p className="mt-2 text-sm text-error">{unlockError}</p> : null}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onUnlock}
          disabled={!isPinValid}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-btn border border-accent-1/20 bg-accent-1 px-4 py-3 text-sm font-medium text-text-1"
        >
          <Eye className="h-4 w-4" />
          Unlock Vault
        </motion.button>
      </motion.div>
    </div>
  )
}

function VaultLetterStats({
  letters,
  stats,
  showForm,
  onToggleForm,
}: {
  letters: VaultItem[]
  stats: { total: number; sealed: number; newest: string }
  showForm: boolean
  onToggleForm: () => void
}) {
  return (
    <div className="mb-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-panel p-6 border border-accent-1/20 bg-card backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-btn bg-gradient-to-br from-accent-2 to-accent-1 text-white">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-text-2">
              Private keepsake
            </div>
            <div
              className="text-xl font-semibold text-text-1"
              style={{ fontFamily: "'Playfair Display',serif'" }}
            >
              Some words are worth the wait.
            </div>
            <p className="text-sm text-text-2 mt-1">
              Every letter opens only on its promised day — the future you writes to the future
              us.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onToggleForm}
            className="inline-flex items-center gap-2 rounded-btn px-4 py-2.5 text-sm font-medium bg-soft-tint hover:bg-soft-tint backdrop-blur border border-accent-1/20"
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? 'Cancel' : 'Write a letter'}
          </button>
          <div className="inline-flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-widest text-text-2 rounded-btn bg-soft-tint border border-accent-1/20">
            <Sparkles className="h-3.5 w-3.5" />
            {letters.length === 0 ? 'Fresh start' : 'Keepsakes saved'}
          </div>
        </div>
      </div>

      <div className="rounded-panel p-5 border border-accent-1/20 bg-card backdrop-blur">
        <div className="text-[10px] uppercase tracking-[0.22em] text-text-2">
          Archive
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-btn p-3 bg-soft-tint border border-accent-1/15 text-center">
            <p className="text-[10px] uppercase tracking-[0.18em] text-text-2">Letters</p>
            <p className="mt-2 text-2xl text-text-1" style={{ fontFamily: "'Playfair Display',serif'" }}>
              {stats.total}
            </p>
          </div>
          <div className="rounded-btn p-3 bg-soft-tint border border-accent-1/15 text-center">
            <p className="text-[10px] uppercase tracking-[0.18em] text-text-2">Sealed</p>
            <p className="mt-2 text-2xl text-text-1" style={{ fontFamily: "'Playfair Display',serif'" }}>
              {stats.sealed}
            </p>
          </div>
          <div className="rounded-btn p-3 bg-soft-tint border border-accent-1/15 text-center">
            <p className="text-[10px] uppercase tracking-[0.18em] text-text-2">Latest</p>
            <p className="mt-2 text-base text-text-1" style={{ fontFamily: "'Playfair Display',serif'" }}>
              {stats.newest}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function NewVaultLetterForm({
  fieldId,
  title,
  content,
  category,
  revealDate,
  onTitleChange,
  onContentChange,
  onCategoryChange,
  onRevealDateChange,
  onCreate,
}: {
  fieldId: string
  title: string
  content: string
  category: VaultCategory
  revealDate: string
  onTitleChange: (value: string) => void
  onContentChange: (value: string) => void
  onCategoryChange: (value: LetterCategory) => void
  onRevealDateChange: (value: string) => void
  onCreate: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0, y: -10 }}
      animate={{ opacity: 1, height: 'auto', y: 0 }}
      exit={{ opacity: 0, height: 0, y: -10 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="mb-6 overflow-hidden"
    >
      <div className="rounded-[32px] border border-accent-1/20 bg-card p-5 shadow-xl backdrop-blur-xl">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label htmlFor={`${fieldId}-title`} className="text-sm text-text-2">Title</label>
              <input
                id={`${fieldId}-title`}
                type="text"
                value={title}
                onChange={(event) => onTitleChange(event.target.value)}
                placeholder="A note for her heart"
                className="mt-2 w-full rounded-btn border border-accent-1/20 bg-soft-tint px-4 py-3 text-base text-text-1 outline-none placeholder:text-text-2/80"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor={`${fieldId}-message`} className="text-sm text-text-2">Message</label>
              <textarea
                id={`${fieldId}-message`}
                value={content}
                onChange={(event) => onContentChange(event.target.value)}
                placeholder="Write your heart out..."
                rows={6}
                className="mt-2 w-full resize-none rounded-btn border border-accent-1/20 bg-soft-tint px-4 py-3 text-base text-text-1 outline-none placeholder:text-text-2/80"
              />
            </div>
            <div>
              <label htmlFor={`${fieldId}-category`} className="text-sm text-text-2">Category</label>
              <select
                id={`${fieldId}-category`}
                value={category === 'all' ? 'private' : category}
                onChange={(event) => {
                  if (isLetterCategory(event.target.value)) onCategoryChange(event.target.value)
                }}
                className="mt-2 w-full rounded-btn border border-accent-1/20 bg-soft-tint px-4 py-3 text-sm text-text-1 outline-none"
              >
                <option value="private">Private</option>
                <option value="celebration">Celebration</option>
                <option value="ritual">Ritual</option>
                <option value="travel">Travel</option>
              </select>
            </div>
            <div>
              <label htmlFor={`${fieldId}-reveal-date`} className="text-sm text-text-2">Reveal date</label>
              <input
                id={`${fieldId}-reveal-date`}
                type="date"
                value={revealDate}
                onChange={(event) => onRevealDateChange(event.target.value)}
                className="mt-2 w-full rounded-btn border border-accent-1/20 bg-soft-tint px-4 py-3 text-sm text-text-1 outline-none"
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={onCreate}
              disabled={!title.trim() || !content.trim()}
              className="inline-flex items-center gap-2 rounded-btn border border-accent-1/20 bg-accent-1 px-4 py-2.5 text-sm font-medium text-text-1 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              Seal &amp; Save
            </button>
          </div>
      </div>
    </motion.div>
  )
}

export default function VaultPage() {
  return (
    <VaultKeyProvider>
      <Suspense fallback={<VaultPageSkeleton />}>
        <VaultPageContent />
      </Suspense>
    </VaultKeyProvider>
  )
}

function VaultPageContent() {
  const fieldId = useId()
  const { masterKey, isUnlocked: isPasswordVaultUnlocked, unlockWithPassphrase, unlockWithBackupPhrase, unlockWithBiometric } = useVaultKey()
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [letters, setLetters] = useState<VaultItem[]>([])
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [vaultCategory, setVaultCategory] = useState<VaultCategory>('all')
  const [revealDate, setRevealDate] = useState('')
  const [pin, setPin] = useState('')
  const [unlockError, setUnlockError] = useState('')
  const [lettersError, setLettersError] = useState<string | null>(null)
  const [tab, setTab] = useState<VaultTab>('letters')
  const [hasWrappedKey, setHasWrappedKey] = useState<boolean | null>(null)
  const [passphrase, setPassphrase] = useState('')
  const [passwordVaultError, setPasswordVaultError] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)
  const [showRecovery, setShowRecovery] = useState(false)
  const [recoveryPhrase, setRecoveryPhrase] = useState('')
  const prefersReduced = usePrefersReducedMotion()
  const [showVaultSetup, setShowVaultSetup] = useState(false)
  const isPinValid = /^\d{4,6}$/.test(pin)

  const filteredLetters = useMemo(() => {
    if (vaultCategory === 'all') return letters
    return letters.filter((letter) => (letter.category ?? 'private') === vaultCategory)
  }, [letters, vaultCategory])

  const stats = useMemo(
    () => ({
      total: letters.length,
      sealed: letters.filter((letter) => letter.is_locked || (letter.reveal_at && new Date(letter.reveal_at) > new Date())).length,
      newest: letters[0]?.title ?? 'No letters yet',
    }),
    [letters]
  )

  useEffect(() => {
    let active = true
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!active) return
        if (!user) {
          window.location.href = '/login'
          return
        }
        const [currentUserId, coupleStatus] = await Promise.all([getCurrentUserId(), getCoupleStatus()])
        if (!active) return
        setUserId(currentUserId)
        setCoupleId(coupleStatus.status === 'accepted' ? coupleStatus.couple?.id ?? null : null)
        setIsAuthenticated(true)
      } catch (error_) {
        if (active) {
          setAuthError(error_ instanceof Error ? error_.message : 'Unable to check authentication.')
        }
      }
    }

    void checkAuth()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    void loadWrappedKey()
      .then((stored) => {
        if (active) setHasWrappedKey(Boolean(stored))
      })
      .catch((error_: unknown) => {
        if (active) {
          setPasswordVaultError(error_ instanceof Error ? error_.message : 'Unable to load the vault key.')
        }
      })
    return () => {
      active = false
    }
  }, [isPasswordVaultUnlocked])

  const fetchLetters = async () => {
    if (!coupleId) {
      setLettersError(null)
      setLetters([])
      return
    }

    const { data, error } = await supabase
      .from('vault_items')
      .select('*')
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[vault] letters load failed:', error)
      setLettersError(error.message)
      setLetters([])
      return
    }

    setLettersError(null)
    setLetters((data ?? []).filter(isVaultItem))
  }

  const handleUnlock = async () => {
    if (!isPinValid) {
      setUnlockError('PIN must be 4-6 digits')
      return
    }
    setUnlockError('')
    const response = await fetch('/api/auth/pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify', pin }),
    })
    const result = await response.json()
    if (!response.ok || !result.valid) {
      setUnlockError(result.error ?? 'Invalid PIN')
      return
    }
    setIsUnlocked(true)
    void fetchLetters()
  }

  useEffect(() => {
    if (!isUnlocked) return
    const timeout = window.setTimeout(() => {
      setIsUnlocked(false)
    }, 5 * 60 * 1000)
    return () => window.clearTimeout(timeout)
  }, [isUnlocked])

  const handleCreate = async () => {
    if (!newTitle.trim() || !newContent.trim()) return
    if (!coupleId || !userId) return

    const nextLetter = {
      couple_id: coupleId,
      user_id: userId,
      title: newTitle.trim(),
      content: newContent.trim(),
      photo_url: null,
      is_locked: Boolean(revealDate),
      category: vaultCategory === 'all' ? 'private' : vaultCategory,
      reveal_at: revealDate ? new Date(revealDate).toISOString() : null,
    }

    const created = await insertRow<VaultItem>('vault_items', nextLetter)

    if (created) {
      setLetters((prev) => [created, ...prev])
      setNewTitle('')
      setNewContent('')
      setRevealDate('')
      setShowForm(false)
      return
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-4 py-10">
        <div className="text-center">
          <p className={authError ? 'text-sm text-error' : 'text-sm text-text-2'}>
            {authError ?? 'Checking authentication...'}
          </p>
        </div>
      </div>
    )
  }

  if (!isUnlocked) {
    return (
      <VaultLockScreen
        pin={pin}
        isPinValid={isPinValid}
        unlockError={unlockError}
        prefersReduced={prefersReduced}
        onPinChange={setPin}
        onUnlock={handleUnlock}
      />
    )
  }

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      {/* Breadcrumb + header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-text-2 mb-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 hover:text-text-1"
          >
            <Lock className="h-3.5 w-3.5" /> Home
          </Link>
          <span className="text-text-2">/</span>
          <span className="text-text-1">Vault</span>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1
              className="text-3xl font-bold text-text-1 mb-1"
              style={{ fontFamily: "'Playfair Display',serif'" }}
            >
              Love Vault
            </h1>
            <p className="text-text-2 text-sm">
              Letters, promises, and little surprises — locked until the moment they matter most.
            </p>
          </div>

          <button
            onClick={() => setShowForm((v) => !v)}
            className="px-4 py-2 rounded-full text-sm font-medium text-text-1 shadow-md hover:opacity-90 transition-opacity flex items-center gap-2 shrink-0 bg-gradient-to-r from-accent-2 to-accent-1"
          >
            <Lock className="h-4 w-4" />
            {showForm ? 'Cancel' : 'Seal a new letter'}
          </button>
        </div>
      </div>

      <VaultTabs tab={tab} onChange={setTab} />

      {tab === 'letters' ? (
        <>
      <VaultLetterStats
        letters={letters}
        stats={stats}
        showForm={showForm}
        onToggleForm={() => setShowForm((value) => !value)}
      />

      <AnimatePresence>
        {showForm ? (
          <NewVaultLetterForm
            fieldId={fieldId}
            title={newTitle}
            content={newContent}
            category={vaultCategory}
            revealDate={revealDate}
            onTitleChange={setNewTitle}
            onContentChange={setNewContent}
            onCategoryChange={setVaultCategory}
            onRevealDateChange={setRevealDate}
            onCreate={handleCreate}
          />
        ) : null}
      </AnimatePresence>

      <div className="mb-6 flex flex-wrap gap-2">
       {VAULT_CATEGORIES.map((option) => (
         <button
           key={option}
           type="button"
           onClick={() => setVaultCategory(option)}
           className={`rounded-full px-3 py-1.5 text-xs capitalize ${
             vaultCategory === option
               ? 'bg-accent-1 text-text-1'
               : 'bg-soft-tint text-text-2'
           }`}
         >
           {option}
         </button>
       ))}
      </div>

      {lettersError ? (
        <div className="rounded-[32px] border border-error/30 bg-error/10 p-10 text-center shadow-lg backdrop-blur-xl" role="alert">
          <h2 className="text-2xl text-text-1">Unable to load vault letters</h2>
          <p className="mt-2 text-sm text-error">{lettersError}</p>
          <button
            type="button"
            onClick={() => void fetchLetters()}
            className="mt-5 rounded-xl bg-accent-1 px-4 py-2 font-semibold text-white"
          >
            Retry
          </button>
        </div>
      ) : filteredLetters.length === 0 ? (
       <div className="rounded-[32px] border border-dashed border-accent-1/35 bg-card/65 p-10 text-center shadow-lg backdrop-blur-xl">
         <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent-1 text-text-1">
           <Lock className="h-4 w-4" />
         </div>
         <h2
           className="text-3xl text-text-1"
           style={{ fontFamily: 'var(--font-display)' }}
         >
           Your first letter is waiting
         </h2>
         <p className="mt-2 text-sm text-text-2">
           Write a note for the version of your relationship that keeps getting sweeter.
         </p>
       </div>
      ) : (
       <div className="space-y-4">
         {filteredLetters.map((letter) => (
           <VaultCard key={letter.id} letter={letter} />
         ))}
       </div>
      )}
        </>
      ) : (
        <section>
          <div className="mb-5 flex items-center justify-between rounded-panel border border-accent-1/20 bg-card p-5 backdrop-blur-xl">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-text-2">Password security</p>
              <p className="mt-1 text-sm text-text-1">{isPasswordVaultUnlocked ? 'Unlocked · auto-locks after five minutes of inactivity' : 'Encrypted credentials stay locked separately from Love Vault letters.'}</p>
            </div>
            {isPasswordVaultUnlocked ? <Fingerprint className="h-5 w-5 text-success" /> : <KeyRound className="h-5 w-5 text-accent-1" />}
          </div>
          {!hasWrappedKey ? (
            <div className="rounded-modal border border-dashed border-accent-1/30 bg-card p-10 text-center">
              <KeyRound className="mx-auto h-8 w-8 text-accent-1" />
              <h2 className="mt-3 text-2xl text-text-1" style={{ fontFamily: 'var(--font-display)' }}>Set up your password vault</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-text-2">Create a passphrase before adding encrypted credentials. Your passphrase never leaves this device.</p>
              <button type="button" onClick={() => setShowVaultSetup(true)} className="mt-5 rounded-btn bg-accent-1 px-4 py-2.5 text-sm text-text-1">Set up Vault Passphrase</button>
            </div>
          ) : !isPasswordVaultUnlocked ? (
            <div className="mx-auto max-w-md rounded-modal border border-accent-1/20 bg-card p-6">
              <h2 className="text-2xl text-text-1" style={{ fontFamily: 'var(--font-display)' }}>Unlock passwords</h2>
              <input type="password" value={passphrase} onChange={(event) => setPassphrase(event.target.value)} placeholder="Vault passphrase" className="mt-4 w-full rounded-btn border border-accent-1/20 bg-soft-tint px-4 py-3 text-sm text-text-1" />
              {passwordVaultError ? <p className="mt-2 text-sm text-error">{passwordVaultError}</p> : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => void unlockWithPassphrase(passphrase).catch((cause) => setPasswordVaultError(cause instanceof Error ? cause.message : 'Unable to unlock passwords.'))} disabled={passphrase.length < 8} className="rounded-btn bg-accent-1 px-4 py-2 text-sm text-text-1 disabled:opacity-50">Unlock</button>
                <button type="button" onClick={() => void unlockWithBiometric().catch((cause) => setPasswordVaultError(cause instanceof Error ? cause.message : 'Biometric unlock is unavailable.'))} className="inline-flex items-center gap-2 rounded-btn border border-accent-1/20 px-4 py-2 text-sm text-text-1"><Fingerprint className="h-4 w-4" />Biometric</button>
                <button type="button" onClick={() => { setShowRecovery((value) => !value); setPasswordVaultError('') }} className="rounded-btn border border-accent-1/20 px-4 py-2 text-sm text-text-1">Use recovery phrase</button>
                {showRecovery ? (
                  <div className="mt-3 space-y-2">
                    <label htmlFor="vault-recovery-phrase" className="text-xs text-text-2">Enter all 12 recovery words in order</label>
                    <textarea id="vault-recovery-phrase" value={recoveryPhrase} onChange={(event) => setRecoveryPhrase(event.target.value)} rows={3} className="w-full rounded-btn border border-accent-1/20 bg-soft-tint px-3 py-2 text-sm text-text-1" placeholder="word1 word2 word3 ..." />
                    <button
                      type="button"
                      onClick={() => void unlockWithBackupPhrase(recoveryPhrase.trim().split(/\\s+/)).catch((cause) => setPasswordVaultError(cause instanceof Error ? cause.message : 'Unable to recover the vault.'))}
                      disabled={recoveryPhrase.trim().split(/\\s+/).length !== 12}
                      className="rounded-btn bg-accent-1 px-4 py-2 text-sm text-text-1 disabled:opacity-50"
                    >
                      Recover vault
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <PasswordList masterKey={masterKey!} />
          )}
          {showVaultSetup ? <VaultSetupModal onClose={() => { setShowVaultSetup(false); void loadWrappedKey().then((stored) => setHasWrappedKey(Boolean(stored))) }} /> : null}
        </section>
      )}
    </div>
  )
}

function VaultPageSkeleton() {
  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-8">
      <div className="mb-6 h-6 w-32 animate-pulse rounded-full bg-card" />
      <div className="mb-6 h-16 animate-pulse rounded-panel bg-card" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-52 animate-pulse rounded-panel bg-card" />
        <div className="h-52 animate-pulse rounded-panel bg-card" />
      </div>
    </div>
  )
}

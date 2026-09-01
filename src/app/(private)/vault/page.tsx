'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Eye, Plus, X, Save, Heart, Sparkles } from 'lucide-react'
import VaultCard from '@/features/vault/VaultCard'
import { setVaultUnlocked } from '@/lib/auth'
import { insertRow, readRows, type SecretLetter } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'

type VaultCategory = 'all' | 'private' | 'celebration' | 'ritual' | 'travel'

const fallbackLetters: SecretLetter[] = [
  {
    id: 1,
    created_at: new Date().toISOString(),
    title: 'A little promise',
    content: 'May we always choose softness, laughter, and each other.',
    is_locked: false,
    category: 'private',
    reveal_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
  },
  {
    id: 2,
    created_at: new Date().toISOString(),
    title: 'For our anniversary',
    content: 'Here is to all the lovely chapters yet to be written.',
    is_locked: false,
    category: 'celebration',
    reveal_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
  },
]

export default function VaultPage() {
  return (
    <Suspense fallback={<VaultPageSkeleton />}>
      <VaultPageContent />
    </Suspense>
  )
}

function VaultPageContent() {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [letters, setLetters] = useState<SecretLetter[]>(fallbackLetters)
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [vaultCategory, setVaultCategory] = useState<VaultCategory>('all')
  const [revealDate, setRevealDate] = useState('')

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
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = '/login'
        return
      }
      setIsAuthenticated(true)

      const vaultUnlocked =
        typeof window !== 'undefined' && localStorage.getItem('a-little-world-with-us-vault') === 'true'
      if (vaultUnlocked) {
        setIsUnlocked(true)
        fetchLetters()
      }
    }

    checkAuth()
  }, [])

  const fetchLetters = async () => {
    const data = await readRows<SecretLetter>('secret_letters', '*', {
      column: 'created_at',
      ascending: false,
    })
    setLetters(data)
  }

  const handleUnlock = () => {
    setVaultUnlocked(true)
    setIsUnlocked(true)
    fetchLetters()
  }

  const handleCreate = async () => {
    if (!newTitle.trim() || !newContent.trim()) return

    const nextLetter = {
      title: newTitle.trim(),
      content: newContent.trim(),
      is_locked: Boolean(revealDate),
      category: vaultCategory === 'all' ? 'private' : vaultCategory,
      reveal_at: revealDate ? new Date(revealDate).toISOString() : null,
    }

    const created = await insertRow<SecretLetter>('secret_letters', nextLetter)

    if (created) {
      setLetters((prev) => [created, ...prev])
      setNewTitle('')
      setNewContent('')
      setRevealDate('')
      setShowForm(false)
      return
    }

    setLetters((prev) => [
      {
        id: Date.now(),
        created_at: new Date().toISOString(),
        ...nextLetter,
      },
      ...prev,
    ])
    setNewTitle('')
    setNewContent('')
    setRevealDate('')
    setShowForm(false)
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-4 py-10">
        <div className="text-center">
          <p className="text-sm text-[var(--text-secondary)]">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (!isUnlocked) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="w-full rounded-[32px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-7 text-center shadow-xl backdrop-blur-xl"
        >
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--button-bg)] text-[var(--text-primary)] shadow-lg">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
            >
              <Lock className="h-9 w-9" />
            </motion.div>
          </div>

          <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-secondary)]">
            Private keepsake
          </p>
          <h1
            className="mt-2 text-4xl text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Love Vault
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Your private letters and memories, sealed until the right moment.
          </p>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleUnlock}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--button-bg)] px-4 py-3 text-sm font-medium text-[var(--text-primary)]"
          >
            <Eye className="h-4 w-4" />
            Unlock Vault
          </motion.button>

        </motion.div>
      </div>
    )
  }

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      {/* Breadcrumb + header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mb-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 hover:text-[var(--text-primary)]"
          >
            <Lock className="h-3.5 w-3.5" /> Home
          </Link>
          <span className="text-[var(--text-secondary)]">/</span>
          <span className="text-[var(--text-primary)]">Vault</span>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1
              className="text-3xl font-bold text-[var(--text-primary)] mb-1"
              style={{ fontFamily: "'Playfair Display',serif'" }}
            >
              Love Vault
            </h1>
            <p className="text-[var(--text-secondary)] text-sm">
              Letters, promises, and little surprises — locked until the moment they matter most.
            </p>
          </div>

          <button
            onClick={() => setShowForm((v) => !v)}
            className="px-4 py-2 rounded-full text-sm font-medium text-[var(--text-primary)] shadow-md hover:opacity-90 transition-opacity flex items-center gap-2 shrink-0 bg-gradient-to-r from-[var(--accent-2)] to-[var(--accent-1)]"
          >
            <Lock className="h-4 w-4" />
            {showForm ? 'Cancel' : 'Seal a new letter'}
          </button>
        </div>
      </div>

      {/* Stats and intro */}
      <div className="mb-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl p-6 border border-[var(--accent-1)]/20 bg-[var(--card-bg)] backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-gradient-to-br from-[var(--accent-2)] to-[var(--accent-1)]">
              🔐
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-secondary)]">
                Private keepsake
              </div>
              <div
                className="text-xl font-semibold text-[var(--text-primary)]"
                style={{ fontFamily: "'Playfair Display',serif'" }}
              >
                Some words are worth the wait.
              </div>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Every letter opens only on its promised day — the future you writes to the future
                us.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShowForm((value) => !value)}
              className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium bg-[var(--bg-2)] hover:bg-[var(--bg-3)] backdrop-blur border border-[var(--accent-1)]/20"
            >
              {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {showForm ? 'Cancel' : 'Write a letter'}
            </button>
            <div className="inline-flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-widest text-[var(--text-secondary)] rounded-2xl bg-[var(--bg-2)] border border-[var(--accent-1)]/20">
              <Sparkles className="h-3.5 w-3.5" />
              {letters.length === 0 ? 'Fresh start' : 'Keepsakes saved'}
            </div>
          </div>
        </div>

        <div className="rounded-3xl p-5 border border-[var(--accent-1)]/20 bg-[var(--card-bg)] backdrop-blur">
          <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-secondary)]">
            Archive
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-2xl p-3 bg-[var(--bg-2)] border border-[var(--accent-1)]/15 text-center">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                Letters
              </p>
              <p
                className="mt-2 text-2xl text-[var(--text-primary)]"
                style={{ fontFamily: "'Playfair Display',serif'" }}
              >
                {stats.total}
              </p>
            </div>
            <div className="rounded-2xl p-3 bg-[var(--bg-2)] border border-[var(--accent-1)]/15 text-center">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                Sealed
              </p>
              <p
                className="mt-2 text-2xl text-[var(--text-primary)]"
                style={{ fontFamily: "'Playfair Display',serif'" }}
              >
                {stats.sealed}
              </p>
            </div>
            <div className="rounded-2xl p-3 bg-[var(--bg-2)] border border-[var(--accent-1)]/15 text-center">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                Latest
              </p>
              <p
                className="mt-2 text-base text-[var(--text-primary)]"
                style={{ fontFamily: "'Playfair Display',serif'" }}
              >
                {stats.newest}
              </p>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="mb-6 overflow-hidden"
          >
            <div className="rounded-[32px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-5 shadow-xl backdrop-blur-xl">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="text-sm text-[var(--text-secondary)]">Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="A note for her heart"
                    className="mt-2 w-full rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-4 py-3 text-base text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]/80"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-[var(--text-secondary)]">Message</label>
                  <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Write your heart out..."
                    rows={6}
                    className="mt-2 w-full resize-none rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-4 py-3 text-base text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]/80"
                  />
                </div>
               <div>
                 <label className="text-sm text-[var(--text-secondary)]">Category</label>
                 <select
                   value={vaultCategory === 'all' ? 'private' : vaultCategory}
                   onChange={(e) => setVaultCategory(e.target.value as Exclude<VaultCategory, 'all'>)}
                   className="mt-2 w-full rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none"
                 >
                   <option value="private">Private</option>
                   <option value="celebration">Celebration</option>
                   <option value="ritual">Ritual</option>
                   <option value="travel">Travel</option>
                 </select>
               </div>
               <div>
                 <label className="text-sm text-[var(--text-secondary)]">Reveal date</label>
                 <input
                   type="date"
                   value={revealDate}
                   onChange={(e) => setRevealDate(e.target.value)}
                   className="mt-2 w-full rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none"
                 />
               </div>
             </div>

             <div className="mt-5 flex justify-end">
               <button
                 type="button"
                 onClick={handleCreate}
                 disabled={!newTitle.trim() || !newContent.trim()}
                 className="inline-flex items-center gap-2 rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--button-bg)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] disabled:opacity-50"
               >
                 <Save className="h-4 w-4" />
                 Seal & Save
               </button>
             </div>
           </div>
         </motion.div>
      )}
      </AnimatePresence>

      <div className="mb-6 flex flex-wrap gap-2">
       {(['all', 'private', 'celebration', 'ritual', 'travel'] as VaultCategory[]).map((option) => (
         <button
           key={option}
           type="button"
           onClick={() => setVaultCategory(option)}
           className={`rounded-full px-3 py-1.5 text-xs capitalize ${
             vaultCategory === option
               ? 'bg-[var(--button-bg)] text-[var(--text-primary)]'
               : 'bg-[var(--bg-2)] text-[var(--text-secondary)]'
           }`}
         >
           {option}
         </button>
       ))}
      </div>

      {filteredLetters.length === 0 ? (
       <div className="rounded-[32px] border border-dashed border-[var(--accent-1)]/35 bg-[var(--card-bg)]/65 p-10 text-center shadow-lg backdrop-blur-xl">
         <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--button-bg)] text-[var(--text-primary)]">
           <Heart className="h-6 w-6 text-[var(--accent-1)]" />
         </div>
         <h2
           className="text-3xl text-[var(--text-primary)]"
           style={{ fontFamily: 'var(--font-display)' }}
         >
           Your first letter is waiting
         </h2>
         <p className="mt-2 text-sm text-[var(--text-secondary)]">
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
    </div>
  )
}

function VaultPageSkeleton() {
  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-8">
      <div className="mb-6 h-6 w-32 animate-pulse rounded-full bg-[var(--card-bg-strong)]" />
      <div className="mb-6 h-16 animate-pulse rounded-3xl bg-[var(--card-bg-strong)]" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-52 animate-pulse rounded-3xl bg-[var(--card-bg-strong)]" />
        <div className="h-52 animate-pulse rounded-3xl bg-[var(--card-bg-strong)]" />
      </div>
    </div>
  )
}

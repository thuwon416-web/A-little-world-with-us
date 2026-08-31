'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Unlock, ChevronDown, Heart } from 'lucide-react'
import { SecretLetter } from '@/lib/supabase'

interface VaultCardProps {
  letter: SecretLetter
}

export default function VaultCard({ letter }: VaultCardProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45 }}
      className="overflow-hidden rounded-[28px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] shadow-md backdrop-blur-xl"
    >
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 p-5 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--button-bg)]">
            {letter.is_locked ? (
              <Lock className="h-4 w-4 text-[var(--accent-2)]" />
            ) : (
              <Unlock className="h-4 w-4 text-[var(--accent-1)]" />
            )}
          </div>
          <div>
            <h3
              className="text-2xl text-[var(--text-primary)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {letter.title}
            </h3>
            <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">
              {new Date(letter.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown className="h-5 w-5 text-[var(--text-secondary)]" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-0">
              <div className="mb-4 h-px bg-gradient-to-r from-transparent via-[var(--text-primary)]/25 to-transparent" />
              <p className="whitespace-pre-wrap text-sm leading-7 text-[var(--text-primary)]/85">
                {letter.content}
              </p>
              <div className="mt-4 flex justify-end">
                <Heart className="h-4 w-4 text-[var(--accent-1)]" fill="currentColor" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

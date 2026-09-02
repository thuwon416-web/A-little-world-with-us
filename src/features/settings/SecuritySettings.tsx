'use client'

import { Shield, Key, Lock, Eye } from 'lucide-react'

export default function SecuritySettings() {
  return (
    <div className="glass-card p-5">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
        <Shield className="h-5 w-5 text-[var(--accent-1)]" />
        Security
      </h3>

      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <Lock className="h-5 w-5 text-[var(--accent-1)] mt-0.5" />
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Security Headers
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, and more
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Key className="h-5 w-5 text-[var(--accent-1)] mt-0.5" />
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              RLS Policies
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Database-level access control (Row Level Security)
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Eye className="h-5 w-5 text-[var(--accent-1)] mt-0.5" />
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Client-Side Encryption
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Sensitive data encrypted before sending to server
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-[var(--accent-1)] mt-0.5" />
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              PIN Protection
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              PBKDF2 + AES-GCM encryption for PIN lock
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

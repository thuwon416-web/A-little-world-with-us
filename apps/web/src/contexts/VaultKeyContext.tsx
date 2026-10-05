'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import {
  deriveKeyFromPassphrase,
  generateMasterKey,
  generateSalt,
  unwrapMasterKey,
  wrapMasterKey,
} from '@/lib/vault-crypto'
import { loadWrappedKey, saveWrappedKey } from '@/lib/vault-storage'

type VaultKeyContextValue = {
  masterKey: Uint8Array | null
  isUnlocked: boolean
  unlockWithPassphrase: (passphrase: string) => Promise<void>
  unlockWithBiometric: () => Promise<void>
  lock: () => void
  setupWithPassphrase: (passphrase: string, backupPhrase: string[]) => Promise<void>
  unlockWithBackupPhrase: (backupPhrase: string[]) => Promise<void>
}

const VaultKeyContext = createContext<VaultKeyContextValue | null>(null)

export function VaultKeyProvider({ children }: { children: React.ReactNode }) {
  const [masterKey, setMasterKey] = useState<Uint8Array | null>(null)
  const timer = useRef<number | null>(null)
  const lock = useCallback(() => {
    setMasterKey(null)
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = null
  }, [])
  const armAutoLock = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(lock, 5 * 60 * 1000)
  }, [lock])
  const unlockWithPassphrase = useCallback(async (passphrase: string) => {
    if (passphrase.length < 8) throw new Error('Vault passphrase must be at least 8 characters.')
    const stored = await loadWrappedKey()
    if (stored) {
      const key = await deriveKeyFromPassphrase(passphrase, stored.salt)
      setMasterKey(await unwrapMasterKey(stored.ciphertext, stored.iv, key))
    } else {
      const salt = generateSalt()
      const key = await deriveKeyFromPassphrase(passphrase, salt)
      const generated = await generateMasterKey()
      const wrapped = await wrapMasterKey(generated, key)
      await saveWrappedKey({ ...wrapped, salt, version: 1 })
      setMasterKey(generated)
    }
    armAutoLock()
  }, [armAutoLock])
  const setupWithPassphrase = useCallback(async (passphrase: string, backupPhrase: string[]) => {
    if (passphrase.length < 8) throw new Error('Vault passphrase must be at least 8 characters.')
    if (backupPhrase.length !== 12 || backupPhrase.some((word) => !word.trim())) {
      throw new Error('A valid 12-word recovery phrase is required.')
    }
    const passphraseSalt = generateSalt()
    const passphraseKey = await deriveKeyFromPassphrase(passphrase, passphraseSalt)
    const generated = await generateMasterKey()
    const wrapped = await wrapMasterKey(generated, passphraseKey)
    const recoverySalt = generateSalt()
    const recoveryKey = await deriveKeyFromPassphrase(backupPhrase.join(' '), recoverySalt)
    const recoveryWrapped = await wrapMasterKey(generated, recoveryKey)
    await saveWrappedKey({
      ...wrapped,
      salt: passphraseSalt,
      version: 2,
      recoveryCiphertext: recoveryWrapped.ciphertext,
      recoveryIv: recoveryWrapped.iv,
      recoverySalt,
    })
    setMasterKey(generated)
    armAutoLock()
  }, [armAutoLock])

  const unlockWithBackupPhrase = useCallback(async (backupPhrase: string[]) => {
    if (backupPhrase.length !== 12 || backupPhrase.some((word) => !word.trim())) {
      throw new Error('Enter the complete 12-word recovery phrase.')
    }
    const stored = await loadWrappedKey()
    if (!stored?.recoveryCiphertext || !stored.recoveryIv || !stored.recoverySalt) {
      throw new Error('This vault does not have a configured recovery phrase.')
    }
    const key = await deriveKeyFromPassphrase(backupPhrase.join(' ').trim(), stored.recoverySalt)
    setMasterKey(await unwrapMasterKey(stored.recoveryCiphertext, stored.recoveryIv, key))
    armAutoLock()
  }, [armAutoLock])

  const unlockWithBiometric = useCallback(async () => {
    throw new Error('Web biometric unlock is planned for Phase 14.5.')
  }, [])
  useEffect(() => () => lock(), [lock])
  return (
    <VaultKeyContext.Provider value={{ masterKey, isUnlocked: masterKey !== null, unlockWithPassphrase, unlockWithBiometric, setupWithPassphrase, unlockWithBackupPhrase, lock }}>
      {children}
    </VaultKeyContext.Provider>
  )
}

export function useVaultKey(): VaultKeyContextValue {
  const context = useContext(VaultKeyContext)
  if (!context) throw new Error('useVaultKey must be used within VaultKeyProvider')
  return context
}

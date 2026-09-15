import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import * as LocalAuthentication from 'expo-local-authentication'
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
}

const VaultKeyContext = createContext<VaultKeyContextValue | null>(null)

export function VaultKeyProvider({ children }: { children: React.ReactNode }) {
  const [masterKey, setMasterKey] = useState<Uint8Array | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lock = useCallback(() => {
    setMasterKey(null)
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
  }, [])
  const armAutoLock = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(lock, 5 * 60 * 1000)
  }, [lock])
  const unlockWithPassphrase = useCallback(async (passphrase: string) => {
    if (passphrase.length < 8) throw new Error('Vault passphrase must be at least 8 characters.')
    const stored = await loadWrappedKey()
    if (stored) {
      const key = await deriveKeyFromPassphrase(passphrase, stored.salt)
      setMasterKey(await unwrapMasterKey(stored.ciphertext, stored.iv, key))
    } else {
      const salt = await generateSalt()
      const key = await deriveKeyFromPassphrase(passphrase, salt)
      const generated = await generateMasterKey()
      const wrapped = await wrapMasterKey(generated, key)
      await saveWrappedKey({ ...wrapped, salt, version: 1 })
      setMasterKey(generated)
    }
    armAutoLock()
  }, [armAutoLock])
  const unlockWithBiometric = useCallback(async () => {
    const availability = await LocalAuthentication.hasHardwareAsync()
    if (!availability) throw new Error('Biometric hardware is unavailable.')
    const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Unlock your private vault' })
    if (!result.success) throw new Error('Biometric authentication was cancelled.')
    const stored = await loadWrappedKey()
    if (!stored) throw new Error('Set a Vault passphrase before using biometrics.')
    throw new Error('Biometric key release requires platform secure key wrapping and is planned for Phase 14.5.')
  }, [])
  useEffect(() => () => lock(), [lock])
  return (
    <VaultKeyContext.Provider value={{ masterKey, isUnlocked: masterKey !== null, unlockWithPassphrase, unlockWithBiometric, lock }}>
      {children}
    </VaultKeyContext.Provider>
  )
}

export function useVaultKey(): VaultKeyContextValue {
  const context = useContext(VaultKeyContext)
  if (!context) throw new Error('useVaultKey must be used within VaultKeyProvider')
  return context
}

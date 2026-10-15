import { b64encode, generateSalt } from './vault-crypto'
import type { VaultCredential } from '@/services/vault-credentials'

type ExportCredential = Pick<VaultCredential, 'label' | 'category' | 'isShared' | 'encryptedPayload' | 'encryptionIv'>
export type VaultExport = {
  version: 1
  createdAt: string
  salt: string
  kdfParams: { algorithm: 'PBKDF2'; iterations: 100000; hash: 'SHA-256' }
  credentials: ExportCredential[]
  integrityHash: string
}

async function digest(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return b64encode(new Uint8Array(bytes))
}

export async function exportVault(_masterKey: Uint8Array, credentials: VaultCredential[]): Promise<string> {
  const payload = {
    version: 1 as const,
    createdAt: new Date().toISOString(),
    salt: generateSalt(),
    kdfParams: { algorithm: 'PBKDF2' as const, iterations: 100000 as const, hash: 'SHA-256' as const },
    credentials: credentials.map(({ label, category, isShared, encryptedPayload, encryptionIv }) => ({
      label, category, isShared, encryptedPayload, encryptionIv,
    })),
  }
  const integrityHash = await digest(JSON.stringify(payload))
  return JSON.stringify({ ...payload, integrityHash }, null, 2)
}

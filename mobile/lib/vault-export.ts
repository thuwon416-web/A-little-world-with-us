import * as Crypto from 'expo-crypto'
import { b64encode } from './vault-crypto'
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
  const bytes = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value, { encoding: Crypto.CryptoEncoding.BASE64 })
  return bytes
}

export async function exportVault(_masterKey: Uint8Array, credentials: VaultCredential[]): Promise<string> {
  const payload = {
    version: 1 as const,
    createdAt: new Date().toISOString(),
    salt: b64encode(await Crypto.getRandomBytesAsync(16)),
    kdfParams: { algorithm: 'PBKDF2' as const, iterations: 100000 as const, hash: 'SHA-256' as const },
    credentials: credentials.map(({ label, category, isShared, encryptedPayload, encryptionIv }) => ({ label, category, isShared, encryptedPayload, encryptionIv })),
  }
  return JSON.stringify({ ...payload, integrityHash: await digest(JSON.stringify(payload)) }, null, 2)
}

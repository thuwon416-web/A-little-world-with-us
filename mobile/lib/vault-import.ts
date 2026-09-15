import * as Crypto from 'expo-crypto'
import { decryptCredential } from './vault-crypto'
import { createCredential, getCredentials, type VaultCredential } from '@/services/vault-credentials'

type ImportPayload = {
  version: number
  createdAt: string
  salt: string
  kdfParams: { algorithm: string; iterations: number; hash: string }
  credentials: Array<Pick<VaultCredential, 'label' | 'category' | 'isShared' | 'encryptedPayload' | 'encryptionIv'>>
  integrityHash: string
}

async function digest(value: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value, { encoding: Crypto.CryptoEncoding.BASE64 })
}

export async function importVault(fileContent: string, masterKey: Uint8Array): Promise<{ imported: number; skipped: number; errors: string[] }> {
  let parsed: unknown
  try { parsed = JSON.parse(fileContent) } catch { throw new Error('The selected Vault export is not valid JSON.') }
  if (!parsed || typeof parsed !== 'object') throw new Error('Unsupported Vault export.')
  const payload = parsed as ImportPayload
  if (payload.version !== 1 || payload.kdfParams?.algorithm !== 'PBKDF2' || payload.kdfParams.iterations !== 100000 || payload.kdfParams.hash !== 'SHA-256' || !Array.isArray(payload.credentials) || !payload.integrityHash) throw new Error('Unsupported or incomplete Vault export.')
  const { integrityHash, ...unsigned } = payload
  if (await digest(JSON.stringify(unsigned)) !== integrityHash) throw new Error('Vault export integrity check failed.')
  const existing = await getCredentials()
  const labels = new Set(existing.map((item) => item.label.trim().toLowerCase()))
  const result = { imported: 0, skipped: 0, errors: [] as string[] }
  for (const item of payload.credentials) {
    if (!item.label || !item.encryptedPayload || !item.encryptionIv) { result.errors.push('Skipped an incomplete credential.'); continue }
    if (labels.has(item.label.trim().toLowerCase())) { result.skipped += 1; continue }
    try {
      await decryptCredential(item.encryptedPayload, item.encryptionIv, masterKey)
      await createCredential({ encryptedPayload: item.encryptedPayload, encryptionIv: item.encryptionIv, encryptionVersion: 1, category: item.category, label: item.label, websiteUrl: null, keyVersion: 1, isShared: item.isShared })
      labels.add(item.label.trim().toLowerCase())
      result.imported += 1
    } catch (error) { result.errors.push(`${item.label}: ${error instanceof Error ? error.message : 'Unable to import credential.'}`) }
  }
  return result
}

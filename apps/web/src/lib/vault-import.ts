import { decryptCredential, b64encode } from './vault-crypto'
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
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return b64encode(new Uint8Array(bytes))
}

function isImportPayload(value: unknown): value is ImportPayload {
  if (!value || typeof value !== 'object') return false
  const payload = value as Partial<ImportPayload>
  return payload.version === 1 && typeof payload.createdAt === 'string' && typeof payload.salt === 'string' &&
    payload.kdfParams?.algorithm === 'PBKDF2' && payload.kdfParams.iterations === 100000 &&
    payload.kdfParams.hash === 'SHA-256' && Array.isArray(payload.credentials) &&
    typeof payload.integrityHash === 'string'
}

export async function importVault(fileContent: string, masterKey: Uint8Array): Promise<{ imported: number; skipped: number; errors: string[] }> {
  let parsed: unknown
  try { parsed = JSON.parse(fileContent) } catch { throw new Error('The selected Vault export is not valid JSON.') }
  if (!isImportPayload(parsed)) throw new Error('Unsupported or incomplete Vault export.')
  const { integrityHash, ...unsigned } = parsed
  if (await digest(JSON.stringify(unsigned)) !== integrityHash) throw new Error('Vault export integrity check failed.')
  const existing = await getCredentials()
  const labels = new Set(existing.map((item) => item.label.trim().toLowerCase()))
  const result = { imported: 0, skipped: 0, errors: [] as string[] }
  for (const item of parsed.credentials) {
    if (!item.label || !item.encryptedPayload || !item.encryptionIv) {
      result.errors.push('Skipped an incomplete credential.')
      continue
    }
    if (labels.has(item.label.trim().toLowerCase())) { result.skipped += 1; continue }
    try {
      await decryptCredential(item.encryptedPayload, item.encryptionIv, masterKey)
      await createCredential({
        encryptedPayload: item.encryptedPayload,
        encryptionIv: item.encryptionIv,
        encryptionVersion: 1,
        category: item.category,
        label: item.label,
        websiteUrl: null,
        keyVersion: 1,
        isShared: item.isShared,
      })
      labels.add(item.label.trim().toLowerCase())
      result.imported += 1
    } catch (error) {
      result.errors.push(`${item.label}: ${error instanceof Error ? error.message : 'Unable to import credential.'}`)
    }
  }
  return result
}

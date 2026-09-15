import { getCoupleStatus } from '@/lib/couples'
import { getCurrentUserId, supabase } from '@/lib/supabase'

export type VaultCredential = {
  id: string
  coupleId: string
  userId: string
  isShared: boolean
  encryptedPayload: string
  encryptionIv: string
  encryptionVersion: number
  category: string
  label: string
  websiteUrl: string | null
  keyVersion: number
  createdAt: string
  updatedAt: string
}

export type VaultCredentialInput = Omit<
  VaultCredential,
  'id' | 'coupleId' | 'userId' | 'createdAt' | 'updatedAt'
>

type VaultCredentialRow = {
  id: string
  couple_id: string
  user_id: string
  is_shared: boolean
  encrypted_payload: string
  encryption_iv: string
  encryption_version: number
  category: string
  label: string
  website_url: string | null
  key_version: number
  created_at: string
  updated_at: string
}

const mapCredential = (row: VaultCredentialRow): VaultCredential => ({
  id: row.id,
  coupleId: row.couple_id,
  userId: row.user_id,
  isShared: row.is_shared,
  encryptedPayload: row.encrypted_payload,
  encryptionIv: row.encryption_iv,
  encryptionVersion: row.encryption_version,
  category: row.category,
  label: row.label,
  websiteUrl: row.website_url,
  keyVersion: row.key_version,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

async function getVaultContext(): Promise<{ coupleId: string; userId: string }> {
  const userId = await getCurrentUserId()
  if (!userId) throw new Error('Please sign in again.')
  const coupleStatus = await getCoupleStatus()
  if (coupleStatus.status !== 'accepted' || !coupleStatus.couple?.id) {
    throw new Error('An accepted couple link is required before using password credentials.')
  }
  return { coupleId: coupleStatus.couple.id, userId }
}

export async function getCredentials(): Promise<VaultCredential[]> {
  const { coupleId } = await getVaultContext()
  const { data, error } = await supabase
    .from('vault_credentials')
    .select('*')
    .eq('couple_id', coupleId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return ((data ?? []) as VaultCredentialRow[]).map(mapCredential)
}

export async function createCredential(input: VaultCredentialInput): Promise<VaultCredential> {
  const { coupleId, userId } = await getVaultContext()
  const { data, error } = await supabase
    .from('vault_credentials')
    .insert({
      couple_id: coupleId,
      user_id: userId,
      is_shared: input.isShared,
      encrypted_payload: input.encryptedPayload,
      encryption_iv: input.encryptionIv,
      encryption_version: input.encryptionVersion,
      category: input.category,
      label: input.label,
      website_url: input.websiteUrl,
      key_version: input.keyVersion,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapCredential(data as VaultCredentialRow)
}

export async function updateCredential(
  id: string,
  input: Partial<VaultCredentialInput>
): Promise<void> {
  const { coupleId } = await getVaultContext()
  const update: Record<string, unknown> = {}
  if (input.isShared !== undefined) update.is_shared = input.isShared
  if (input.encryptedPayload !== undefined) update.encrypted_payload = input.encryptedPayload
  if (input.encryptionIv !== undefined) update.encryption_iv = input.encryptionIv
  if (input.encryptionVersion !== undefined) update.encryption_version = input.encryptionVersion
  if (input.category !== undefined) update.category = input.category
  if (input.label !== undefined) update.label = input.label
  if (input.websiteUrl !== undefined) update.website_url = input.websiteUrl
  if (input.keyVersion !== undefined) update.key_version = input.keyVersion
  const { error } = await supabase
    .from('vault_credentials')
    .update(update)
    .eq('id', id)
    .eq('couple_id', coupleId)
  if (error) throw error
}

export async function deleteCredential(id: string): Promise<void> {
  const { coupleId } = await getVaultContext()
  const { error } = await supabase
    .from('vault_credentials')
    .delete()
    .eq('id', id)
    .eq('couple_id', coupleId)
  if (error) throw error
}

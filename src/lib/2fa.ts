/**
 * Two-Factor Authentication (TOTP)
 * Note: This is a simplified version. For production, use a library like 'otpauth'
 */

export interface TOTPSetup {
  secret: string
  qrCodeUrl: string
  backupCodes: string[]
}

export function generateSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567' // Base32
  let secret = ''
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return secret
}

export function generateTOTP(secret: string): string {
  // Simplified TOTP generation
  // In production, use proper TOTP algorithm
  const time = Math.floor(Date.now() / 30000)
  const code = Math.abs(hashCode(secret + time)) % 1000000
  return code.toString().padStart(6, '0')
}

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash
}

export function generateBackupCodes(count: number = 10): string[] {
  const codes = []
  for (let i = 0; i < count; i++) {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase()
    codes.push(code)
  }
  return codes
}

export async function enable2FA(): Promise<TOTPSetup> {
  const secret = generateSecret()
  const backupCodes = generateBackupCodes()
  
  // Generate QR code URL (for Google Authenticator, etc.)
  const qrCodeUrl = `https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl=otpauth://totp/A%20Little%20World%20With%20Us?secret=${secret}` 
  
  return {
    secret,
    qrCodeUrl,
    backupCodes,
  }
}

export async function verify2FA(secret: string, code: string): Promise<boolean> {
  const expectedCode = generateTOTP(secret)
  return code === expectedCode
}

export function save2FASecret(secret: string, backupCodes: string[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('a-little-world-with-us-2fa-secret', secret)
  localStorage.setItem('a-little-world-with-us-2fa-backup', JSON.stringify(backupCodes))
}

export function get2FASecret(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('a-little-world-with-us-2fa-secret')
}

export function get2FABackupCodes(): string[] {
  if (typeof window === 'undefined') return []
  const backup = localStorage.getItem('a-little-world-with-us-2fa-backup')
  return backup ? JSON.parse(backup) : []
}

export function remove2FA(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('a-little-world-with-us-2fa-secret')
  localStorage.removeItem('a-little-world-with-us-2fa-backup')
}

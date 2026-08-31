export const AUTH_STORAGE_KEY = 'our-forever-auth'
export const VAULT_STORAGE_KEY = 'our-forever-vault'
const COOKIE_NAME = 'our-forever-auth'

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false

  try {
    return localStorage.getItem(AUTH_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function setAuthenticated(value: boolean): void {
  if (typeof window === 'undefined') return

  try {
    if (value) {
      localStorage.setItem(AUTH_STORAGE_KEY, 'true')
      document.cookie = `${COOKIE_NAME}=true; Path=/; SameSite=Lax; Max-Age=2592000`
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      document.cookie = `${COOKIE_NAME}=; Path=/; SameSite=Lax; Max-Age=0`
    }
  } catch {
    return
  }
}

export function clearAuthenticated(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    sessionStorage.removeItem(AUTH_STORAGE_KEY)
    localStorage.removeItem(VAULT_STORAGE_KEY)
    sessionStorage.removeItem(VAULT_STORAGE_KEY)
    document.cookie = `${COOKIE_NAME}=; Path=/; SameSite=Lax; Max-Age=0`
  } catch {
    return
  }
}

export function isVaultUnlocked(): boolean {
  if (typeof window === 'undefined') return false

  try {
    return (
      localStorage.getItem(VAULT_STORAGE_KEY) === 'true' ||
      sessionStorage.getItem(VAULT_STORAGE_KEY) === 'true'
    )
  } catch {
    return false
  }
}

export function setVaultUnlocked(value: boolean): void {
  if (typeof window === 'undefined') return

  try {
    if (value) {
      sessionStorage.setItem(VAULT_STORAGE_KEY, 'true')
    } else {
      sessionStorage.removeItem(VAULT_STORAGE_KEY)
    }
  } catch {
    return
  }
}

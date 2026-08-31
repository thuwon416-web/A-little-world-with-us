type ErrorContext = Record<string, string | number | boolean | null | undefined>

type LoggedError = {
  id: string
  message: string
  name: string
  stack?: string
  context?: ErrorContext
  timestamp: string
}

const ERROR_LOG_KEY = 'our-forever-error-log'

function readStoredErrors() {
  if (typeof window === 'undefined') return [] as LoggedError[]

  try {
    const raw = window.localStorage.getItem(ERROR_LOG_KEY)
    return raw ? (JSON.parse(raw) as LoggedError[]) : []
  } catch {
    return [] as LoggedError[]
  }
}

function writeStoredErrors(errors: LoggedError[]) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(errors.slice(0, 25)))
  } catch {
    // Ignore storage failures for offline or restricted environments.
  }
}

export function logError(error: unknown, context?: ErrorContext) {
  const normalized = error instanceof Error ? error : new Error(String(error ?? 'Unknown error'))

  const entry: LoggedError = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    message: normalized.message,
    name: normalized.name,
    stack: normalized.stack,
    context,
    timestamp: new Date().toISOString(),
  }

  const nextErrors = [entry, ...readStoredErrors()]
  writeStoredErrors(nextErrors)

  if (typeof console !== 'undefined') {
    console.error('Our Forever error report:', entry)
  }

  return entry
}

export function getErrorLog() {
  return readStoredErrors()
}

export function clearErrorLog() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(ERROR_LOG_KEY)
}

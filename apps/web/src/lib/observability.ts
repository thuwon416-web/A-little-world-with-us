import 'server-only'

type LogFields = Record<string, string | number | boolean | null | undefined>

function sanitize(fields: LogFields) {
  const blocked = /token|secret|password|authorization|cookie|email|message|body|latitude|longitude|location/i
  return Object.fromEntries(
    Object.entries(fields).filter(([key]) => !blocked.test(key)).map(([key, value]) => [key, value])
  )
}

export async function logEvent(event: string, fields: LogFields = {}) {
  const token = process.env.AXIOM_TOKEN
  const dataset = process.env.AXIOM_DATASET
  if (!token || !dataset) return

  const baseUrl = process.env.AXIOM_INGEST_URL || 'https://api.axiom.co/v1/ingest'
  const payload = [{ time: new Date().toISOString(), event, ...sanitize(fields) }]
  try {
    await fetch(`${baseUrl.replace(/\/$/, '')}/${encodeURIComponent(dataset)}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
  } catch {
    // Observability must never break the user request.
  }
}

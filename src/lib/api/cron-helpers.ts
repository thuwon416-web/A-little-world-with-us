import { NextResponse } from 'next/server'

type CronRequestValidation =
  | { ok: true; supabaseUrl: string; serviceRole: string }
  | { ok: false; response: NextResponse }

export function validateCronRequest(request: Request): CronRequestValidation {
  const cronSecret = process.env.CRON_SECRET
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!cronSecret || !supabaseUrl || !serviceRole) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Cron environment is not configured' }, { status: 500 }),
    }
  }

  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  return { ok: true, supabaseUrl, serviceRole }
}

export function callEdgeFunction(
  supabaseUrl: string,
  serviceRole: string,
  functionName: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = new Headers({
    Authorization: `Bearer ${serviceRole}`,
    'Content-Type': 'application/json',
  })
  new Headers(options.headers).forEach((value, key) => headers.set(key, value))

  return fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
    method: 'POST',
    ...options,
    headers,
    cache: 'no-store',
  })
}

export function parseEdgeFunctionResponse(response: Response): Promise<unknown> {
  return response.json().catch(() => ({ error: 'Invalid Edge Function response' }))
}

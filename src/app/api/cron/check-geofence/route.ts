import { NextResponse } from 'next/server'
import {
  callEdgeFunction,
  parseEdgeFunctionResponse,
  validateCronRequest,
} from '@/lib/api/cron-helpers'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const validation = validateCronRequest(request)
  if (!validation.ok) return validation.response

  const response = await callEdgeFunction(
    validation.supabaseUrl,
    validation.serviceRole,
    'check-geofence'
  )

  const payload = await parseEdgeFunctionResponse(response)
  return NextResponse.json(payload, { status: response.ok ? 200 : 500 })
}

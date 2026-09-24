import { NextResponse } from 'next/server'

export async function GET() {
  const publicKey = process.env.WEB_PUSH_PUBLIC_KEY
  if (!publicKey) {
    return NextResponse.json({ error: 'Browser notifications are not configured.' }, { status: 503 })
  }
  return NextResponse.json({ publicKey }, { headers: { 'Cache-Control': 'no-store' } })
}

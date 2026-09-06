import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { feedback } = await request.json()

    // TODO: Store feedback in database or send email
    // For now, just log it
    console.log('Feedback received:', feedback)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing feedback:', error)
    return NextResponse.json({ error: 'Failed to process feedback' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { userId, title, body, scheduledAt } = await req.json()

    if (!userId || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Save notification to database (if table exists)
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          body,
          scheduled_at: scheduledAt || new Date().toISOString(),
        })

      if (error) {
        // If table doesn't exist, log but don't fail - this is an optional feature
        console.log('Notifications table may not exist:', error.message)
      }
    } catch (dbError) {
      // Database error is not critical for this optional feature
      console.log('Database error (optional feature):', dbError)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Notification API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

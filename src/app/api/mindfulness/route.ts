import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getFirstRow, executeQuery, getAllRows } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { getToday } from '@/lib/utils'

export const dynamic = 'force-dynamic'

// GET - Fetch mindfulness for a member on a specific date
export async function GET(request: NextRequest) {
  try {
    requireAuth(request)
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('memberId')
    const date = searchParams.get('date') || getToday()

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID required' },
        { status: 400 }
      )
    }

    // Get mindfulness goal
    const mindfulnessGoal = await getFirstRow<{ target_value: number }>(
      "SELECT target_value FROM goals WHERE member_id = ? AND type = 'mindfulness'",
      [memberId]
    )

    // Get all mindfulness entries for the date
    const entries = await getAllRows(
      'SELECT * FROM mindfulness_entries WHERE member_id = ? AND date = ? ORDER BY created_at DESC',
      [memberId, date]
    )

    // Calculate total mindfulness minutes
    const totalResult = await getFirstRow<{ total: number }>(
      'SELECT COALESCE(SUM(duration_minutes), 0) as total FROM mindfulness_entries WHERE member_id = ? AND date = ?',
      [memberId, date]
    )

    return NextResponse.json({
      entries,
      total: totalResult?.total || 0,
      target: mindfulnessGoal?.target_value || 15,
      unit: 'minutes'
    })
  } catch (error) {
    console.error('Get mindfulness error:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to fetch mindfulness' },
      { status: 500 }
    )
  }
}

// POST - Log mindfulness minutes manually or sync from HealthKit
export async function POST(request: NextRequest) {
  try {
    requireAuth(request)
    const { memberId, duration_minutes, date = getToday(), source = 'manual', notes } = await request.json()

    if (!memberId || !duration_minutes) {
      return NextResponse.json(
        { error: 'Member ID and duration required' },
        { status: 400 }
      )
    }

    if (duration_minutes <= 0) {
      return NextResponse.json(
        { error: 'Duration must be positive' },
        { status: 400 }
      )
    }

    // Create new entry (mindfulness is additive, not cumulative like steps)
    const entryId = uuidv4()
    await executeQuery(
      'INSERT INTO mindfulness_entries (id, member_id, duration_minutes, date, source, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [entryId, memberId, duration_minutes, date, source, notes || null]
    )

    return NextResponse.json({ success: true, id: entryId })
  } catch (error) {
    console.error('Log mindfulness error:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to log mindfulness' },
      { status: 500 }
    )
  }
}

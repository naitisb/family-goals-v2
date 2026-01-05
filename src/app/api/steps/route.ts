import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getFirstRow, executeQuery, getAllRows } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { getToday } from '@/lib/utils'

export const dynamic = 'force-dynamic'

// GET - Fetch steps for a member on a specific date
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

    // Get steps goal
    const stepsGoal = await getFirstRow<{ target_value: number }>(
      "SELECT target_value FROM goals WHERE member_id = ? AND type = 'steps'",
      [memberId]
    )

    // Get all steps entries for the date
    const entries = await getAllRows(
      'SELECT * FROM steps_entries WHERE member_id = ? AND date = ? ORDER BY created_at DESC',
      [memberId, date]
    )

    // Calculate total steps
    const totalResult = await getFirstRow<{ total: number }>(
      'SELECT COALESCE(SUM(steps), 0) as total FROM steps_entries WHERE member_id = ? AND date = ?',
      [memberId, date]
    )

    return NextResponse.json({
      entries,
      total: totalResult?.total || 0,
      target: stepsGoal?.target_value || 10000,
      unit: 'steps'
    })
  } catch (error) {
    console.error('Get steps error:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to fetch steps' },
      { status: 500 }
    )
  }
}

// POST - Log steps manually or sync from HealthKit
export async function POST(request: NextRequest) {
  try {
    requireAuth(request)
    const { memberId, steps, date = getToday(), source = 'manual' } = await request.json()

    if (!memberId || !steps) {
      return NextResponse.json(
        { error: 'Member ID and steps required' },
        { status: 400 }
      )
    }

    if (steps <= 0) {
      return NextResponse.json(
        { error: 'Steps must be positive' },
        { status: 400 }
      )
    }

    // For HealthKit sync, check if entry already exists for this date
    // Replace it instead of adding (HealthKit sends total for day)
    if (source === 'healthkit') {
      const existing = await getFirstRow<{ id: string }>(
        "SELECT id FROM steps_entries WHERE member_id = ? AND date = ? AND source = 'healthkit'",
        [memberId, date]
      )

      if (existing) {
        await executeQuery(
          'UPDATE steps_entries SET steps = ? WHERE id = ?',
          [steps, existing.id]
        )
        return NextResponse.json({ success: true, updated: true })
      }
    }

    // Create new entry
    const entryId = uuidv4()
    await executeQuery(
      'INSERT INTO steps_entries (id, member_id, steps, date, source) VALUES (?, ?, ?, ?, ?)',
      [entryId, memberId, steps, date, source]
    )

    return NextResponse.json({ success: true, id: entryId })
  } catch (error) {
    console.error('Log steps error:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to log steps' },
      { status: 500 }
    )
  }
}

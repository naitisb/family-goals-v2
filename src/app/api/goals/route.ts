import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getFirstRow, executeQuery } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { getToday, getWeekStart } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    const {
      memberId,
      type,
      title,
      description,
      target_value,
      target_unit,
      assigned_by,
      frequency = 'daily',
      due_time,
      reminder_enabled,
      reminder_time
    } = await request.json()

    if (!memberId || !title) {
      return NextResponse.json(
        { error: 'Member ID and title required' },
        { status: 400 }
      )
    }

    // Check custom goal count (max 4 per frequency)
    if (type === 'custom') {
      const countResult = await getFirstRow<{ count: number }>(
        "SELECT COUNT(*) as count FROM goals WHERE member_id = ? AND type = 'custom' AND frequency = ?",
        [memberId, frequency]
      )
      if (countResult && countResult.count >= 4) {
        return NextResponse.json(
          { error: `Maximum 4 ${frequency} custom goals allowed` },
          { status: 400 }
        )
      }
    }

    const goalId = uuidv4()
    await executeQuery(
      `INSERT INTO goals (id, member_id, type, title, description, target_value, target_unit, assigned_by, is_custom, frequency, due_time, reminder_enabled, reminder_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        goalId,
        memberId,
        type || 'custom',
        title,
        description || null,
        target_value || null,
        target_unit || null,
        assigned_by || null,
        type === 'custom' ? 1 : 0,
        frequency,
        due_time || null,
        reminder_enabled ? 1 : 0,
        reminder_time || null
      ]
    )

    return NextResponse.json({
      id: goalId,
      member_id: memberId,
      type: type || 'custom',
      title,
      description,
      target_value,
      frequency
    })
  } catch (error) {
    console.error('Create goal error:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to create goal' },
      { status: 500 }
    )
  }
}


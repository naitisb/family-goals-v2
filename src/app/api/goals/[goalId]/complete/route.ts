import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getFirstRow, executeQuery } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { getToday, getWeekStart } from '@/lib/utils'
import { Goal, GoalCompletion } from '@/types'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ goalId: string }> }
) {
  try {
    requireAuth(request)
    const { goalId } = await params
    const { memberId, value, notes } = await request.json()

    const goal = await getFirstRow<Goal>(
      'SELECT * FROM goals WHERE id = ?',
      [goalId]
    )
    if (!goal) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      )
    }

    // Use today for daily goals, week start for weekly
    const date = goal.frequency === 'weekly' ? getWeekStart() : getToday()

    // Check if already completed
    const existing = await getFirstRow<GoalCompletion>(
      'SELECT * FROM goal_completions WHERE goal_id = ? AND member_id = ? AND date = ?',
      [goalId, memberId, date]
    )

    if (existing) {
      // Toggle off - delete completion
      await executeQuery('DELETE FROM goal_completions WHERE id = ?', [existing.id])
      return NextResponse.json({ completed: false })
    } else {
      // Toggle on - create completion
      await executeQuery(
        'INSERT INTO goal_completions (id, goal_id, member_id, date, value, notes) VALUES (?, ?, ?, ?, ?, ?)',
        [uuidv4(), goalId, memberId, date, value || null, notes || null]
      )
      return NextResponse.json({ completed: true })
    }
  } catch (error) {
    console.error('Complete goal error:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to complete goal' },
      { status: 500 }
    )
  }
}



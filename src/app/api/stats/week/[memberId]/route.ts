import { NextRequest, NextResponse } from 'next/server'
import { getAllRows, getFirstRow } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { getWeekStart, getWeekEnd } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    requireAuth(request)
    const { memberId } = await params
    const { searchParams } = new URL(request.url)
    const weekOffset = parseInt(searchParams.get('weekOffset') || '0')

    const now = new Date()
    now.setDate(now.getDate() + (weekOffset * 7))

    const weekStart = getWeekStart(now)
    const weekEnd = getWeekEnd(now)

    // Get all dates in the week
    const days: Array<{
      date: string
      completed: number
      total: number
      water: number
      exercise: number
    }> = []

    const startDate = new Date(weekStart)
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]

      // Get goal completions for this day
      const completions = await getFirstRow<{ count: number }>(
        "SELECT COUNT(*) as count FROM goal_completions WHERE member_id = ? AND date = ?",
        [memberId, dateStr]
      )

      const totalGoals = await getFirstRow<{ count: number }>(
        "SELECT COUNT(*) as count FROM goals WHERE member_id = ? AND frequency = 'daily'",
        [memberId]
      )

      const water = await getFirstRow<{ total: number }>(
        "SELECT COALESCE(SUM(amount_ml), 0) as total FROM water_entries WHERE member_id = ? AND date = ?",
        [memberId, dateStr]
      )

      const exercise = await getFirstRow<{ total: number }>(
        "SELECT COALESCE(SUM(duration_minutes), 0) as total FROM exercise_entries WHERE member_id = ? AND date = ?",
        [memberId, dateStr]
      )

      days.push({
        date: dateStr,
        completed: completions?.count || 0,
        total: totalGoals?.count || 0,
        water: water?.total || 0,
        exercise: exercise?.total || 0
      })
    }

    // Calculate summary
    const totalCompleted = days.reduce((sum, d) => sum + d.completed, 0)
    const totalPossible = days.reduce((sum, d) => sum + d.total, 0)
    const perfectDays = days.filter(d => d.total > 0 && d.completed >= d.total).length
    const totalWater = days.reduce((sum, d) => sum + d.water, 0)
    const totalExercise = days.reduce((sum, d) => sum + d.exercise, 0)

    // Calculate current streak
    let streak = 0
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].total > 0 && days[i].completed >= days[i].total) {
        streak++
      } else if (days[i].total > 0) {
        break
      }
    }

    return NextResponse.json({
      period: 'week',
      start_date: weekStart,
      end_date: weekEnd,
      days,
      summary: {
        avg_completion: totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0,
        perfect_days: perfectDays,
        current_streak: streak,
        total_water: totalWater,
        total_exercise: totalExercise
      }
    })
  } catch (error) {
    console.error('Get weekly stats error:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to get weekly stats' },
      { status: 500 }
    )
  }
}


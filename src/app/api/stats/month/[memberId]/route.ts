import { NextRequest, NextResponse } from 'next/server'
import { getAllRows, getFirstRow } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { getMonthStart, getMonthEnd } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    requireAuth(request)
    const { memberId } = await params
    const { searchParams } = new URL(request.url)
    const monthOffset = parseInt(searchParams.get('monthOffset') || '0')

    const now = new Date()
    now.setMonth(now.getMonth() + monthOffset)

    const monthStart = getMonthStart(now)
    const monthEnd = getMonthEnd(now)

    // Get all dates in the month
    const days: Array<{
      date: string
      completed: number
      total: number
      water: number
      exercise: number
    }> = []

    const startDate = new Date(monthStart)
    const endDate = new Date(monthEnd)
    
    while (startDate <= endDate) {
      const dateStr = startDate.toISOString().split('T')[0]

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

      startDate.setDate(startDate.getDate() + 1)
    }

    // Calculate summary
    const totalCompleted = days.reduce((sum, d) => sum + d.completed, 0)
    const totalPossible = days.reduce((sum, d) => sum + d.total, 0)
    const perfectDays = days.filter(d => d.total > 0 && d.completed >= d.total).length
    const totalWater = days.reduce((sum, d) => sum + d.water, 0)
    const totalExercise = days.reduce((sum, d) => sum + d.exercise, 0)

    return NextResponse.json({
      period: 'month',
      start_date: monthStart,
      end_date: monthEnd,
      days,
      summary: {
        avg_completion: totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0,
        perfect_days: perfectDays,
        current_streak: 0,
        total_water: totalWater,
        total_exercise: totalExercise
      }
    })
  } catch (error) {
    console.error('Get monthly stats error:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to get monthly stats' },
      { status: 500 }
    )
  }
}


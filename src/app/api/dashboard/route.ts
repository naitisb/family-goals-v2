import { NextRequest, NextResponse } from 'next/server'
import { getAllRows, getFirstRow } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { getToday, getWeekStart } from '@/lib/utils'
import { Member, Goal } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    const today = getToday()
    const weekStart = getWeekStart()

    const members = await getAllRows<Member>(
      'SELECT id, name, avatar_color, profile_photo_url FROM family_members WHERE family_id = ?',
      [auth.familyId]
    )

    const dashboard = await Promise.all(members.map(async (member) => {
      // Get all goals for this member
      const goals = await getAllRows<Goal>(
        `SELECT g.*, 
                fm.name as assigned_by_name,
                fm.avatar_color as assigned_by_color
         FROM goals g
         LEFT JOIN family_members fm ON g.assigned_by = fm.id
         WHERE g.member_id = ?`,
        [member.id]
      )

      // Get completions for today (daily) and this week (weekly)
      const dailyCompletions = await getAllRows<{ goal_id: string; value: number; notes: string }>(
        'SELECT goal_id, value, notes FROM goal_completions WHERE member_id = ? AND date = ?',
        [member.id, today]
      )

      const weeklyCompletions = await getAllRows<{ goal_id: string; value: number; notes: string }>(
        'SELECT goal_id, value, notes FROM goal_completions WHERE member_id = ? AND date = ?',
        [member.id, weekStart]
      )

      // Map completions to goals
      const goalsWithCompletion = goals.map(goal => {
        const completions = goal.frequency === 'weekly' ? weeklyCompletions : dailyCompletions
        const completion = completions.find(c => c.goal_id === goal.id)
        return {
          ...goal,
          is_completed: !!completion,
          completion_value: completion?.value,
          completion_notes: completion?.notes
        }
      })

      // Get water total for today
      const waterResult = await getFirstRow<{ total: number }>(
        'SELECT COALESCE(SUM(amount_ml), 0) as total FROM water_entries WHERE member_id = ? AND date = ?',
        [member.id, today]
      )

      // Get exercise total for today
      const exerciseResult = await getFirstRow<{ total: number }>(
        'SELECT COALESCE(SUM(duration_minutes), 0) as total FROM exercise_entries WHERE member_id = ? AND date = ?',
        [member.id, today]
      )

      // Get steps total for today
      const stepsResult = await getFirstRow<{ total: number }>(
        'SELECT COALESCE(SUM(steps), 0) as total FROM steps_entries WHERE member_id = ? AND date = ?',
        [member.id, today]
      )

      // Get water goal target
      const waterGoal = goals.find(g => g.type === 'water')
      const waterTarget = waterGoal?.target_value || 3000

      // Get steps goal target
      const stepsGoal = goals.find(g => g.type === 'steps')
      const stepsTarget = stepsGoal?.target_value || 10000

      // Count completions
      const dailyGoals = goalsWithCompletion.filter(g => g.frequency !== 'weekly')
      const weeklyGoals = goalsWithCompletion.filter(g => g.frequency === 'weekly')

      return {
        ...member,
        goals: goalsWithCompletion,
        water_progress: {
          current: waterResult?.total || 0,
          target: waterTarget
        },
        exercise_progress: {
          current: exerciseResult?.total || 0,
          target: 30
        },
        steps_progress: {
          current: stepsResult?.total || 0,
          target: stepsTarget
        },
        completed_count: dailyGoals.filter(g => g.is_completed).length,
        total_goals: dailyGoals.length,
        weekly_completed_count: weeklyGoals.filter(g => g.is_completed).length,
        weekly_total_goals: weeklyGoals.length
      }
    }))

    return NextResponse.json(dashboard)
  } catch (error) {
    console.error('Dashboard error:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to load dashboard' },
      { status: 500 }
    )
  }
}



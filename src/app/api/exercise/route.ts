import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getAllRows, getFirstRow, executeQuery } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { getToday } from '@/lib/utils'
import { ExerciseEntry } from '@/types'

export const dynamic = 'force-dynamic'

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

    const entries = await getAllRows<ExerciseEntry>(
      'SELECT * FROM exercise_entries WHERE member_id = ? AND date = ? ORDER BY created_at DESC',
      [memberId, date]
    )

    const totalResult = await getFirstRow<{ total: number }>(
      'SELECT COALESCE(SUM(duration_minutes), 0) as total FROM exercise_entries WHERE member_id = ? AND date = ?',
      [memberId, date]
    )

    return NextResponse.json({
      entries,
      total: totalResult?.total || 0,
      target: 30
    })
  } catch (error) {
    console.error('Get exercise entries error:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to get exercise entries' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAuth(request)
    const { memberId, duration_minutes, activity, notes } = await request.json()

    if (!memberId || !duration_minutes) {
      return NextResponse.json(
        { error: 'Member ID and duration required' },
        { status: 400 }
      )
    }

    const date = getToday()
    await executeQuery(
      'INSERT INTO exercise_entries (id, member_id, duration_minutes, activity, notes, date) VALUES (?, ?, ?, ?, ?, ?)',
      [uuidv4(), memberId, duration_minutes, activity || null, notes || null, date]
    )

    const totalResult = await getFirstRow<{ total: number }>(
      'SELECT COALESCE(SUM(duration_minutes), 0) as total FROM exercise_entries WHERE member_id = ? AND date = ?',
      [memberId, date]
    )

    return NextResponse.json({
      success: true,
      total: totalResult?.total || 0
    })
  } catch (error) {
    console.error('Add exercise entry error:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to add exercise entry' },
      { status: 500 }
    )
  }
}


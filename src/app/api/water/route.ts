import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getAllRows, getFirstRow, executeQuery } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { getToday } from '@/lib/utils'
import { WaterEntry, Goal } from '@/types'

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

    const entries = await getAllRows<WaterEntry>(
      'SELECT * FROM water_entries WHERE member_id = ? AND date = ? ORDER BY created_at DESC',
      [memberId, date]
    )

    const totalResult = await getFirstRow<{ total: number }>(
      'SELECT COALESCE(SUM(amount_ml), 0) as total FROM water_entries WHERE member_id = ? AND date = ?',
      [memberId, date]
    )

    // Get water goal for target
    const waterGoal = await getFirstRow<Goal>(
      "SELECT target_value, target_unit FROM goals WHERE member_id = ? AND type = 'water'",
      [memberId]
    )

    return NextResponse.json({
      entries,
      total: totalResult?.total || 0,
      target: waterGoal?.target_value || 2000,
      unit: waterGoal?.target_unit || 'ml'
    })
  } catch (error) {
    console.error('Get water entries error:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to get water entries' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAuth(request)
    const { memberId, amount_ml } = await request.json()

    if (!memberId || !amount_ml) {
      return NextResponse.json(
        { error: 'Member ID and amount required' },
        { status: 400 }
      )
    }

    const date = getToday()
    await executeQuery(
      'INSERT INTO water_entries (id, member_id, amount_ml, date) VALUES (?, ?, ?, ?)',
      [uuidv4(), memberId, amount_ml, date]
    )

    const totalResult = await getFirstRow<{ total: number }>(
      'SELECT COALESCE(SUM(amount_ml), 0) as total FROM water_entries WHERE member_id = ? AND date = ?',
      [memberId, date]
    )

    return NextResponse.json({
      success: true,
      total: totalResult?.total || 0
    })
  } catch (error) {
    console.error('Add water entry error:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to add water entry' },
      { status: 500 }
    )
  }
}


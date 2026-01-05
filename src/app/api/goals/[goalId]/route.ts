import { NextRequest, NextResponse } from 'next/server'
import { getFirstRow, executeQuery } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { Goal } from '@/types'

export const dynamic = 'force-dynamic'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ goalId: string }> }
) {
  try {
    requireAuth(request)
    const { goalId } = await params
    const updates = await request.json()

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

    const updateFields: string[] = []
    const values: unknown[] = []

    if (updates.title !== undefined) {
      updateFields.push('title = ?')
      values.push(updates.title)
    }
    if (updates.description !== undefined) {
      updateFields.push('description = ?')
      values.push(updates.description)
    }
    if (updates.target_value !== undefined) {
      updateFields.push('target_value = ?')
      values.push(updates.target_value)
    }
    if (updates.target_unit !== undefined) {
      updateFields.push('target_unit = ?')
      values.push(updates.target_unit)
    }
    if (updates.due_time !== undefined) {
      updateFields.push('due_time = ?')
      values.push(updates.due_time)
    }
    if (updates.reminder_enabled !== undefined) {
      updateFields.push('reminder_enabled = ?')
      values.push(updates.reminder_enabled ? 1 : 0)
    }
    if (updates.reminder_time !== undefined) {
      updateFields.push('reminder_time = ?')
      values.push(updates.reminder_time)
    }
    if (updates.frequency !== undefined) {
      updateFields.push('frequency = ?')
      values.push(updates.frequency)
    }

    if (updateFields.length > 0) {
      values.push(goalId)
      await executeQuery(
        `UPDATE goals SET ${updateFields.join(', ')} WHERE id = ?`,
        values
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update goal error:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to update goal' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ goalId: string }> }
) {
  try {
    requireAuth(request)
    const { goalId } = await params

    const goal = await getFirstRow<Goal>(
      "SELECT * FROM goals WHERE id = ? AND type = 'custom'",
      [goalId]
    )
    if (!goal) {
      return NextResponse.json(
        { error: 'Custom goal not found' },
        { status: 404 }
      )
    }

    await executeQuery('DELETE FROM goals WHERE id = ?', [goalId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete goal error:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to delete goal' },
      { status: 500 }
    )
  }
}


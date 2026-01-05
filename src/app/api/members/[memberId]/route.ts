import { NextRequest, NextResponse } from 'next/server'
import { getFirstRow, executeQuery } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { Member } from '@/types'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const auth = requireAuth(request)
    const { memberId } = await params

    // Check member count (min 2)
    const countResult = await getFirstRow<{ count: number }>(
      'SELECT COUNT(*) as count FROM family_members WHERE family_id = ?',
      [auth.familyId]
    )
    if (countResult && countResult.count <= 2) {
      return NextResponse.json(
        { error: 'Minimum 2 family members required' },
        { status: 400 }
      )
    }

    // Verify member belongs to this family
    const member = await getFirstRow<Member>(
      'SELECT * FROM family_members WHERE id = ? AND family_id = ?',
      [memberId, auth.familyId]
    )
    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    // Delete member (cascades to goals, completions, etc.)
    await executeQuery('DELETE FROM family_members WHERE id = ?', [memberId])

    // Also delete goals assigned BY this member to others
    await executeQuery('DELETE FROM goals WHERE assigned_by = ?', [memberId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete member error:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to delete member' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const auth = requireAuth(request)
    const { memberId } = await params
    const { avatar_color, name } = await request.json()

    // Verify member belongs to this family
    const member = await getFirstRow<Member>(
      'SELECT * FROM family_members WHERE id = ? AND family_id = ?',
      [memberId, auth.familyId]
    )
    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    const updates: string[] = []
    const values: (string | number | null)[] = []

    if (avatar_color) {
      updates.push('avatar_color = ?')
      values.push(avatar_color)
    }
    if (name) {
      updates.push('name = ?')
      values.push(name)
    }

    if (updates.length > 0) {
      values.push(memberId)
      await executeQuery(
        `UPDATE family_members SET ${updates.join(', ')} WHERE id = ?`,
        values
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update member error:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to update member' },
      { status: 500 }
    )
  }
}


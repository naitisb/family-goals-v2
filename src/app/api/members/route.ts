import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getAllRows, getFirstRow, executeQuery } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { Member } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request)

    const members = await getAllRows<Member>(
      'SELECT id, family_id, name, avatar_color, profile_photo_url, created_at FROM family_members WHERE family_id = ?',
      [auth.familyId]
    )

    return NextResponse.json(members)
  } catch (error) {
    console.error('Get members error:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to get members' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    const { name, pin, avatarColor } = await request.json()

    if (!name || !pin || pin.length !== 4) {
      return NextResponse.json(
        { error: 'Name and 4-digit PIN required' },
        { status: 400 }
      )
    }

    // Check member count (max 10)
    const countResult = await getFirstRow<{ count: number }>(
      'SELECT COUNT(*) as count FROM family_members WHERE family_id = ?',
      [auth.familyId]
    )
    if (countResult && countResult.count >= 10) {
      return NextResponse.json(
        { error: 'Maximum 10 family members allowed' },
        { status: 400 }
      )
    }

    const memberId = uuidv4()
    const color = avatarColor || '#6366f1'

    await executeQuery(
      'INSERT INTO family_members (id, family_id, name, pin, avatar_color) VALUES (?, ?, ?, ?, ?)',
      [memberId, auth.familyId, name, pin, color]
    )

    // Create default goals for new member
    // Default water target: 3L (3000ml) - general adult recommendation
    await executeQuery(
      `INSERT INTO goals (id, member_id, type, title, description, target_value, target_unit, frequency)
       VALUES (?, ?, 'water', 'Drink Water', 'Recommended daily intake: Men 3.7L (125 oz), Women 2.7L (91 oz), Teens 2-3L, Children 1-2L. Source: National Academies of Sciences - https://nap.nationalacademies.org/read/10925', 3000, 'ml', 'daily')`,
      [uuidv4(), memberId]
    )

    await executeQuery(
      `INSERT INTO goals (id, member_id, type, title, description, target_value, frequency)
       VALUES (?, ?, 'exercise', 'Exercise', 'Stay active!', 30, 'daily')`,
      [uuidv4(), memberId]
    )

    await executeQuery(
      `INSERT INTO goals (id, member_id, type, title, description, target_value, target_unit, frequency)
       VALUES (?, ?, 'steps', 'Daily Steps', 'Track your daily steps and stay active. Recommended: 10,000 steps per day', 10000, 'steps', 'daily')`,
      [uuidv4(), memberId]
    )

    await executeQuery(
      `INSERT INTO goals (id, member_id, type, title, description, is_custom, frequency)
       VALUES (?, ?, 'custom', 'My Goal', 'Set your personal goal!', 1, 'daily')`,
      [uuidv4(), memberId]
    )

    // Create assigned goals from other members
    const otherMembers = await getAllRows<Member>(
      'SELECT id, name FROM family_members WHERE family_id = ? AND id != ?',
      [auth.familyId, memberId]
    )

    for (const other of otherMembers) {
      // Other members assign to new member
      await executeQuery(
        `INSERT INTO goals (id, member_id, type, title, description, assigned_by, frequency)
         VALUES (?, ?, 'assigned', 'Goal from ${other.name}', 'Complete this goal!', ?, 'daily')`,
        [uuidv4(), memberId, other.id]
      )

      // New member assigns to other members
      await executeQuery(
        `INSERT INTO goals (id, member_id, type, title, description, assigned_by, frequency)
         VALUES (?, ?, 'assigned', 'Goal from ${name}', 'Complete this goal!', ?, 'daily')`,
        [uuidv4(), other.id, memberId]
      )
    }

    return NextResponse.json({
      id: memberId,
      name,
      avatar_color: color
    })
  } catch (error) {
    console.error('Add member error:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to add member' },
      { status: 500 }
    )
  }
}



import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getAllRows, executeQuery } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { CustomExercise } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request)

    const exercises = await getAllRows<CustomExercise>(
      `SELECT ce.*, fm.name as created_by_name
       FROM custom_exercises ce
       LEFT JOIN family_members fm ON ce.created_by = fm.id
       WHERE ce.family_id = ?
       ORDER BY ce.name`,
      [auth.familyId]
    )

    return NextResponse.json(exercises)
  } catch (error) {
    console.error('Get custom exercises error:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to get custom exercises' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    const { name, icon, default_duration, memberId } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Exercise name required' },
        { status: 400 }
      )
    }

    const exerciseId = uuidv4()
    await executeQuery(
      'INSERT INTO custom_exercises (id, family_id, name, icon, default_duration, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [exerciseId, auth.familyId, name, icon || '🏃', default_duration || 30, memberId || null]
    )

    return NextResponse.json({
      id: exerciseId,
      name,
      icon: icon || '🏃',
      default_duration: default_duration || 30
    })
  } catch (error) {
    console.error('Create custom exercise error:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to create custom exercise' },
      { status: 500 }
    )
  }
}



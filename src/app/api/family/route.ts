import { NextRequest, NextResponse } from 'next/server'
import { getFirstRow, executeQuery } from '@/lib/db'
import { requireAuth, comparePassword } from '@/lib/auth'
import { Family } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request)

    const family = await getFirstRow<Family>(
      'SELECT id, name, created_at FROM families WHERE id = ?',
      [auth.familyId]
    )

    if (!family) {
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(family)
  } catch (error) {
    console.error('Get family error:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to get family' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    const { name } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Family name required' },
        { status: 400 }
      )
    }

    // Check if name is already taken by another family
    const existing = await getFirstRow<Family>(
      'SELECT * FROM families WHERE name = ? AND id != ?',
      [name, auth.familyId]
    )
    if (existing) {
      return NextResponse.json(
        { error: 'Family name already exists' },
        { status: 400 }
      )
    }

    await executeQuery(
      'UPDATE families SET name = ? WHERE id = ?',
      [name, auth.familyId]
    )

    return NextResponse.json({ success: true, name })
  } catch (error) {
    console.error('Update family error:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to update family' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json(
        { error: 'Password required for deletion' },
        { status: 400 }
      )
    }

    const family = await getFirstRow<Family>(
      'SELECT * FROM families WHERE id = ?',
      [auth.familyId]
    )
    if (!family) {
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      )
    }

    const validPassword = await comparePassword(password, family.password_hash)
    if (!validPassword) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }

    // Delete family (cascades to all related data)
    await executeQuery('DELETE FROM families WHERE id = ?', [auth.familyId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete family error:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to delete family' },
      { status: 500 }
    )
  }
}


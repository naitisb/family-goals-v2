import { NextRequest, NextResponse } from 'next/server'
import { getAllRows } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { Photo } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('memberId')
    const goalId = searchParams.get('goalId')
    const type = searchParams.get('type')

    let query = 'SELECT * FROM photos WHERE family_id = ?'
    const params: unknown[] = [auth.familyId]

    if (memberId) {
      query += ' AND member_id = ?'
      params.push(memberId)
    }
    if (goalId) {
      query += ' AND goal_id = ?'
      params.push(goalId)
    }
    if (type) {
      query += ' AND type = ?'
      params.push(type)
    }

    query += ' ORDER BY created_at DESC'

    const photos = await getAllRows<Photo>(query, params)

    return NextResponse.json(photos)
  } catch (error) {
    console.error('Get photos error:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to get photos' },
      { status: 500 }
    )
  }
}


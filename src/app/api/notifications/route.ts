import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getAllRows, getFirstRow, executeQuery } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { Notification } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    requireAuth(request)
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('memberId')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID required' },
        { status: 400 }
      )
    }

    let query = `
      SELECT n.*, g.title as goal_title
      FROM notifications n
      LEFT JOIN goals g ON n.goal_id = g.id
      WHERE n.member_id = ?
    `
    if (unreadOnly) {
      query += ' AND n.is_read = 0'
    }
    query += ' ORDER BY n.created_at DESC LIMIT 50'

    const notifications = await getAllRows<Notification>(query, [memberId])

    const unreadResult = await getFirstRow<{ count: number }>(
      'SELECT COUNT(*) as count FROM notifications WHERE member_id = ? AND is_read = 0',
      [memberId]
    )

    return NextResponse.json({
      notifications,
      unreadCount: unreadResult?.count || 0
    })
  } catch (error) {
    console.error('Get notifications error:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to get notifications' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAuth(request)
    const { memberId, type, title, message, goalId } = await request.json()

    if (!memberId || !type || !title) {
      return NextResponse.json(
        { error: 'Member ID, type, and title required' },
        { status: 400 }
      )
    }

    const notificationId = uuidv4()
    await executeQuery(
      'INSERT INTO notifications (id, member_id, type, title, message, goal_id) VALUES (?, ?, ?, ?, ?, ?)',
      [notificationId, memberId, type, title, message || null, goalId || null]
    )

    return NextResponse.json({ success: true, notificationId })
  } catch (error) {
    console.error('Create notification error:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}



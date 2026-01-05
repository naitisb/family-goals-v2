import { NextRequest, NextResponse } from 'next/server'
import { getFirstRow } from '@/lib/db'
import { requireAuth, generateToken } from '@/lib/auth'
import { Member } from '@/types'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    const { memberId, pin } = await request.json()

    if (!memberId || !pin) {
      return NextResponse.json(
        { error: 'Member ID and PIN required' },
        { status: 400 }
      )
    }

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

    if (member.pin !== pin) {
      return NextResponse.json(
        { error: 'Invalid PIN' },
        { status: 401 }
      )
    }

    const token = generateToken({ familyId: auth.familyId, memberId: member.id })

    return NextResponse.json({
      token,
      member: {
        id: member.id,
        name: member.name,
        avatar_color: member.avatar_color,
        profile_photo_url: member.profile_photo_url
      }
    })
  } catch (error) {
    console.error('PIN verification error:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'PIN verification failed' },
      { status: 500 }
    )
  }
}


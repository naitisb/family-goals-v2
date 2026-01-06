import { NextRequest, NextResponse } from 'next/server'
import { getFirstRow, getAllRows } from '@/lib/db'
import { comparePassword, generateToken } from '@/lib/auth'
import { Family, Member } from '@/types'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { familyName, password } = await request.json()

    if (!familyName || !password) {
      return NextResponse.json(
        { error: 'Family name and password required' },
        { status: 400 }
      )
    }

    const family = await getFirstRow<Family>(
      'SELECT * FROM families WHERE name = ?',
      [familyName]
    )

    if (!family) {
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 401 }
      )
    }

    const validPassword = await comparePassword(password, family.password_hash)
    if (!validPassword) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }

    const members = await getAllRows<Member>(
      'SELECT id, family_id, name, avatar_color, profile_photo_url, created_at FROM family_members WHERE family_id = ?',
      [family.id]
    )

    const token = generateToken({ familyId: family.id })

    return NextResponse.json({
      token,
      family: { id: family.id, name: family.name },
      members
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}



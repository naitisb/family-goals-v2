import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { executeQuery, getFirstRow } from '@/lib/db'
import { hashPassword, generateToken } from '@/lib/auth'
import { Family } from '@/types'

export const dynamic = 'force-dynamic'

interface RegisterMember {
  name: string
  pin: string
  avatarColor?: string
}

export async function POST(request: NextRequest) {
  try {
    const { familyName, password, members } = await request.json()

    if (!familyName || !password || !members || members.length < 2) {
      return NextResponse.json(
        { error: 'Family name, password, and at least 2 members required' },
        { status: 400 }
      )
    }

    if (members.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 family members allowed' },
        { status: 400 }
      )
    }

    // Check if family already exists
    const existing = await getFirstRow<Family>(
      'SELECT * FROM families WHERE name = ?',
      [familyName]
    )
    if (existing) {
      return NextResponse.json(
        { error: 'Family name already exists' },
        { status: 400 }
      )
    }

    // Create family
    const familyId = uuidv4()
    const passwordHash = await hashPassword(password)
    await executeQuery(
      'INSERT INTO families (id, name, password_hash) VALUES (?, ?, ?)',
      [familyId, familyName, passwordHash]
    )

    // Create family settings
    await executeQuery(
      'INSERT INTO family_settings (id, family_id) VALUES (?, ?)',
      [uuidv4(), familyId]
    )

    // Create members and their default goals
    const createdMembers: Array<{ id: string; name: string; avatar_color: string }> = []
    
    for (const member of members as RegisterMember[]) {
      const memberId = uuidv4()
      const avatarColor = member.avatarColor || '#6366f1'
      
      await executeQuery(
        'INSERT INTO family_members (id, family_id, name, pin, avatar_color) VALUES (?, ?, ?, ?, ?)',
        [memberId, familyId, member.name, member.pin, avatarColor]
      )

      createdMembers.push({ id: memberId, name: member.name, avatar_color: avatarColor })

      // Create default water goal with recommended intake guidelines
      await executeQuery(
        `INSERT INTO goals (id, member_id, type, title, description, target_value, target_unit, frequency)
         VALUES (?, ?, 'water', 'Drink Water', 'Recommended daily intake: Men 3.7L, Women 2.7L, Teens 2-3L, Children 1-2L (source: Mayo Clinic)', 3000, 'ml', 'daily')`,
        [uuidv4(), memberId]
      )

      // Create default exercise goal
      await executeQuery(
        `INSERT INTO goals (id, member_id, type, title, description, target_value, frequency)
         VALUES (?, ?, 'exercise', 'Exercise', 'Stay active!', 30, 'daily')`,
        [uuidv4(), memberId]
      )

      // Create one default custom goal
      await executeQuery(
        `INSERT INTO goals (id, member_id, type, title, description, is_custom, frequency)
         VALUES (?, ?, 'custom', 'My Goal', 'Set your personal goal!', 1, 'daily')`,
        [uuidv4(), memberId]
      )
    }

    // Create assigned goals (each member assigns to others)
    for (let i = 0; i < createdMembers.length; i++) {
      const assigner = createdMembers[i]
      for (let j = 0; j < createdMembers.length; j++) {
        if (i !== j) {
          const assignee = createdMembers[j]
          await executeQuery(
            `INSERT INTO goals (id, member_id, type, title, description, assigned_by, frequency)
             VALUES (?, ?, 'assigned', 'Goal from ${assigner.name}', 'Complete this goal!', ?, 'daily')`,
            [uuidv4(), assignee.id, assigner.id]
          )
        }
      }
    }

    const token = generateToken({ familyId })

    return NextResponse.json({
      token,
      family: { id: familyId, name: familyName },
      members: createdMembers
    })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}


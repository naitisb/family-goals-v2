import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getFirstRow, executeQuery } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { FamilySettings } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request)

    let settings = await getFirstRow<FamilySettings>(
      'SELECT * FROM family_settings WHERE family_id = ?',
      [auth.familyId]
    )

    if (!settings) {
      // Create default settings
      const settingsId = uuidv4()
      await executeQuery(
        'INSERT INTO family_settings (id, family_id) VALUES (?, ?)',
        [settingsId, auth.familyId]
      )
      settings = await getFirstRow<FamilySettings>(
        'SELECT * FROM family_settings WHERE family_id = ?',
        [auth.familyId]
      )
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Get settings error:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to get settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    const updates = await request.json()

    const existing = await getFirstRow<FamilySettings>(
      'SELECT * FROM family_settings WHERE family_id = ?',
      [auth.familyId]
    )

    if (existing) {
      const updateFields: string[] = []
      const values: unknown[] = []

      const allowedFields = [
        'theme', 'background_type', 'background_value', 'background_fit',
        'background_position', 'background_blur', 'background_overlay',
        'background_overlay_color', 'background_contain_color', 'accent_color'
      ]

      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          updateFields.push(`${field} = ?`)
          values.push(updates[field])
        }
      }

      if (updateFields.length > 0) {
        updateFields.push('updated_at = CURRENT_TIMESTAMP')
        values.push(auth.familyId)
        await executeQuery(
          `UPDATE family_settings SET ${updateFields.join(', ')} WHERE family_id = ?`,
          values
        )
      }
    } else {
      await executeQuery(
        `INSERT INTO family_settings (id, family_id, theme, background_type, background_value, 
          background_fit, background_position, background_blur, background_overlay, 
          background_overlay_color, background_contain_color, accent_color)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          uuidv4(),
          auth.familyId,
          updates.theme || 'dark',
          updates.background_type || 'gradient',
          updates.background_value || 'default',
          updates.background_fit || 'cover',
          updates.background_position || 'center',
          updates.background_blur || 0,
          updates.background_overlay || 0.6,
          updates.background_overlay_color || '#000000',
          updates.background_contain_color || '#0f0f23',
          updates.accent_color || '#8b5cf6'
        ]
      )
    }

    const settings = await getFirstRow<FamilySettings>(
      'SELECT * FROM family_settings WHERE family_id = ?',
      [auth.familyId]
    )

    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error('Update settings error:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}


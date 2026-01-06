import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { v4 as uuidv4 } from 'uuid'
import { executeQuery } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    const formData = await request.formData()
    
    const file = formData.get('file') as File
    const type = formData.get('type') as string
    const memberId = formData.get('memberId') as string | null
    const goalId = formData.get('goalId') as string | null
    const caption = formData.get('caption') as string | null

    if (!file || !type) {
      return NextResponse.json(
        { error: 'File and type required' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const extension = file.name.split('.').pop() || 'jpg'
    const filename = `${type}/${auth.familyId}/${memberId || 'family'}/${uuidv4()}.${extension}`

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: false
    })

    // Save to database
    const photoId = uuidv4()
    await executeQuery(
      `INSERT INTO photos (id, family_id, member_id, goal_id, type, url, original_name, caption)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [photoId, auth.familyId, memberId, goalId, type, blob.url, file.name, caption]
    )

    // If this is a profile photo, update the member's profile_photo_url
    if (type === 'profile' && memberId) {
      await executeQuery(
        'UPDATE family_members SET profile_photo_url = ? WHERE id = ?',
        [blob.url, memberId]
      )
    }

    return NextResponse.json({
      url: blob.url,
      photoId
    })
  } catch (error) {
    console.error('Upload error:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}



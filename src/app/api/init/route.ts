import { NextResponse } from 'next/server'
import { initializeSchema } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    await initializeSchema()
    return NextResponse.json({ success: true, message: 'Database schema initialized' })
  } catch (error) {
    console.error('Init schema error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize schema' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    await initializeSchema()
    return NextResponse.json({ success: true, message: 'Database schema initialized' })
  } catch (error) {
    console.error('Init schema error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize schema' },
      { status: 500 }
    )
  }
}



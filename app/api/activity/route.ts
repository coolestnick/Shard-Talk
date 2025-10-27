import { NextRequest, NextResponse } from 'next/server'
import { getMongoDb } from '@/lib/mongodb'
import { ActivityDoc } from '@/types/user'

/**
 * GET /api/activity
 *
 * NOTE: This endpoint is DEPRECATED and should NOT be called by the frontend.
 * It's kept for backward compatibility with external integrations only.
 *
 * The frontend should NOT track or fetch user activity data.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const address = (searchParams.get('address') || '').toLowerCase()
    const type = searchParams.get('type') as ActivityDoc['type'] | null
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))

    // Try to connect to database
    let db
    try {
      db = await getMongoDb()
    } catch (dbError: any) {
      console.error('Database connection error in /api/activity:', dbError)
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        items: [],
        total: 0,
        page,
        limit
      }, { status: 200 }) // Return 200 to prevent retries
    }

    const query: any = {}
    if (address) query.address = address
    if (type) query.type = type

    try {
      const cursor = db.collection<ActivityDoc>('activity')
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)

      const [items, total] = await Promise.all([
        cursor.toArray(),
        db.collection<ActivityDoc>('activity').countDocuments(query)
      ])

      return NextResponse.json({
        success: true,
        items,
        total,
        page,
        limit
      }, {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (queryError: any) {
      console.error('Query error in /api/activity:', queryError)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch activity',
        items: [],
        total: 0,
        page,
        limit
      }, { status: 200 })
    }
  } catch (error: any) {
    console.error('Unexpected error in GET /api/activity:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error.message
    }, { status: 500 })
  }
}

/**
 * POST /api/activity
 *
 * NOTE: This endpoint is DEPRECATED and should NOT be called by the frontend.
 * Activity logging has been disabled to improve performance and privacy.
 */
export async function POST(req: NextRequest) {
  try {
    let body
    try {
      body = await req.json()
    } catch (parseError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON in request body'
      }, { status: 400 })
    }

    const address: string = (body.address || '').toLowerCase()
    const type: ActivityDoc['type'] = body.type
    const metadata: Record<string, any> | undefined = body.metadata

    if (!address || !type) {
      return NextResponse.json({
        success: false,
        error: 'address and type are required'
      }, { status: 400 })
    }

    // Try to connect to database
    let db
    try {
      db = await getMongoDb()
    } catch (dbError: any) {
      console.error('Database connection error in POST /api/activity:', dbError)
      return NextResponse.json({
        success: false,
        error: 'Database connection failed'
      }, { status: 503 })
    }

    try {
      const doc: ActivityDoc = {
        address,
        type,
        metadata,
        createdAt: new Date(),
      }
      await db.collection<ActivityDoc>('activity').insertOne(doc)
      return NextResponse.json({
        success: true,
        ok: true
      }, { status: 201 })
    } catch (insertError: any) {
      console.error('Insert error in POST /api/activity:', insertError)
      return NextResponse.json({
        success: false,
        error: 'Failed to save activity'
      }, { status: 503 })
    }
  } catch (error: any) {
    console.error('Unexpected error in POST /api/activity:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error.message
    }, { status: 500 })
  }
}



import { NextRequest } from 'next/server'
import { getMongoDb } from '@/lib/mongodb'
import { UserDoc } from '@/types/user'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const address = (searchParams.get('address') || '').toLowerCase()
    const username = searchParams.get('username') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '0', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))

    if (address) {
      try {
        const db = await getMongoDb()
        const user = await db.collection<UserDoc>('users').findOne({ address })
        return new Response(JSON.stringify({ user }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      } catch (dbError: any) {
        console.error('Database error fetching user by address:', dbError)
        return new Response(JSON.stringify({
          error: 'Database connection failed',
          user: null
        }), {
          status: 200,  // Return 200 with null user instead of 500
          headers: { 'Content-Type': 'application/json' }
        })
      }
    }

    if (username) {
      try {
        const db = await getMongoDb()
        const exists = await db.collection<UserDoc>('users').findOne({ username })
        return new Response(JSON.stringify({ available: !exists }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      } catch (dbError: any) {
        console.error('Database error checking username:', dbError)
        return new Response(JSON.stringify({
          error: 'Database connection failed',
          available: true  // Assume available on error to allow users to proceed
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      }
    }

    // List users paginated when no filters provided
    if (page > 0) {
      try {
        const db = await getMongoDb()
        const cursor = db.collection<UserDoc>('users')
          .find({})
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
        const [items, total] = await Promise.all([
          cursor.toArray(),
          db.collection<UserDoc>('users').countDocuments({})
        ])
        return new Response(JSON.stringify({ items, total, page, limit }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      } catch (dbError: any) {
        console.error('Database error listing users:', dbError)
        return new Response(JSON.stringify({
          error: 'Database connection failed',
          items: [],
          total: 0,
          page,
          limit
        }), {
          status: 200,  // Return empty list instead of 500
          headers: { 'Content-Type': 'application/json' }
        })
      }
    }

    return new Response(JSON.stringify({ error: 'Missing query param: address or username' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    console.error('Unexpected error in GET /api/users:', error)
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const address: string = (body.address || '').toLowerCase()
    const username: string | undefined = body.username?.trim()

    if (!address) {
      return new Response(JSON.stringify({ error: 'address is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    try {
      const db = await getMongoDb()
      const now = new Date()

      const update: Partial<UserDoc> = { updatedAt: now }
      if (typeof username === 'string' && username.length > 0) {
        update.username = username
      }

      // Upsert user
      const res = await db.collection<UserDoc>('users').findOneAndUpdate(
        { address },
        { $setOnInsert: { address, createdAt: now }, $set: update },
        { upsert: true, returnDocument: 'after' }
      )

      return new Response(JSON.stringify({ user: res }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (e: any) {
      console.error('Database error in POST /api/users:', e)

      // Handle unique username conflict
      if (e?.code === 11000 && e?.message?.includes('username')) {
        return new Response(JSON.stringify({ error: 'Username already taken' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      // Database connection or other DB error
      return new Response(JSON.stringify({
        error: 'Database operation failed',
        message: e.message
      }), {
        status: 503,  // Service Unavailable instead of 500
        headers: { 'Content-Type': 'application/json' }
      })
    }
  } catch (error: any) {
    console.error('Unexpected error in POST /api/users:', error)
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}



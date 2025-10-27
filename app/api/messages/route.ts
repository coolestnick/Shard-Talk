import { NextRequest, NextResponse } from 'next/server'
import { getMongoDb } from '@/lib/mongodb'

/**
 * Messages API Endpoint
 *
 * FRONTEND USAGE:
 * - Only POST method is used by the frontend to store messages after blockchain confirmation
 * - Frontend does NOT call GET to avoid unnecessary database reads
 *
 * EXTERNAL INTEGRATIONS:
 * - GET endpoint is available for external integrations and analytics
 * - Can be used to query message count and retrieve message history
 */

// Message type definition
interface Message {
  messageId: number
  sender: string
  content: string
  timestamp: number
  transactionHash?: string
  createdAt: Date
}

// GET /api/messages - Fetch messages by address or get message count
// NOTE: Not called by frontend, available for external integrations only
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    const count = searchParams.get('count') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Validate required parameters
    if (!address) {
      return NextResponse.json(
        {
          success: false,
          error: 'Address parameter is required',
          example: '/api/messages?address=0x123...&count=true'
        },
        { status: 400 }
      )
    }

    // Validate address format
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid Ethereum address format',
          address: address
        },
        { status: 400 }
      )
    }

    // Validate pagination parameters
    if (page < 1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Page must be >= 1',
          provided: page
        },
        { status: 400 }
      )
    }

    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        {
          success: false,
          error: 'Limit must be between 1 and 100',
          provided: limit
        },
        { status: 400 }
      )
    }

    const normalizedAddress = address.toLowerCase()

    // Try to connect to database
    let db
    try {
      db = await getMongoDb()
    } catch (dbError: any) {
      console.error('Database connection error:', dbError)
      return NextResponse.json(
        {
          success: false,
          error: 'Database connection failed',
          message: 'Unable to connect to database. Please try again later.',
          address: normalizedAddress,
          messageCount: 0
        },
        { status: 200 } // Return 200 to prevent retries
      )
    }

    const messagesCollection = db.collection('messages')

    // If count parameter is true, return only the count
    if (count) {
      try {
        const messageCount = await messagesCollection.countDocuments({
          sender: normalizedAddress,
        })

        return NextResponse.json({
          success: true,
          address: normalizedAddress,
          messageCount,
        })
      } catch (queryError: any) {
        console.error('Error counting messages:', queryError)
        return NextResponse.json({
          success: false,
          error: 'Failed to count messages',
          address: normalizedAddress,
          messageCount: 0,
        }, { status: 200 }) // Return 200 with safe default
      }
    }

    // Otherwise, return paginated messages
    try {
      const skip = (page - 1) * limit
      const messages = await messagesCollection
        .find({ sender: normalizedAddress })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .toArray()

      const totalMessages = await messagesCollection.countDocuments({
        sender: normalizedAddress,
      })

      return NextResponse.json({
        success: true,
        address: normalizedAddress,
        messages,
        pagination: {
          page,
          limit,
          total: totalMessages,
          totalPages: Math.ceil(totalMessages / limit),
        },
      })
    } catch (queryError: any) {
      console.error('Error fetching messages:', queryError)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch messages',
        address: normalizedAddress,
        messages: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      }, { status: 200 }) // Return 200 with empty data
    }
  } catch (error: any) {
    console.error('Unexpected error in GET /api/messages:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error.message || 'An unexpected error occurred'
      },
      { status: 500 }
    )
  }
}

// POST /api/messages - Save a message to MongoDB
export async function POST(request: NextRequest) {
  try {
    // Parse request body with error handling
    let body
    try {
      body = await request.json()
    } catch (parseError: any) {
      console.error('Error parsing request body:', parseError)
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body'
        },
        { status: 400 }
      )
    }

    const { messageId, sender, content, timestamp, transactionHash } = body

    // Validate required fields
    if (!messageId || !sender || !content || !timestamp) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: messageId, sender, content, timestamp',
          received: {
            messageId: !!messageId,
            sender: !!sender,
            content: !!content,
            timestamp: !!timestamp,
          }
        },
        { status: 400 }
      )
    }

    // Validate field types
    if (typeof messageId !== 'number') {
      return NextResponse.json(
        {
          success: false,
          error: 'messageId must be a number',
          received: typeof messageId
        },
        { status: 400 }
      )
    }

    if (!sender.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid Ethereum address format for sender',
          sender
        },
        { status: 400 }
      )
    }

    if (typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'content must be a non-empty string'
        },
        { status: 400 }
      )
    }

    if (typeof timestamp !== 'number' || timestamp <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'timestamp must be a positive number'
        },
        { status: 400 }
      )
    }

    // Try to connect to database
    let db
    try {
      db = await getMongoDb()
    } catch (dbError: any) {
      console.error('Database connection error:', dbError)
      return NextResponse.json(
        {
          success: false,
          error: 'Database connection failed',
          message: 'Unable to connect to database. Message not saved.'
        },
        { status: 503 } // Service Unavailable
      )
    }

    const messagesCollection = db.collection('messages')
    const normalizedAddress = sender.toLowerCase()

    // Prepare message document
    const messageDoc: Message = {
      messageId,
      sender: normalizedAddress,
      content: content.trim(),
      timestamp,
      transactionHash,
      createdAt: new Date(),
    }

    // Insert or update message (upsert based on messageId)
    try {
      const result = await messagesCollection.updateOne(
        { messageId },
        { $set: messageDoc },
        { upsert: true }
      )

      return NextResponse.json({
        success: true,
        messageId,
        inserted: result.upsertedCount > 0,
        updated: result.modifiedCount > 0,
        message: result.upsertedCount > 0 ? 'Message saved successfully' : 'Message updated successfully'
      })
    } catch (dbError: any) {
      console.error('Error saving message:', dbError)

      // Handle duplicate key error
      if (dbError.code === 11000) {
        return NextResponse.json(
          {
            success: false,
            error: 'Message with this ID already exists',
            messageId
          },
          { status: 409 }
        )
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to save message',
          message: dbError.message
        },
        { status: 503 } // Service Unavailable
      )
    }
  } catch (error: any) {
    console.error('Unexpected error in POST /api/messages:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error.message || 'An unexpected error occurred'
      },
      { status: 500 }
    )
  }
}

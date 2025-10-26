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

    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400 }
      )
    }

    const normalizedAddress = address.toLowerCase()
    const db = await getMongoDb()
    const messagesCollection = db.collection('messages')

    // If count parameter is true, return only the count
    if (count) {
      const messageCount = await messagesCollection.countDocuments({
        sender: normalizedAddress,
      })

      return NextResponse.json({
        address: normalizedAddress,
        messageCount,
      })
    }

    // Otherwise, return paginated messages
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
      address: normalizedAddress,
      messages,
      pagination: {
        page,
        limit,
        total: totalMessages,
        totalPages: Math.ceil(totalMessages / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// POST /api/messages - Save a message to MongoDB
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messageId, sender, content, timestamp, transactionHash } = body

    if (!messageId || !sender || !content || !timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields: messageId, sender, content, timestamp' },
        { status: 400 }
      )
    }

    const db = await getMongoDb()
    const messagesCollection = db.collection('messages')

    const normalizedAddress = sender.toLowerCase()

    // Prepare message document
    const messageDoc: Message = {
      messageId,
      sender: normalizedAddress,
      content,
      timestamp,
      transactionHash,
      createdAt: new Date(),
    }

    // Insert or update message (upsert based on messageId)
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
    })
  } catch (error: any) {
    console.error('Error saving message:', error)

    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Message with this ID already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to save message' },
      { status: 500 }
    )
  }
}

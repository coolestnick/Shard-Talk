import { NextRequest, NextResponse } from 'next/server'
import { getMongoDb } from '@/lib/mongodb'

/**
 * GET /api/totalmsg/[address]
 *
 * Simple, fast endpoint to get total message count for a wallet address
 *
 * Example: /api/totalmsg/0x22D74ADFB45147d7588aFA3ba0eF1c363b7dFcFF
 *
 * Returns: { success: true, address: "0x...", totalMessages: 5 }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const address = params.address

    // Validate address format
    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid Ethereum address format',
          address: address || 'missing',
          example: '/api/totalmsg/0x22D74ADFB45147d7588aFA3ba0eF1c363b7dFcFF',
          totalMessages: 0
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
          address: normalizedAddress,
          totalMessages: 0,
          message: 'Unable to fetch message count at this time'
        },
        { status: 200 } // Return 200 to prevent retries
      )
    }

    const messagesCollection = db.collection('messages')

    // Get total message count for this address
    try {
      const totalMessages = await messagesCollection.countDocuments({
        sender: normalizedAddress,
      })

      return NextResponse.json(
        {
          success: true,
          address: normalizedAddress,
          totalMessages,
        },
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
          },
        }
      )
    } catch (queryError: any) {
      console.error('Error counting messages:', queryError)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to count messages',
          address: normalizedAddress,
          totalMessages: 0,
        },
        { status: 200 } // Return 200 with safe default
      )
    }
  } catch (error: any) {
    console.error('Unexpected error in GET /api/totalmsg:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error.message || 'An unexpected error occurred',
        totalMessages: 0,
      },
      { status: 500 }
    )
  }
}

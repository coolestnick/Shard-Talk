/**
 * Add Test Messages to MongoDB
 *
 * Manually adds test messages for a specific wallet address
 *
 * Usage: node scripts/add-test-messages.js
 */

require('dotenv').config()
const { MongoClient } = require('mongodb')

const MONGODB_URI = process.env.MONGODB_URI
const MONGODB_DB = process.env.MONGODB_DB || 'shardtalk'

// The wallet address to add messages for
const WALLET_ADDRESS = '0x472ce8ba3840be35a309b11990f2c02f1e4c9c5e'
const NUM_MESSAGES = 6

async function addTestMessages() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables')
    process.exit(1)
  }

  console.log('🚀 Adding test messages to MongoDB...')
  console.log(`📦 Database: ${MONGODB_DB}`)
  console.log(`👤 Wallet: ${WALLET_ADDRESS}`)
  console.log(`📨 Messages to add: ${NUM_MESSAGES}`)
  console.log('')

  let client

  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI)
    await client.connect()
    console.log('✅ Connected to MongoDB')

    const db = client.db(MONGODB_DB)
    const messagesCollection = db.collection('messages')

    // Get the current highest messageId to continue from there
    const lastMessage = await messagesCollection
      .find({})
      .sort({ messageId: -1 })
      .limit(1)
      .toArray()

    let startMessageId = lastMessage.length > 0 ? lastMessage[0].messageId + 1 : 1000
    console.log(`📊 Starting from messageId: ${startMessageId}`)
    console.log('')

    // Create test messages
    const testMessages = []
    const now = Math.floor(Date.now() / 1000)

    for (let i = 0; i < NUM_MESSAGES; i++) {
      const message = {
        messageId: startMessageId + i,
        sender: WALLET_ADDRESS.toLowerCase(),
        content: `Test message ${i + 1} - Added manually for testing`,
        timestamp: now - (NUM_MESSAGES - i) * 60, // Space them 1 minute apart
        transactionHash: `0xtest${startMessageId + i}`,
        createdAt: new Date(),
      }
      testMessages.push(message)
    }

    // Insert messages
    console.log('💾 Inserting messages...')
    for (const msg of testMessages) {
      try {
        const result = await messagesCollection.updateOne(
          { messageId: msg.messageId },
          { $set: msg },
          { upsert: true }
        )

        if (result.upsertedCount > 0) {
          console.log(`  ✅ Inserted messageId ${msg.messageId}: "${msg.content}"`)
        } else if (result.modifiedCount > 0) {
          console.log(`  ♻️  Updated messageId ${msg.messageId}: "${msg.content}"`)
        } else {
          console.log(`  ⚠️  MessageId ${msg.messageId} already exists, skipped`)
        }
      } catch (error) {
        console.error(`  ❌ Error inserting messageId ${msg.messageId}:`, error.message)
      }
    }

    // Verify the count
    console.log('')
    console.log('🔍 Verifying...')
    const totalCount = await messagesCollection.countDocuments({
      sender: WALLET_ADDRESS.toLowerCase(),
    })

    console.log(`✅ Total messages for ${WALLET_ADDRESS}: ${totalCount}`)
    console.log('')
    console.log('🎉 Test messages added successfully!')
    console.log('')
    console.log('📝 You can now test the endpoint:')
    console.log(`   curl "http://localhost:3000/api/totalmsg/${WALLET_ADDRESS}"`)
    console.log(`   or`)
    console.log(`   curl "https://shard-talk.vercel.app/api/totalmsg/${WALLET_ADDRESS}"`)
    console.log('')

  } catch (error) {
    console.error('\n❌ Error adding test messages:', error)
    process.exit(1)
  } finally {
    if (client) {
      await client.close()
      console.log('🔌 MongoDB connection closed')
    }
  }
}

// Run the script
addTestMessages()

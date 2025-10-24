/**
 * Sync Messages from Blockchain to MongoDB
 *
 * This script fetches all messages from the Shardeum blockchain smart contract
 * and saves them to MongoDB for faster querying and analytics.
 *
 * Usage: node scripts/sync-messages.js
 */

require('dotenv').config()
const { ethers } = require('ethers')
const { MongoClient } = require('mongodb')
const contractABI = require('../contracts/ShardeumChat.json')

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x9b137bde888021ca8174ac2621a59b14afa4fee6'
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://api-mezame.shardeum.org'
const MONGODB_URI = process.env.MONGODB_URI
const MONGODB_DB = process.env.MONGODB_DB || 'shardtalk'

const BATCH_SIZE = 50 // Process 50 messages at a time

async function syncMessages() {
  let mongoClient

  try {
    console.log('🚀 Starting blockchain to MongoDB sync...')
    console.log(`📝 Contract Address: ${CONTRACT_ADDRESS}`)
    console.log(`🌐 RPC URL: ${RPC_URL}`)
    console.log(`💾 MongoDB Database: ${MONGODB_DB}`)
    console.log('')

    // Connect to blockchain
    console.log('🔗 Connecting to Shardeum blockchain...')
    const provider = new ethers.JsonRpcProvider(RPC_URL)
    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI.abi, provider)

    // Get total message count from blockchain
    const totalMessages = await contract.getTotalMessageCount()
    const messageCount = Number(totalMessages)
    console.log(`📊 Total messages on blockchain: ${messageCount}`)

    if (messageCount === 0) {
      console.log('ℹ️  No messages found on blockchain. Nothing to sync.')
      return
    }

    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...')
    mongoClient = new MongoClient(MONGODB_URI)
    await mongoClient.connect()
    const db = mongoClient.db(MONGODB_DB)
    const messagesCollection = db.collection('messages')

    // Check existing messages in MongoDB
    const existingCount = await messagesCollection.countDocuments()
    console.log(`📊 Existing messages in MongoDB: ${existingCount}`)
    console.log('')

    // Fetch and sync messages in batches
    let syncedCount = 0
    let updatedCount = 0
    let skippedCount = 0

    for (let start = 0; start < messageCount; start += BATCH_SIZE) {
      const count = Math.min(BATCH_SIZE, messageCount - start)

      console.log(`⏳ Fetching messages ${start + 1} to ${start + count}...`)

      // Fetch batch from blockchain
      const messages = await contract.getMessages(start, count)

      // Prepare bulk operations
      const bulkOps = messages.map((msg) => {
        const messageDoc = {
          messageId: Number(msg.messageId),
          sender: msg.sender.toLowerCase(),
          content: msg.content,
          timestamp: Number(msg.timestamp),
          createdAt: new Date(Number(msg.timestamp) * 1000),
        }

        return {
          updateOne: {
            filter: { messageId: messageDoc.messageId },
            update: { $set: messageDoc },
            upsert: true,
          },
        }
      })

      // Execute bulk write
      if (bulkOps.length > 0) {
        const result = await messagesCollection.bulkWrite(bulkOps)
        syncedCount += result.upsertedCount
        updatedCount += result.modifiedCount
        skippedCount += result.matchedCount - result.modifiedCount

        console.log(`✅ Batch complete: ${result.upsertedCount} inserted, ${result.modifiedCount} updated, ${result.matchedCount - result.modifiedCount} unchanged`)
      }
    }

    console.log('')
    console.log('🎉 Sync completed successfully!')
    console.log(`📊 Summary:`)
    console.log(`   - Total blockchain messages: ${messageCount}`)
    console.log(`   - New messages synced: ${syncedCount}`)
    console.log(`   - Messages updated: ${updatedCount}`)
    console.log(`   - Messages unchanged: ${skippedCount}`)

    // Get unique senders count
    const uniqueSenders = await messagesCollection.distinct('sender')
    console.log(`   - Unique senders: ${uniqueSenders.length}`)

    console.log('')
    console.log('✅ All messages are now synced to MongoDB!')

  } catch (error) {
    console.error('')
    console.error('❌ Error syncing messages:', error.message)
    console.error(error)
    process.exit(1)
  } finally {
    if (mongoClient) {
      await mongoClient.close()
      console.log('🔌 MongoDB connection closed')
    }
  }
}

// Run the sync
syncMessages()

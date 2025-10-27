/**
 * MongoDB Index Setup Script
 *
 * Creates indexes for optimal query performance
 *
 * Usage: node scripts/setup-indexes.js
 */

require('dotenv').config()
const { MongoClient } = require('mongodb')

const MONGODB_URI = process.env.MONGODB_URI
const MONGODB_DB = process.env.MONGODB_DB || 'shardtalk'

async function setupIndexes() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables')
    process.exit(1)
  }

  console.log('🚀 Setting up MongoDB indexes...')
  console.log(`📦 Database: ${MONGODB_DB}`)
  console.log('')

  let client

  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI)
    await client.connect()
    console.log('✅ Connected to MongoDB')

    const db = client.db(MONGODB_DB)

    // Messages Collection Indexes
    console.log('\n📊 Setting up indexes for "messages" collection...')
    const messagesCollection = db.collection('messages')

    // Index 1: sender (for counting messages by user)
    await messagesCollection.createIndex(
      { sender: 1 },
      { name: 'sender_1' }
    )
    console.log('  ✅ Created index: sender_1')

    // Index 2: messageId (unique, for upserts)
    await messagesCollection.createIndex(
      { messageId: 1 },
      { unique: true, name: 'messageId_1_unique' }
    )
    console.log('  ✅ Created index: messageId_1_unique')

    // Index 3: timestamp (for sorting)
    await messagesCollection.createIndex(
      { timestamp: -1 },
      { name: 'timestamp_-1' }
    )
    console.log('  ✅ Created index: timestamp_-1')

    // Index 4: Compound index for sender + timestamp (for pagination)
    await messagesCollection.createIndex(
      { sender: 1, timestamp: -1 },
      { name: 'sender_1_timestamp_-1' }
    )
    console.log('  ✅ Created index: sender_1_timestamp_-1')

    // Users Collection Indexes (if used)
    console.log('\n📊 Setting up indexes for "users" collection...')
    const usersCollection = db.collection('users')

    // Index 1: address (unique)
    await usersCollection.createIndex(
      { address: 1 },
      { unique: true, name: 'address_1_unique' }
    )
    console.log('  ✅ Created index: address_1_unique')

    // Index 2: username (unique, sparse - allows null)
    await usersCollection.createIndex(
      { username: 1 },
      { unique: true, sparse: true, name: 'username_1_unique' }
    )
    console.log('  ✅ Created index: username_1_unique')

    // Activity Collection Indexes (if used)
    console.log('\n📊 Setting up indexes for "activity" collection...')
    const activityCollection = db.collection('activity')

    // Index 1: address
    await activityCollection.createIndex(
      { address: 1 },
      { name: 'address_1' }
    )
    console.log('  ✅ Created index: address_1')

    // Index 2: createdAt (for sorting)
    await activityCollection.createIndex(
      { createdAt: -1 },
      { name: 'createdAt_-1' }
    )
    console.log('  ✅ Created index: createdAt_-1')

    // Verify indexes
    console.log('\n🔍 Verifying indexes...')

    const messagesIndexes = await messagesCollection.indexes()
    console.log(`\n  Messages collection has ${messagesIndexes.length} indexes:`)
    messagesIndexes.forEach(idx => {
      console.log(`    - ${idx.name}: ${JSON.stringify(idx.key)}`)
    })

    const usersIndexes = await usersCollection.indexes()
    console.log(`\n  Users collection has ${usersIndexes.length} indexes:`)
    usersIndexes.forEach(idx => {
      console.log(`    - ${idx.name}: ${JSON.stringify(idx.key)}`)
    })

    const activityIndexes = await activityCollection.indexes()
    console.log(`\n  Activity collection has ${activityIndexes.length} indexes:`)
    activityIndexes.forEach(idx => {
      console.log(`    - ${idx.name}: ${JSON.stringify(idx.key)}`)
    })

    console.log('\n✅ All indexes created successfully!')
    console.log('\n📈 Performance should be significantly improved for:')
    console.log('  - Counting messages by sender')
    console.log('  - Finding messages by messageId')
    console.log('  - Sorting messages by timestamp')
    console.log('  - Paginating user messages')
    console.log('')

  } catch (error) {
    console.error('\n❌ Error setting up indexes:', error)
    process.exit(1)
  } finally {
    if (client) {
      await client.close()
      console.log('🔌 MongoDB connection closed')
    }
  }
}

// Run the setup
setupIndexes()

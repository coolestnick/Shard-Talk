/**
 * Verify Messages in MongoDB
 *
 * Checks if messages exist for a specific wallet
 */

require('dotenv').config()
const { MongoClient } = require('mongodb')

const MONGODB_URI = process.env.MONGODB_URI
const MONGODB_DB = process.env.MONGODB_DB || 'shardtalk'
const WALLET_ADDRESS = '0x472ce8ba3840be35a309b11990f2c02f1e4c9c5e'

async function verifyMessages() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found')
    process.exit(1)
  }

  let client
  try {
    client = new MongoClient(MONGODB_URI)
    await client.connect()

    const db = client.db(MONGODB_DB)
    const messagesCollection = db.collection('messages')

    const count = await messagesCollection.countDocuments({
      sender: WALLET_ADDRESS.toLowerCase()
    })

    console.log(`\n✅ Messages in database for ${WALLET_ADDRESS}: ${count}`)

    if (count > 0) {
      const messages = await messagesCollection
        .find({ sender: WALLET_ADDRESS.toLowerCase() })
        .sort({ messageId: 1 })
        .toArray()

      console.log('\n📨 Messages:')
      messages.forEach((msg, i) => {
        console.log(`  ${i + 1}. ID ${msg.messageId}: "${msg.content}"`)
      })
    }

    console.log('')
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    if (client) await client.close()
  }
}

verifyMessages()

import { MongoClient, Db } from 'mongodb'

let cachedClient: MongoClient | null = null
let cachedDb: Db | null = null
let indexesCreated = false

export async function getMongoDb(): Promise<Db> {
  const uri = process.env.MONGODB_URI
  const dbName = process.env.MONGODB_DB || 'shardtalk'

  if (!uri) {
    throw new Error('Missing MONGODB_URI environment variable')
  }

  // Return cached connection if available
  if (cachedClient && cachedDb) {
    return cachedDb
  }

  // Create new connection with optimized settings
  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    minPoolSize: 2,
    connectTimeoutMS: 10000, // 10 second timeout
    socketTimeoutMS: 45000, // 45 second timeout
    serverSelectionTimeoutMS: 10000, // 10 second timeout
  })

  await client.connect()
  const db = client.db(dbName)

  cachedClient = client
  cachedDb = db

  // Create indexes only once per application lifecycle
  // Run asynchronously to not block the first request
  if (!indexesCreated) {
    indexesCreated = true
    // Don't await - let indexes create in background
    createIndexes(db).catch(err => {
      console.error('Failed to create indexes:', err)
    })
  }

  return db
}

// Create indexes in background - only for collections we're actively using
async function createIndexes(db: Db) {
  try {
    // Only create indexes for messages collection (the only one we write to)
    await db.collection('messages').createIndex(
      { messageId: 1 },
      { unique: true, background: true }
    )
    await db.collection('messages').createIndex(
      { sender: 1, timestamp: -1 },
      { background: true }
    )
    await db.collection('messages').createIndex(
      { timestamp: -1 },
      { background: true }
    )
    console.log('✅ MongoDB indexes created successfully')
  } catch (error) {
    console.error('Failed to create indexes:', error)
    // Don't throw - indexes might already exist
  }
}



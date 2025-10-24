# Messages API Documentation

This document describes the new Messages API endpoints for querying user messages stored in MongoDB.

## Overview

All messages sent through the ShardTalk application are stored both on the Shardeum blockchain (for immutability and decentralization) and in MongoDB (for fast querying and analytics).

## Base URL

```
http://localhost:3000/api/messages
```

---

## Endpoints

### 1. Get Message Count by Wallet Address

Get the total number of messages sent by a specific wallet address.

**Endpoint:** `GET /api/messages`

**Query Parameters:**
- `address` (required): The wallet address to query (case-insensitive)
- `count` (required): Must be set to `true` to get count only

**Example Request:**
```bash
curl "http://localhost:3000/api/messages?address=0x56e8667227e66ffebe06c21c2fef47ae108d3de0&count=true"
```

**Example Response:**
```json
{
  "address": "0x56e8667227e66ffebe06c21c2fef47ae108d3de0",
  "messageCount": 4
}
```

**Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Missing or invalid address parameter
- `500 Internal Server Error` - Database error

---

### 2. Get User Messages (Paginated)

Fetch all messages sent by a specific wallet address with pagination support.

**Endpoint:** `GET /api/messages`

**Query Parameters:**
- `address` (required): The wallet address to query (case-insensitive)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Number of messages per page (default: 20)

**Example Request:**
```bash
curl "http://localhost:3000/api/messages?address=0x56e8667227e66ffebe06c21c2fef47ae108d3de0&page=1&limit=10"
```

**Example Response:**
```json
{
  "address": "0x56e8667227e66ffebe06c21c2fef47ae108d3de0",
  "messages": [
    {
      "_id": "68fb552f4e2dc24218b8478c",
      "messageId": 4,
      "sender": "0x56e8667227e66ffebe06c21c2fef47ae108d3de0",
      "content": "try",
      "timestamp": 1761250736,
      "createdAt": "2025-10-23T20:18:56.000Z",
      "transactionHash": "0x123..."
    },
    {
      "_id": "68fb552f4e2dc24218b8478b",
      "messageId": 3,
      "sender": "0x56e8667227e66ffebe06c21c2fef47ae108d3de0",
      "content": "nice",
      "timestamp": 1761250500,
      "createdAt": "2025-10-23T20:15:00.000Z",
      "transactionHash": "0x456..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 4,
    "totalPages": 1
  }
}
```

**Response Fields:**
- `address`: Normalized wallet address (lowercase)
- `messages`: Array of message objects sorted by timestamp (newest first)
  - `_id`: MongoDB document ID
  - `messageId`: Unique message ID from blockchain
  - `sender`: Sender's wallet address
  - `content`: Message content
  - `timestamp`: Unix timestamp when message was sent
  - `createdAt`: ISO date string
  - `transactionHash`: Blockchain transaction hash (if available)
- `pagination`: Pagination metadata
  - `page`: Current page number
  - `limit`: Messages per page
  - `total`: Total number of messages for this address
  - `totalPages`: Total number of pages

**Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Missing or invalid address parameter
- `500 Internal Server Error` - Database error

---

### 3. Save Message (Internal Use)

This endpoint is used internally by the application to save messages to MongoDB after they're confirmed on the blockchain. It's called automatically by the ChatContext after a message is successfully posted.

**Endpoint:** `POST /api/messages`

**Request Body:**
```json
{
  "messageId": 5,
  "sender": "0x56e8667227e66ffebe06c21c2fef47ae108d3de0",
  "content": "Hello world!",
  "timestamp": 1761250736,
  "transactionHash": "0x123..."
}
```

**Example Response:**
```json
{
  "success": true,
  "messageId": 5,
  "inserted": true,
  "updated": false
}
```

**Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Missing required fields
- `409 Conflict` - Message with this ID already exists
- `500 Internal Server Error` - Database error

---

## MongoDB Schema

### Messages Collection

```typescript
{
  messageId: number,           // Unique message ID from blockchain (indexed)
  sender: string,              // Wallet address (lowercase, indexed)
  content: string,             // Message content (max 500 chars)
  timestamp: number,           // Unix timestamp
  transactionHash?: string,    // Blockchain transaction hash
  createdAt: Date             // MongoDB insertion date
}
```

**Indexes:**
- `messageId` - Unique index for preventing duplicates
- `sender, timestamp` - Compound index for efficient user queries
- `timestamp` - Index for chronological queries

---

## Sync Script

To sync existing blockchain messages to MongoDB, run:

```bash
npm run sync-messages
```

This script:
1. Connects to the Shardeum blockchain
2. Fetches all messages from the smart contract
3. Saves them to MongoDB (using upsert to prevent duplicates)
4. Provides a summary of synced messages

**Example Output:**
```
🚀 Starting blockchain to MongoDB sync...
📝 Contract Address: 0x9b137bde888021ca8174ac2621a59b14afa4fee6
🌐 RPC URL: https://api-mezame.shardeum.org
💾 MongoDB Database: shardtalk

🔗 Connecting to Shardeum blockchain...
📊 Total messages on blockchain: 5
🔗 Connecting to MongoDB...
📊 Existing messages in MongoDB: 0

⏳ Fetching messages 1 to 5...
✅ Batch complete: 5 inserted, 0 updated, 0 unchanged

🎉 Sync completed successfully!
📊 Summary:
   - Total blockchain messages: 5
   - New messages synced: 5
   - Messages updated: 0
   - Messages unchanged: 0
   - Unique senders: 2

✅ All messages are now synced to MongoDB!
```

---

## Example Usage in JavaScript

### Get Message Count

```javascript
async function getMessageCount(address) {
  const response = await fetch(
    `http://localhost:3000/api/messages?address=${address}&count=true`
  )
  const data = await response.json()
  return data.messageCount
}

// Usage
const count = await getMessageCount('0x56e8667227e66ffebe06c21c2fef47ae108d3de0')
console.log(`User has sent ${count} messages`)
```

### Get User Messages

```javascript
async function getUserMessages(address, page = 1, limit = 20) {
  const response = await fetch(
    `http://localhost:3000/api/messages?address=${address}&page=${page}&limit=${limit}`
  )
  const data = await response.json()
  return data
}

// Usage
const result = await getUserMessages('0x56e8667227e66ffebe06c21c2fef47ae108d3de0', 1, 10)
console.log(`Found ${result.pagination.total} messages`)
result.messages.forEach(msg => {
  console.log(`[${new Date(msg.createdAt).toLocaleString()}] ${msg.content}`)
})
```

### Get All Messages for a User (Iterate Pages)

```javascript
async function getAllUserMessages(address) {
  const allMessages = []
  let page = 1
  let hasMore = true

  while (hasMore) {
    const result = await getUserMessages(address, page, 20)
    allMessages.push(...result.messages)

    hasMore = page < result.pagination.totalPages
    page++
  }

  return allMessages
}

// Usage
const messages = await getAllUserMessages('0x56e8667227e66ffebe06c21c2fef47ae108d3de0')
console.log(`Retrieved ${messages.length} total messages`)
```

---

## Notes

- All wallet addresses are automatically normalized to lowercase for consistency
- Messages are sorted by timestamp in descending order (newest first)
- The API automatically handles pagination to prevent loading too much data at once
- Message content is limited to 500 characters (enforced by smart contract)
- All messages are deduplicated by `messageId` to prevent duplicates
- The sync script can be run multiple times safely - it uses upsert operations

---

## Error Handling

All endpoints return standard HTTP status codes and JSON error responses:

```json
{
  "error": "Error message description"
}
```

Common errors:
- `400` - Missing or invalid parameters
- `409` - Duplicate message ID (when saving)
- `500` - Database or server error

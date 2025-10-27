# Total Messages API Endpoint

## Overview

A simple, fast API endpoint to get the total number of messages sent by a specific wallet address.

## Endpoint

```
GET /api/totalmsg/{address}
```

## Parameters

- **address** (required): Ethereum wallet address (must be a valid 40-character hex address with `0x` prefix)

## Example Usage

### Request

```bash
# Production
curl "https://shard-talk.vercel.app/api/totalmsg/0x22D74ADFB45147d7588aFA3ba0eF1c363b7dFcFF"

# Local development
curl "http://localhost:3000/api/totalmsg/0x22D74ADFB45147d7588aFA3ba0eF1c363b7dFcFF"
```

### Successful Response

```json
{
  "success": true,
  "address": "0x22d74adfb45147d7588afa3ba0ef1c363b7dfcff",
  "totalMessages": 5
}
```

### Error Response (Invalid Address)

```json
{
  "success": false,
  "error": "Invalid Ethereum address format",
  "address": "invalid",
  "example": "/api/totalmsg/0x22D74ADFB45147d7588aFA3ba0eF1c363b7dFcFF",
  "totalMessages": 0
}
```

### Error Response (Database Unavailable)

```json
{
  "success": false,
  "error": "Database connection failed",
  "address": "0x22d74adfb45147d7588afa3ba0ef1c363b7dfcff",
  "totalMessages": 0,
  "message": "Unable to fetch message count at this time"
}
```

## Features

### ✅ Fast & Efficient
- Single database query
- Minimal overhead
- Returns only essential data

### ✅ Real-time Counts
- Counts messages directly from MongoDB
- Reflects the most current message count
- Updates automatically as new messages are sent

### ✅ Robust Error Handling
- Validates Ethereum address format
- Handles database connection failures gracefully
- Returns safe defaults on errors (0 messages)
- Never crashes or returns 500 errors unnecessarily

### ✅ Caching
- Response is cacheable for 10 seconds
- Reduces database load for repeated requests
- Uses `stale-while-revalidate` for optimal performance

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether the request succeeded |
| `address` | string | The normalized (lowercase) wallet address |
| `totalMessages` | number | Total number of messages sent by this address |
| `error` | string | Error message (only present if success is false) |
| `message` | string | Additional error details (optional) |

## HTTP Status Codes

| Status | Description |
|--------|-------------|
| 200 | Success - Message count retrieved |
| 200 | Database error - Returns safe default (totalMessages: 0) |
| 400 | Invalid address format |
| 500 | Unexpected server error |

## Integration Examples

### JavaScript/Fetch

```javascript
async function getTotalMessages(address) {
  try {
    const response = await fetch(`/api/totalmsg/${address}`)
    const data = await response.json()

    if (data.success) {
      console.log(`Total messages: ${data.totalMessages}`)
      return data.totalMessages
    } else {
      console.error(`Error: ${data.error}`)
      return 0
    }
  } catch (error) {
    console.error('Failed to fetch total messages:', error)
    return 0
  }
}

// Usage
const count = await getTotalMessages('0x22D74ADFB45147d7588aFA3ba0eF1c363b7dFcFF')
```

### React Hook

```typescript
import { useState, useEffect } from 'react'

function useTotalMessages(address: string | null) {
  const [totalMessages, setTotalMessages] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!address) return

    const fetchTotal = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/totalmsg/${address}`)
        const data = await response.json()

        if (data.success) {
          setTotalMessages(data.totalMessages)
        } else {
          setError(data.error)
          setTotalMessages(0)
        }
      } catch (err) {
        setError('Failed to fetch message count')
        setTotalMessages(0)
      } finally {
        setLoading(false)
      }
    }

    fetchTotal()
  }, [address])

  return { totalMessages, loading, error }
}

// Usage in component
function UserStats({ address }: { address: string }) {
  const { totalMessages, loading, error } = useTotalMessages(address)

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return <div>Total Messages: {totalMessages}</div>
}
```

### cURL Examples

```bash
# Basic request
curl "http://localhost:3000/api/totalmsg/0x22D74ADFB45147d7588aFA3ba0eF1c363b7dFcFF"

# With verbose output
curl -v "http://localhost:3000/api/totalmsg/0x22D74ADFB45147d7588aFA3ba0eF1c363b7dFcFF"

# Pretty print JSON (requires jq)
curl -s "http://localhost:3000/api/totalmsg/0x22D74ADFB45147d7588aFA3ba0eF1c363b7dFcFF" | jq

# Check response time
time curl -s "http://localhost:3000/api/totalmsg/0x22D74ADFB45147d7588aFA3ba0eF1c363b7dFcFF"
```

## Performance Characteristics

- **Response Time**: < 100ms (typical)
- **Database Operations**: 1 (single count query)
- **Caching**: 10 seconds public cache
- **Rate Limiting**: None (can be added if needed)

## Differences from `/api/messages?count=true`

| Feature | `/api/totalmsg/{address}` | `/api/messages?address={address}&count=true` |
|---------|---------------------------|----------------------------------------------|
| URL Format | Path parameter | Query parameter |
| Response Size | Minimal (3 fields) | Same (3 fields) |
| Caching | Built-in (10s) | No cache headers |
| Primary Use | External integrations | Internal use |
| Optimized For | Speed and simplicity | Compatibility with existing code |

## Use Cases

1. **User Profile Pages**: Show total message count on user profiles
2. **Leaderboards**: Rank users by message count
3. **Analytics Dashboards**: Track user engagement metrics
4. **Mobile Apps**: Lightweight endpoint for mobile clients
5. **External Integrations**: Easy to integrate with third-party services

## Testing

### Test with curl

```bash
# Valid address (should return count)
curl "http://localhost:3000/api/totalmsg/0x22D74ADFB45147d7588aFA3ba0eF1c363b7dFcFF"

# Invalid address (should return 400 error)
curl "http://localhost:3000/api/totalmsg/invalid"

# Missing address (should return 400 error)
curl "http://localhost:3000/api/totalmsg/"
```

### Test with Node.js

```javascript
const addresses = [
  '0x22D74ADFB45147d7588aFA3ba0eF1c363b7dFcFF',
  '0xde35c097f96c922d35c4a20d6c35ccc96d764ffd',
  // Add more addresses to test
]

async function testEndpoint() {
  for (const address of addresses) {
    const response = await fetch(`http://localhost:3000/api/totalmsg/${address}`)
    const data = await response.json()
    console.log(`${address}: ${data.totalMessages} messages`)
  }
}

testEndpoint()
```

## Security Considerations

- ✅ Address validation prevents injection attacks
- ✅ No sensitive data exposed
- ✅ Database errors don't leak connection details
- ✅ Returns safe defaults on failures
- ⚠️ Public endpoint - consider rate limiting for production

## Rate Limiting (Optional)

If you need to add rate limiting, consider using a middleware or edge function:

```typescript
// Example rate limiting middleware (not included)
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: {
    success: false,
    error: 'Too many requests, please try again later'
  }
})
```

## Monitoring

### Metrics to Track

1. **Response Time**: Should be < 100ms on average
2. **Error Rate**: Should be < 1%
3. **Cache Hit Rate**: Monitor cache effectiveness
4. **Database Load**: Single query per request

### Logging

All errors are logged to the server console:
- Database connection failures
- Query errors
- Unexpected errors

Check your logs:
```bash
# Vercel
vercel logs --follow

# Local
npm run dev
```

## Troubleshooting

### Issue: Returns 0 messages when user has sent messages

**Solution**: Check MongoDB connection and ensure messages are being saved to the database

```bash
# Verify MongoDB connection
curl "http://localhost:3000/api/totalmsg/0x22D74ADFB45147d7588aFA3ba0eF1c363b7dFcFF"

# Check if messages exist in database
mongosh "your-mongodb-uri" --eval "db.messages.countDocuments({sender: '0x22d74adfb45147d7588afa3ba0ef1c363b7dfcff'})"
```

### Issue: Slow response times

**Solution**:
1. Ensure MongoDB has proper indexes on the `sender` field
2. Check database connection pooling
3. Verify network latency to MongoDB

```javascript
// Create index (run once)
db.messages.createIndex({ sender: 1 })
```

### Issue: Invalid address errors

**Solution**: Ensure address is exactly 42 characters (0x + 40 hex characters)

```javascript
// Validate address before calling API
function isValidAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}
```

## Future Enhancements

Potential improvements for this endpoint:

1. **Query multiple addresses**: `/api/totalmsg?addresses=0x123,0x456`
2. **Time range filtering**: `/api/totalmsg/{address}?from=timestamp&to=timestamp`
3. **Include additional stats**: Average message length, first/last message time
4. **WebSocket support**: Real-time updates when count changes
5. **Batch requests**: Get counts for multiple addresses in one request

## Summary

The `/api/totalmsg/{address}` endpoint provides a simple, fast, and reliable way to get the total message count for any wallet address. It's optimized for:

- ⚡ **Speed**: Single database query
- 🛡️ **Reliability**: Graceful error handling
- 📊 **Simplicity**: Minimal response payload
- 🔄 **Real-time**: Always returns current count

Perfect for dashboards, analytics, and external integrations!

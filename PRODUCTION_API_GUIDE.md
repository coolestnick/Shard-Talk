# ShardTalk Production API Guide

## Base URL
```
https://shard-talk.vercel.app
```

---

## API Endpoints

### 1. Get Message Count by Wallet Address

**Endpoint:**
```
https://shard-talk.vercel.app/api/messages?address={WALLET_ADDRESS}&count=true
```

**Parameters:**
- `address` (required): Ethereum wallet address (e.g., `0x123...`)
- `count` (required): Must be `true` to get count only

**Example URL:**
```
https://shard-talk.vercel.app/api/messages?address=0x56e8667227e66ffebe06c21c2fef47ae108d3de0&count=true
```

**Response:**
```json
{
  "address": "0x56e8667227e66ffebe06c21c2fef47ae108d3de0",
  "messageCount": 4
}
```

**Verification Function:**
```javascript
function(response) {
  if (!response || typeof response !== 'object') {
    return 0;
  }

  if (typeof response.messageCount !== 'number') {
    return 0;
  }

  return response.messageCount >= 0 ? 1 : 0;
}
```

---

### 2. Get User Messages (Paginated)

**Endpoint:**
```
https://shard-talk.vercel.app/api/messages?address={WALLET_ADDRESS}&page={PAGE}&limit={LIMIT}
```

**Parameters:**
- `address` (required): Ethereum wallet address
- `page` (optional): Page number (default: 1)
- `limit` (optional): Messages per page (default: 20, max: 100)

**Example URL:**
```
https://shard-talk.vercel.app/api/messages?address=0x56e8667227e66ffebe06c21c2fef47ae108d3de0&page=1&limit=10
```

**Response:**
```json
{
  "address": "0x56e8667227e66ffebe06c21c2fef47ae108d3de0",
  "messages": [
    {
      "_id": "68fb552f4e2dc24218b8478c",
      "messageId": 4,
      "sender": "0x56e8667227e66ffebe06c21c2fef47ae108d3de0",
      "content": "Hello world!",
      "timestamp": 1761250736,
      "createdAt": "2025-10-23T20:18:56.000Z",
      "transactionHash": "0x123..."
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

**Verification Function:**
```javascript
function(response) {
  if (!response || typeof response !== 'object') {
    return 0;
  }

  if (!Array.isArray(response.messages)) {
    return 0;
  }

  if (!response.pagination || typeof response.pagination.total !== 'number') {
    return 0;
  }

  // Verify all messages have required fields
  for (const msg of response.messages) {
    if (
      typeof msg.messageId !== 'number' ||
      typeof msg.sender !== 'string' ||
      typeof msg.content !== 'string' ||
      typeof msg.timestamp !== 'number'
    ) {
      return 0;
    }
  }

  return 1;
}
```

---

## Integration Examples

### cURL Examples

**Get Message Count:**
```bash
curl "https://shard-talk.vercel.app/api/messages?address=0x56e8667227e66ffebe06c21c2fef47ae108d3de0&count=true"
```

**Get Messages (First 10):**
```bash
curl "https://shard-talk.vercel.app/api/messages?address=0x56e8667227e66ffebe06c21c2fef47ae108d3de0&page=1&limit=10"
```

---

### JavaScript/TypeScript Examples

**Using Fetch API:**
```javascript
// Get message count
async function getMessageCount(walletAddress) {
  const url = `https://shard-talk.vercel.app/api/messages?address=${walletAddress}&count=true`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Verify response
    if (typeof data.messageCount !== 'number') {
      throw new Error('Invalid response structure');
    }

    return data.messageCount;
  } catch (error) {
    console.error('Error fetching message count:', error);
    return null;
  }
}

// Usage
const count = await getMessageCount('0x56e8667227e66ffebe06c21c2fef47ae108d3de0');
console.log(`Total messages: ${count}`);
```

**Get User Messages:**
```javascript
async function getUserMessages(walletAddress, page = 1, limit = 20) {
  const url = `https://shard-talk.vercel.app/api/messages?address=${walletAddress}&page=${page}&limit=${limit}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Verify response structure
    if (!Array.isArray(data.messages) || !data.pagination) {
      throw new Error('Invalid response structure');
    }

    return {
      messages: data.messages,
      pagination: data.pagination,
      address: data.address
    };
  } catch (error) {
    console.error('Error fetching messages:', error);
    return null;
  }
}

// Usage
const result = await getUserMessages('0x56e8667227e66ffebe06c21c2fef47ae108d3de0', 1, 10);
if (result) {
  console.log(`Found ${result.pagination.total} total messages`);
  result.messages.forEach(msg => {
    console.log(`[${new Date(msg.createdAt).toLocaleString()}] ${msg.content}`);
  });
}
```

---

### Using the API Client Library

**Installation:**
```typescript
import { MessagesApiClient } from '@/lib/api/messages-api'

// Create client instance for production
const client = new MessagesApiClient({
  baseUrl: 'https://shard-talk.vercel.app',
  timeout: 10000
})
```

**Get Message Count:**
```typescript
const result = await client.getMessageCount('0x56e8667227e66ffebe06c21c2fef47ae108d3de0')

if (result.success) {
  console.log(`Messages sent: ${result.data.messageCount}`)
} else {
  console.error(`Error: ${result.error}`)
}
```

**Get Messages:**
```typescript
const result = await client.getMessages(
  '0x56e8667227e66ffebe06c21c2fef47ae108d3de0',
  1,  // page
  10  // limit
)

if (result.success) {
  console.log(`Total: ${result.data.pagination.total}`)
  result.data.messages.forEach(msg => {
    console.log(`${msg.sender}: ${msg.content}`)
  })
} else {
  console.error(`Error: ${result.error}`)
}
```

**Get All Messages (All Pages):**
```typescript
const result = await client.getAllMessages('0x56e8667227e66ffebe06c21c2fef47ae108d3de0')

if (result.success) {
  console.log(`Retrieved ${result.data.messages.length} messages`)
}
```

**Check if User Has Messages:**
```typescript
const hasMessages = await client.hasMessages('0x56e8667227e66ffebe06c21c2fef47ae108d3de0')
console.log(`User has messages: ${hasMessages}`)
```

**Get Latest Message:**
```typescript
const result = await client.getLatestMessage('0x56e8667227e66ffebe06c21c2fef47ae108d3de0')

if (result.success && result.data) {
  console.log(`Latest: ${result.data.content}`)
}
```

---

### Python Examples

```python
import requests

def get_message_count(wallet_address):
    url = f"https://shard-talk.vercel.app/api/messages?address={wallet_address}&count=true"

    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()

        data = response.json()

        # Verify response
        if 'messageCount' not in data or not isinstance(data['messageCount'], int):
            raise ValueError('Invalid response structure')

        return data['messageCount']
    except Exception as e:
        print(f"Error: {e}")
        return None

# Usage
count = get_message_count('0x56e8667227e66ffebe06c21c2fef47ae108d3de0')
print(f"Total messages: {count}")
```

```python
def get_user_messages(wallet_address, page=1, limit=20):
    url = f"https://shard-talk.vercel.app/api/messages?address={wallet_address}&page={page}&limit={limit}"

    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()

        data = response.json()

        # Verify response
        if 'messages' not in data or 'pagination' not in data:
            raise ValueError('Invalid response structure')

        return data
    except Exception as e:
        print(f"Error: {e}")
        return None

# Usage
result = get_user_messages('0x56e8667227e66ffebe06c21c2fef47ae108d3de0', 1, 10)
if result:
    print(f"Total messages: {result['pagination']['total']}")
    for msg in result['messages']:
        print(f"{msg['sender']}: {msg['content']}")
```

---

## Response Verification

### Complete Verification Function for Message Count

```javascript
function verifyMessageCountResponse(response) {
  // Check if response exists
  if (!response) {
    return {
      valid: false,
      error: 'Response is null or undefined'
    };
  }

  // Check if response is an object
  if (typeof response !== 'object') {
    return {
      valid: false,
      error: 'Response is not an object'
    };
  }

  // Check if address field exists and is a string
  if (!response.address || typeof response.address !== 'string') {
    return {
      valid: false,
      error: 'Missing or invalid address field'
    };
  }

  // Check if address is valid Ethereum format
  if (!/^0x[a-fA-F0-9]{40}$/.test(response.address)) {
    return {
      valid: false,
      error: 'Invalid Ethereum address format'
    };
  }

  // Check if messageCount exists and is a number
  if (typeof response.messageCount !== 'number') {
    return {
      valid: false,
      error: 'Missing or invalid messageCount field'
    };
  }

  // Check if messageCount is non-negative
  if (response.messageCount < 0) {
    return {
      valid: false,
      error: 'messageCount cannot be negative'
    };
  }

  return {
    valid: true,
    data: response
  };
}
```

### Complete Verification Function for Messages

```javascript
function verifyMessagesResponse(response) {
  // Check if response exists
  if (!response) {
    return {
      valid: false,
      error: 'Response is null or undefined'
    };
  }

  // Check if response is an object
  if (typeof response !== 'object') {
    return {
      valid: false,
      error: 'Response is not an object'
    };
  }

  // Check if address field exists
  if (!response.address || typeof response.address !== 'string') {
    return {
      valid: false,
      error: 'Missing or invalid address field'
    };
  }

  // Check if messages array exists
  if (!Array.isArray(response.messages)) {
    return {
      valid: false,
      error: 'messages field is not an array'
    };
  }

  // Check if pagination exists
  if (!response.pagination || typeof response.pagination !== 'object') {
    return {
      valid: false,
      error: 'Missing or invalid pagination field'
    };
  }

  // Verify pagination fields
  const requiredPaginationFields = ['page', 'limit', 'total', 'totalPages'];
  for (const field of requiredPaginationFields) {
    if (typeof response.pagination[field] !== 'number') {
      return {
        valid: false,
        error: `Missing or invalid pagination.${field} field`
      };
    }
  }

  // Verify each message structure
  for (let i = 0; i < response.messages.length; i++) {
    const msg = response.messages[i];

    // Check required message fields
    if (typeof msg.messageId !== 'number') {
      return {
        valid: false,
        error: `Message ${i}: missing or invalid messageId`
      };
    }

    if (typeof msg.sender !== 'string' || !/^0x[a-fA-F0-9]{40}$/.test(msg.sender)) {
      return {
        valid: false,
        error: `Message ${i}: missing or invalid sender address`
      };
    }

    if (typeof msg.content !== 'string') {
      return {
        valid: false,
        error: `Message ${i}: missing or invalid content`
      };
    }

    if (typeof msg.timestamp !== 'number') {
      return {
        valid: false,
        error: `Message ${i}: missing or invalid timestamp`
      };
    }
  }

  return {
    valid: true,
    data: response
  };
}
```

---

## Error Responses

All endpoints return error responses in this format:

```json
{
  "error": "Error message description"
}
```

**Common HTTP Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Missing or invalid parameters
- `404 Not Found` - Endpoint not found
- `500 Internal Server Error` - Server error

**Example Error Response:**
```json
{
  "error": "Address parameter is required"
}
```

---

## API Headers (Optional)

No special headers are required for GET requests. For POST requests (internal use only):

```
Content-Type: application/json
```

---

## Rate Limiting

Currently, there are no rate limits on the API. However, please be respectful and avoid excessive requests.

**Best Practices:**
- Cache responses when possible
- Use pagination instead of fetching all data at once
- Implement exponential backoff for retries

---

## Testing the API

### Quick Test

Open this URL in your browser to test the API:

```
https://shard-talk.vercel.app/api/messages?address=0x56e8667227e66ffebe06c21c2fef47ae108d3de0&count=true
```

### Test with cURL

```bash
# Test message count
curl "https://shard-talk.vercel.app/api/messages?address=0x56e8667227e66ffebe06c21c2fef47ae108d3de0&count=true"

# Test get messages
curl "https://shard-talk.vercel.app/api/messages?address=0x56e8667227e66ffebe06c21c2fef47ae108d3de0&page=1&limit=10"
```

---

## Support

For issues or questions:
- GitHub: [Your GitHub Repository]
- Documentation: API_DOCUMENTATION.md

---

## Summary

**Production API Endpoints:**

1. **Message Count:**
   ```
   GET https://shard-talk.vercel.app/api/messages?address={ADDRESS}&count=true
   ```

2. **User Messages:**
   ```
   GET https://shard-talk.vercel.app/api/messages?address={ADDRESS}&page={PAGE}&limit={LIMIT}
   ```

**Response Validation:**
- Always check if response exists and is an object
- Verify required fields exist and have correct types
- Validate Ethereum addresses match `^0x[a-fA-F0-9]{40}$` pattern
- Ensure numeric fields are non-negative

**Best Practices:**
- Use the provided API client library for automatic verification
- Implement proper error handling
- Cache responses when appropriate
- Use pagination for large datasets

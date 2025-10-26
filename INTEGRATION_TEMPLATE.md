# API Integration Template

Based on your screenshot, here's how to configure your API integration:

---

## Configuration for Your Form

### Name
```
Shard Talk
```

### Description
```
A decentralized Messaging Dapp On Shardeum
```

### API Endpoint (Message Count)
```
https://shard-talk.vercel.app/api/messages
```

### API Query (Message Count)
```
address={WALLET_ADDRESS}&count=true
```

**Full URL Example:**
```
https://shard-talk.vercel.app/api/messages?address=0x56e8667227e66ffebe06c21c2fef47ae108d3de0&count=true
```

### Expression (to be applied on the response)
```javascript
function(response) {
  // Verify response structure
  if (!response || typeof response !== 'object') {
    return 0;
  }

  // Check if messageCount exists and is a number
  if (typeof response.messageCount !== 'number') {
    return 0;
  }

  // Verify messageCount is non-negative
  if (response.messageCount < 0) {
    return 0;
  }

  // Return 1 for valid response
  return 1;
}
```

### API Headers
```
Content-Type: application/json
```

---

## Alternative: Get Messages with Details

### API Endpoint (Get Messages)
```
https://shard-talk.vercel.app/api/messages
```

### API Query (Get Messages)
```
address={WALLET_ADDRESS}&page=1&limit=10
```

### Expression (to be applied on the response)
```javascript
function(response) {
  // Verify response structure
  if (!response || typeof response !== 'object') {
    return 0;
  }

  // Check if messages array exists
  if (!Array.isArray(response.messages)) {
    return 0;
  }

  // Check if pagination exists
  if (!response.pagination || typeof response.pagination.total !== 'number') {
    return 0;
  }

  // Verify each message has required fields
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

  // Return 1 for valid response
  return 1;
}
```

---

## Testing Your Integration

### Test URLs

**Test with a real wallet address:**
```
https://shard-talk.vercel.app/api/messages?address=0x56e8667227e66ffebe06c21c2fef47ae108d3de0&count=true
```

**Expected Response:**
```json
{
  "address": "0x56e8667227e66ffebe06c21c2fef47ae108d3de0",
  "messageCount": 4
}
```

### Quick Browser Test

Copy and paste this into your browser:
```
https://shard-talk.vercel.app/api/messages?address=0x56e8667227e66ffebe06c21c2fef47ae108d3de0&count=true
```

---

## Response Examples

### Success Response (Message Count)
```json
{
  "address": "0x56e8667227e66ffebe06c21c2fef47ae108d3de0",
  "messageCount": 4
}
```

### Success Response (Get Messages)
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
      "createdAt": "2025-10-23T20:18:56.000Z"
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

### Error Response
```json
{
  "error": "Address parameter is required"
}
```

---

## Common Integration Patterns

### Pattern 1: Check if User Has Sent Messages

**Use Case:** Verify user participation

**Configuration:**
- Endpoint: `https://shard-talk.vercel.app/api/messages`
- Query: `address={WALLET_ADDRESS}&count=true`
- Verification: `return response.messageCount > 0 ? 1 : 0;`

### Pattern 2: Get User's Message History

**Use Case:** Display user activity

**Configuration:**
- Endpoint: `https://shard-talk.vercel.app/api/messages`
- Query: `address={WALLET_ADDRESS}&page=1&limit=20`
- Verification: `return response.messages.length > 0 ? 1 : 0;`

### Pattern 3: Verify Minimum Message Count

**Use Case:** Require minimum activity level

**Configuration:**
- Endpoint: `https://shard-talk.vercel.app/api/messages`
- Query: `address={WALLET_ADDRESS}&count=true`
- Verification: `return response.messageCount >= 5 ? 1 : 0;`

---

## Advanced Verification Expressions

### Verify User Has Sent At Least 5 Messages

```javascript
function(response) {
  if (!response || typeof response !== 'object') {
    return 0;
  }

  if (typeof response.messageCount !== 'number') {
    return 0;
  }

  // Return 1 only if user has sent 5+ messages
  return response.messageCount >= 5 ? 1 : 0;
}
```

### Verify User Has Recent Activity (Last 7 Days)

```javascript
function(response) {
  if (!response || !Array.isArray(response.messages)) {
    return 0;
  }

  const sevenDaysAgo = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60);

  // Check if any message was sent in last 7 days
  const hasRecentActivity = response.messages.some(msg =>
    msg.timestamp > sevenDaysAgo
  );

  return hasRecentActivity ? 1 : 0;
}
```

### Extract Message Count as Return Value

```javascript
function(response) {
  if (!response || typeof response !== 'object') {
    return 0;
  }

  if (typeof response.messageCount !== 'number') {
    return 0;
  }

  // Return the actual message count
  return response.messageCount;
}
```

---

## Troubleshooting

### Issue: Getting 400 Bad Request

**Cause:** Missing or invalid wallet address

**Solution:** Ensure the `address` parameter is a valid Ethereum address (0x followed by 40 hex characters)

### Issue: Getting empty messages array

**Cause:** User hasn't sent any messages yet

**Solution:** This is expected behavior. Check `messageCount` first.

### Issue: Response verification always returns 0

**Cause:** Incorrect verification function

**Solution:** Use the verification functions provided above, or check browser console for response structure.

---

## Complete Working Examples

### Example 1: Basic Integration

**Configuration:**
```
Name: Shard Talk Message Count
Endpoint: https://shard-talk.vercel.app/api/messages
Query: address={WALLET_ADDRESS}&count=true
Verification: function(response) { return response && response.messageCount >= 0 ? 1 : 0; }
```

### Example 2: Require Active User (5+ messages)

**Configuration:**
```
Name: Shard Talk Active User
Endpoint: https://shard-talk.vercel.app/api/messages
Query: address={WALLET_ADDRESS}&count=true
Verification: function(response) { return response && response.messageCount >= 5 ? 1 : 0; }
```

### Example 3: Get User Message Details

**Configuration:**
```
Name: Shard Talk User Messages
Endpoint: https://shard-talk.vercel.app/api/messages
Query: address={WALLET_ADDRESS}&page=1&limit=10
Verification: function(response) { return response && response.messages && response.messages.length > 0 ? 1 : 0; }
```

---

## Notes

- **No Email Parameter:** The API uses wallet addresses only, not email addresses
- **Case Insensitive:** Wallet addresses are normalized to lowercase
- **Response Format:** Always returns JSON
- **No Authentication:** Public API, no API key required
- **CORS Enabled:** Can be called from any domain

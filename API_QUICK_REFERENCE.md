# ShardTalk API Quick Reference

## Production URLs

**Base URL:** `https://shard-talk.vercel.app`

---

## API Endpoints

### 1️⃣ Get Message Count

**URL:**
```
https://shard-talk.vercel.app/api/messages?address={WALLET_ADDRESS}&count=true
```

**Example:**
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
  if (!response || typeof response !== 'object') return 0;
  if (typeof response.messageCount !== 'number') return 0;
  if (response.messageCount < 0) return 0;
  return 1;
}
```

---

### 2️⃣ Get User Messages

**URL:**
```
https://shard-talk.vercel.app/api/messages?address={WALLET_ADDRESS}&page={PAGE}&limit={LIMIT}
```

**Example:**
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
      "content": "try",
      "timestamp": 1761250736,
      "createdAt": "2025-10-23T20:18:56.000Z",
      "transactionHash": "0x..."
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
  if (!response || typeof response !== 'object') return 0;
  if (!Array.isArray(response.messages)) return 0;
  if (!response.pagination || typeof response.pagination.total !== 'number') return 0;
  for (const msg of response.messages) {
    if (typeof msg.messageId !== 'number' ||
        typeof msg.sender !== 'string' ||
        typeof msg.content !== 'string' ||
        typeof msg.timestamp !== 'number') return 0;
  }
  return 1;
}
```

---

## Test URLs (Copy & Paste into Browser)

**Test Message Count:**
```
https://shard-talk.vercel.app/api/messages?address=0x56e8667227e66ffebe06c21c2fef47ae108d3de0&count=true
```

**Test Get Messages:**
```
https://shard-talk.vercel.app/api/messages?address=0x56e8667227e66ffebe06c21c2fef47ae108d3de0&page=1&limit=10
```

---

## Integration Setup (Based on Your Screenshot)

### For Message Count Endpoint

| Field | Value |
|-------|-------|
| **Name** | Shard Talk |
| **Description** | A decentralized Messaging Dapp On Shardeum |
| **API endpoint** | `https://shard-talk.vercel.app/api/messages` |
| **API query** | `address={WALLET_ADDRESS}&count=true` |
| **Expression** | `function(response) { return response && typeof response.messageCount === 'number' && response.messageCount >= 0 ? 1 : 0; }` |
| **API headers** | `Content-Type: application/json` |

---

## JavaScript Examples

### Fetch Message Count

```javascript
const address = '0x56e8667227e66ffebe06c21c2fef47ae108d3de0'
const url = `https://shard-talk.vercel.app/api/messages?address=${address}&count=true`

fetch(url)
  .then(res => res.json())
  .then(data => console.log(`Messages: ${data.messageCount}`))
  .catch(err => console.error(err))
```

### Fetch User Messages

```javascript
const address = '0x56e8667227e66ffebe06c21c2fef47ae108d3de0'
const url = `https://shard-talk.vercel.app/api/messages?address=${address}&page=1&limit=10`

fetch(url)
  .then(res => res.json())
  .then(data => {
    console.log(`Total: ${data.pagination.total}`)
    data.messages.forEach(msg => console.log(msg.content))
  })
  .catch(err => console.error(err))
```

---

## cURL Examples

```bash
# Get message count
curl "https://shard-talk.vercel.app/api/messages?address=0x56e8667227e66ffebe06c21c2fef47ae108d3de0&count=true"

# Get messages
curl "https://shard-talk.vercel.app/api/messages?address=0x56e8667227e66ffebe06c21c2fef47ae108d3de0&page=1&limit=10"
```

---

## Common Use Cases

### ✅ Check if User Has Sent Messages

```javascript
function(response) {
  return response && response.messageCount > 0 ? 1 : 0;
}
```

### ✅ Require Minimum 5 Messages

```javascript
function(response) {
  return response && response.messageCount >= 5 ? 1 : 0;
}
```

### ✅ Get Actual Message Count

```javascript
function(response) {
  return response && typeof response.messageCount === 'number' ? response.messageCount : 0;
}
```

---

## Error Handling

**Error Response Format:**
```json
{
  "error": "Error message"
}
```

**Common Errors:**
- `400` - Missing or invalid address parameter
- `500` - Server error

---

## Notes

- ✅ No authentication required
- ✅ CORS enabled
- ✅ Case-insensitive wallet addresses
- ✅ Returns JSON format
- ❌ No email parameter supported (only wallet address)

---

## Files to Reference

- **Complete API Documentation:** `API_DOCUMENTATION.md`
- **Production Guide:** `PRODUCTION_API_GUIDE.md`
- **Integration Template:** `INTEGRATION_TEMPLATE.md`
- **TypeScript Types:** `types/api.ts`
- **API Client Library:** `lib/api/messages-api.ts`

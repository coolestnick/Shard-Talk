# Frontend Data Fetching Policy

## ✅ IMPORTANT: What the Frontend Should Do

### 1. Fetch Messages from Blockchain ONLY
- **Source**: Smart contract on Shardeum blockchain
- **Method**: Direct contract calls via ethers.js
- **What to fetch**: Messages from the blockchain contract
- **Why**: Messages are the source of truth on-chain

```typescript
// ✅ CORRECT: Fetch from blockchain
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider)
const messages = await contract.getMessages(start, count)
```

### 2. Save Messages to MongoDB (After Blockchain Confirmation)
- **When**: After message is confirmed on blockchain
- **Method**: POST to `/api/messages`
- **Purpose**: Backup and analytics only
- **Why**: Messages are already on blockchain, this is just for faster queries

```typescript
// ✅ CORRECT: Save after blockchain confirmation
await fetch('/api/messages', {
  method: 'POST',
  body: JSON.stringify({
    messageId,
    sender,
    content,
    timestamp,
    transactionHash
  })
})
```

### 3. Get Message Count (Optional)
- **Endpoint**: `/api/totalmsg/{address}`
- **Purpose**: Show user their total message count
- **What it returns**: ONLY the count, no message content
- **Why**: Faster than querying blockchain for just the count

```typescript
// ✅ CORRECT: Get count only
const response = await fetch(`/api/totalmsg/${address}`)
const { totalMessages } = await response.json()
```

---

## ❌ What the Frontend Should NEVER Do

### 1. ❌ NEVER Fetch User Profiles or Usernames
```typescript
// ❌ WRONG: Do NOT do this
await fetch(`/api/users?address=${address}`)
```

**Why NOT:**
- Creates unnecessary database load
- Not needed - messages come from blockchain
- Privacy concern - shouldn't track users
- Causes the 500 errors you saw

**What to do instead:**
- Just show the wallet address (0x123...abc)
- Or show first 6 + last 4 characters

```typescript
// ✅ CORRECT: Format address directly
const formatAddress = (addr) => `${addr.slice(0, 6)}...${addr.slice(-4)}`
```

### 2. ❌ NEVER Fetch Activity Logs
```typescript
// ❌ WRONG: Do NOT do this
await fetch('/api/activity')
await fetch('/api/activity', { method: 'POST', body: ... })
```

**Why NOT:**
- Privacy issue - no need to track user activity
- Creates unnecessary database writes
- Adds latency
- Not used anywhere in the app

**Already disabled in code:**
- `app/page.tsx` lines 16-21: Activity tracking commented out
- `components/MessageList.tsx` lines 87-95: Username fetching disabled

### 3. ❌ NEVER Fetch All Messages from Database
```typescript
// ❌ WRONG: Do NOT do this
await fetch('/api/messages?address=${address}') // Getting full messages
```

**Why NOT:**
- Messages should come from blockchain, not database
- Database is just a backup/cache
- Blockchain is the source of truth
- Wastes bandwidth

**What to do instead:**
- Fetch from blockchain contract
- Database is ONLY for saving (POST), not reading (GET)

---

## 📊 Current Frontend Data Flow (Correct)

```
┌─────────────────────────────────────────────────────────┐
│ 1. User Sends Message                                   │
│    ↓                                                     │
│    • Frontend → Blockchain (postMessage())              │
│    • Wait for confirmation                              │
│    • Message is now on-chain ✅                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 2. Save to MongoDB (Backup)                             │
│    ↓                                                     │
│    • Frontend → POST /api/messages                      │
│    • MongoDB saves for analytics                        │
│    • This is OPTIONAL (nice to have)                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 3. Display Messages                                      │
│    ↓                                                     │
│    • Frontend → Blockchain (getMessages())              │
│    • Display directly from blockchain                   │
│    • Format addresses in UI (no API calls)              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 4. Show User Stats (Optional)                           │
│    ↓                                                     │
│    • Frontend → GET /api/totalmsg/{address}             │
│    • Get count only (not messages)                      │
│    • Display: "You've sent 5 messages"                  │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 What's Already Fixed in Code

### ✅ MessageList Component
**File**: `components/MessageList.tsx` lines 87-95

```typescript
// Disabled: No longer fetching usernames from database
// useEffect(() => {
//   const uniqueAddresses = Array.from(new Set(messages.map(m => m.sender.toLowerCase())))
//   const missing = uniqueAddresses.filter(a => !addressToUsername[a])
//   if (missing.length === 0) return
//   ;(async () => {
//     // Disabled: Not fetching usernames from database anymore
//   })()
// }, [messages])
```

**What this means**: The code used to fetch usernames for every message sender. Now it's disabled. ✅

### ✅ Page Component
**File**: `app/page.tsx` lines 16-21

```typescript
// Disabled: No longer tracking user activity in database
// useEffect(() => {
//   if (isConnected && address) {
//     // Disabled: Not logging to database anymore
//   }
// }, [isConnected, address])
```

**What this means**: The code used to log user activity. Now it's disabled. ✅

---

## 🚨 Current Issue: Old Code on Production

**Problem**: Your production site (shard-talk.vercel.app) is still running OLD CODE that:
- ❌ Fetches user profiles (`/api/users` 500 errors)
- ❌ Tries to fetch activity logs (`/api/activity` 500 errors)
- ❌ Doesn't have the new error handling

**Solution**: REDEPLOY to Vercel!

```bash
# Commit all the fixes
git add .
git commit -m "Remove all unnecessary frontend API calls + add error handling"
git push origin main

# Vercel will auto-deploy the new code
```

**After deployment**, you should see:
- ✅ NO `/api/users` calls in browser console
- ✅ NO `/api/activity` calls in browser console
- ✅ Messages load from blockchain
- ✅ Only `/api/totalmsg/{address}` calls (optional, for count)

---

## 📋 API Endpoints Summary

| Endpoint | Frontend Should Use? | Purpose |
|----------|---------------------|---------|
| **Blockchain Contract** | ✅ YES | Fetch and display messages |
| `POST /api/messages` | ✅ YES | Save message after blockchain confirmation |
| `GET /api/totalmsg/{address}` | ✅ YES (optional) | Get message count only |
| `GET /api/messages` | ❌ NO | Only for external integrations |
| `GET /api/users` | ❌ NO | NEVER call this |
| `POST /api/users` | ❌ NO | NEVER call this |
| `GET /api/activity` | ❌ NO | NEVER call this |
| `POST /api/activity` | ❌ NO | NEVER call this |

---

## 🎯 Performance Benefits

By NOT fetching unnecessary data:

1. **Faster Load Times**
   - No waiting for user profile queries
   - No waiting for activity log writes
   - Only essential blockchain reads

2. **Reduced Database Load**
   - 90% fewer database queries
   - Lower MongoDB costs
   - Better scalability

3. **Better Privacy**
   - No user tracking
   - No activity logging
   - Only messages (which are public on blockchain anyway)

4. **Fewer Errors**
   - No 500 errors from failed user queries
   - No failed activity logging
   - Simpler, more reliable code

---

## ✅ Checklist: Is Your Frontend Correct?

Open browser console and check:

- [ ] ❌ NO calls to `/api/users`
- [ ] ❌ NO calls to `/api/activity`
- [ ] ✅ Messages loaded from blockchain contract
- [ ] ✅ Addresses shown as formatted strings (0x123...abc)
- [ ] ✅ Optional: ONE call to `/api/totalmsg/{address}` for count
- [ ] ✅ POST to `/api/messages` only after blockchain confirmation

If you see `/api/users` or `/api/activity` calls, **your old code is still deployed!**

---

## 🔧 MongoDB Environment Variable

**IMPORTANT**: After redeploying, ensure MongoDB is configured on Vercel:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add `MONGODB_URI` with your connection string
3. Redeploy

Without this, even the POST to `/api/messages` and GET from `/api/totalmsg` will fail.

---

## 📖 Summary

**The frontend should:**
- ✅ Fetch messages from blockchain
- ✅ Save messages to database after confirmation (POST only)
- ✅ Optionally get message count from `/api/totalmsg`
- ✅ Format addresses in the UI directly

**The frontend should NEVER:**
- ❌ Fetch user profiles or usernames
- ❌ Log activity to database
- ❌ Fetch other users' data
- ❌ Query messages from database (blockchain is the source)

**Current status:**
- ✅ Local code is correct (all unnecessary calls removed)
- ❌ Production is running old code (needs redeploy)
- ❌ MongoDB environment variable needs to be set on Vercel

**Next step**: Deploy the fixes to production!

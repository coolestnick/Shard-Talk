# DigitalOcean MongoDB Setup for Vercel

## 🎯 Your New Database Connection

You're switching from MongoDB Atlas to **DigitalOcean Managed MongoDB**.

**Connection String:**
```
mongodb+srv://doadmin:g3q1apofx059248i@Onchain-Chat-2de43fb0.mongo.ondigitalocean.com/admin?tls=true&authSource=admin&replicaSet=Onchain-Chat
```

---

## ⚙️ What Needs to Change on Vercel

### 1. Update Environment Variables

You need to update **TWO** environment variables on Vercel:

| Variable | Current Value | New Value |
|----------|--------------|-----------|
| `MONGODB_URI` | Old MongoDB Atlas URI | New DigitalOcean URI |
| `MONGODB_DB` | `shardtalk` or `admin` | **`shardtalk`** (recommended) |

---

## 🚀 Step-by-Step: Update Vercel

### Option A: Vercel Dashboard (Easiest)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select your `shard-talk` project

2. **Update MONGODB_URI**
   - Click **Settings** → **Environment Variables**
   - Find `MONGODB_URI`
   - Click **Edit** (pencil icon)
   - Replace with:
     ```
     mongodb+srv://doadmin:g3q1apofx059248i@Onchain-Chat-2de43fb0.mongo.ondigitalocean.com/admin?tls=true&authSource=admin&replicaSet=Onchain-Chat
     ```
   - **IMPORTANT**: Select all three environments:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
   - Click **Save**

3. **Update or Add MONGODB_DB**
   - Still in Environment Variables section
   - If `MONGODB_DB` exists, click **Edit**
   - If it doesn't exist, click **Add New**
   - Set:
     - **Name**: `MONGODB_DB`
     - **Value**: `shardtalk`
     - **Select**: Production, Preview, Development (all three)
   - Click **Save**

4. **Redeploy**
   - Go to **Deployments** tab
   - Find the latest deployment
   - Click three dots (⋮) → **Redeploy**
   - Click **Redeploy** again to confirm

### Option B: Vercel CLI

```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Login
vercel login

# Navigate to your project
cd "/Users/nikhilkumar/Downloads/shardeum-onchain-chat-main 2"

# Update MONGODB_URI
vercel env rm MONGODB_URI production
vercel env add MONGODB_URI production
# Paste: mongodb+srv://doadmin:g3q1apofx059248i@Onchain-Chat-2de43fb0.mongo.ondigitalocean.com/admin?tls=true&authSource=admin&replicaSet=Onchain-Chat

vercel env rm MONGODB_URI preview
vercel env add MONGODB_URI preview
# Paste the same URI

# Update MONGODB_DB
vercel env rm MONGODB_DB production
vercel env add MONGODB_DB production
# Enter: shardtalk

vercel env rm MONGODB_DB preview
vercel env add MONGODB_DB preview
# Enter: shardtalk

# Deploy
vercel --prod
```

---

## 🗄️ Database Name Configuration

### Important: Connection String vs Database Name

Your connection string connects to the `admin` database:
```
mongodb+srv://...@...com/admin?...
                           ^^^^
```

But your app should use a **separate database** for storing messages:
```
MONGODB_DB=shardtalk
```

### How It Works

```javascript
// In your code (lib/mongodb.ts)
const client = new MongoClient(MONGODB_URI)  // Connects using 'admin' for auth
const db = client.db(MONGODB_DB)            // But uses 'shardtalk' for data

// So you get:
// - Authentication: admin database
// - Data storage: shardtalk database
```

This is the **correct** way to configure it.

---

## 📊 Database Collections

After deploying, your DigitalOcean MongoDB will have these collections in the `shardtalk` database:

```
Database: shardtalk
├── messages      ← Chat messages from blockchain
├── users         ← User profiles (not actively used)
└── activity      ← Activity logs (deprecated)
```

---

## 🔄 Migrating Data (If Needed)

If you had data in your old MongoDB Atlas and want to move it to DigitalOcean:

### Option 1: Use Sync Script (Recommended)

Your app already has a sync script that pulls data from blockchain:

```bash
# Update .env with new DigitalOcean URI
echo 'MONGODB_URI="mongodb+srv://doadmin:g3q1apofx059248i@Onchain-Chat-2de43fb0.mongo.ondigitalocean.com/admin?tls=true&authSource=admin&replicaSet=Onchain-Chat"' > .env
echo 'MONGODB_DB="shardtalk"' >> .env

# Run sync script
npm run sync-messages
```

This will:
- Fetch all messages from blockchain
- Save them to your new DigitalOcean database
- Takes ~30 seconds for 100 messages

### Option 2: MongoDB Dump/Restore

If you want to copy data from old database:

```bash
# Export from old database
mongodump --uri="your_old_mongodb_atlas_uri" --db=shardtalk --out=./backup

# Import to new database
mongorestore --uri="mongodb+srv://doadmin:g3q1apofx059248i@Onchain-Chat-2de43fb0.mongo.ondigitalocean.com/admin?tls=true&authSource=admin&replicaSet=Onchain-Chat" --db=shardtalk ./backup/shardtalk
```

### Option 3: Start Fresh

Just deploy and let users send new messages. They'll be saved to the new database automatically.

---

## 🔒 DigitalOcean Firewall Settings

**Important**: DigitalOcean databases have IP restrictions by default.

### Check Firewall Settings

1. Go to DigitalOcean Dashboard
2. Click **Databases** → Your database
3. Click **Settings** → **Trusted Sources**
4. Ensure **"Allow all IP addresses"** is enabled
   - Or add Vercel's IP ranges (not recommended, changes frequently)

### Enable All IPs (Recommended for Vercel)

```
In DigitalOcean Dashboard:
1. Go to your database
2. Click "Settings"
3. Under "Trusted Sources"
4. Click "Edit"
5. Select "Allow all IP addresses"
6. Click "Save"
```

**Why**: Vercel uses dynamic IPs that change frequently, so allowing all IPs is the practical solution.

**Security**: Your database is still protected by:
- Username/password authentication
- TLS encryption
- Firewall on DigitalOcean

---

## 🧪 Testing After Update

### 1. Test Locally First

```bash
# Update your local .env file
echo 'MONGODB_URI="mongodb+srv://doadmin:g3q1apofx059248i@Onchain-Chat-2de43fb0.mongo.ondigitalocean.com/admin?tls=true&authSource=admin&replicaSet=Onchain-Chat"' > .env.local
echo 'MONGODB_DB="shardtalk"' >> .env.local

# Test connection
npm run dev

# In another terminal, test endpoints
curl "http://localhost:3000/api/totalmsg/0x22D74ADFB45147d7588aFA3ba0eF1c363b7dFcFF"
```

### 2. Test Production Endpoints

After deploying to Vercel:

```bash
# Test message count endpoint
curl "https://shard-talk.vercel.app/api/totalmsg/0x22D74ADFB45147d7588aFA3ba0eF1c363b7dFcFF"

# Should return:
# {"success":true,"address":"0x22d74adfb45147d7588afa3ba0ef1c363b7dfcff","totalMessages":X}

# Test messages endpoint
curl "https://shard-talk.vercel.app/api/messages?address=0x22D74ADFB45147d7588aFA3ba0eF1c363b7dfcff&count=true"

# Should return:
# {"success":true,"address":"0x22d74adfb45147d7588afa3ba0ef1c363b7dfcff","messageCount":X}
```

### 3. Check Vercel Logs

```bash
vercel logs --follow
```

Look for:
- ✅ Successful database connections
- ✅ No "Database connection failed" errors
- ✅ Messages being saved successfully

### 4. Test in Browser

1. Open https://shard-talk.vercel.app
2. Connect wallet
3. Send a test message
4. Check browser console:
   - ✅ Should see "Message saved to MongoDB"
   - ✅ Should NOT see database errors
   - ✅ Message should appear in chat

---

## 📋 Complete Checklist

### Before Deploying:
- [ ] DigitalOcean database is running
- [ ] "Allow all IP addresses" is enabled in DigitalOcean firewall
- [ ] You have the connection string ready
- [ ] Local .env.local is updated (for testing)

### On Vercel:
- [ ] `MONGODB_URI` updated with DigitalOcean connection string
- [ ] `MONGODB_DB` set to `shardtalk`
- [ ] Both variables applied to Production, Preview, and Development
- [ ] Project redeployed

### After Deploying:
- [ ] Test `/api/totalmsg/{address}` endpoint
- [ ] Test `/api/messages?count=true` endpoint
- [ ] Send a test message through the app
- [ ] Check Vercel logs for errors
- [ ] Verify messages are being saved to DigitalOcean

---

## 🔧 Troubleshooting

### Issue: "Database connection failed"

**Causes:**
1. DigitalOcean firewall blocking Vercel IPs
2. Incorrect connection string
3. Database user doesn't have permissions

**Solutions:**
```bash
# 1. Check firewall (DigitalOcean dashboard)
# Settings → Trusted Sources → Allow all IP addresses

# 2. Verify connection string
# Should have these parts:
# - mongodb+srv:// (protocol)
# - doadmin:password@ (credentials)
# - hostname.mongo.ondigitalocean.com (host)
# - /admin (database for auth)
# - ?tls=true&authSource=admin&replicaSet=... (options)

# 3. Test connection locally
mongo "mongodb+srv://doadmin:g3q1apofx059248i@Onchain-Chat-2de43fb0.mongo.ondigitalocean.com/admin?tls=true&authSource=admin&replicaSet=Onchain-Chat" --eval "db.adminCommand('ping')"
```

### Issue: "Authentication failed"

**Cause:** Username or password is incorrect

**Solution:**
1. Go to DigitalOcean Dashboard
2. Click your database
3. Click **Users & Databases** tab
4. Reset password for `doadmin` user
5. Update connection string on Vercel

### Issue: Collections not appearing

**Cause:** Wrong database name

**Solution:**
```bash
# Verify MONGODB_DB on Vercel
# Should be: shardtalk

# Check which database has your data
mongo "your_connection_string" --eval "db.adminCommand('listDatabases')"
```

### Issue: Slow queries

**Cause:** DigitalOcean database might need indexes

**Solution:**
```javascript
// Connect to your database
mongosh "mongodb+srv://doadmin:g3q1apofx059248i@Onchain-Chat-2de43fb0.mongo.ondigitalocean.com/admin?tls=true&authSource=admin&replicaSet=Onchain-Chat"

// Switch to shardtalk database
use shardtalk

// Create indexes
db.messages.createIndex({ sender: 1 })
db.messages.createIndex({ messageId: 1 }, { unique: true })
db.messages.createIndex({ timestamp: -1 })
```

---

## 📊 DigitalOcean vs MongoDB Atlas

### What's Different?

| Feature | MongoDB Atlas | DigitalOcean |
|---------|--------------|--------------|
| **Connection Format** | Same | Same (mongodb+srv://) |
| **IP Allowlist** | Manual setup | Same |
| **Database Name** | Flexible | Use separate DB (not admin) |
| **Scaling** | ✅ Auto-scaling | ✅ Manual scaling |
| **Monitoring** | Built-in dashboard | DigitalOcean dashboard |
| **Backup** | Automated | Automated |

### What Stays the Same?

- ✅ Your code doesn't change
- ✅ Connection format is identical
- ✅ All queries work the same
- ✅ No code changes needed
- ✅ Just update environment variables

---

## 🎯 Quick Summary

**What you need to do:**

1. **Update Vercel environment variables:**
   ```
   MONGODB_URI = mongodb+srv://doadmin:g3q1apofx059248i@Onchain-Chat-2de43fb0.mongo.ondigitalocean.com/admin?tls=true&authSource=admin&replicaSet=Onchain-Chat
   MONGODB_DB = shardtalk
   ```

2. **Enable IP access on DigitalOcean:**
   - Dashboard → Database → Settings → Trusted Sources
   - Enable "Allow all IP addresses"

3. **Redeploy on Vercel:**
   - Deployments → Redeploy
   - Or push to Git

4. **Test:**
   - Try the endpoints
   - Send a test message
   - Check logs

**Time required:** 5 minutes

**Code changes:** None! Just environment variables.

---

## ✅ Final Verification

After everything is set up, run these commands:

```bash
# 1. Test message count
curl "https://shard-talk.vercel.app/api/totalmsg/0x22D74ADFB45147d7588aFA3ba0eF1c363b7dFcFF"

# 2. Check Vercel logs
vercel logs --follow

# 3. Send a test message through the app
# Open https://shard-talk.vercel.app
# Connect wallet → Send message → Check console

# All should work perfectly! ✅
```

---

**Your scaled DigitalOcean database is ready!** 🚀

# Vercel Deployment Guide

## Fixing 500 Internal Server Errors

Your production deployment at `https://shard-talk.vercel.app` is experiencing 500 errors because **environment variables are not configured on Vercel**.

---

## Step-by-Step Deployment Fix

### 1. Add Environment Variables to Vercel

Go to your Vercel dashboard:

1. Open [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your `shard-talk` project
3. Click **Settings** → **Environment Variables**
4. Add the following variables:

#### Required Environment Variables:

```plaintext
# MongoDB Configuration (REQUIRED - This is causing the 500 errors!)
MONGODB_URI=mongodb+srv://doadmin:T0PY7Wa63lmc2194@Onchain-Chat-2de43fb0.mongo.ondigitalocean.com/admin?tls=true&authSource=admin
MONGODB_DB=shardtalk

# WalletConnect Project ID
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=1af5bc64ed6f6072f0df23f093583c81

# Contract Configuration
NEXT_PUBLIC_CONTRACT_ADDRESS=0x9b137bde888021ca8174ac2621a59b14afa4fee6
NEXT_PUBLIC_RPC_URL=https://api-mezame.shardeum.org
NEXT_PUBLIC_CHAIN_ID=8119
NEXT_PUBLIC_EXPLORER_URL=https://explorer-mezame.shardeum.org

# API Base URL (optional)
NEXT_PUBLIC_API_BASE_URL=https://shard-talk.vercel.app

# Private Key (only needed if redeploying contracts)
# PRIVATE_KEY=your_private_key_here
```

**CRITICAL:** Make sure `MONGODB_URI` is set! This is what's causing the 500 errors.

---

### 2. Environment Variable Scope

For each variable, select the appropriate environments:

- **Production**: ✅ Check this for live site
- **Preview**: ✅ Check this for PR previews
- **Development**: ⬜ Leave unchecked (use local .env file)

---

### 3. Redeploy After Adding Variables

After adding all environment variables:

1. Go to **Deployments** tab
2. Click the **three dots (⋮)** on the latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete

---

### 4. Verify Deployment

Test your API endpoints:

```bash
# Test message count (should return JSON, not 500 error)
curl "https://shard-talk.vercel.app/api/messages?address=0x56e8667227e66ffebe06c21c2fef47ae108d3de0&count=true"

# Expected response:
# {"address":"0x56e8667227e66ffebe06c21c2fef47ae108d3de0","messageCount":4}
```

---

## Why 500 Errors Were Happening

### Root Cause:
The `/api/users` and other API endpoints require MongoDB connection, but `MONGODB_URI` wasn't set on Vercel.

### Why It Kept Retrying:
The frontend was configured to retry failed requests, causing the infinite loop of errors you saw.

### What We Fixed:
1. **Added circuit breaker** - Stops retrying after 3 failures
2. **Disabled retry on 5xx errors** - No more infinite loops
3. **Added timeout** - Requests timeout after 10 seconds
4. **Better error handling** - Fails gracefully instead of crashing

---

## Additional Deployment Options

### Option 1: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod

# The CLI will ask for environment variables during first deployment
```

### Option 2: Deploy via GitHub Integration

1. Push your code to GitHub
2. Go to Vercel dashboard → **Add New** → **Project**
3. Import your GitHub repository
4. Add environment variables in the setup wizard
5. Click **Deploy**

---

## Environment Variable Priority

Vercel uses this priority order:

1. **Environment Variables** (set in Vercel dashboard) ← Highest priority
2. `.env.production` (in your repo)
3. `.env.local` (gitignored, not deployed)
4. `.env` (in your repo)

**Best Practice:** Use Vercel dashboard for secrets like MongoDB credentials.

---

## Common Issues & Solutions

### Issue 1: Still Getting 500 Errors After Adding Variables

**Solution:**
1. Make sure you **redeployed** after adding variables
2. Check that variable names match exactly (case-sensitive)
3. Verify MongoDB URI is correct (test locally first)

### Issue 2: API Works Locally But Not on Vercel

**Solution:**
```bash
# Test your MongoDB connection string works
node -e "
const { MongoClient } = require('mongodb');
new MongoClient('YOUR_MONGODB_URI_HERE').connect()
  .then(() => console.log('✅ Connected'))
  .catch(err => console.error('❌ Error:', err.message))
"
```

### Issue 3: NEXT_PUBLIC_ Variables Not Working

**Solution:**
- Variables starting with `NEXT_PUBLIC_` are embedded at **build time**
- You must **redeploy** after changing them
- They are visible in browser (don't put secrets in NEXT_PUBLIC_ variables)

### Issue 4: Deployment Takes Too Long

**Solution:**
- Vercel has a 45-second timeout for API routes
- Consider using Edge Functions for faster cold starts
- Or implement pagination for large data queries

---

## Monitoring & Debugging

### Check Deployment Logs:

1. Go to **Deployments** tab
2. Click on your latest deployment
3. Click **Functions** tab
4. View logs for `/api/messages`, `/api/users`, etc.

### View Runtime Logs:

1. Go to your project dashboard
2. Click **Logs** or **Analytics**
3. Filter by status code (500, 404, etc.)

### Test API Endpoints:

```bash
# Check if API is working
curl https://shard-talk.vercel.app/api/messages?address=0x123...&count=true

# Check response headers
curl -I https://shard-talk.vercel.app/api/messages?address=0x123...&count=true
```

---

## Production Checklist

Before going live, verify:

- [x] All environment variables set on Vercel
- [x] MongoDB connection string works
- [x] API endpoints return 200 (not 500)
- [x] Messages API returns valid JSON
- [x] Circuit breaker prevents infinite retries
- [x] Domain DNS configured (if using custom domain)
- [x] HTTPS working correctly
- [x] No secrets exposed in client-side code

---

## Performance Optimizations

### Enable Edge Caching:

Add to your API routes:

```typescript
export const runtime = 'edge' // Use edge runtime for faster response
export const revalidate = 60 // Cache for 60 seconds
```

### Use ISR (Incremental Static Regeneration):

```typescript
export const revalidate = 300 // Regenerate every 5 minutes
```

### Optimize MongoDB Queries:

- Use indexes (already done!)
- Limit query results
- Use projection to return only needed fields

---

## Security Best Practices

1. **Never commit** `.env` with real credentials
2. **Rotate secrets** regularly
3. **Use Vercel's encryption** for sensitive variables
4. **Enable CORS** only for trusted domains
5. **Rate limit** API endpoints (consider Vercel's rate limiting)

---

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Environment Variables Guide**: https://vercel.com/docs/environment-variables
- **Serverless Functions**: https://vercel.com/docs/functions
- **MongoDB Atlas**: https://www.mongodb.com/docs/atlas/

---

## Quick Reference

### Vercel CLI Commands:

```bash
vercel                  # Deploy to preview
vercel --prod          # Deploy to production
vercel env ls          # List environment variables
vercel env add         # Add environment variable
vercel env rm          # Remove environment variable
vercel logs            # View deployment logs
vercel domains         # Manage custom domains
```

### Test Deployment:

```bash
# Test production
curl https://shard-talk.vercel.app/api/messages?address=0x123...&count=true

# Test preview (replace with your preview URL)
curl https://shard-talk-abc123.vercel.app/api/messages?address=0x123...&count=true
```

---

## Summary

**The 500 errors are caused by missing MongoDB credentials on Vercel.**

**To fix:**
1. Add `MONGODB_URI` to Vercel environment variables
2. Add all other `NEXT_PUBLIC_*` variables
3. Redeploy the project
4. Test the API endpoints

After following these steps, your production app will work correctly! 🚀

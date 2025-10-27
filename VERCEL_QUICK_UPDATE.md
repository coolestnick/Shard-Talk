# 🚀 Quick Update: Vercel + DigitalOcean Database

## ⚡ 2-Minute Setup

### Step 1: Update Vercel Environment Variables

Go to: **https://vercel.com/dashboard** → Your Project → **Settings** → **Environment Variables**

#### Update These 2 Variables:

1. **MONGODB_URI** (Edit or Add New)
   ```
   mongodb+srv://doadmin:g3q1apofx059248i@Onchain-Chat-2de43fb0.mongo.ondigitalocean.com/admin?tls=true&authSource=admin&replicaSet=Onchain-Chat
   ```
   - ✅ Select: Production, Preview, Development

2. **MONGODB_DB** (Edit or Add New)
   ```
   shardtalk
   ```
   - ✅ Select: Production, Preview, Development

### Step 2: Enable IP Access on DigitalOcean

Go to: **DigitalOcean Dashboard** → **Databases** → Your Database → **Settings**

- Find: **Trusted Sources**
- Enable: **"Allow all IP addresses"**
- Click: **Save**

### Step 3: Redeploy

On Vercel:
- Go to **Deployments** tab
- Click **⋮** on latest deployment
- Click **Redeploy**

---

## ✅ Test It Works

```bash
# Test the endpoint
curl "https://shard-talk.vercel.app/api/totalmsg/0x22D74ADFB45147d7588aFA3ba0eF1c363b7dfcff"

# Should return success with message count
```

---

## 🔧 If It Doesn't Work

### Check 1: Vercel Environment Variables
- Both `MONGODB_URI` and `MONGODB_DB` are set
- Applied to all environments (Production, Preview, Development)
- No typos in the connection string

### Check 2: DigitalOcean Firewall
- "Allow all IP addresses" is enabled
- Database status is "Online"

### Check 3: Vercel Logs
```bash
vercel logs --follow
```
Look for "Database connection failed" errors

---

## 📝 What Changed?

| Setting | Old Value | New Value |
|---------|-----------|-----------|
| `MONGODB_URI` | MongoDB Atlas URI | DigitalOcean URI |
| `MONGODB_DB` | `shardtalk` | `shardtalk` (same) |
| IP Allowlist | Atlas: 0.0.0.0/0 | DigitalOcean: Allow all |

**Your code**: No changes needed! ✅

---

## 🎯 Complete Checklist

- [ ] Updated `MONGODB_URI` on Vercel
- [ ] Updated `MONGODB_DB` on Vercel (or added if missing)
- [ ] Enabled "Allow all IP addresses" on DigitalOcean
- [ ] Redeployed on Vercel
- [ ] Tested `/api/totalmsg` endpoint
- [ ] Sent test message through app
- [ ] Checked Vercel logs (no errors)

---

**Done in 2 minutes!** 🎉

For detailed guide, see: `VERCEL_DIGITALOCEAN_SETUP.md`

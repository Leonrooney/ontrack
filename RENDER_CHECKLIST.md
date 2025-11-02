# Render Deployment Checklist

## ✅ Pre-Deployment Verification

Your code is ready:
- ✅ PostgreSQL migrations in repository
- ✅ Prisma schema configured for PostgreSQL
- ✅ All files committed and pushed to GitHub
- ✅ Demo data seeded in local PostgreSQL database
- ✅ App running successfully locally

Repository: `https://github.com/Leonrooney/ontrack`

---

## 🚀 Step 1: Create Web Service on Render

1. Go to https://render.com/dashboard
2. Click **"New +"** → **"Web Service"**
3. Connect GitHub repository: `Leonrooney/ontrack`
4. Configure:

| Setting | Value |
|---------|-------|
| **Name** | `ontrack` |
| **Region** | Same as your PostgreSQL database |
| **Branch** | `main` |
| **Root Directory** | `/` (leave blank or `/`) |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npx prisma migrate deploy && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

5. Click **"Create Web Service"**

---

## 🔐 Step 2: Environment Variables

Go to **Settings** → **Environment** and add:

```bash
# Database - Use INTERNAL Database URL from your PostgreSQL service
DATABASE_URL=postgresql://USER:PASSWORD@INTERNAL-HOST:5432/DB?sslmode=require

# NextAuth
NEXTAUTH_SECRET=N2op8iEId61/0ExAjc8DS+gV+PtRn67/8hmNvfecTGc=

# Production URLs
NEXTAUTH_URL=https://ontrack.onrender.com
NEXT_PUBLIC_API_URL=https://ontrack.onrender.com

# Node Version (recommended)
NODE_VERSION=20
```

**Important:** 
- Use **INTERNAL Database URL** (not external)
- Get it from: PostgreSQL Dashboard → Connections → Internal Connection String
- Your Render URL might be `ontrack-XXX.onrender.com` if automatic name is taken

---

## 📋 Step 3: Post-Deployment Verification

### 3.1 Check Build Logs

After deployment starts, watch the logs:
- ✅ Should see "Prisma Client generated successfully"
- ✅ Should see "Migration applied successfully"
- ✅ Should see "Compiled successfully"
- ✅ Should end with "Server listening on port 10000"

### 3.2 Health Check

Visit:
```
https://ontrack.onrender.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "...",
  "environment": "production"
}
```

### 3.3 Test Main Site

Visit:
```
https://ontrack.onrender.com
```

Should redirect to:
```
https://ontrack.onrender.com/dashboard
```

### 3.4 Test Authentication

1. Go to login page (if you have one)
2. Sign in with:
   - **Email**: `demo@ontrack.app`
   - **Password**: `Passw0rd!`

**Note:** If you haven't seeded the production database, you'll need to:
- Run the seed script via Render Shell, OR
- Create a signup page

### 3.5 Seed Production Database (Optional)

If you need demo data in production:

1. In Render dashboard, go to your Web Service
2. Click **"Shell"** tab
3. Run:
   ```bash
   npm run prisma:seed
   ```

---

## 🔄 Step 4: Enable Auto-Deploy

1. Go to **Settings** → **Auto-Deploy**
2. Toggle **"Automatic Deploy"** to ON
3. Verify it says: "Auto-Deploy is enabled for main branch"

Now any push to `main` will trigger a new deployment.

---

## 🐛 Troubleshooting

### Build Fails: "Can't generate Prisma Client"
**Solution:** Check that `postinstall` script is in package.json
```bash
# In Render build logs, you should see Prisma generating
```

### Build Fails: Migration Error
**Solution:** Verify migrations are committed:
```bash
git log --oneline --all | grep migration
```

### Database Connection Error
**Solution:** 
- Verify using **INTERNAL** Database URL (not external)
- Check PostgreSQL service is running
- Ensure `?sslmode=require` is at end of URL

### "Server not listening" Error
**Solution:** 
- Verify start command is exactly: `npm start`
- Next.js should auto-detect port from `$PORT` environment variable (Render sets this)

### "NEXTAUTH_SECRET" Missing
**Solution:** 
- Add environment variable in Render dashboard
- Must match your local `.env` file

### Health Endpoint Returns 404
**Solution:** 
- Check build completed successfully
- Verify API route exists: `src/app/api/health/route.ts`

### Can't Sign In
**Solution:** 
- Verify production database has users (may need to seed)
- Check NEXTAUTH_URL matches your actual Render URL exactly
- Try clearing browser cookies

---

## 📊 Monitoring

### View Logs
1. Go to Render Dashboard → ontrack
2. Click **"Logs"** tab
3. Filter by: "Build", "Deploy", or "Runtime"

### Check Performance
1. Click **"Metrics"** tab
2. Monitor: Memory, CPU, Response Time

### Database Access
1. Go to PostgreSQL service dashboard
2. Click **"Query"** tab for read-only access
3. Click **"Shell"** tab for psql access

---

## 🎉 Success Criteria

- [x] Build completes without errors
- [x] Prisma migrations applied successfully
- [x] Site loads at `https://ontrack.onrender.com`
- [x] `/api/health` responds with status ok
- [x] Dashboard accessible and styled correctly
- [x] Authentication works (login/logout)
- [x] Auto-deploy enabled

---

## 📝 Next Steps

After successful deployment:

1. **Custom Domain** (Optional)
   - Go to Settings → Custom Domain
   - Add your domain
   - Update DNS records as instructed

2. **SSL Certificate**
   - Automatically provisioned by Render
   - Force HTTPS enabled by default

3. **Environment Variables**
   - Keep sensitive values in Render (never commit)
   - Update `.env.example` for documentation only

4. **Monitoring**
   - Set up email alerts for failed deployments
   - Monitor resource usage in free tier

---

## 🔗 Quick Links

- **Render Dashboard**: https://render.com/dashboard
- **Render Docs**: https://render.com/docs
- **Your App**: https://ontrack.onrender.com
- **GitHub Repo**: https://github.com/Leonrooney/ontrack

---

Good luck with your deployment! 🚀


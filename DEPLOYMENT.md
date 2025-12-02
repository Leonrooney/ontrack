# OnTrack Deployment to Render.com

## ⚠️ Important: Database Migration Commands

- **`prisma migrate dev`**: **NEVER** use this against Render's database. Use only for local development with `.env.local`
- **`prisma migrate deploy`**: Use this for production deployments on Render. This applies existing migrations without creating new ones.

See [LOCAL_SETUP.md](LOCAL_SETUP.md) for local development setup.

## Prerequisites

- ✅ GitHub repository: `https://github.com/Leonrooney/ontrack`
- ✅ PostgreSQL database created on Render (`ontrack-db`)
- ✅ Local development database set up (see [LOCAL_SETUP.md](LOCAL_SETUP.md))
- ✅ Code committed and pushed to `main` branch

## Deployment Steps

### 1. Create Web Service on Render

1. Go to https://render.com → Sign in with GitHub
2. Click **"New +"** → **"Web Service"**
3. Connect GitHub repository: **Leonrooney/ontrack**
4. Configure settings:

| Setting | Value |
|---------|-------|
| **Name** | `ontrack` |
| **Environment** | `Node` |
| **Region** | Same as your PostgreSQL database (e.g., Frankfurt) |
| **Branch** | `main` |
| **Root Directory** | `/` (leave blank) |
| **Build Command** | `npm install && npm run db:migrate:deploy && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

5. Click **"Create Web Service"**

### 2. Configure Environment Variables

Once the service is created, go to **Settings** → **Environment** and add:

```bash
# Database - Use INTERNAL Database URL from PostgreSQL service
DATABASE_URL=postgresql://<user>:<password>@<internal-host>:5432/<db>?sslmode=require

# NextAuth Secret (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET=<your-generated-secret>

# Production URLs
NEXTAUTH_URL=https://ontrack-backend-n1im.onrender.com
NEXT_PUBLIC_API_URL=https://ontrack-backend-n1im.onrender.com

# Node Version (recommended for deterministic builds)
NODE_VERSION=20
```

**Important Notes:**
- Get the **Internal Database URL** from: PostgreSQL Dashboard → Connections → Internal Connection String
- Current Render URL: `https://ontrack-backend-n1im.onrender.com`
- **Never commit these values** to Git (already in `.gitignore`)

### 3. Deploy

The build will start automatically. Watch the build logs for:

✅ **Expected Build Output:**
```
Installing dependencies...
Running postinstall...
Prisma Client generated successfully
Running migrations...
Migration 20241102_XXXXX applied successfully
Compiling...
Next.js compiled successfully
Creating production build...
Built in XXs
Starting server...
Server listening on port 10000
```

### 4. Seed Production Database

After successful deployment, seed your production database:

1. In Render dashboard → your Web Service → **Shell** tab
2. Run:
   ```bash
   npm run prisma:seed
   ```
3. You should see: ✅ Seed complete.

### 5. Verify Deployment

#### 5.1 Health Check
Visit: `https://ontrack-backend-n1im.onrender.com/api/health`

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-11-02T...",
  "environment": "production"
}
```

#### 5.2 Test Main Pages
- **Dashboard**: `https://ontrack-backend-n1im.onrender.com/dashboard`
- **Activity**: `https://ontrack-backend-n1im.onrender.com/activity`
- **Goals**: `https://ontrack-backend-n1im.onrender.com/goals`
- **Forecast**: `https://ontrack-backend-n1im.onrender.com/forecast`
- **FAQ**: `https://ontrack-backend-n1im.onrender.com/faq`

#### 5.3 Test Authentication
1. Visit: `https://ontrack-backend-n1im.onrender.com/login`
2. Sign in with:
   - **Email**: `demo@ontrack.app`
   - **Password**: `Passw0rd!`
3. Should redirect to `/dashboard`
4. Test logout and re-login

### 6. Enable Auto-Deploy

1. Go to **Settings** → **Auto-Deploy**
2. Toggle **"Automatic Deploy"** to ON
3. Verify: "Auto-Deploy is enabled for main branch"

Now any push to `main` will trigger a new deployment automatically.

## Troubleshooting

### Build Fails: Prisma Client Error
**Solution:** Build command includes `postinstall` script which runs `prisma generate`

### Build Fails: Migration Error
**Check:** 
- Ensure migrations are in `prisma/migrations/`
- Verify DATABASE_URL is correct (INTERNAL URL)
- Check build logs for specific migration error
- **Never use `migrate dev` in production** - only use `migrate deploy`

### 500 Error on API Routes
**Common causes:**
1. **Decimal serialization**: Already fixed with `toPlain()` helper
2. **Missing env vars**: Check all vars are set in Render
3. **Database connection**: Verify DATABASE_URL is INTERNAL and has `?sslmode=require`

### 401 Unauthorized
**Check:**
- NEXTAUTH_URL matches your actual Render URL exactly
- NEXTAUTH_SECRET is set in environment variables
- Database has seeded users (run `npm run prisma:seed`)

### P1001: Can't Reach Database
**Solution:**
- Must use **INTERNAL** Database URL (not external)
- Check PostgreSQL service is "Available"
- Verify `?sslmode=require` at end of URL

### Build Uses Wrong Node Version
**Solution:**
- Add `NODE_VERSION=20` to environment variables
- Redeploy

## Monitoring

### View Logs
- **Build Logs**: See deployment progress
- **Runtime Logs**: See live app logs
- **Filter**: Use search to find errors

### Check Metrics
- Memory usage
- CPU usage
- Response times
- Request counts

### Database Access
- **Query**: Read-only SQL queries
- **Shell**: Full psql access

## Next Steps

### Custom Domain (Optional)
1. Go to **Settings** → **Custom Domains**
2. Add your domain
3. Update DNS records as instructed
4. Update `NEXTAUTH_URL` and `NEXT_PUBLIC_API_URL`
5. Redeploy

### SSL Certificate
- Automatically provisioned by Render
- HTTPS enforced by default

### Environment Variables
- Never commit sensitive values to Git
- Update `.env.example` for documentation only
- Use Render's encrypted secrets storage

## Success Criteria

- ✅ Build completes without errors
- ✅ Prisma migrations applied successfully
- ✅ Site loads at Render URL
- ✅ `/api/health` returns 200
- ✅ All pages render correctly
- ✅ Authentication works
- ✅ Database queries successful
- ✅ Auto-deploy enabled

## Quick Reference

- **Render Dashboard**: https://render.com/dashboard
- **Render Docs**: https://render.com/docs
- **Your App**: https://ontrack-backend-n1im.onrender.com
- **GitHub Repo**: https://github.com/Leonrooney/ontrack

## Migration Commands Reference

| Command | When to Use | Environment |
|---------|-------------|-------------|
| `npm run db:migrate:dev` | Creating new migrations during development | **Local only** (with `.env.local`) |
| `npm run db:migrate:deploy` | Applying migrations to production | **Render** (during build) |

**⚠️ Critical**: Never run `migrate dev` against Render's database. It requires SUPERUSER permissions that managed databases don't allow.

## Support

If you encounter issues not covered here:
1. Check Render build logs
2. Check Render runtime logs
3. Check browser console for client errors
4. Review Prisma Client generation
5. Verify all environment variables are set


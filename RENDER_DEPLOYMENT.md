# Render Deployment Guide

This guide explains how to deploy OnTrack to Render and fix common deployment issues.

## Prerequisites

1. A Render account
2. A PostgreSQL database on Render (or external)
3. GitHub repository connected to Render

## Deployment Steps

### 1. Create a Web Service on Render

1. Go to your Render dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub repository: `Leonrooney/ontrack`
4. Select the repository

### 2. Configure Build & Start Commands ⚠️ IMPORTANT

**You MUST manually update these in the Render dashboard!**

1. Go to your service in Render dashboard
2. Click on "Settings" tab
3. Scroll down to "Build & Deploy" section
4. Update the **Build Command** to:
   ```
   npm install && npm run build
   ```
   ⚠️ **Remove** `npx prisma migrate deploy` from the build command!

5. Update the **Start Command** to:
   ```
   npm run start:prod
   ```

6. Click "Save Changes"

**Alternative Start Command (using shell script):**
```
./scripts/start.sh
```

### 3. Environment Variables

Set the following environment variables in Render:

- `DATABASE_URL` - Your PostgreSQL connection string
  - For Render PostgreSQL: Use the **Internal Database URL** (not external)
  - Format: `postgresql://user:password@host:5432/database`
  
- `NEXTAUTH_URL` - Your app's URL (e.g., `https://ontrack.onrender.com`)
- `NEXTAUTH_SECRET` - A random secret string (generate with `openssl rand -base64 32`)
- `NODE_ENV` - Set to `production`

### 4. Using render.yaml (Optional)

⚠️ **Note:** `render.yaml` is only used for Blueprint deployments (new services created from the YAML file). If you created your service manually in the dashboard, you must update the build/start commands manually as described in step 2 above.

If you want to use `render.yaml`:
1. Delete your existing service (or create a new one)
2. Use "New +" → "Blueprint" instead of "Web Service"
3. Connect your repository
4. Render will automatically use the `render.yaml` configuration

## Troubleshooting

### Issue: "Can't reach database server" during build

**Solution:** This happens because `prisma migrate deploy` runs during build, but the database isn't accessible during build time.

**Fix:** 
- Remove `npx prisma migrate deploy` from the build command
- Add it to the start command instead (already done in `start:prod` script)

### Issue: Migrations fail on startup

If migrations fail but the database is already up-to-date, the script will continue. If you need strict migration enforcement, remove the error handling in `scripts/start.sh`.

### Issue: Database connection errors

1. Verify `DATABASE_URL` is set correctly
2. For Render PostgreSQL, use the **Internal Database URL**
3. Ensure the database is in the same region as your web service
4. Check that the database is not paused

### Issue: Build fails with memory errors

If your build fails due to memory limits:
1. Consider using Render's larger instance types
2. Optimize your build (remove unnecessary dependencies)
3. Use build caching if available

## Manual Configuration (REQUIRED if service was created manually)

**⚠️ CRITICAL: If your Render service was created manually (not from Blueprint), you MUST update these settings manually in the dashboard. The render.yaml file will NOT automatically override manual settings.**

1. **Go to your service → Settings → Build & Deploy**

2. **Build Command:**
   ```
   npm install && npm run build
   ```
   ⚠️ **Make sure this does NOT include `npx prisma migrate deploy`**

3. **Start Command:**
   ```
   npm run start:prod
   ```

4. **Node Version:**
   - Set to `20` (or use `NODE_VERSION` environment variable)

5. **Click "Save Changes"** and trigger a new deployment

## Verification

After deployment:

1. Check the build logs for any errors
2. Check the runtime logs to confirm migrations ran successfully
3. Visit your app URL to verify it's working
4. Test database connectivity by logging in or creating a workout

## Notes

- Migrations run automatically on every deployment via the `start:prod` script
- The build process no longer requires database access
- If migrations fail, the app will still start (this is intentional to handle already-applied migrations)

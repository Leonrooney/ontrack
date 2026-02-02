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

### 2. Configure Build & Start Commands

**Build Command:**
```
npm install && npm run build
```

**Start Command:**
```
npm run start:prod
```

**OR use the shell script:**
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

If you prefer configuration as code, the `render.yaml` file is included. Render will automatically detect and use it.

To use it:
1. Ensure `render.yaml` is in your repository root
2. Render will automatically apply the configuration

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

## Manual Configuration (if not using render.yaml)

If you're configuring manually in the Render dashboard:

1. **Build Command:**
   ```
   npm install && npm run build
   ```

2. **Start Command:**
   ```
   npm run start:prod
   ```

3. **Node Version:**
   - Set to `20` (or use `NODE_VERSION` environment variable)

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

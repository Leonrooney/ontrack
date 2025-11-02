# Render.com Deployment Guide

## Prerequisites

1. GitHub repository pushed: `https://github.com/Leonrooney/ontrack`
2. Render.com account (sign in with GitHub)

## Step-by-Step Deployment

## ⚠️ IMPORTANT: Update Prisma Schema First

Before deploying, update your Prisma schema to use PostgreSQL:

1. Open `prisma/schema.prisma`
2. Change line 9 from:
   ```prisma
   provider = "sqlite" // Use "postgresql" for production on Render
   ```
   to:
   ```prisma
   provider = "postgresql"
   ```
3. Commit and push this change:
   ```bash
   git add prisma/schema.prisma
   git commit -m "chore: switch to PostgreSQL for production"
   git push origin main
   ```

**Note:** You can keep SQLite locally by having a separate `.env.local` file, but the schema in Git should use PostgreSQL for Render.

### 1. Create PostgreSQL Database on Render

1. Go to Render Dashboard → **New +** → **PostgreSQL**
2. Configure:
   - **Name**: `ontrack-db`
   - **Database**: `ontrack`
   - **User**: `ontrack_user` (or auto-generated)
   - **Region**: Choose closest to you
   - **PostgreSQL Version**: Latest stable
   - **Plan**: Free tier (or paid if needed)
3. Click **Create Database**
4. Wait for it to be "Available"
5. Copy the **Internal Database URL** (will use this later)

### 2. Create Web Service

1. Go to Render Dashboard → **New +** → **Web Service**
2. Connect GitHub repository: `Leonrooney/ontrack`
3. Configure:
   - **Name**: `ontrack`
   - **Environment**: `Node`
   - **Region**: Same as your database
   - **Branch**: `main`
   - **Root Directory**: `/` (leave blank or `/`)
   - **Build Command**: `npm install && npx prisma migrate deploy && npm run build`
   - **Start Command**: `npm start`

### 3. Environment Variables

Add these in the Render dashboard (Environment tab):

```bash
DATABASE_URL="postgresql://<user>:<password>@<host>:5432/<database>?sslmode=require"
NEXTAUTH_SECRET=<your_secret_from_local_env>
NEXTAUTH_URL=https://ontrack.onrender.com
NEXT_PUBLIC_API_URL=https://ontrack.onrender.com
NODE_ENV=production
```

**Important Notes:**
- Use the **Internal Database URL** from your PostgreSQL service
- Generate `NEXTAUTH_SECRET` if you don't have one: `openssl rand -base64 32`
- After deployment, Render will assign a URL like `https://ontrack.onrender.com` or `https://ontrack-<random>.onrender.com`

### 4. Deploy

1. Click **Create Web Service**
2. Render will:
   - Clone your repository
   - Install dependencies
   - Generate Prisma Client
   - Build Next.js app
   - Start the service
3. Wait for "Live" status (green checkmark)

### 5. Run Database Migrations

Once deployed, you need to run migrations:

**Option A: Via Render Shell** (Recommended)
1. In your Web Service dashboard, go to **Shell**
2. Run:
   ```bash
   npx prisma migrate deploy
   ```
3. (Optional) Seed data:
   ```bash
   npm run prisma:seed
   ```

**Option B: Add to Build Command**
Update build command to:
```bash
npm install && npx prisma generate && npx prisma migrate deploy && npm run build
```

### 6. Verify Deployment

1. Visit your Render URL: `https://ontrack.onrender.com`
2. Check health endpoint: `https://ontrack.onrender.com/api/health`
3. Test login:
   - Email: `demo@ontrack.app`
   - Password: `Passw0rd!`

## Post-Deployment Checklist

- [ ] App accessible at Render URL
- [ ] Health endpoint responds (`/api/health`)
- [ ] Database migrations run successfully
- [ ] Demo user can log in
- [ ] Environment variables set correctly
- [ ] Logs show no errors

## Troubleshooting

### Build Fails
- Check build logs in Render dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### Database Connection Errors
- Verify `DATABASE_URL` uses Internal Database URL
- Check database service is running
- Ensure migrations have run

### Authentication Issues
- Verify `NEXTAUTH_URL` matches your Render URL exactly
- Check `NEXTAUTH_SECRET` is set
- Clear browser cookies and try again

### Prisma Errors
- Run `npx prisma generate` locally to verify schema
- Check Prisma Client is generated in build logs
- Verify database URL format is correct

## Updating Your App

1. Make changes locally
2. Commit: `git add . && git commit -m "Your message"`
3. Push: `git push origin main`
4. Render automatically redeploys on push to `main`

## Database Access

To connect to your PostgreSQL database:
- Use Render's internal connection string for the app
- Use the external connection string for local tools (pgAdmin, etc.)
- Never commit connection strings to Git


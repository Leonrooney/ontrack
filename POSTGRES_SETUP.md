# PostgreSQL Setup Instructions

Your Prisma schema has been updated to use PostgreSQL. Follow these steps to complete the setup:

## Step 1: Create PostgreSQL Database on Render

1. Go to https://render.com/dashboard
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `ontrack-db`
   - **Database**: `ontrack` (or leave default)
   - **Region**: Choose closest to you
   - **Plan**: Free tier or paid
4. Click **"Create Database"**
5. Wait for it to become "Available"
6. **Copy the Internal Database URL** (you'll need this below)

## Step 2: Update Your Local .env File

Open `/Users/leonrooney/Code/FYP/ontrack/.env` and replace the DATABASE_URL:

```bash
# Replace the SQLite URL with your Render PostgreSQL URL
DATABASE_URL="postgresql://<user>:<password>@<host>:5432/<dbname>?sslmode=require"
```

**Important:** Use the **Internal Database URL** from Render dashboard, not the external one.

## Step 3: Generate Prisma Client and Run Migrations

```bash
cd /Users/leonrooney/Code/FYP/ontrack

# Generate Prisma client for PostgreSQL
npx prisma generate

# Run migrations to create tables in PostgreSQL
npx prisma migrate deploy

# (Optional) If you want to reset and seed:
# npx prisma migrate reset --force && npm run prisma:seed
```

## Step 4: Test Locally

```bash
npm run dev
```

Visit http://localhost:3000 and verify everything works.

## Step 5: Commit and Push

```bash
git add -A
git commit -m "chore: switch Prisma schema to PostgreSQL"
git push origin main
```

## Step 6: Deploy to Render

Follow the instructions in `RENDER_DEPLOYMENT.md` to set up your Web Service on Render.

**Quick reference for Render Web Service:**
- Build Command: `npm install && npx prisma migrate deploy && npm run build`
- Start Command: `npm start`
- Environment variables:
  - `DATABASE_URL` = Your Render PostgreSQL Internal URL
  - `NEXTAUTH_SECRET` = Your secret from local .env
  - `NEXTAUTH_URL` = https://ontrack.onrender.com (or your custom domain)
  - `NEXT_PUBLIC_API_URL` = Same as NEXTAUTH_URL

## Troubleshooting

### "Connection refused" or "Can't reach database"
- Verify you're using the **Internal Database URL**, not external
- Ensure database service is running and "Available" in Render dashboard
- Check firewall/network settings

### "Migration failed"
- Try `npx prisma migrate reset --force` to start fresh
- Check your migration files are pushed to GitHub

### "Prisma Client not generated"
- Run `npx prisma generate` manually
- Check for TypeScript errors in your schema

## Notes

- **Local development**: You can use Render's PostgreSQL for local dev, or switch back to SQLite for local only
- **Production**: Always use PostgreSQL on Render
- **Secrets**: Never commit `.env` file - it's in `.gitignore`


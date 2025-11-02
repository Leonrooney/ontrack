# Local Development Setup with Render PostgreSQL

## ⚠️ Important: Use EXTERNAL Database URL

Render provides two database URLs:
- **Internal URL**: Only works from Render's internal network (use in production)
- **External URL**: Works from anywhere, including your local machine (use for local dev)

## Quick Setup

### 1. Get Your External Database URL

1. Go to https://render.com/dashboard
2. Click on your PostgreSQL service: `ontrack-db`
3. Go to **"Connections"** tab
4. Copy the **"External Connection String"** (NOT Internal)

It should look like:
```
postgresql://USER:PASSWORD@SOMETHING.render.com/DBNAME?sslmode=require
```

### 2. Create Local .env File

Create `/Users/leonrooney/Code/FYP/ontrack/.env` with:

```bash
# Use EXTERNAL Database URL for local development
DATABASE_URL="postgresql://USER:PASSWORD@HOST.render.com/DB?sslmode=require"

# NextAuth
NEXTAUTH_SECRET="N2op8iEId61/0ExAjc8DS+gV+PtRn67/8hmNvfecTGc="
NEXTAUTH_URL=http://localhost:3000

# Public API
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 3. Generate Prisma Client and Migrate

```bash
cd /Users/leonrooney/Code/FYP/ontrack

# Generate Prisma client for PostgreSQL
npx prisma generate

# Run migrations (creates tables in your Render database)
npx prisma migrate deploy

# (Optional) Seed demo data
npm run prisma:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Troubleshooting

### "Can't reach database server" Error
- ✅ Make sure you're using **EXTERNAL** database URL, not Internal
- ✅ Check Render PostgreSQL service is "Available" in dashboard
- ✅ Verify credentials are correct in your connection string

### Port 3000 Already in Use
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

### Prisma Client Not Generated
```bash
# Force regenerate
rm -rf node_modules/.prisma
npx prisma generate
```

### Migration Errors
```bash
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset --force

# Then seed again
npm run prisma:seed
```

## Demo Credentials

Once seeded, you can log in with:
- Email: `demo@ontrack.app`
- Password: `Passw0rd!`

## Environment Variables Reference

| Variable | Local Value | Production Value |
|----------|-------------|------------------|
| DATABASE_URL | External Render URL | Internal Render URL |
| NEXTAUTH_SECRET | Same | Same |
| NEXTAUTH_URL | http://localhost:3000 | https://ontrack.onrender.com |
| NEXT_PUBLIC_API_URL | http://localhost:3000 | https://ontrack.onrender.com |

## Notes

- **Never commit `.env`** - it's in `.gitignore`
- Keep Internal URL only for production on Render
- Use External URL for all local development
- Database is shared between local dev and production (safe for this setup)


# Local Development Setup

This guide explains how to set up OnTrack for **local development** with a local PostgreSQL database.

## ⚠️ Important: Database Environment Separation

- **Local Development**: Use `.env.local` with a local PostgreSQL database
- **Production (Render)**: Use `.env` with Render's PostgreSQL database
- **Never run `prisma migrate dev` against Render's database** - it requires SUPERUSER permissions that managed databases don't allow

## Prerequisites

- Node.js 20+
- PostgreSQL installed and running locally
- npm or yarn

## Step 1: Install PostgreSQL Locally

### macOS (using Homebrew)
```bash
brew install postgresql@14
brew services start postgresql@14
```

### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Windows
Download and install from: https://www.postgresql.org/download/windows/

## Step 2: Create Local Database

```bash
# Create a new database for local development
createdb ontrack_dev

# Or using psql:
psql postgres
CREATE DATABASE ontrack_dev;
\q
```

## Step 3: Set Up Environment Variables

1. Copy the local development example file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and update the `DATABASE_URL`:
   ```bash
   # Default PostgreSQL setup (adjust if different)
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ontrack_dev
   
   # If your PostgreSQL user/password is different:
   # DATABASE_URL=postgresql://your_user:your_password@localhost:5432/ontrack_dev
   ```

3. Generate a NextAuth secret:
   ```bash
   openssl rand -base64 32
   ```
   Add it to `.env.local` as `NEXTAUTH_SECRET`

4. Set the remaining variables:
   ```bash
   NEXTAUTH_URL=http://localhost:3000
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```

## Step 4: Install Dependencies

```bash
npm install
```

## Step 5: Run Database Migrations (Local Only)

**⚠️ CRITICAL: Only run this with `.env.local` pointing to your LOCAL database!**

```bash
# Make sure .env.local is active (Next.js loads .env.local automatically)
npm run db:migrate:dev
```

This will:
- Create all tables in your local database
- Apply all migrations from `prisma/migrations/`
- Generate Prisma Client

## Step 6: Seed Local Database (Optional)

```bash
npm run prisma:seed
```

This populates your local database with:
- Demo user (email: `demo@ontrack.app`, password: `Passw0rd!`)
- Sample exercises
- Other seed data

## Step 7: Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Working with Migrations Locally

### Creating a New Migration

When you modify `prisma/schema.prisma`:

```bash
# Make sure .env.local is active (local database)
npm run db:migrate:dev
```

This will:
- Create a new migration file
- Apply it to your local database
- Regenerate Prisma Client

### Resetting Local Database (if needed)

```bash
# Drop and recreate database
dropdb ontrack_dev
createdb ontrack_dev

# Re-run migrations
npm run db:migrate:dev

# Re-seed
npm run prisma:seed
```

## Switching Between Local and Production

### For Local Development
- Use `.env.local` with local PostgreSQL
- Run `npm run db:migrate:dev` for schema changes
- Use `npm run dev` to start server

### For Production Deployment
- Use `.env` with Render PostgreSQL (set in Render dashboard)
- Run `npm run db:migrate:deploy` (only on Render, during build)
- Never run `migrate dev` against production

## Troubleshooting

### Error: "permission denied to terminate process"
**Cause**: You're trying to run `migrate dev` against Render's database  
**Solution**: Make sure `.env.local` points to your local database, not Render

### Error: "database does not exist"
**Solution**: Create the database: `createdb ontrack_dev`

### Error: "password authentication failed"
**Solution**: Check your PostgreSQL user/password in `.env.local`

### Error: "connection refused"
**Solution**: Make sure PostgreSQL is running:
```bash
# macOS
brew services start postgresql@14

# Linux
sudo systemctl start postgresql
```

### Prisma Client Not Generated
**Solution**: Run `npx prisma generate`

## Quick Reference

| Task | Command | Environment |
|------|---------|-------------|
| Create migration | `npm run db:migrate:dev` | Local only (`.env.local`) |
| Apply migrations | `npm run db:migrate:deploy` | Production (Render) |
| Generate Prisma Client | `npx prisma generate` | Both |
| Seed database | `npm run prisma:seed` | Both |
| Start dev server | `npm run dev` | Local |

## Next Steps

- See [README.md](README.md) for project overview
- See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
- Start coding! 🚀




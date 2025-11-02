# Environment Variables Setup

Create a `.env` file in the root directory with the following variables:

```bash
# Database
# Example for PostgreSQL: postgresql://user:password@localhost:5432/ontrack
# Example for SQLite: file:./dev.db
DATABASE_URL=your_connection_string

# NextAuth
# Generate a secret: openssl rand -base64 32
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# Production URL (update when deploying)
# NEXTAUTH_URL=https://ontrack.onrender.com
```

## Quick Setup

1. **Generate NextAuth Secret:**
   ```bash
   openssl rand -base64 32
   ```
   Copy the output and use it as `NEXTAUTH_SECRET`

2. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your actual values.

3. **Never commit `.env`** - it's already in `.gitignore`

## API Routes

- `/api/auth/[...nextauth]` - NextAuth authentication endpoints
- `/api/users` - User management endpoints (protected)
- `/api/health` - Health check endpoint

## Next Steps

1. Set up Prisma with your database
2. Replace hardcoded user in `/api/auth/[...nextauth]/route.ts` with database queries
3. Add Zod validation for API routes
4. Configure production environment variables on your hosting platform


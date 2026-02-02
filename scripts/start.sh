#!/bin/bash
# Production startup script for Render
# Runs database migrations before starting the Next.js server

set -e

echo "🚀 Starting OnTrack production server..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  WARNING: DATABASE_URL environment variable is not set!"
  echo "Continuing without migrations..."
else
  # Check if using Supabase direct connection (port 5432) instead of pooler
  if echo "$DATABASE_URL" | grep -q "\.supabase\.co:5432"; then
    echo "⚠️  WARNING: Detected Supabase direct connection (port 5432)"
    echo "⚠️  For Render/serverless, use Connection Pooling URL (port 6543)"
    echo "⚠️  Get it from: Supabase Dashboard → Settings → Database → Connection Pooling"
    echo "⚠️  Format: postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
  fi
  
  echo "📦 Running database migrations..."
  if npx prisma migrate deploy; then
    echo "✅ Migrations completed successfully"
  else
    echo "⚠️  Migration failed, but continuing startup..."
    echo "⚠️  This may be expected if:"
    echo "   - Migrations have already been applied"
    echo "   - Database connection issue (check DATABASE_URL)"
    echo "   - For Supabase: Ensure you're using the pooler URL (port 6543)"
  fi
fi

echo "🌐 Starting Next.js server..."
exec npm start

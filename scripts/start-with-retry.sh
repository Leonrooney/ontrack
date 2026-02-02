#!/bin/bash
# Production startup script for Render with database connection retry
# Runs database migrations before starting the Next.js server

set -e

echo "🚀 Starting OnTrack production server..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  WARNING: DATABASE_URL environment variable is not set!"
  echo "Continuing without migrations..."
else
  echo "📦 Attempting database migrations..."
  
  # Retry logic for database connection
  MAX_RETRIES=3
  RETRY_DELAY=5
  RETRY_COUNT=0
  
  while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if npx prisma migrate deploy; then
      echo "✅ Migrations completed successfully"
      break
    else
      RETRY_COUNT=$((RETRY_COUNT + 1))
      if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
        echo "⚠️  Migration attempt $RETRY_COUNT failed. Retrying in ${RETRY_DELAY}s..."
        sleep $RETRY_DELAY
      else
        echo "⚠️  All migration attempts failed. Continuing startup..."
        echo "⚠️  This may be expected if:"
        echo "   - Database is not yet available"
        echo "   - Migrations have already been applied"
        echo "   - DATABASE_URL is incorrect"
      fi
    fi
  done
fi

echo "🌐 Starting Next.js server..."
exec npm start

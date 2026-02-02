#!/bin/bash
# Production startup script for Render
# Runs database migrations before starting the Next.js server

set -e

echo "Running database migrations..."
npx prisma migrate deploy || {
  echo "Warning: Migration failed, but continuing startup..."
  echo "This may be expected if migrations have already been applied."
}

echo "Starting Next.js server..."
exec npm start

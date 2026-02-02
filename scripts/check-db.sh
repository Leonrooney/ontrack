#!/bin/bash
# Quick script to check database connectivity
# Useful for debugging connection issues

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL is not set!"
  exit 1
fi

echo "Checking database connection..."
echo "DATABASE_URL format: ${DATABASE_URL:0:20}..."

# Extract host from DATABASE_URL
HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')

echo "Host: $HOST"
echo "Port: ${PORT:-5432}"

# Try to connect (if nc is available)
if command -v nc &> /dev/null; then
  if nc -z -w5 "$HOST" "${PORT:-5432}" 2>/dev/null; then
    echo "✅ Port is reachable"
  else
    echo "❌ Port is not reachable"
  fi
else
  echo "⚠️  'nc' command not available, skipping port check"
fi

# Try Prisma connection
echo ""
echo "Testing Prisma connection..."
npx prisma db execute --stdin <<< "SELECT 1;" 2>&1 | head -5

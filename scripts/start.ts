#!/usr/bin/env ts-node
/**
 * Production startup script for Render
 * Runs database migrations before starting the Next.js server
 * Handles migration errors gracefully
 */

import { execSync } from 'child_process';
import { spawn } from 'child_process';

async function main() {
  console.log('🚀 Starting OnTrack production server...\n');

  // Run database migrations
  try {
    console.log('📦 Running database migrations...');
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: process.env,
    });
    console.log('✅ Migrations completed successfully\n');
  } catch (error) {
    console.warn('⚠️  Migration warning:', error instanceof Error ? error.message : 'Unknown error');
    console.warn('Continuing startup... (migrations may already be applied)\n');
  }

  // Start Next.js server
  console.log('🌐 Starting Next.js server...\n');
  const server = spawn('npm', ['start'], {
    stdio: 'inherit',
    env: process.env,
    shell: true,
  });

  server.on('error', (error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    server.kill('SIGTERM');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    server.kill('SIGINT');
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

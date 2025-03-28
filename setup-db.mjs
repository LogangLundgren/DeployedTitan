#!/usr/bin/env node
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import ws from 'ws';

// WebSocket is required for Neon serverless
neonConfig.webSocketConstructor = ws;

// Find the migrations directory relative to the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const migrationsFolder = join(__dirname, 'migrations');

if (!process.env.DATABASE_URL) {
  console.error('Error: DATABASE_URL environment variable is required.');
  process.exit(1);
}

async function main() {
  console.log('Setting up the database...');
  
  try {
    // Create a Neon pool and connect to the database
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool);
    
    // Perform the migration
    console.log('Running migrations...');
    await migrate(db, { migrationsFolder });
    
    console.log('Database setup completed successfully!');
    pool.end();
  } catch (error) {
    console.error('Error setting up the database:', error);
    process.exit(1);
  }
}

main();
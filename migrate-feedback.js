import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Required for Neon serverless
neonConfig.webSocketConstructor = ws;

// Create the pool and the drizzle instance
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function main() {
  console.log('Creating feedbacks table...');
  
  try {
    // Run the SQL directly to create the table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS feedbacks (
        id SERIAL PRIMARY KEY,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        username TEXT,
        path TEXT NOT NULL,
        user_agent TEXT NOT NULL,
        timestamp TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    console.log('Feedbacks table created successfully!');
  } catch (error) {
    console.error('Error creating feedbacks table:', error);
  } finally {
    await pool.end();
  }
}

main();
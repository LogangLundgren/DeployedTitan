import { db } from './db';
import { users } from '../shared/schema';
import { sql } from 'drizzle-orm';

export async function runMigrations() {
  console.log('Running database migrations...');
  
  try {
    // Check if onboarding_step column exists
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'onboarding_step'
      );
    `);
    
    const columnExists = result.rows?.[0]?.exists === true;
    
    if (!columnExists) {
      console.log('Adding onboarding_step to users table...');
      
      // Create the onboarding_step enum type
      await db.execute(sql`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'onboarding_step') THEN
            CREATE TYPE onboarding_step AS ENUM (
              'not_started', 
              'profile_setup', 
              'template_creation', 
              'marketplace_intro', 
              'social_connection', 
              'completed'
            );
          END IF;
        END
        $$;
      `);
      
      // Add onboarding_step column
      await db.execute(sql`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS onboarding_step onboarding_step DEFAULT 'not_started';
      `);
      
      // Add onboarding_completed column
      await db.execute(sql`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
      `);
      
      console.log('Added onboarding columns to users table successfully');
    } else {
      console.log('Onboarding columns already exist in users table');
    }
    
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
}
// Script to update visibility of all existing workouts to public
// This makes all historical workouts appear in the social feed

// We'll use raw SQL approach since this is a one-time migration
// and it's more reliable than ORM for this task

import { pool } from './server/db';

async function makeWorkoutsPublic() {
  try {
    console.log('Starting update of workout visibility...');
    
    // Get count of private workouts before update
    const privateWorkoutsCountResult = await pool.query(
      `SELECT COUNT(*) FROM workouts WHERE "isPublic" = false`
    );
    
    const privateWorkoutsCount = parseInt(privateWorkoutsCountResult.rows[0]?.count || '0');
    console.log(`Found ${privateWorkoutsCount} private workouts to update`);
    
    // Update all workouts to be public
    const result = await pool.query(
      `UPDATE workouts SET "isPublic" = true WHERE "isPublic" = false RETURNING id`
    );
    
    console.log(`Successfully updated ${result.rowCount} workouts to public visibility`);
    console.log('Finished updating workout visibility');
  } catch (error) {
    console.error('Error updating workout visibility:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the function
makeWorkoutsPublic();
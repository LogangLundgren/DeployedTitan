// Script to directly add global exercises to the database
// This bypasses the ORM mapping issues by using direct SQL

import pkg from 'pg';
const { Pool } = pkg;

// Connect to database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// List of comprehensive global exercises
const globalExercises = [
  // Chest
  { name: 'Barbell Bench Press', category: 'Chest', subcategory: null, isCustom: false },
  { name: 'Incline Dumbbell Press', category: 'Chest', subcategory: null, isCustom: false },
  { name: 'Chest Fly (Machine or Dumbbell)', category: 'Chest', subcategory: null, isCustom: false },
  { name: 'Push-Up', category: 'Chest', subcategory: null, isCustom: false },
  { name: 'Cable Crossover', category: 'Chest', subcategory: null, isCustom: false },
  
  // Back
  { name: 'Deadlift', category: 'Back', subcategory: null, isCustom: false },
  { name: 'Barbell Bent-Over Row', category: 'Back', subcategory: null, isCustom: false },
  { name: 'Lat Pulldown', category: 'Back', subcategory: null, isCustom: false },
  { name: 'Pull-Up', category: 'Back', subcategory: null, isCustom: false },
  { name: 'Seated Cable Row', category: 'Back', subcategory: null, isCustom: false },
  
  // Shoulders
  { name: 'Overhead Barbell Press (Military Press)', category: 'Shoulders', subcategory: null, isCustom: false },
  { name: 'Dumbbell Lateral Raise', category: 'Shoulders', subcategory: null, isCustom: false },
  { name: 'Arnold Press', category: 'Shoulders', subcategory: null, isCustom: false },
  { name: 'Front Raise', category: 'Shoulders', subcategory: null, isCustom: false },
  { name: 'Reverse Pec Deck / Rear Delt Fly', category: 'Shoulders', subcategory: null, isCustom: false },
  
  // Arms
  { name: 'Barbell Curl', category: 'Arms', subcategory: 'Biceps', isCustom: false },
  { name: 'Dumbbell Hammer Curl', category: 'Arms', subcategory: 'Biceps', isCustom: false },
  { name: 'Preacher Curl', category: 'Arms', subcategory: 'Biceps', isCustom: false },
  { name: 'Triceps Pushdown (Cable)', category: 'Arms', subcategory: 'Triceps', isCustom: false },
  { name: 'Overhead Triceps Extension (Dumbbell or Cable)', category: 'Arms', subcategory: 'Triceps', isCustom: false },
  
  // Lower Body - Quads & Hamstrings
  { name: 'Barbell Back Squat', category: 'Lower Body', subcategory: 'Quads', isCustom: false },
  { name: 'Front Squat', category: 'Lower Body', subcategory: 'Quads', isCustom: false },
  { name: 'Leg Press', category: 'Lower Body', subcategory: 'Quads', isCustom: false },
  { name: 'Leg Extension', category: 'Lower Body', subcategory: 'Quads', isCustom: false },
  { name: 'Lying Leg Curl', category: 'Lower Body', subcategory: 'Hamstrings', isCustom: false },
  
  // Lower Body - Glutes & Hamstrings
  { name: 'Romanian Deadlift', category: 'Lower Body', subcategory: 'Hamstrings', isCustom: false },
  { name: 'Glute Bridge / Hip Thrust', category: 'Lower Body', subcategory: 'Glutes', isCustom: false },
  { name: 'Bulgarian Split Squat', category: 'Lower Body', subcategory: 'Quads', isCustom: false },
  { name: 'Walking Lunge', category: 'Lower Body', subcategory: 'Quads', isCustom: false },
  { name: 'Cable Kickback', category: 'Lower Body', subcategory: 'Glutes', isCustom: false },
];

async function addGlobalExercises() {
  const client = await pool.connect();
  try {
    // Begin transaction
    await client.query('BEGIN');
    
    // Get existing global exercises to avoid duplicates
    const existingResult = await client.query(
      'SELECT id, name, category FROM exercises WHERE is_custom = false'
    );
    const existingExercises = existingResult.rows;
    
    console.log(`Found ${existingExercises.length} existing global exercises.`);
    
    // Track new additions
    let addedCount = 0;
    
    // Add each global exercise if it doesn't already exist
    for (const exercise of globalExercises) {
      // Check if this exercise already exists by name and category
      const exists = existingExercises.some(
        e => e.name.toLowerCase() === exercise.name.toLowerCase() && 
             e.category.toLowerCase() === exercise.category.toLowerCase()
      );
      
      if (!exists) {
        // Insert the new exercise
        await client.query(
          'INSERT INTO exercises (name, category, subcategory, is_custom, user_id) VALUES ($1, $2, $3, $4, $5)',
          [exercise.name, exercise.category, exercise.subcategory, exercise.isCustom, null]
        );
        console.log(`Added: ${exercise.name} (${exercise.category})`);
        addedCount++;
      } else {
        console.log(`Skipped: ${exercise.name} (${exercise.category}) - already exists`);
      }
    }
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log(`Successfully added ${addedCount} new global exercises.`);
    console.log('Total global exercises in database: ' + (existingExercises.length + addedCount));
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('Error adding global exercises:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

// Run the function
addGlobalExercises();
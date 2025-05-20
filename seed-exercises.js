// Script to seed the database with a comprehensive global exercise library
import { pool } from './server/db.js';

async function seedExercises() {
  console.log('Starting to seed global exercise library...');

  // Define the global exercise library
  const globalExercises = [
    // Chest
    { name: 'Barbell Bench Press', category: 'Chest', subcategory: null, isCustom: false, userId: null },
    { name: 'Incline Dumbbell Press', category: 'Chest', subcategory: null, isCustom: false, userId: null },
    { name: 'Chest Fly (Machine or Dumbbell)', category: 'Chest', subcategory: null, isCustom: false, userId: null },
    { name: 'Push-Up', category: 'Chest', subcategory: null, isCustom: false, userId: null },
    { name: 'Cable Crossover', category: 'Chest', subcategory: null, isCustom: false, userId: null },
    
    // Back
    { name: 'Deadlift', category: 'Back', subcategory: null, isCustom: false, userId: null },
    { name: 'Barbell Bent-Over Row', category: 'Back', subcategory: null, isCustom: false, userId: null },
    { name: 'Lat Pulldown', category: 'Back', subcategory: null, isCustom: false, userId: null },
    { name: 'Pull-Up', category: 'Back', subcategory: null, isCustom: false, userId: null },
    { name: 'Seated Cable Row', category: 'Back', subcategory: null, isCustom: false, userId: null },
    
    // Shoulders
    { name: 'Overhead Barbell Press (Military Press)', category: 'Shoulders', subcategory: null, isCustom: false, userId: null },
    { name: 'Dumbbell Lateral Raise', category: 'Shoulders', subcategory: null, isCustom: false, userId: null },
    { name: 'Arnold Press', category: 'Shoulders', subcategory: null, isCustom: false, userId: null },
    { name: 'Front Raise', category: 'Shoulders', subcategory: null, isCustom: false, userId: null },
    { name: 'Reverse Pec Deck / Rear Delt Fly', category: 'Shoulders', subcategory: null, isCustom: false, userId: null },
    
    // Arms
    { name: 'Barbell Curl', category: 'Arms', subcategory: 'Biceps', isCustom: false, userId: null },
    { name: 'Dumbbell Hammer Curl', category: 'Arms', subcategory: 'Biceps', isCustom: false, userId: null },
    { name: 'Preacher Curl', category: 'Arms', subcategory: 'Biceps', isCustom: false, userId: null },
    { name: 'Triceps Pushdown (Cable)', category: 'Arms', subcategory: 'Triceps', isCustom: false, userId: null },
    { name: 'Overhead Triceps Extension (Dumbbell or Cable)', category: 'Arms', subcategory: 'Triceps', isCustom: false, userId: null },
    
    // Lower Body - Quads & Hamstrings
    { name: 'Barbell Back Squat', category: 'Lower Body', subcategory: 'Quads', isCustom: false, userId: null },
    { name: 'Front Squat', category: 'Lower Body', subcategory: 'Quads', isCustom: false, userId: null },
    { name: 'Leg Press', category: 'Lower Body', subcategory: 'Quads', isCustom: false, userId: null },
    { name: 'Leg Extension', category: 'Lower Body', subcategory: 'Quads', isCustom: false, userId: null },
    { name: 'Lying Leg Curl', category: 'Lower Body', subcategory: 'Hamstrings', isCustom: false, userId: null },
    
    // Lower Body - Glutes & Hamstrings
    { name: 'Romanian Deadlift', category: 'Lower Body', subcategory: 'Hamstrings', isCustom: false, userId: null },
    { name: 'Glute Bridge / Hip Thrust', category: 'Lower Body', subcategory: 'Glutes', isCustom: false, userId: null },
    { name: 'Bulgarian Split Squat', category: 'Lower Body', subcategory: 'Quads', isCustom: false, userId: null },
    { name: 'Walking Lunge', category: 'Lower Body', subcategory: 'Quads', isCustom: false, userId: null },
    { name: 'Cable Kickback', category: 'Lower Body', subcategory: 'Glutes', isCustom: false, userId: null },
  ];

  try {
    // Check if exercises already exist to avoid duplicates
    const existingExercises = await pool.query('SELECT name FROM exercises WHERE userId IS NULL');
    const existingNames = existingExercises.rows.map(e => e.name.toLowerCase());
    
    // Filter out exercises that already exist
    const newExercises = globalExercises.filter(exercise => 
      !existingNames.includes(exercise.name.toLowerCase())
    );
    
    if (newExercises.length === 0) {
      console.log('All global exercises already exist in the database.');
      return;
    }

    // Insert new exercises
    for (const exercise of newExercises) {
      await pool.query(
        'INSERT INTO exercises (name, category, subcategory, "isCustom", "userId") VALUES ($1, $2, $3, $4, $5)',
        [exercise.name, exercise.category, exercise.subcategory, exercise.isCustom, exercise.userId]
      );
      console.log(`Added exercise: ${exercise.name}`);
    }

    console.log(`Successfully added ${newExercises.length} new exercises to the global library.`);

  } catch (error) {
    console.error('Error seeding global exercises:', error);
  } finally {
    pool.end();
  }
}

seedExercises();
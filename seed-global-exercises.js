// This script seeds the database with the comprehensive global exercise library
import { db } from './server/db.js';
import { exercises } from './shared/schema.js';
import { eq, and } from 'drizzle-orm';

// Comprehensive global exercise library
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

async function seedGlobalExercises() {
  try {
    console.log('Checking for existing global exercises...');
    const existingExercises = await db.select().from(exercises).where(eq(exercises.isCustom, false));
    
    if (existingExercises.length > 0) {
      console.log(`Found ${existingExercises.length} existing global exercises.`);
      
      // Optional: Delete existing global exercises if you want to start fresh
      // Uncomment the following line to clear existing global exercises
      // await db.delete(exercises).where(eq(exercises.isCustom, false));
      // console.log('Deleted existing global exercises.');
    }
    
    console.log('Adding new global exercises...');
    for (const exercise of globalExercises) {
      // Check if this exercise already exists
      const existing = await db.select()
        .from(exercises)
        .where(eq(exercises.name, exercise.name))
        .where(eq(exercises.category, exercise.category))
        .where(eq(exercises.isCustom, false));
      
      if (existing.length === 0) {
        await db.insert(exercises).values(exercise);
        console.log(`Added: ${exercise.name} (${exercise.category})`);
      } else {
        console.log(`Skipped duplicate: ${exercise.name} (${exercise.category})`);
      }
    }
    
    console.log('Global exercise library seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding global exercises:', error);
  } finally {
    process.exit(0);
  }
}

seedGlobalExercises();
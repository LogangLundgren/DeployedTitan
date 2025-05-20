import { Exercise } from "@shared/schema";

// Comprehensive global exercise library as requested by the user
export const globalExercises: Omit<Exercise, 'id'>[] = [
  // Chest
  { name: 'Barbell Bench Press', category: 'Chest', subcategory: null, isCustom: false, userId: null, createdAt: new Date() },
  { name: 'Incline Dumbbell Press', category: 'Chest', subcategory: null, isCustom: false, userId: null, createdAt: new Date() },
  { name: 'Chest Fly (Machine or Dumbbell)', category: 'Chest', subcategory: null, isCustom: false, userId: null, createdAt: new Date() },
  { name: 'Push-Up', category: 'Chest', subcategory: null, isCustom: false, userId: null, createdAt: new Date() },
  { name: 'Cable Crossover', category: 'Chest', subcategory: null, isCustom: false, userId: null, createdAt: new Date() },
  
  // Back
  { name: 'Deadlift', category: 'Back', subcategory: null, isCustom: false, userId: null, createdAt: new Date() },
  { name: 'Barbell Bent-Over Row', category: 'Back', subcategory: null, isCustom: false, userId: null, createdAt: new Date() },
  { name: 'Lat Pulldown', category: 'Back', subcategory: null, isCustom: false, userId: null, createdAt: new Date() },
  { name: 'Pull-Up', category: 'Back', subcategory: null, isCustom: false, userId: null, createdAt: new Date() },
  { name: 'Seated Cable Row', category: 'Back', subcategory: null, isCustom: false, userId: null, createdAt: new Date() },
  
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
import {
  users, type User, type InsertUser,
  exercises, type Exercise, type InsertExercise,
  workouts, type Workout, type InsertWorkout,
  workoutExercises, type WorkoutExercise, type InsertWorkoutExercise,
  sets, type Set, type InsertSet,
  type WorkoutWithDetails
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Exercise operations
  getExercises(): Promise<Exercise[]>;
  getExercisesByCategory(category: string): Promise<Exercise[]>;
  getExercise(id: number): Promise<Exercise | undefined>;
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  
  // Workout operations
  getWorkouts(userId: number): Promise<Workout[]>;
  getWorkoutWithDetails(id: number): Promise<WorkoutWithDetails | undefined>;
  getRecentWorkouts(userId: number, limit: number): Promise<WorkoutWithDetails[]>;
  createWorkout(workout: InsertWorkout): Promise<Workout>;
  updateWorkout(id: number, workout: Partial<Workout>): Promise<Workout | undefined>;
  deleteWorkout(id: number): Promise<boolean>;
  
  // Workout Exercise operations
  createWorkoutExercise(workoutExercise: InsertWorkoutExercise): Promise<WorkoutExercise>;
  deleteWorkoutExercise(id: number): Promise<boolean>;
  
  // Set operations
  createSet(set: InsertSet): Promise<Set>;
  updateSet(id: number, set: Partial<Set>): Promise<Set | undefined>;
  deleteSet(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private exercises: Map<number, Exercise>;
  private workouts: Map<number, Workout>;
  private workoutExercises: Map<number, WorkoutExercise>;
  private sets: Map<number, Set>;
  
  private userCurrentId: number;
  private exerciseCurrentId: number;
  private workoutCurrentId: number;
  private workoutExerciseCurrentId: number;
  private setCurrentId: number;

  constructor() {
    this.users = new Map();
    this.exercises = new Map();
    this.workouts = new Map();
    this.workoutExercises = new Map();
    this.sets = new Map();
    
    this.userCurrentId = 1;
    this.exerciseCurrentId = 1;
    this.workoutCurrentId = 1;
    this.workoutExerciseCurrentId = 1;
    this.setCurrentId = 1;
    
    // Add some default exercises
    this.seedDefaultExercises();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Exercise methods
  async getExercises(): Promise<Exercise[]> {
    return Array.from(this.exercises.values());
  }
  
  async getExercisesByCategory(category: string): Promise<Exercise[]> {
    return Array.from(this.exercises.values()).filter(
      (exercise) => exercise.category === category
    );
  }
  
  async getExercise(id: number): Promise<Exercise | undefined> {
    return this.exercises.get(id);
  }
  
  async createExercise(insertExercise: InsertExercise): Promise<Exercise> {
    const id = this.exerciseCurrentId++;
    const exercise: Exercise = { ...insertExercise, id };
    this.exercises.set(id, exercise);
    return exercise;
  }
  
  // Workout methods
  async getWorkouts(userId: number): Promise<Workout[]> {
    return Array.from(this.workouts.values()).filter(
      (workout) => workout.userId === userId
    );
  }
  
  async getWorkoutWithDetails(id: number): Promise<WorkoutWithDetails | undefined> {
    const workout = this.workouts.get(id);
    if (!workout) return undefined;
    
    const workoutExercisesForWorkout = Array.from(this.workoutExercises.values())
      .filter(we => we.workoutId === id)
      .sort((a, b) => a.order - b.order);
    
    const exercises = workoutExercisesForWorkout.map(we => {
      const exerciseDetails = this.exercises.get(we.exerciseId);
      if (!exerciseDetails) {
        throw new Error(`Exercise with ID ${we.exerciseId} not found`);
      }
      
      const setsForExercise = Array.from(this.sets.values())
        .filter(set => set.workoutExerciseId === we.id)
        .sort((a, b) => a.order - b.order);
      
      return {
        ...we,
        exerciseDetails,
        sets: setsForExercise
      };
    });
    
    let totalSets = 0;
    let volume = 0;
    
    exercises.forEach(exercise => {
      totalSets += exercise.sets.length;
      exercise.sets.forEach(set => {
        if (set.weight && set.reps) {
          volume += set.weight * set.reps;
        }
      });
    });
    
    return {
      ...workout,
      exercises,
      totalSets,
      totalExercises: exercises.length,
      volume
    };
  }
  
  async getRecentWorkouts(userId: number, limit: number): Promise<WorkoutWithDetails[]> {
    const userWorkouts = Array.from(this.workouts.values())
      .filter(workout => workout.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
    
    const workoutsWithDetails = await Promise.all(
      userWorkouts.map(workout => this.getWorkoutWithDetails(workout.id))
    );
    
    return workoutsWithDetails.filter((w): w is WorkoutWithDetails => w !== undefined);
  }
  
  async createWorkout(insertWorkout: InsertWorkout): Promise<Workout> {
    const id = this.workoutCurrentId++;
    const workout: Workout = { ...insertWorkout, id };
    this.workouts.set(id, workout);
    return workout;
  }
  
  async updateWorkout(id: number, workoutUpdate: Partial<Workout>): Promise<Workout | undefined> {
    const workout = this.workouts.get(id);
    if (!workout) return undefined;
    
    const updatedWorkout = { ...workout, ...workoutUpdate };
    this.workouts.set(id, updatedWorkout);
    return updatedWorkout;
  }
  
  async deleteWorkout(id: number): Promise<boolean> {
    // First find all workout exercises for this workout
    const workoutExercisesToDelete = Array.from(this.workoutExercises.values())
      .filter(we => we.workoutId === id);
    
    // For each workout exercise, delete associated sets
    for (const we of workoutExercisesToDelete) {
      const setsToDelete = Array.from(this.sets.values())
        .filter(set => set.workoutExerciseId === we.id);
      
      for (const set of setsToDelete) {
        this.sets.delete(set.id);
      }
      
      this.workoutExercises.delete(we.id);
    }
    
    return this.workouts.delete(id);
  }
  
  // Workout Exercise methods
  async createWorkoutExercise(insertWorkoutExercise: InsertWorkoutExercise): Promise<WorkoutExercise> {
    const id = this.workoutExerciseCurrentId++;
    const workoutExercise: WorkoutExercise = { ...insertWorkoutExercise, id };
    this.workoutExercises.set(id, workoutExercise);
    return workoutExercise;
  }
  
  async deleteWorkoutExercise(id: number): Promise<boolean> {
    // First delete all sets associated with this workout exercise
    const setsToDelete = Array.from(this.sets.values())
      .filter(set => set.workoutExerciseId === id);
    
    for (const set of setsToDelete) {
      this.sets.delete(set.id);
    }
    
    return this.workoutExercises.delete(id);
  }
  
  // Set methods
  async createSet(insertSet: InsertSet): Promise<Set> {
    const id = this.setCurrentId++;
    const set: Set = { ...insertSet, id };
    this.sets.set(id, set);
    return set;
  }
  
  async updateSet(id: number, setUpdate: Partial<Set>): Promise<Set | undefined> {
    const set = this.sets.get(id);
    if (!set) return undefined;
    
    const updatedSet = { ...set, ...setUpdate };
    this.sets.set(id, updatedSet);
    return updatedSet;
  }
  
  async deleteSet(id: number): Promise<boolean> {
    return this.sets.delete(id);
  }
  
  // Seed default exercises
  private seedDefaultExercises() {
    const defaultExercises: Omit<Exercise, 'id'>[] = [
      { name: 'Bench Press', category: 'Chest', subcategory: 'Strength', isCustom: false, userId: null },
      { name: 'Incline Dumbbell Press', category: 'Chest', subcategory: 'Hypertrophy', isCustom: false, userId: null },
      { name: 'Barbell Squat', category: 'Legs', subcategory: 'Compound', isCustom: false, userId: null },
      { name: 'Cable Fly', category: 'Chest', subcategory: 'Isolation', isCustom: false, userId: null },
      { name: 'Lat Pulldown', category: 'Back', subcategory: 'Compound', isCustom: false, userId: null },
      { name: 'Overhead Press', category: 'Shoulders', subcategory: 'Compound', isCustom: false, userId: null },
      { name: 'Deadlift', category: 'Back', subcategory: 'Compound', isCustom: false, userId: null },
      { name: 'Bicep Curl', category: 'Arms', subcategory: 'Isolation', isCustom: false, userId: null },
      { name: 'Tricep Extension', category: 'Arms', subcategory: 'Isolation', isCustom: false, userId: null },
      { name: 'Leg Press', category: 'Legs', subcategory: 'Compound', isCustom: false, userId: null },
      { name: 'Plank', category: 'Core', subcategory: 'Isometric', isCustom: false, userId: null },
      { name: 'Russian Twist', category: 'Core', subcategory: 'Rotational', isCustom: false, userId: null }
    ];
    
    defaultExercises.forEach(exercise => {
      const id = this.exerciseCurrentId++;
      this.exercises.set(id, { ...exercise, id });
    });
    
    // Create a test user
    const testUser: User = {
      id: this.userCurrentId++,
      username: 'demo',
      password: 'password',
      name: 'John Smith',
      email: 'demo@example.com'
    };
    this.users.set(testUser.id, testUser);
    
    // Add some sample workouts for the test user
    const sampleWorkouts = [
      {
        name: 'Monday Push Day',
        date: new Date('2023-07-24T10:00:00Z'),
        notes: 'Feeling strong today',
        userId: testUser.id,
        category: 'Strength',
        duration: 45
      },
      {
        name: 'Leg Day',
        date: new Date('2023-07-22T15:30:00Z'),
        notes: 'Recovery from last session',
        userId: testUser.id,
        category: 'Strength',
        duration: 53
      },
      {
        name: 'Upper Body',
        date: new Date('2023-07-20T09:00:00Z'),
        notes: 'Focus on form',
        userId: testUser.id,
        category: 'Hypertrophy',
        duration: 45
      },
      {
        name: 'Core & Cardio',
        date: new Date('2023-07-19T17:00:00Z'),
        notes: 'Quick session',
        userId: testUser.id,
        category: 'HIIT',
        duration: 30
      }
    ];
    
    sampleWorkouts.forEach(workout => {
      const id = this.workoutCurrentId++;
      this.workouts.set(id, { ...workout, id });
    });
  }
}

export const storage = new MemStorage();

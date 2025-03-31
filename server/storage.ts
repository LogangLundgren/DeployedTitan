import {
  users, type User, type InsertUser,
  exercises, type Exercise, type InsertExercise,
  workouts, type Workout, type InsertWorkout,
  workoutExercises, type WorkoutExercise, type InsertWorkoutExercise,
  sets, type Set, type InsertSet,
  templates, type Template, type InsertTemplate,
  templateExercises, type TemplateExercise, type InsertTemplateExercise,
  notifications, type Notification, type InsertNotification,
  goals, type Goal, type InsertGoal,
  milestones, type Milestone, type InsertMilestone,
  type WorkoutWithDetails, type TemplateWithExercises
} from "@shared/schema";
import { eq, desc, and } from 'drizzle-orm';
import { db } from './db';

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
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
  
  // Template operations
  getTemplates(userId: number): Promise<Template[]>;
  getTemplateWithExercises(id: number): Promise<TemplateWithExercises | undefined>;
  createTemplate(template: InsertTemplate): Promise<Template>;
  updateTemplate(id: number, template: Partial<Template>): Promise<Template | undefined>;
  deleteTemplate(id: number): Promise<boolean>;
  
  // Template Exercise operations
  createTemplateExercise(templateExercise: InsertTemplateExercise): Promise<TemplateExercise>;
  deleteTemplateExercise(id: number): Promise<boolean>;
  updateTemplateExercise(id: number, templateExercise: Partial<TemplateExercise>): Promise<TemplateExercise | undefined>;
  
  // Notification operations
  getNotifications(userId: number): Promise<Notification[]>;
  getUnreadNotificationsCount(userId: number): Promise<number>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: number): Promise<boolean>;
  
  // Goal operations
  getGoals(userId: number): Promise<Goal[]>;
  getGoal(id: number): Promise<Goal | undefined>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, goal: Partial<Goal>): Promise<Goal | undefined>;
  deleteGoal(id: number): Promise<boolean>;
  updateGoalProgress(id: number, currentValue: number): Promise<Goal | undefined>;
  getPublicGoals(limit?: number): Promise<Goal[]>;
  
  // Milestone operations
  getMilestones(goalId: number): Promise<Milestone[]>;
  createMilestone(milestone: InsertMilestone): Promise<Milestone>;
  updateMilestone(id: number, milestone: Partial<Milestone>): Promise<Milestone | undefined>;
  deleteMilestone(id: number): Promise<boolean>;
  completeMilestone(id: number): Promise<Milestone | undefined>;
  
  // DB-specific method
  initialize?(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private exercises: Map<number, Exercise>;
  private workouts: Map<number, Workout>;
  private workoutExercises: Map<number, WorkoutExercise>;
  private sets: Map<number, Set>;
  private templates: Map<number, Template>;
  private templateExercises: Map<number, TemplateExercise>;
  private notifications: Map<number, Notification>;
  private goals: Map<number, Goal>;
  private milestones: Map<number, Milestone>;
  
  private userCurrentId: number;
  private exerciseCurrentId: number;
  private workoutCurrentId: number;
  private workoutExerciseCurrentId: number;
  private setCurrentId: number;
  private templateCurrentId: number;
  private templateExerciseCurrentId: number;
  private notificationCurrentId: number;
  private goalCurrentId: number;
  private milestoneCurrentId: number;

  constructor() {
    this.users = new Map();
    this.exercises = new Map();
    this.workouts = new Map();
    this.workoutExercises = new Map();
    this.sets = new Map();
    this.templates = new Map();
    this.templateExercises = new Map();
    this.notifications = new Map();
    this.goals = new Map();
    this.milestones = new Map();
    
    this.userCurrentId = 1;
    this.exerciseCurrentId = 1;
    this.workoutCurrentId = 1;
    this.workoutExerciseCurrentId = 1;
    this.setCurrentId = 1;
    this.templateCurrentId = 1;
    this.templateExerciseCurrentId = 1;
    this.notificationCurrentId = 1;
    this.goalCurrentId = 1;
    this.milestoneCurrentId = 1;
    
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
    const user: User = { 
      ...insertUser, 
      id,
      name: insertUser.name ?? null,
      email: insertUser.email ?? null,
      bio: insertUser.bio ?? null,
      location: insertUser.location ?? null,
      fitnessLevel: insertUser.fitnessLevel ?? null,
      experienceYears: insertUser.experienceYears ?? null,
      goals: insertUser.goals ?? null,
      certifications: insertUser.certifications ?? null,
      socialMedia: insertUser.socialMedia ?? null
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userUpdate: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userUpdate };
    this.users.set(id, updatedUser);
    return updatedUser;
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
    const exercise: Exercise = { 
      ...insertExercise, 
      id,
      subcategory: insertExercise.subcategory ?? null,
      userId: insertExercise.userId ?? null,
      isCustom: insertExercise.isCustom ?? null
    };
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
    const workout: Workout = { 
      ...insertWorkout, 
      id,
      date: insertWorkout.date || new Date(),
      category: insertWorkout.category ?? null,
      notes: insertWorkout.notes ?? null,
      duration: insertWorkout.duration ?? null,
      isPublic: insertWorkout.isPublic ?? false
    };
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
    const set: Set = { 
      ...insertSet, 
      id,
      notes: insertSet.notes ?? null,
      weight: insertSet.weight ?? null,
      reps: insertSet.reps ?? null
    };
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
  
  // Template operations
  async getTemplates(userId: number): Promise<Template[]> {
    return Array.from(this.templates.values())
      .filter(template => template.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async getTemplateWithExercises(id: number): Promise<TemplateWithExercises | undefined> {
    const template = this.templates.get(id);
    if (!template) return undefined;
    
    const templateExercisesForTemplate = Array.from(this.templateExercises.values())
      .filter(te => te.templateId === id)
      .sort((a, b) => a.order - b.order);
    
    const exercises = templateExercisesForTemplate.map(te => {
      const exerciseDetails = this.exercises.get(te.exerciseId);
      if (!exerciseDetails) {
        throw new Error(`Exercise with ID ${te.exerciseId} not found`);
      }
      
      return {
        ...te,
        exerciseDetails
      };
    });
    
    return {
      ...template,
      exercises
    };
  }
  
  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const id = this.templateCurrentId++;
    const template: Template = { 
      ...insertTemplate, 
      id,
      description: insertTemplate.description ?? null,
      category: insertTemplate.category ?? null,
      createdAt: new Date()
    };
    this.templates.set(id, template);
    return template;
  }
  
  async updateTemplate(id: number, templateUpdate: Partial<Template>): Promise<Template | undefined> {
    const template = this.templates.get(id);
    if (!template) return undefined;
    
    const updatedTemplate = { ...template, ...templateUpdate };
    this.templates.set(id, updatedTemplate);
    return updatedTemplate;
  }
  
  async deleteTemplate(id: number): Promise<boolean> {
    // Delete all template exercises for this template
    const templateExercisesToDelete = Array.from(this.templateExercises.values())
      .filter(te => te.templateId === id);
    
    for (const te of templateExercisesToDelete) {
      this.templateExercises.delete(te.id);
    }
    
    return this.templates.delete(id);
  }
  
  // Template Exercise operations
  async createTemplateExercise(insertTemplateExercise: InsertTemplateExercise): Promise<TemplateExercise> {
    const id = this.templateExerciseCurrentId++;
    const templateExercise: TemplateExercise = {
      ...insertTemplateExercise,
      id,
      defaultSets: insertTemplateExercise.defaultSets ?? null,
      defaultReps: insertTemplateExercise.defaultReps ?? null,
      defaultWeight: insertTemplateExercise.defaultWeight ?? null,
      notes: insertTemplateExercise.notes ?? null
    };
    this.templateExercises.set(id, templateExercise);
    return templateExercise;
  }
  
  async updateTemplateExercise(id: number, templateExerciseUpdate: Partial<TemplateExercise>): Promise<TemplateExercise | undefined> {
    const templateExercise = this.templateExercises.get(id);
    if (!templateExercise) return undefined;
    
    const updatedTemplateExercise = { ...templateExercise, ...templateExerciseUpdate };
    this.templateExercises.set(id, updatedTemplateExercise);
    return updatedTemplateExercise;
  }
  
  async deleteTemplateExercise(id: number): Promise<boolean> {
    return this.templateExercises.delete(id);
  }
  
  // Notification operations
  async getNotifications(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async getUnreadNotificationsCount(userId: number): Promise<number> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId && !notification.isRead)
      .length;
  }
  
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.notificationCurrentId++;
    const notification: Notification = {
      ...insertNotification,
      id,
      isRead: false,
      createdAt: new Date(),
      title: insertNotification.title ?? null,
      link: insertNotification.link ?? null
    };
    this.notifications.set(id, notification);
    return notification;
  }
  
  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    
    const updatedNotification = { ...notification, isRead: true };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }
  
  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    const userNotifications = Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId && !notification.isRead);
      
    if (userNotifications.length === 0) return false;
    
    userNotifications.forEach(notification => {
      this.notifications.set(notification.id, { ...notification, isRead: true });
    });
    
    return true;
  }
  
  // Goal operations
  async getGoals(userId: number): Promise<Goal[]> {
    return Array.from(this.goals.values())
      .filter(goal => goal.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async getGoal(id: number): Promise<Goal | undefined> {
    return this.goals.get(id);
  }
  
  async createGoal(insertGoal: InsertGoal): Promise<Goal> {
    const id = this.goalCurrentId++;
    const now = new Date();
    const goal: Goal = {
      ...insertGoal,
      id,
      currentValue: insertGoal.currentValue ?? 0,
      description: insertGoal.description ?? null,
      category: insertGoal.category ?? null,
      exerciseId: insertGoal.exerciseId ?? null,
      startDate: insertGoal.startDate ?? now,
      targetDate: insertGoal.targetDate ?? null,
      isPublic: insertGoal.isPublic ?? false,
      isCompleted: false,
      completedDate: null,
      createdAt: now,
      updatedAt: now
    };
    this.goals.set(id, goal);
    
    // Create a notification for the new goal
    await this.createNotification({
      userId: goal.userId,
      title: "New Goal Created",
      message: `You've set a new goal: ${goal.title}`,
      type: "goal"
    });
    
    return goal;
  }
  
  async updateGoal(id: number, goalUpdate: Partial<Goal>): Promise<Goal | undefined> {
    const goal = this.goals.get(id);
    if (!goal) return undefined;
    
    const updatedGoal = {
      ...goal,
      ...goalUpdate,
      updatedAt: new Date()
    };
    this.goals.set(id, updatedGoal);
    return updatedGoal;
  }
  
  async deleteGoal(id: number): Promise<boolean> {
    // Delete all milestones for this goal
    const milestonesToDelete = Array.from(this.milestones.values())
      .filter(milestone => milestone.goalId === id);
    
    for (const milestone of milestonesToDelete) {
      this.milestones.delete(milestone.id);
    }
    
    return this.goals.delete(id);
  }
  
  async updateGoalProgress(id: number, currentValue: number): Promise<Goal | undefined> {
    const goal = this.goals.get(id);
    if (!goal) return undefined;
    
    const previousValue = goal.currentValue;
    
    // Check if goal is completed with this update
    const isCompleted = currentValue >= goal.targetValue && !goal.isCompleted;
    
    const updatedGoal = {
      ...goal,
      currentValue,
      isCompleted: isCompleted || goal.isCompleted,
      updatedAt: new Date()
    };
    this.goals.set(id, updatedGoal);
    
    // Check if any milestones are reached
    const goalMilestones = Array.from(this.milestones.values())
      .filter(milestone => milestone.goalId === id && !milestone.isCompleted && milestone.targetValue <= currentValue);
    
    for (const milestone of goalMilestones) {
      await this.completeMilestone(milestone.id);
    }
    
    // Create a notification if goal is completed
    if (isCompleted) {
      await this.createNotification({
        userId: goal.userId,
        title: "Goal Completed! 🎉",
        message: `Congratulations! You've completed your goal: ${goal.title}`,
        type: "achievement"
      });
    }
    
    // Create a notification if progress is significant (25%, 50%, 75%)
    const progressPercentage = Math.floor((currentValue / goal.targetValue) * 100);
    const previousPercentage = Math.floor((previousValue / goal.targetValue) * 100);
    
    const milestones = [25, 50, 75];
    for (const milestone of milestones) {
      if (progressPercentage >= milestone && previousPercentage < milestone) {
        await this.createNotification({
          userId: goal.userId,
          title: `${milestone}% Progress! 💪`,
          message: `You've reached ${milestone}% of your goal: ${goal.title}`,
          type: "progress"
        });
        break;
      }
    }
    
    return updatedGoal;
  }
  
  async getPublicGoals(limit?: number): Promise<Goal[]> {
    const publicGoals = Array.from(this.goals.values())
      .filter(goal => goal.isPublic)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return limit ? publicGoals.slice(0, limit) : publicGoals;
  }
  
  // Milestone operations
  async getMilestones(goalId: number): Promise<Milestone[]> {
    return Array.from(this.milestones.values())
      .filter(milestone => milestone.goalId === goalId)
      .sort((a, b) => a.targetValue - b.targetValue);
  }
  
  async createMilestone(insertMilestone: InsertMilestone): Promise<Milestone> {
    const id = this.milestoneCurrentId++;
    const milestone: Milestone = {
      ...insertMilestone,
      id,
      description: insertMilestone.description ?? null,
      isCompleted: false,
      completedDate: null,
      createdAt: new Date()
    };
    this.milestones.set(id, milestone);
    return milestone;
  }
  
  async updateMilestone(id: number, milestoneUpdate: Partial<Milestone>): Promise<Milestone | undefined> {
    const milestone = this.milestones.get(id);
    if (!milestone) return undefined;
    
    const updatedMilestone = { ...milestone, ...milestoneUpdate };
    this.milestones.set(id, updatedMilestone);
    return updatedMilestone;
  }
  
  async deleteMilestone(id: number): Promise<boolean> {
    return this.milestones.delete(id);
  }
  
  async completeMilestone(id: number): Promise<Milestone | undefined> {
    const milestone = this.milestones.get(id);
    if (!milestone || milestone.isCompleted) return milestone;
    
    const completedMilestone = {
      ...milestone,
      isCompleted: true,
      completedDate: new Date()
    };
    this.milestones.set(id, completedMilestone);
    
    // Get the goal to create a notification
    const goal = this.goals.get(milestone.goalId);
    if (goal) {
      await this.createNotification({
        userId: goal.userId,
        title: "Milestone Achieved! 🏆",
        message: `You've reached a milestone in your goal "${goal.title}": ${milestone.title}`,
        type: "milestone"
      });
    }
    
    return completedMilestone;
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
      email: 'demo@example.com',
      bio: null,
      location: null,
      fitnessLevel: null,
      experienceYears: null,
      goals: null,
      certifications: null,
      socialMedia: null
    };
    this.users.set(testUser.id, testUser);
  }
}

// Database implementation

export class DbStorage implements IStorage {
  constructor() {
    // The db is imported from server/db.ts
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }
  
  async updateUser(id: number, userUpdate: Partial<User>): Promise<User | undefined> {
    // Remove password from update if it exists (we wouldn't update password this way in a real app)
    const { password, ...updateData } = userUpdate;
    
    const result = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
      
    return result[0];
  }
  
  // Exercise operations
  async getExercises(): Promise<Exercise[]> {
    return await db.select().from(exercises);
  }
  
  async getExercisesByCategory(category: string): Promise<Exercise[]> {
    return await db.select().from(exercises).where(eq(exercises.category, category));
  }
  
  async getExercise(id: number): Promise<Exercise | undefined> {
    const result = await db.select().from(exercises).where(eq(exercises.id, id));
    return result[0];
  }
  
  async createExercise(exercise: InsertExercise): Promise<Exercise> {
    const result = await db.insert(exercises).values(exercise).returning();
    return result[0];
  }
  
  // Workout operations
  async getWorkouts(userId: number): Promise<Workout[]> {
    return await db.select().from(workouts).where(eq(workouts.userId, userId));
  }
  
  async getWorkoutWithDetails(id: number): Promise<WorkoutWithDetails | undefined> {
    // First, get the workout
    const workoutResult = await db.select().from(workouts).where(eq(workouts.id, id));
    
    if (workoutResult.length === 0) return undefined;
    const workout = workoutResult[0];
    
    // Get workout exercises
    const workoutExercisesResult = await db
      .select()
      .from(workoutExercises)
      .where(eq(workoutExercises.workoutId, id))
      .orderBy(workoutExercises.order);
    
    // Process each workout exercise
    const exercisesWithDetails = await Promise.all(
      workoutExercisesResult.map(async (we: WorkoutExercise) => {
        // Get exercise details
        const exerciseResult = await db
          .select()
          .from(exercises)
          .where(eq(exercises.id, we.exerciseId));
        
        if (exerciseResult.length === 0) {
          throw new Error(`Exercise with ID ${we.exerciseId} not found`);
        }
        
        // Get sets for this workout exercise
        const setsResult = await db
          .select()
          .from(sets)
          .where(eq(sets.workoutExerciseId, we.id))
          .orderBy(sets.order);
        
        return {
          ...we,
          exerciseDetails: exerciseResult[0],
          sets: setsResult,
        };
      })
    );
    
    // Calculate statistics
    let totalSets = 0;
    let volume = 0;
    
    exercisesWithDetails.forEach((exercise: any) => {
      totalSets += exercise.sets.length;
      exercise.sets.forEach((set: any) => {
        if (set.weight && set.reps) {
          volume += set.weight * set.reps;
        }
      });
    });
    
    return {
      ...workout,
      exercises: exercisesWithDetails,
      totalSets,
      totalExercises: exercisesWithDetails.length,
      volume
    };
  }
  
  async getRecentWorkouts(userId: number, limit: number): Promise<WorkoutWithDetails[]> {
    // Get workouts for the user, sorted by date
    const workoutResults = await db
      .select()
      .from(workouts)
      .where(eq(workouts.userId, userId))
      .orderBy(desc(workouts.date))
      .limit(limit);
    
    // Get details for each workout
    const workoutsWithDetails = await Promise.all(
      workoutResults.map((workout: Workout) => this.getWorkoutWithDetails(workout.id))
    );
    
    return workoutsWithDetails.filter((w): w is WorkoutWithDetails => w !== undefined);
  }
  
  async createWorkout(workout: InsertWorkout): Promise<Workout> {
    const result = await db.insert(workouts).values(workout).returning();
    return result[0];
  }
  
  async updateWorkout(id: number, workout: Partial<Workout>): Promise<Workout | undefined> {
    const result = await db
      .update(workouts)
      .set(workout)
      .where(eq(workouts.id, id))
      .returning();
    
    return result[0];
  }
  
  async deleteWorkout(id: number): Promise<boolean> {
    // First, get the workout exercises to delete
    const workoutExercisesResult = await db
      .select()
      .from(workoutExercises)
      .where(eq(workoutExercises.workoutId, id));
    
    // Delete sets for each workout exercise
    for (const we of workoutExercisesResult) {
      await db
        .delete(sets)
        .where(eq(sets.workoutExerciseId, we.id));
    }
    
    // Delete workout exercises
    await db
      .delete(workoutExercises)
      .where(eq(workoutExercises.workoutId, id));
    
    // Delete workout
    const result = await db
      .delete(workouts)
      .where(eq(workouts.id, id))
      .returning();
    
    return result.length > 0;
  }
  
  // Workout Exercise operations
  async createWorkoutExercise(workoutExercise: InsertWorkoutExercise): Promise<WorkoutExercise> {
    const result = await db.insert(workoutExercises).values(workoutExercise).returning();
    return result[0];
  }
  
  async deleteWorkoutExercise(id: number): Promise<boolean> {
    // Delete sets first
    await db
      .delete(sets)
      .where(eq(sets.workoutExerciseId, id));
    
    // Delete workout exercise
    const result = await db
      .delete(workoutExercises)
      .where(eq(workoutExercises.id, id))
      .returning();
    
    return result.length > 0;
  }
  
  // Set operations
  async createSet(set: InsertSet): Promise<Set> {
    const result = await db.insert(sets).values(set).returning();
    return result[0];
  }
  
  async updateSet(id: number, set: Partial<Set>): Promise<Set | undefined> {
    const result = await db
      .update(sets)
      .set(set)
      .where(eq(sets.id, id))
      .returning();
    
    return result[0];
  }
  
  async deleteSet(id: number): Promise<boolean> {
    const result = await db
      .delete(sets)
      .where(eq(sets.id, id))
      .returning();
    
    return result.length > 0;
  }
  
  // Template operations
  async getTemplates(userId: number): Promise<Template[]> {
    return await db
      .select()
      .from(templates)
      .where(eq(templates.userId, userId))
      .orderBy(desc(templates.createdAt));
  }
  
  async getTemplateWithExercises(id: number): Promise<TemplateWithExercises | undefined> {
    // First, get the template
    const templateResult = await db.select().from(templates).where(eq(templates.id, id));
    
    if (templateResult.length === 0) return undefined;
    const template = templateResult[0];
    
    // Get template exercises
    const templateExercisesResult = await db
      .select()
      .from(templateExercises)
      .where(eq(templateExercises.templateId, id))
      .orderBy(templateExercises.order);
    
    // Process each template exercise
    const exercisesWithDetails = await Promise.all(
      templateExercisesResult.map(async (te: TemplateExercise) => {
        // Get exercise details
        const exerciseResult = await db
          .select()
          .from(exercises)
          .where(eq(exercises.id, te.exerciseId));
        
        if (exerciseResult.length === 0) {
          throw new Error(`Exercise with ID ${te.exerciseId} not found`);
        }
        
        return {
          ...te,
          exerciseDetails: exerciseResult[0],
        };
      })
    );
    
    return {
      ...template,
      exercises: exercisesWithDetails,
    };
  }
  
  async createTemplate(template: InsertTemplate): Promise<Template> {
    const result = await db.insert(templates).values(template).returning();
    return result[0];
  }
  
  async updateTemplate(id: number, template: Partial<Template>): Promise<Template | undefined> {
    const result = await db
      .update(templates)
      .set(template)
      .where(eq(templates.id, id))
      .returning();
    
    return result[0];
  }
  
  async deleteTemplate(id: number): Promise<boolean> {
    try {
      // First, delete all template exercises
      await db.delete(templateExercises).where(eq(templateExercises.templateId, id));
      
      // Then delete the template
      const result = await db.delete(templates).where(eq(templates.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting template:', error);
      return false;
    }
  }
  
  // Template Exercise operations
  async createTemplateExercise(templateExercise: InsertTemplateExercise): Promise<TemplateExercise> {
    const result = await db.insert(templateExercises).values(templateExercise).returning();
    return result[0];
  }
  
  async updateTemplateExercise(id: number, templateExercise: Partial<TemplateExercise>): Promise<TemplateExercise | undefined> {
    const result = await db
      .update(templateExercises)
      .set(templateExercise)
      .where(eq(templateExercises.id, id))
      .returning();
    
    return result[0];
  }
  
  async deleteTemplateExercise(id: number): Promise<boolean> {
    try {
      const result = await db.delete(templateExercises).where(eq(templateExercises.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting template exercise:', error);
      return false;
    }
  }
  
  // Notification operations
  async getNotifications(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }
  
  async getUnreadNotificationsCount(userId: number): Promise<number> {
    const unreadNotifications = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
      
    return unreadNotifications.length;
  }
  
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const result = await db.insert(notifications).values(notification).returning();
    return result[0];
  }
  
  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
      
    return result[0];
  }
  
  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    try {
      const result = await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
        .returning();
        
      return result.length > 0;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }
  
  // Goal operations
  async getGoals(userId: number): Promise<Goal[]> {
    try {
      return await db
        .select()
        .from(goals)
        .where(eq(goals.userId, userId))
        .orderBy(desc(goals.createdAt));
    } catch (error) {
      console.error('Error getting goals:', error);
      return [];
    }
  }
  
  async getGoal(id: number): Promise<Goal | undefined> {
    try {
      const result = await db.select().from(goals).where(eq(goals.id, id));
      return result[0];
    } catch (error) {
      console.error('Error getting goal:', error);
      return undefined;
    }
  }
  
  async createGoal(goal: InsertGoal): Promise<Goal> {
    try {
      const result = await db.insert(goals).values(goal).returning();
      const newGoal = result[0];
      
      // Create a notification for the new goal
      await this.createNotification({
        userId: newGoal.userId,
        title: "New Goal Created",
        message: `You've set a new goal: ${newGoal.title}`,
        type: "goal"
      });
      
      return newGoal;
    } catch (error) {
      console.error('Error creating goal:', error);
      throw error;
    }
  }
  
  async updateGoal(id: number, goalUpdate: Partial<Goal>): Promise<Goal | undefined> {
    try {
      const result = await db
        .update(goals)
        .set({ ...goalUpdate, updatedAt: new Date() })
        .where(eq(goals.id, id))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error('Error updating goal:', error);
      return undefined;
    }
  }
  
  async deleteGoal(id: number): Promise<boolean> {
    try {
      // Delete all milestones for this goal (cascade should handle this, but just to be safe)
      await db.delete(milestones).where(eq(milestones.goalId, id));
      
      // Delete the goal
      const result = await db
        .delete(goals)
        .where(eq(goals.id, id))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting goal:', error);
      return false;
    }
  }
  
  async updateGoalProgress(id: number, currentValue: number): Promise<Goal | undefined> {
    try {
      // Get current goal to check progress
      const goalResult = await db.select().from(goals).where(eq(goals.id, id));
      if (goalResult.length === 0) return undefined;
      
      const goal = goalResult[0];
      const previousValue = goal.currentValue;
      
      // Check if goal is completed with this update
      const isCompleted = currentValue >= goal.targetValue && !goal.isCompleted;
      
      // Update goal
      const updatedGoalResult = await db
        .update(goals)
        .set({
          currentValue,
          isCompleted: isCompleted || goal.isCompleted,
          updatedAt: new Date()
        })
        .where(eq(goals.id, id))
        .returning();
      
      if (updatedGoalResult.length === 0) return undefined;
      const updatedGoal = updatedGoalResult[0];
      
      // Check if any milestones are reached
      const milestonesResult = await db
        .select()
        .from(milestones)
        .where(
          and(
            eq(milestones.goalId, id),
            eq(milestones.isCompleted, false)
          )
        );
      
      for (const milestone of milestonesResult) {
        if (currentValue >= milestone.targetValue) {
          await this.completeMilestone(milestone.id);
        }
      }
      
      // Create a notification if goal is completed
      if (isCompleted) {
        await this.createNotification({
          userId: goal.userId,
          title: "Goal Completed! 🎉",
          message: `Congratulations! You've completed your goal: ${goal.title}`,
          type: "achievement"
        });
      }
      
      // Create a notification if progress is significant (25%, 50%, 75%)
      const progressPercentage = Math.floor((currentValue / goal.targetValue) * 100);
      const previousPercentage = Math.floor((previousValue / goal.targetValue) * 100);
      
      const milestones = [25, 50, 75];
      for (const milestone of milestones) {
        if (progressPercentage >= milestone && previousPercentage < milestone) {
          await this.createNotification({
            userId: goal.userId,
            title: `${milestone}% Progress! 💪`,
            message: `You've reached ${milestone}% of your goal: ${goal.title}`,
            type: "progress"
          });
          break;
        }
      }
      
      return updatedGoal;
    } catch (error) {
      console.error('Error updating goal progress:', error);
      return undefined;
    }
  }
  
  async getPublicGoals(limit?: number): Promise<Goal[]> {
    try {
      const query = db
        .select()
        .from(goals)
        .where(eq(goals.isPublic, true))
        .orderBy(desc(goals.createdAt));
      
      if (limit) {
        query.limit(limit);
      }
      
      return await query;
    } catch (error) {
      console.error('Error getting public goals:', error);
      return [];
    }
  }
  
  // Milestone operations
  async getMilestones(goalId: number): Promise<Milestone[]> {
    try {
      return await db
        .select()
        .from(milestones)
        .where(eq(milestones.goalId, goalId))
        .orderBy(milestones.targetValue);
    } catch (error) {
      console.error('Error getting milestones:', error);
      return [];
    }
  }
  
  async createMilestone(milestone: InsertMilestone): Promise<Milestone> {
    try {
      const result = await db.insert(milestones).values(milestone).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating milestone:', error);
      throw error;
    }
  }
  
  async updateMilestone(id: number, milestoneUpdate: Partial<Milestone>): Promise<Milestone | undefined> {
    try {
      const result = await db
        .update(milestones)
        .set(milestoneUpdate)
        .where(eq(milestones.id, id))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error('Error updating milestone:', error);
      return undefined;
    }
  }
  
  async deleteMilestone(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(milestones)
        .where(eq(milestones.id, id))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting milestone:', error);
      return false;
    }
  }
  
  async completeMilestone(id: number): Promise<Milestone | undefined> {
    try {
      const milestoneResult = await db
        .select()
        .from(milestones)
        .where(eq(milestones.id, id));
      
      if (milestoneResult.length === 0 || milestoneResult[0].isCompleted) {
        return milestoneResult[0];
      }
      
      const updatedResult = await db
        .update(milestones)
        .set({ 
          isCompleted: true, 
          completedDate: new Date() 
        })
        .where(eq(milestones.id, id))
        .returning();
      
      if (updatedResult.length === 0) return undefined;
      
      // Get the goal to create a notification
      const milestone = updatedResult[0];
      const goalResult = await db
        .select()
        .from(goals)
        .where(eq(goals.id, milestone.goalId));
      
      if (goalResult.length > 0) {
        const goal = goalResult[0];
        await this.createNotification({
          userId: goal.userId,
          title: "Milestone Achieved! 🏆",
          message: `You've reached a milestone in your goal "${goal.title}": ${milestone.title}`,
          type: "milestone"
        });
      }
      
      return milestone;
    } catch (error) {
      console.error('Error completing milestone:', error);
      return undefined;
    }
  }
  
  // Initialization function to set up the database with default data
  async initialize(): Promise<void> {
    // Check if we have any users
    const userCount = await db.select().from(users);
    
    if (userCount.length === 0) {
      // Create a test user
      const testUser = await this.createUser({
        username: 'demo',
        password: 'password',
        name: 'John Smith',
        email: 'demo@example.com',
        bio: null,
        location: null,
        fitnessLevel: null,
        experienceYears: null, 
        goals: null,
        certifications: null,
        socialMedia: null
      });
      
      // Add default exercises
      const defaultExercises: InsertExercise[] = [
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
      
      for (const exercise of defaultExercises) {
        await this.createExercise(exercise);
      }
      
      // No sample workouts - let users create their own
    }
  }
}

// Use in-memory storage during development, database storage in production
export const storage = process.env.DATABASE_URL 
  ? new DbStorage() 
  : new MemStorage();

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
  mediaFiles, type MediaFile, type InsertMediaFile,
  comments, type Comment, type InsertComment,
  likes, type Like, type InsertLike,
  coachProfiles, type CoachProfile, type InsertCoachProfile,
  workoutPlans, type WorkoutPlan, type InsertWorkoutPlan,
  workoutPlanDays, type WorkoutPlanDay, type InsertWorkoutPlanDay,
  planTemplates, type PlanTemplate, type InsertPlanTemplate,
  coachingServices, type CoachingService, type InsertCoachingService,
  purchases, type Purchase, type InsertPurchase,
  reviews, type Review, type InsertReview,
  userSuggestions, type UserSuggestion, type InsertUserSuggestion,
  type WorkoutWithDetails, type TemplateWithExercises
} from "@shared/schema";
import { eq, desc, and, asc, sql, or, isNull, isNotNull, inArray, like, count } from 'drizzle-orm';
import { db } from './db';

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  updateUserCoachStatus(id: number, isCoach: boolean): Promise<User | undefined>;
  updateUserStripeInfo(id: number, stripeInfo: { customerId?: string, subscriptionId?: string }): Promise<User | undefined>;
  
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
  getTemplateExercises(templateId: number): Promise<TemplateExercise[]>;
  
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
  
  // Media file operations
  getMediaFiles(workoutId: number): Promise<MediaFile[]>;
  getMediaFilesByExercise(workoutExerciseId: number): Promise<MediaFile[]>;
  createMediaFile(mediaFile: InsertMediaFile): Promise<MediaFile>;
  deleteMediaFile(id: number): Promise<boolean>;
  
  // Comment operations
  getComments(workoutId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  updateComment(id: number, content: string): Promise<Comment | undefined>;
  deleteComment(id: number): Promise<boolean>;
  
  // Like operations
  getLikes(workoutId: number): Promise<Like[]>;
  getLikeCount(workoutId: number): Promise<number>;
  isLikedByUser(workoutId: number, userId: number): Promise<boolean>;
  toggleLike(workoutId: number, userId: number): Promise<boolean>;
  createLike(like: InsertLike): Promise<Like>;
  deleteLike(workoutId: number, userId: number): Promise<boolean>;
  
  // Coach Profile operations
  getCoachProfile(userId: number): Promise<CoachProfile | undefined>;
  getCoachProfileById(id: number): Promise<CoachProfile | undefined>;
  createCoachProfile(coachProfile: InsertCoachProfile): Promise<CoachProfile>;
  updateCoachProfile(id: number, coachProfile: Partial<CoachProfile>): Promise<CoachProfile | undefined>;
  listCoaches(limit?: number, offset?: number): Promise<CoachProfile[]>;
  getFeaturedCoaches(limit?: number): Promise<CoachProfile[]>;
  searchCoaches(query: string, category?: string, limit?: number): Promise<CoachProfile[]>;
  
  // Workout Plan operations
  getWorkoutPlan(id: number): Promise<WorkoutPlan | undefined>;
  checkWorkoutPlanExists(id: number): Promise<boolean>;
  getWorkoutPlans(coachId?: number, publishedOnly?: boolean): Promise<WorkoutPlan[]>;
  createWorkoutPlan(plan: InsertWorkoutPlan): Promise<WorkoutPlan>;
  updateWorkoutPlan(id: number, plan: Partial<WorkoutPlan>): Promise<WorkoutPlan | undefined>;
  deleteWorkoutPlan(id: number): Promise<boolean>;
  getFeaturedWorkoutPlans(limit?: number): Promise<WorkoutPlan[]>;
  searchWorkoutPlans(query: string, category?: string, limit?: number): Promise<WorkoutPlan[]>;
  getPurchasedWorkoutPlans(userId: number): Promise<WorkoutPlan[]>;
  
  // Workout Plan Day operations
  getWorkoutPlanDays(planId: number): Promise<WorkoutPlanDay[]>;
  getWorkoutPlanDay(id: number): Promise<WorkoutPlanDay | undefined>;
  createWorkoutPlanDay(workoutPlanDay: InsertWorkoutPlanDay): Promise<WorkoutPlanDay>;
  updateWorkoutPlanDay(id: number, workoutPlanDay: Partial<WorkoutPlanDay>): Promise<WorkoutPlanDay | undefined>;
  deleteWorkoutPlanDay(id: number): Promise<boolean>;
  
  // Plan Template operations
  
  getPlanTemplates(planId: number): Promise<PlanTemplate[]>;
  createPlanTemplate(planTemplate: InsertPlanTemplate): Promise<PlanTemplate>;
  updatePlanTemplate(id: number, planTemplate: Partial<PlanTemplate>): Promise<PlanTemplate | undefined>;
  deletePlanTemplate(id: number): Promise<boolean>;
  
  // Coaching Service operations
  getCoachingServices(coachId: number): Promise<CoachingService[]>;
  getCoachingService(id: number): Promise<CoachingService | undefined>;
  createCoachingService(coachingService: InsertCoachingService): Promise<CoachingService>;
  updateCoachingService(id: number, coachingService: Partial<CoachingService>): Promise<CoachingService | undefined>;
  deleteCoachingService(id: number): Promise<boolean>;
  
  // Purchase operations
  getPurchases(userId: number): Promise<Purchase[]>;
  createPurchase(purchase: InsertPurchase): Promise<Purchase>;
  getPurchase(id: number): Promise<Purchase | undefined>;
  updatePurchaseStatus(id: number, status: string): Promise<Purchase | undefined>;
  
  // Review operations
  getReviews(coachId?: number, planId?: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  updateReview(id: number, reviewContent: string, rating: number): Promise<Review | undefined>;
  deleteReview(id: number): Promise<boolean>;
  getAverageRating(coachId?: number, planId?: number): Promise<number>;
  
  // User Suggestions operations
  getUserSuggestions(): Promise<UserSuggestion[]>;
  getUserSuggestion(id: number): Promise<UserSuggestion | undefined>;
  createUserSuggestion(suggestion: InsertUserSuggestion): Promise<UserSuggestion>;
  updateUserSuggestionStatus(id: number, status: string, adminNotes?: string): Promise<UserSuggestion | undefined>;
  deleteUserSuggestion(id: number): Promise<boolean>;
  
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
  private mediaFiles: Map<number, MediaFile>;
  private comments: Map<number, Comment>;
  private likes: Map<number, Like>;
  private coachProfiles: Map<number, CoachProfile>;
  private workoutPlans: Map<number, WorkoutPlan>;
  private workoutPlanDays: Map<number, WorkoutPlanDay>;
  private planTemplates: Map<number, PlanTemplate>;
  private coachingServices: Map<number, CoachingService>;
  private purchases: Map<number, Purchase>;
  private reviews: Map<number, Review>;
  private userSuggestions: Map<number, UserSuggestion>;
  
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
  private mediaFileCurrentId: number;
  private commentCurrentId: number;
  private likeCurrentId: number;
  private coachProfileCurrentId: number;
  private workoutPlanCurrentId: number;
  private workoutPlanDayCurrentId: number;
  private planTemplateCurrentId: number;
  private coachingServiceCurrentId: number;
  private purchaseCurrentId: number;
  private reviewCurrentId: number;
  private userSuggestionCurrentId: number;

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
    this.mediaFiles = new Map();
    this.comments = new Map();
    this.likes = new Map();
    this.coachProfiles = new Map();
    this.workoutPlans = new Map();
    this.workoutPlanDays = new Map();
    this.planTemplates = new Map();
    this.coachingServices = new Map();
    this.purchases = new Map();
    this.reviews = new Map();
    this.userSuggestions = new Map();
    
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
    this.mediaFileCurrentId = 1;
    this.commentCurrentId = 1;
    this.likeCurrentId = 1;
    this.coachProfileCurrentId = 1;
    this.workoutPlanCurrentId = 1;
    this.workoutPlanDayCurrentId = 1;
    this.planTemplateCurrentId = 1;
    this.coachingServiceCurrentId = 1;
    this.purchaseCurrentId = 1;
    this.reviewCurrentId = 1;
    this.userSuggestionCurrentId = 1;
    
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
  
  async updateUserCoachStatus(id: number, isCoach: boolean): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, isCoach };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateUserStripeInfo(id: number, stripeInfo: { customerId?: string, subscriptionId?: string }): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      stripeCustomerId: stripeInfo.customerId ?? user.stripeCustomerId,
      stripeSubscriptionId: stripeInfo.subscriptionId ?? user.stripeSubscriptionId 
    };
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
    
    // Get comments for this workout
    const comments = Array.from(this.comments.values())
      .filter(comment => comment.workoutId === id)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    // Get likes for this workout
    const likes = Array.from(this.likes.values())
      .filter(like => like.workoutId === id);
      
    return {
      ...workout,
      exercises,
      totalSets,
      totalExercises: exercises.length,
      volume,
      comments,
      likes,
      likesCount: likes.length,
      commentsCount: comments.length,
      isLikedByCurrentUser: likes.some(like => like.userId === workout.userId)
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
  
  async getTemplateExercises(templateId: number): Promise<TemplateExercise[]> {
    const exercises = Array.from(this.templateExercises.values())
      .filter(te => te.templateId === templateId)
      .sort((a, b) => a.order - b.order);
      
    // For each template exercise, fetch the exercise details
    return Promise.all(
      exercises.map(async (te) => {
        const exercise = await this.getExercise(te.exerciseId);
        return {
          ...te,
          exercise: exercise!
        };
      })
    );
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
  
  // Media file operations
  async getMediaFiles(workoutId: number): Promise<MediaFile[]> {
    return Array.from(this.mediaFiles.values())
      .filter(file => file.workoutId === workoutId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async getMediaFilesByExercise(workoutExerciseId: number): Promise<MediaFile[]> {
    return Array.from(this.mediaFiles.values())
      .filter(file => file.workoutExerciseId === workoutExerciseId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async createMediaFile(insertMediaFile: InsertMediaFile): Promise<MediaFile> {
    const id = this.mediaFileCurrentId++;
    const mediaFile: MediaFile = {
      ...insertMediaFile,
      id,
      workoutId: insertMediaFile.workoutId ?? null,
      workoutExerciseId: insertMediaFile.workoutExerciseId ?? null,
      fileSize: insertMediaFile.fileSize ?? null,
      mimeType: insertMediaFile.mimeType ?? null,
      caption: insertMediaFile.caption ?? null,
      createdAt: new Date()
    };
    this.mediaFiles.set(id, mediaFile);
    
    // Create a notification for the new media upload
    await this.createNotification({
      userId: mediaFile.userId,
      title: "Media Upload",
      message: `You've uploaded a new ${mediaFile.fileType} to your workout`,
      type: "info"
    });
    
    return mediaFile;
  }
  
  async deleteMediaFile(id: number): Promise<boolean> {
    return this.mediaFiles.delete(id);
  }
  
  // Comment operations
  async getComments(workoutId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.workoutId === workoutId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
  
  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = this.commentCurrentId++;
    const now = new Date();
    const comment: Comment = {
      ...insertComment,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.comments.set(id, comment);
    
    // Create a notification for the workout owner
    const workout = this.workouts.get(insertComment.workoutId);
    if (workout && workout.userId !== insertComment.userId) {
      await this.createNotification({
        userId: workout.userId,
        title: "New Comment",
        message: `Someone commented on your workout: ${workout.name}`,
        type: "social",
        link: `/workouts/${workout.id}`
      });
    }
    
    return comment;
  }
  
  async updateComment(id: number, content: string): Promise<Comment | undefined> {
    const comment = this.comments.get(id);
    if (!comment) return undefined;
    
    const updatedComment = { 
      ...comment, 
      content,
      updatedAt: new Date()
    };
    this.comments.set(id, updatedComment);
    return updatedComment;
  }
  
  async deleteComment(id: number): Promise<boolean> {
    return this.comments.delete(id);
  }
  
  // Like operations
  async getLikes(workoutId: number): Promise<Like[]> {
    return Array.from(this.likes.values())
      .filter(like => like.workoutId === workoutId);
  }
  
  async getLikeCount(workoutId: number): Promise<number> {
    return Array.from(this.likes.values())
      .filter(like => like.workoutId === workoutId)
      .length;
  }
  
  async isLikedByUser(workoutId: number, userId: number): Promise<boolean> {
    return Array.from(this.likes.values())
      .some(like => like.workoutId === workoutId && like.userId === userId);
  }
  
  async toggleLike(workoutId: number, userId: number): Promise<boolean> {
    const isLiked = await this.isLikedByUser(workoutId, userId);
    
    if (isLiked) {
      return this.deleteLike(workoutId, userId);
    } else {
      await this.createLike({ workoutId, userId });
      return true;
    }
  }
  
  async createLike(insertLike: InsertLike): Promise<Like> {
    const id = this.likeCurrentId++;
    const like: Like = {
      ...insertLike,
      id,
      createdAt: new Date()
    };
    this.likes.set(id, like);
    
    // Create a notification for the workout owner
    const workout = this.workouts.get(insertLike.workoutId);
    if (workout && workout.userId !== insertLike.userId) {
      await this.createNotification({
        userId: workout.userId,
        title: "New Like",
        message: `Someone liked your workout: ${workout.name}`,
        type: "social",
        link: `/workouts/${workout.id}`
      });
    }
    
    return like;
  }
  
  async deleteLike(workoutId: number, userId: number): Promise<boolean> {
    const like = Array.from(this.likes.values())
      .find(like => like.workoutId === workoutId && like.userId === userId);
    
    if (like) {
      return this.likes.delete(like.id);
    }
    
    return false;
  }
  
  // Coach Profile operations
  async getCoachProfile(userId: number): Promise<CoachProfile | undefined> {
    return Array.from(this.coachProfiles.values())
      .find((profile) => profile.userId === userId);
  }
  
  async getCoachProfileById(id: number): Promise<CoachProfile | undefined> {
    return this.coachProfiles.get(id);
  }
  
  async createCoachProfile(insertCoachProfile: InsertCoachProfile): Promise<CoachProfile> {
    const id = this.coachProfileCurrentId++;
    const now = new Date();
    const coachProfile: CoachProfile = {
      ...insertCoachProfile,
      id,
      rating: null,
      ratingsCount: 0,
      isVerified: false,
      createdAt: now,
      updatedAt: now
    };
    this.coachProfiles.set(id, coachProfile);
    
    // Create a notification for the user about becoming a coach
    await this.createNotification({
      userId: coachProfile.userId,
      title: "Coach Profile Created",
      message: "You're now a coach! You can create workout plans and offer coaching services.",
      type: "info"
    });
    
    return coachProfile;
  }
  
  async updateCoachProfile(id: number, profileUpdate: Partial<CoachProfile>): Promise<CoachProfile | undefined> {
    const profile = this.coachProfiles.get(id);
    if (!profile) return undefined;
    
    const updatedProfile = {
      ...profile,
      ...profileUpdate,
      updatedAt: new Date()
    };
    this.coachProfiles.set(id, updatedProfile);
    return updatedProfile;
  }
  
  async listCoaches(limit?: number, offset = 0): Promise<CoachProfile[]> {
    let coaches = Array.from(this.coachProfiles.values())
      .filter(coach => coach.isAvailableForHire)
      .sort((a, b) => {
        // Sort by verified first, then by rating
        if (a.isVerified && !b.isVerified) return -1;
        if (!a.isVerified && b.isVerified) return 1;
        
        const aRating = a.rating || 0;
        const bRating = b.rating || 0;
        return bRating - aRating;
      });
    
    if (offset) {
      coaches = coaches.slice(offset);
    }
    
    if (limit) {
      coaches = coaches.slice(0, limit);
    }
    
    return coaches;
  }
  
  async getFeaturedCoaches(limit?: number): Promise<CoachProfile[]> {
    let coaches = Array.from(this.coachProfiles.values())
      .filter(coach => coach.isAvailableForHire && coach.isVerified)
      .sort((a, b) => {
        const aRating = a.rating || 0;
        const bRating = b.rating || 0;
        if (bRating !== aRating) {
          return bRating - aRating;
        }
        return b.ratingsCount - a.ratingsCount;
      });
    
    if (limit) {
      coaches = coaches.slice(0, limit);
    }
    
    return coaches;
  }
  
  async searchCoaches(query: string, category?: string, limit?: number): Promise<CoachProfile[]> {
    const queryLower = query.toLowerCase();
    
    // Get users for name search
    const userMap = new Map<number, User>();
    this.users.forEach(user => userMap.set(user.id, user));
    
    let coaches = Array.from(this.coachProfiles.values())
      .filter(coach => {
        if (!coach.isAvailableForHire) return false;
        
        const user = userMap.get(coach.userId);
        if (!user) return false;
        
        // Match by name, title, specialties, or biography
        const titleMatch = coach.title.toLowerCase().includes(queryLower);
        const nameMatch = user.name ? user.name.toLowerCase().includes(queryLower) : false;
        const specialtiesMatch = coach.specialties.toLowerCase().includes(queryLower);
        const bioMatch = coach.biography.toLowerCase().includes(queryLower);
        
        return titleMatch || nameMatch || specialtiesMatch || bioMatch;
      })
      .sort((a, b) => {
        if (a.isVerified && !b.isVerified) return -1;
        if (!a.isVerified && b.isVerified) return 1;
        
        const aRating = a.rating || 0;
        const bRating = b.rating || 0;
        return bRating - aRating;
      });
    
    if (limit) {
      coaches = coaches.slice(0, limit);
    }
    
    return coaches;
  }
  
  // Workout Plan operations
  async getWorkoutPlans(coachId?: number, publishedOnly: boolean = false): Promise<WorkoutPlan[]> {
    let plans = Array.from(this.workoutPlans.values());
    
    if (coachId) {
      plans = plans.filter(plan => plan.coachId === coachId);
    }
    
    if (publishedOnly && (!coachId || coachId === undefined)) {
      plans = plans.filter(plan => plan.isPublished === true);
    }
    
    return plans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async getWorkoutPlan(id: number): Promise<WorkoutPlan | undefined> {
    return this.workoutPlans.get(id);
  }
  
  async checkWorkoutPlanExists(id: number): Promise<boolean> {
    return this.workoutPlans.has(id);
  }
  
  async createWorkoutPlan(insertWorkoutPlan: InsertWorkoutPlan): Promise<WorkoutPlan> {
    const id = this.workoutPlanCurrentId++;
    const now = new Date();
    const workoutPlan: WorkoutPlan = {
      ...insertWorkoutPlan,
      id,
      featuredImageUrl: insertWorkoutPlan.featuredImageUrl || null,
      equipment: insertWorkoutPlan.equipment || null,
      isFeatured: insertWorkoutPlan.isFeatured || false,
      isSoldOut: false,
      rating: null,
      ratingsCount: 0,
      sales: 0,
      createdAt: now,
      updatedAt: now
    };
    this.workoutPlans.set(id, workoutPlan);
    
    // Find the coach profile for coach name
    const coachProfile = this.coachProfiles.get(workoutPlan.coachId);
    if (coachProfile) {
      // Get user for the coach
      const user = this.users.get(coachProfile.userId);
      
      // Create a notification for the coach
      await this.createNotification({
        userId: coachProfile.userId,
        title: "Workout Plan Created",
        message: `You created a new workout plan: ${workoutPlan.title}`,
        type: "info"
      });
    }
    
    return workoutPlan;
  }
  
  async updateWorkoutPlan(id: number, planUpdate: Partial<WorkoutPlan>): Promise<WorkoutPlan | undefined> {
    const plan = this.workoutPlans.get(id);
    if (!plan) return undefined;
    
    const updatedPlan = {
      ...plan,
      ...planUpdate,
      updatedAt: new Date()
    };
    this.workoutPlans.set(id, updatedPlan);
    return updatedPlan;
  }
  
  async deleteWorkoutPlan(id: number): Promise<boolean> {
    // Delete all plan templates for this plan
    const planTemplatesToDelete = Array.from(this.planTemplates.values())
      .filter(pt => pt.planId === id);
    
    for (const pt of planTemplatesToDelete) {
      this.planTemplates.delete(pt.id);
    }
    
    // Delete all workout plan days for this plan
    const workoutPlanDaysToDelete = Array.from(this.workoutPlanDays.values())
      .filter(day => day.planId === id);
    
    for (const day of workoutPlanDaysToDelete) {
      this.workoutPlanDays.delete(day.id);
    }
    
    return this.workoutPlans.delete(id);
  }
  
  async getFeaturedWorkoutPlans(limit?: number): Promise<WorkoutPlan[]> {
    let plans = Array.from(this.workoutPlans.values())
      .filter(plan => plan.isFeatured && !plan.isSoldOut)
      .sort((a, b) => {
        const aRating = a.rating || 0;
        const bRating = b.rating || 0;
        if (bRating !== aRating) {
          return bRating - aRating;
        }
        return b.sales - a.sales;
      });
    
    if (limit) {
      plans = plans.slice(0, limit);
    }
    
    return plans;
  }
  
  async searchWorkoutPlans(query: string, category?: string, limit?: number): Promise<WorkoutPlan[]> {
    const queryLower = query.toLowerCase();
    
    let filteredPlans = Array.from(this.workoutPlans.values())
      .filter(plan => {
        if (plan.isSoldOut) return false;
        
        // Filter by category if provided
        if (category && plan.category !== category) return false;
        
        // Match by title, description, category, goals
        const titleMatch = plan.title.toLowerCase().includes(queryLower);
        const descMatch = plan.description.toLowerCase().includes(queryLower);
        const categoryMatch = plan.category.toLowerCase().includes(queryLower);
        const goalsMatch = plan.goals.toLowerCase().includes(queryLower);
        
        return titleMatch || descMatch || categoryMatch || goalsMatch;
      })
      .sort((a, b) => {
        // Sort featured first
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        
        // Then by rating
        const aRating = a.rating || 0;
        const bRating = b.rating || 0;
        if (bRating !== aRating) {
          return bRating - aRating;
        }
        
        // Then by sales
        return b.sales - a.sales;
      });
    
    if (limit) {
      filteredPlans = filteredPlans.slice(0, limit);
    }
    
    return filteredPlans;
  }
  
  async getPurchasedWorkoutPlans(userId: number): Promise<WorkoutPlan[]> {
    // Find all purchases for this user
    const userPurchases = Array.from(this.purchases.values())
      .filter(purchase => 
        purchase.userId === userId && 
        purchase.status === 'completed' && 
        purchase.planId !== null
      );
    
    // Get plan IDs from purchases
    const planIds = userPurchases.map(purchase => purchase.planId!);
    
    // Return all plans that have been purchased
    return Array.from(this.workoutPlans.values())
      .filter(plan => planIds.includes(plan.id))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  // Workout Plan Day operations
  async getWorkoutPlanDays(planId: number): Promise<WorkoutPlanDay[]> {
    return Array.from(this.workoutPlanDays.values())
      .filter(day => day.planId === planId)
      .sort((a, b) => a.dayNumber - b.dayNumber);
  }
  
  async getWorkoutPlanDay(id: number): Promise<WorkoutPlanDay | undefined> {
    return this.workoutPlanDays.get(id);
  }
  
  async createWorkoutPlanDay(insertWorkoutPlanDay: InsertWorkoutPlanDay): Promise<WorkoutPlanDay> {
    const id = this.workoutPlanDayCurrentId++;
    const workoutPlanDay: WorkoutPlanDay = {
      ...insertWorkoutPlanDay,
      id,
      createdAt: new Date(),
      title: insertWorkoutPlanDay.title,
      description: insertWorkoutPlanDay.description ?? null,
      templateId: insertWorkoutPlanDay.templateId ?? null
    };
    this.workoutPlanDays.set(id, workoutPlanDay);
    return workoutPlanDay;
  }
  
  async updateWorkoutPlanDay(id: number, workoutPlanDayUpdate: Partial<WorkoutPlanDay>): Promise<WorkoutPlanDay | undefined> {
    const workoutPlanDay = this.workoutPlanDays.get(id);
    if (!workoutPlanDay) return undefined;
    
    const updatedWorkoutPlanDay = {
      ...workoutPlanDay,
      ...workoutPlanDayUpdate
    };
    this.workoutPlanDays.set(id, updatedWorkoutPlanDay);
    return updatedWorkoutPlanDay;
  }
  
  async deleteWorkoutPlanDay(id: number): Promise<boolean> {
    return this.workoutPlanDays.delete(id);
  }
  
  // Plan Template operations
  async getPlanTemplates(planId: number): Promise<PlanTemplate[]> {
    return Array.from(this.planTemplates.values())
      .filter(pt => pt.planId === planId)
      .sort((a, b) => {
        // Sort by week number, then day number, then order
        if (a.weekNumber !== b.weekNumber) {
          return a.weekNumber - b.weekNumber;
        }
        if (a.dayNumber !== b.dayNumber) {
          return a.dayNumber - b.dayNumber;
        }
        return a.order - b.order;
      });
  }
  
  async createPlanTemplate(insertPlanTemplate: InsertPlanTemplate): Promise<PlanTemplate> {
    const id = this.planTemplateCurrentId++;
    const planTemplate: PlanTemplate = {
      ...insertPlanTemplate,
      id,
      notes: insertPlanTemplate.notes || null
    };
    this.planTemplates.set(id, planTemplate);
    return planTemplate;
  }
  
  async updatePlanTemplate(id: number, planTemplateUpdate: Partial<PlanTemplate>): Promise<PlanTemplate | undefined> {
    const planTemplate = this.planTemplates.get(id);
    if (!planTemplate) return undefined;
    
    const updatedPlanTemplate = { ...planTemplate, ...planTemplateUpdate };
    this.planTemplates.set(id, updatedPlanTemplate);
    return updatedPlanTemplate;
  }
  
  async deletePlanTemplate(id: number): Promise<boolean> {
    return this.planTemplates.delete(id);
  }
  
  // Coaching Service operations
  async getCoachingServices(coachId: number): Promise<CoachingService[]> {
    return Array.from(this.coachingServices.values())
      .filter(service => service.coachId === coachId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async getCoachingService(id: number): Promise<CoachingService | undefined> {
    return this.coachingServices.get(id);
  }
  
  async createCoachingService(insertCoachingService: InsertCoachingService): Promise<CoachingService> {
    const id = this.coachingServiceCurrentId++;
    const now = new Date();
    const coachingService: CoachingService = {
      ...insertCoachingService,
      id,
      isAvailable: insertCoachingService.isAvailable ?? true,
      createdAt: now,
      updatedAt: now
    };
    this.coachingServices.set(id, coachingService);
    return coachingService;
  }
  
  async updateCoachingService(id: number, serviceUpdate: Partial<CoachingService>): Promise<CoachingService | undefined> {
    const service = this.coachingServices.get(id);
    if (!service) return undefined;
    
    const updatedService = {
      ...service,
      ...serviceUpdate,
      updatedAt: new Date()
    };
    this.coachingServices.set(id, updatedService);
    return updatedService;
  }
  
  async deleteCoachingService(id: number): Promise<boolean> {
    return this.coachingServices.delete(id);
  }
  
  // Purchase operations
  async getPurchases(userId: number): Promise<Purchase[]> {
    return Array.from(this.purchases.values())
      .filter(purchase => purchase.userId === userId)
      .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
  }
  
  async createPurchase(insertPurchase: InsertPurchase): Promise<Purchase> {
    const id = this.purchaseCurrentId++;
    const purchase: Purchase = {
      ...insertPurchase,
      id,
      purchaseDate: new Date()
    };
    this.purchases.set(id, purchase);
    
    // If it's a plan purchase, update the plan's sales counter
    if (purchase.planId) {
      const plan = this.workoutPlans.get(purchase.planId);
      if (plan) {
        const updatedPlan = {
          ...plan,
          sales: plan.sales + 1
        };
        this.workoutPlans.set(plan.id, updatedPlan);
      }
    }
    
    // Create a notification for the purchase
    await this.createNotification({
      userId: purchase.userId,
      title: "Purchase Completed",
      message: `Your purchase has been completed. Thank you for your order!`,
      type: "success",
      link: "/profile"
    });
    
    return purchase;
  }
  
  async getPurchase(id: number): Promise<Purchase | undefined> {
    return this.purchases.get(id);
  }
  
  async updatePurchaseStatus(id: number, status: string): Promise<Purchase | undefined> {
    const purchase = this.purchases.get(id);
    if (!purchase) return undefined;
    
    const updatedPurchase = { ...purchase, status };
    this.purchases.set(id, updatedPurchase);
    
    // Notify user of status change
    await this.createNotification({
      userId: purchase.userId,
      title: "Purchase Status Updated",
      message: `Your purchase status has been updated to: ${status}`,
      type: "info",
      link: "/profile"
    });
    
    return updatedPurchase;
  }
  
  // Review operations
  async getReviews(coachId?: number, planId?: number): Promise<Review[]> {
    let reviews = Array.from(this.reviews.values());
    
    if (coachId) {
      reviews = reviews.filter(review => review.coachId === coachId);
    }
    
    if (planId) {
      reviews = reviews.filter(review => review.planId === planId);
    }
    
    return reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async createReview(insertReview: InsertReview): Promise<Review> {
    const id = this.reviewCurrentId++;
    const now = new Date();
    const review: Review = {
      ...insertReview,
      id,
      review: insertReview.review || null,
      createdAt: now,
      updatedAt: now
    };
    this.reviews.set(id, review);
    
    // Update the rating on the coach or plan
    if (review.coachId) {
      await this.updateCoachRating(review.coachId);
      
      // Notify the coach about the review
      const coachProfile = this.coachProfiles.get(review.coachId);
      if (coachProfile) {
        await this.createNotification({
          userId: coachProfile.userId,
          title: "New Review Received",
          message: `You've received a new review with a rating of ${review.rating} stars!`,
          type: "info"
        });
      }
    }
    
    if (review.planId) {
      await this.updatePlanRating(review.planId);
      
      // Notify the plan owner about the review
      const plan = this.workoutPlans.get(review.planId);
      if (plan) {
        const coachProfile = this.coachProfiles.get(plan.coachId);
        if (coachProfile) {
          await this.createNotification({
            userId: coachProfile.userId,
            title: "New Plan Review",
            message: `Your plan "${plan.title}" has received a new review with ${review.rating} stars!`,
            type: "info"
          });
        }
      }
    }
    
    return review;
  }
  
  async updateReview(id: number, reviewContent: string, rating: number): Promise<Review | undefined> {
    const review = this.reviews.get(id);
    if (!review) return undefined;
    
    const updatedReview = {
      ...review,
      review: reviewContent,
      rating,
      updatedAt: new Date()
    };
    this.reviews.set(id, updatedReview);
    
    // Update ratings
    if (review.coachId) {
      await this.updateCoachRating(review.coachId);
    }
    
    if (review.planId) {
      await this.updatePlanRating(review.planId);
    }
    
    return updatedReview;
  }
  
  async deleteReview(id: number): Promise<boolean> {
    const review = this.reviews.get(id);
    if (!review) return false;
    
    const deleted = this.reviews.delete(id);
    
    // Update ratings after deletion
    if (deleted) {
      if (review.coachId) {
        await this.updateCoachRating(review.coachId);
      }
      
      if (review.planId) {
        await this.updatePlanRating(review.planId);
      }
    }
    
    return deleted;
  }
  
  async getAverageRating(coachId?: number, planId?: number): Promise<number> {
    if (!coachId && !planId) return 0;
    
    let reviews = Array.from(this.reviews.values());
    
    if (coachId) {
      reviews = reviews.filter(review => review.coachId === coachId);
    }
    
    if (planId) {
      reviews = reviews.filter(review => review.planId === planId);
    }
    
    if (reviews.length === 0) return 0;
    
    const sum = reviews.reduce((total, review) => total + review.rating, 0);
    return sum / reviews.length;
  }
  
  // Helper methods for rating updates
  private async updateCoachRating(coachId: number): Promise<void> {
    const coachProfile = this.coachProfiles.get(coachId);
    if (!coachProfile) return;
    
    const reviews = Array.from(this.reviews.values())
      .filter(review => review.coachId === coachId);
    
    if (reviews.length === 0) {
      this.coachProfiles.set(coachId, {
        ...coachProfile,
        rating: null,
        ratingsCount: 0
      });
      return;
    }
    
    const sum = reviews.reduce((total, review) => total + review.rating, 0);
    const average = sum / reviews.length;
    
    this.coachProfiles.set(coachId, {
      ...coachProfile,
      rating: average,
      ratingsCount: reviews.length
    });
  }
  
  private async updatePlanRating(planId: number): Promise<void> {
    const plan = this.workoutPlans.get(planId);
    if (!plan) return;
    
    const reviews = Array.from(this.reviews.values())
      .filter(review => review.planId === planId);
    
    if (reviews.length === 0) {
      this.workoutPlans.set(planId, {
        ...plan,
        rating: null,
        ratingsCount: 0
      });
      return;
    }
    
    const sum = reviews.reduce((total, review) => total + review.rating, 0);
    const average = sum / reviews.length;
    
    this.workoutPlans.set(planId, {
      ...plan,
      rating: average,
      ratingsCount: reviews.length
    });
  }
  
  // User Suggestions operations
  async getUserSuggestions(): Promise<UserSuggestion[]> {
    return Array.from(this.userSuggestions.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async getUserSuggestion(id: number): Promise<UserSuggestion | undefined> {
    return this.userSuggestions.get(id);
  }
  
  async createUserSuggestion(insertSuggestion: InsertUserSuggestion): Promise<UserSuggestion> {
    const id = this.userSuggestionCurrentId++;
    const now = new Date();
    
    const suggestion: UserSuggestion = {
      ...insertSuggestion,
      id,
      status: insertSuggestion.status || 'new',
      adminNotes: insertSuggestion.adminNotes || null,
      createdAt: now,
      updatedAt: now
    };
    
    this.userSuggestions.set(id, suggestion);
    return suggestion;
  }
  
  async updateUserSuggestionStatus(id: number, status: string, adminNotes?: string): Promise<UserSuggestion | undefined> {
    const suggestion = this.userSuggestions.get(id);
    if (!suggestion) return undefined;
    
    const updatedSuggestion = {
      ...suggestion,
      status,
      adminNotes: adminNotes !== undefined ? adminNotes : suggestion.adminNotes,
      updatedAt: new Date()
    };
    
    this.userSuggestions.set(id, updatedSuggestion);
    return updatedSuggestion;
  }
  
  async deleteUserSuggestion(id: number): Promise<boolean> {
    return this.userSuggestions.delete(id);
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
  
  // Workout Plan operations
  async getWorkoutPlans(coachId?: number, publishedOnly: boolean = false): Promise<WorkoutPlan[]> {
    try {
      let query = db.select().from(workoutPlans);
      
      if (coachId) {
        query = query.where(eq(workoutPlans.coachId, coachId));
      }
      
      const plans = await query.orderBy(desc(workoutPlans.createdAt));
      
      // Apply publishedOnly filter if needed
      if (publishedOnly && (!coachId || coachId === undefined)) {
        return plans.filter(plan => plan.isPublished === true);
      }
      
      return plans;
    } catch (error) {
      console.error("Error getting workout plans:", error);
      return [];
    }
  }
  
  async getWorkoutPlan(id: number): Promise<WorkoutPlan | undefined> {
    try {
      const result = await db
        .select()
        .from(workoutPlans)
        .where(eq(workoutPlans.id, id));
      return result[0];
    } catch (error) {
      console.error("Error getting workout plan:", error);
      return undefined;
    }
  }
  
  async checkWorkoutPlanExists(id: number): Promise<boolean> {
    try {
      const count = await db
        .select({ count: count() })
        .from(workoutPlans)
        .where(eq(workoutPlans.id, id));
      
      console.log(`Checking if workout plan with ID ${id} exists:`, count[0]?.count > 0);
      return count[0]?.count > 0;
    } catch (error) {
      console.error("Error checking if workout plan exists:", error);
      return false;
    }
  }
  
  async createWorkoutPlan(plan: InsertWorkoutPlan): Promise<WorkoutPlan> {
    try {
      const result = await db.insert(workoutPlans).values(plan).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating workout plan:", error);
      throw error;
    }
  }
  
  async updateWorkoutPlan(id: number, planUpdate: Partial<WorkoutPlan>): Promise<WorkoutPlan | undefined> {
    try {
      console.log("Updating workout plan with ID:", id);
      console.log("Update data:", planUpdate);
      
      // First check if the plan exists
      const existingPlan = await this.getWorkoutPlan(id);
      console.log("Existing plan:", existingPlan);
      
      if (!existingPlan) {
        console.log("Plan not found with ID:", id);
        return undefined;
      }
      
      const result = await db
        .update(workoutPlans)
        .set(planUpdate)
        .where(eq(workoutPlans.id, id))
        .returning();
      
      console.log("Update result:", result);
      return result[0];
    } catch (error) {
      console.error("Error updating workout plan:", error);
      return undefined;
    }
  }
  
  async deleteWorkoutPlan(id: number): Promise<boolean> {
    try {
      // Delete related entities first
      await db.delete(workoutPlanDays).where(eq(workoutPlanDays.planId, id));
      await db.delete(planTemplates).where(eq(planTemplates.planId, id));
      
      // Delete the plan
      const result = await db
        .delete(workoutPlans)
        .where(eq(workoutPlans.id, id))
        .returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting workout plan:", error);
      return false;
    }
  }
  
  // Workout Plan Day operations
  async getWorkoutPlanDays(planId: number): Promise<WorkoutPlanDay[]> {
    try {
      return await db
        .select()
        .from(workoutPlanDays)
        .where(eq(workoutPlanDays.planId, planId))
        .orderBy(workoutPlanDays.dayNumber);
    } catch (error) {
      console.error("Error getting workout plan days:", error);
      return [];
    }
  }
  
  async getWorkoutPlanDay(id: number): Promise<WorkoutPlanDay | undefined> {
    try {
      const result = await db
        .select()
        .from(workoutPlanDays)
        .where(eq(workoutPlanDays.id, id));
      return result[0];
    } catch (error) {
      console.error("Error getting workout plan day:", error);
      return undefined;
    }
  }
  
  async createWorkoutPlanDay(day: InsertWorkoutPlanDay): Promise<WorkoutPlanDay> {
    try {
      const result = await db.insert(workoutPlanDays).values(day).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating workout plan day:", error);
      throw error;
    }
  }
  
  async updateWorkoutPlanDay(id: number, dayUpdate: Partial<WorkoutPlanDay>): Promise<WorkoutPlanDay | undefined> {
    try {
      const result = await db
        .update(workoutPlanDays)
        .set(dayUpdate)
        .where(eq(workoutPlanDays.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating workout plan day:", error);
      return undefined;
    }
  }
  
  async deleteWorkoutPlanDay(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(workoutPlanDays)
        .where(eq(workoutPlanDays.id, id))
        .returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting workout plan day:", error);
      return false;
    }
  }
  
  // Coach Profile operations
  async getCoachProfileById(id: number): Promise<CoachProfile | undefined> {
    try {
      const result = await db
        .select()
        .from(coachProfiles)
        .where(eq(coachProfiles.id, id));
      return result[0];
    } catch (error) {
      console.error("Error getting coach profile by id:", error);
      return undefined;
    }
  }
  
  async getCoachProfile(userId: number): Promise<CoachProfile | undefined> {
    try {
      const result = await db
        .select()
        .from(coachProfiles)
        .where(eq(coachProfiles.userId, userId));
      return result[0];
    } catch (error) {
      console.error("Error getting coach profile:", error);
      return undefined;
    }
  }
  
  async createCoachProfile(profile: InsertCoachProfile): Promise<CoachProfile> {
    try {
      const result = await db.insert(coachProfiles).values(profile).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating coach profile:", error);
      throw error;
    }
  }
  
  async updateCoachProfile(id: number, profileUpdate: Partial<CoachProfile>): Promise<CoachProfile | undefined> {
    try {
      const result = await db
        .update(coachProfiles)
        .set(profileUpdate)
        .where(eq(coachProfiles.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating coach profile:", error);
      return undefined;
    }
  }
  
  // Coaching Service operations
  async getCoachingServices(coachId: number): Promise<CoachingService[]> {
    try {
      return await db
        .select()
        .from(coachingServices)
        .where(eq(coachingServices.coachId, coachId))
        .orderBy(desc(coachingServices.createdAt));
    } catch (error) {
      console.error("Error getting coaching services:", error);
      return [];
    }
  }
  
  async getCoachingService(id: number): Promise<CoachingService | undefined> {
    try {
      const result = await db
        .select()
        .from(coachingServices)
        .where(eq(coachingServices.id, id));
      return result[0];
    } catch (error) {
      console.error("Error getting coaching service:", error);
      return undefined;
    }
  }
  
  async createCoachingService(service: InsertCoachingService): Promise<CoachingService> {
    try {
      const result = await db.insert(coachingServices).values(service).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating coaching service:", error);
      throw error;
    }
  }
  
  async updateCoachingService(id: number, serviceUpdate: Partial<CoachingService>): Promise<CoachingService | undefined> {
    try {
      const result = await db
        .update(coachingServices)
        .set(serviceUpdate)
        .where(eq(coachingServices.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating coaching service:", error);
      return undefined;
    }
  }
  
  async deleteCoachingService(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(coachingServices)
        .where(eq(coachingServices.id, id))
        .returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting coaching service:", error);
      return false;
    }
  }
  
  // Plan Template operations
  async getPlanTemplates(planId: number): Promise<PlanTemplate[]> {
    try {
      return await db
        .select()
        .from(planTemplates)
        .where(eq(planTemplates.planId, planId));
    } catch (error) {
      console.error("Error getting plan templates:", error);
      return [];
    }
  }
  
  async createPlanTemplate(template: InsertPlanTemplate): Promise<PlanTemplate> {
    try {
      const result = await db.insert(planTemplates).values(template).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating plan template:", error);
      throw error;
    }
  }
  
  async updatePlanTemplate(id: number, templateUpdate: Partial<PlanTemplate>): Promise<PlanTemplate | undefined> {
    try {
      const result = await db
        .update(planTemplates)
        .set(templateUpdate)
        .where(eq(planTemplates.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating plan template:", error);
      return undefined;
    }
  }
  
  async deletePlanTemplate(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(planTemplates)
        .where(eq(planTemplates.id, id))
        .returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting plan template:", error);
      return false;
    }
  }
  
  // Purchase operations
  async getPurchases(userId: number): Promise<Purchase[]> {
    try {
      return await db
        .select()
        .from(purchases)
        .where(eq(purchases.userId, userId))
        .orderBy(desc(purchases.purchaseDate));
    } catch (error) {
      console.error("Error getting purchases:", error);
      return [];
    }
  }
  
  async createPurchase(insertPurchase: InsertPurchase): Promise<Purchase> {
    try {
      const result = await db.insert(purchases).values(insertPurchase).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating purchase:", error);
      throw error;
    }
  }
  
  async getPurchase(id: number): Promise<Purchase | undefined> {
    try {
      const result = await db
        .select()
        .from(purchases)
        .where(eq(purchases.id, id));
      return result[0];
    } catch (error) {
      console.error("Error getting purchase:", error);
      return undefined;
    }
  }
  
  async updatePurchaseStatus(id: number, status: string): Promise<Purchase | undefined> {
    try {
      const result = await db
        .update(purchases)
        .set({ status })
        .where(eq(purchases.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating purchase status:", error);
      return undefined;
    }
  }
  
  // Review operations
  async getReviews(coachId?: number, planId?: number): Promise<Review[]> {
    try {
      let queryBuilder = db.select().from(reviews);
      
      if (coachId) {
        queryBuilder = queryBuilder.where(eq(reviews.coachId, coachId));
      }
      
      if (planId) {
        queryBuilder = queryBuilder.where(eq(reviews.planId, planId));
      }
      
      return await queryBuilder.orderBy(desc(reviews.createdAt));
    } catch (error) {
      console.error("Error getting reviews:", error);
      return [];
    }
  }
  
  async createReview(review: InsertReview): Promise<Review> {
    try {
      const result = await db.insert(reviews).values(review).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating review:", error);
      throw error;
    }
  }
  
  async updateReview(id: number, reviewContent: string, rating: number): Promise<Review | undefined> {
    try {
      const result = await db
        .update(reviews)
        .set({ 
          review: reviewContent,
          rating,
          updatedAt: new Date()
        })
        .where(eq(reviews.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating review:", error);
      return undefined;
    }
  }
  
  async deleteReview(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(reviews)
        .where(eq(reviews.id, id))
        .returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting review:", error);
      return false;
    }
  }
  
  // Media file operations
  async getMediaFiles(workoutId: number): Promise<MediaFile[]> {
    try {
      return await db
        .select()
        .from(mediaFiles)
        .where(eq(mediaFiles.workoutId, workoutId))
        .orderBy(desc(mediaFiles.createdAt));
    } catch (error) {
      console.error("Error getting media files:", error);
      return [];
    }
  }
  
  async getMediaFilesByExercise(workoutExerciseId: number): Promise<MediaFile[]> {
    try {
      return await db
        .select()
        .from(mediaFiles)
        .where(eq(mediaFiles.workoutExerciseId, workoutExerciseId))
        .orderBy(desc(mediaFiles.createdAt));
    } catch (error) {
      console.error("Error getting media files by exercise:", error);
      return [];
    }
  }
  
  async createMediaFile(mediaFile: InsertMediaFile): Promise<MediaFile> {
    try {
      const result = await db.insert(mediaFiles).values(mediaFile).returning();
      
      // Create notification
      await this.createNotification({
        userId: mediaFile.userId,
        title: "Media Upload",
        message: `You've uploaded a new ${mediaFile.fileType} to your workout`,
        type: "info"
      });
      
      return result[0];
    } catch (error) {
      console.error("Error creating media file:", error);
      throw error;
    }
  }
  
  async deleteMediaFile(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(mediaFiles)
        .where(eq(mediaFiles.id, id))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting media file:", error);
      return false;
    }
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
  
  async updateUserCoachStatus(id: number, isCoach: boolean): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ 
        isCoach,
        coachRegistrationDate: isCoach ? new Date() : null
      })
      .where(eq(users.id, id))
      .returning();
      
    return result[0];
  }
  
  async updateUserStripeInfo(id: number, stripeInfo: { customerId?: string, subscriptionId?: string }): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({
        stripeCustomerId: stripeInfo.customerId ?? null,
        stripeSubscriptionId: stripeInfo.subscriptionId ?? null
      })
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
    
    // Get comments for this workout
    const commentsResult = await db
      .select()
      .from(comments)
      .where(eq(comments.workoutId, id))
      .orderBy(asc(comments.createdAt));
    
    // Get likes for this workout
    const likesResult = await db
      .select()
      .from(likes)
      .where(eq(likes.workoutId, id));
    
    // Check if the current user has liked this workout
    const isLikedByCurrentUser = workout.userId ? 
      await this.isLikedByUser(id, workout.userId) : false;
    
    return {
      ...workout,
      exercises: exercisesWithDetails,
      totalSets,
      totalExercises: exercisesWithDetails.length,
      volume,
      comments: commentsResult,
      likes: likesResult,
      likesCount: likesResult.length,
      commentsCount: commentsResult.length,
      isLikedByCurrentUser
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
  
  async getTemplateExercises(templateId: number): Promise<TemplateExercise[]> {
    try {
      // Get all template exercises for the template
      const templateExercisesResult = await db
        .select()
        .from(templateExercises)
        .where(eq(templateExercises.templateId, templateId))
        .orderBy(templateExercises.order);
        
      // For each template exercise, fetch the exercise details
      return await Promise.all(
        templateExercisesResult.map(async (te) => {
          const exerciseResult = await db
            .select()
            .from(exercises)
            .where(eq(exercises.id, te.exerciseId));
            
          return {
            ...te,
            exercise: exerciseResult[0]
          };
        })
      );
    } catch (error) {
      console.error('Error getting template exercises:', error);
      return [];
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
      
      const milestonePercentages = [25, 50, 75];
      for (const percentage of milestonePercentages) {
        if (progressPercentage >= percentage && previousPercentage < percentage) {
          await this.createNotification({
            userId: goal.userId,
            title: `${percentage}% Progress! 💪`,
            message: `You've reached ${percentage}% of your goal: ${goal.title}`,
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
  
  // Comment operations
  async getComments(workoutId: number): Promise<Comment[]> {
    try {
      return await db
        .select()
        .from(comments)
        .where(eq(comments.workoutId, workoutId))
        .orderBy(asc(comments.createdAt));
    } catch (error) {
      console.error("Error getting comments:", error);
      return [];
    }
  }
  
  async createComment(comment: InsertComment): Promise<Comment> {
    try {
      // Ensure workoutId is not undefined
      if (!comment.workoutId) {
        throw new Error("workoutId is required for comment creation");
      }
      
      const result = await db.insert(comments).values(comment).returning();
      const newComment = result[0];
      
      // Create a notification for the workout owner
      const workoutResult = await db
        .select()
        .from(workouts)
        .where(eq(workouts.id, comment.workoutId));
      
      if (workoutResult.length > 0) {
        const workout = workoutResult[0];
        if (workout.userId !== comment.userId) {
          await this.createNotification({
            userId: workout.userId,
            title: "New Comment",
            message: `Someone commented on your workout: ${workout.name}`,
            type: "social",
            link: `/workouts/${workout.id}`
          });
        }
      }
      
      return newComment;
    } catch (error) {
      console.error("Error creating comment:", error);
      throw error;
    }
  }
  
  async updateComment(id: number, content: string): Promise<Comment | undefined> {
    try {
      const result = await db
        .update(comments)
        .set({ 
          content,
          updatedAt: new Date()
        })
        .where(eq(comments.id, id))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("Error updating comment:", error);
      return undefined;
    }
  }
  
  async deleteComment(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(comments)
        .where(eq(comments.id, id))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting comment:", error);
      return false;
    }
  }
  
  // Like operations
  async getLikes(workoutId: number): Promise<Like[]> {
    try {
      return await db
        .select()
        .from(likes)
        .where(eq(likes.workoutId, workoutId));
    } catch (error) {
      console.error("Error getting likes:", error);
      return [];
    }
  }
  
  async getLikeCount(workoutId: number): Promise<number> {
    try {
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(likes)
        .where(eq(likes.workoutId, workoutId));
      
      return Number(result[0]?.count || 0);
    } catch (error) {
      console.error("Error getting like count:", error);
      return 0;
    }
  }
  
  async isLikedByUser(workoutId: number, userId: number): Promise<boolean> {
    try {
      const result = await db
        .select()
        .from(likes)
        .where(
          and(
            eq(likes.workoutId, workoutId),
            eq(likes.userId, userId)
          )
        );
      
      return result.length > 0;
    } catch (error) {
      console.error("Error checking if liked by user:", error);
      return false;
    }
  }
  
  async toggleLike(workoutId: number, userId: number): Promise<boolean> {
    try {
      const isLiked = await this.isLikedByUser(workoutId, userId);
      
      if (isLiked) {
        return this.deleteLike(workoutId, userId);
      } else {
        await this.createLike({ workoutId, userId });
        return true;
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      return false;
    }
  }
  
  async createLike(like: InsertLike): Promise<Like> {
    try {
      // Ensure workoutId is not undefined
      if (!like.workoutId) {
        throw new Error("workoutId is required for like creation");
      }
      
      const result = await db.insert(likes).values(like).returning();
      const newLike = result[0];
      
      // Create a notification for the workout owner
      const workoutResult = await db
        .select()
        .from(workouts)
        .where(eq(workouts.id, like.workoutId));
      
      if (workoutResult.length > 0) {
        const workout = workoutResult[0];
        if (workout.userId !== like.userId) {
          await this.createNotification({
            userId: workout.userId,
            title: "New Like",
            message: `Someone liked your workout: ${workout.name}`,
            type: "social",
            link: `/workouts/${workout.id}`
          });
        }
      }
      
      return newLike;
    } catch (error) {
      console.error("Error creating like:", error);
      throw error;
    }
  }
  
  async deleteLike(workoutId: number, userId: number): Promise<boolean> {
    try {
      const result = await db
        .delete(likes)
        .where(
          and(
            eq(likes.workoutId, workoutId),
            eq(likes.userId, userId)
          )
        )
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting like:", error);
      return false;
    }
  }

  // Coach methods
  async getFeaturedCoaches(limit?: number): Promise<CoachProfile[]> {
    try {
      const query = db
        .select()
        .from(coachProfiles)
        .where(
          and(
            eq(coachProfiles.isAvailableForHire, true),
            eq(coachProfiles.isVerified, true)
          )
        )
        .orderBy(desc(coachProfiles.rating))
        .limit(limit || 10);
      
      return await query;
    } catch (error) {
      console.error("Error getting featured coaches:", error);
      return [];
    }
  }
  
  async searchCoaches(query: string, category?: string, limit?: number): Promise<CoachProfile[]> {
    try {
      // Fetch all coaches - in a real app, you would use full-text search
      let coaches = await db.select().from(coachProfiles);
      
      // Perform search filtering in application (since we don't have full FTS)
      coaches = coaches.filter(coach => {
        const titleMatch = coach.title.toLowerCase().includes(query.toLowerCase());
        const specialtiesMatch = coach.specialties.toLowerCase().includes(query.toLowerCase());
        const biographyMatch = coach.biography.toLowerCase().includes(query.toLowerCase());
        
        return titleMatch || specialtiesMatch || biographyMatch;
      });
      
      // Apply category filter if provided (matching against specialties)
      if (category) {
        coaches = coaches.filter(coach => 
          coach.specialties.toLowerCase().includes(category.toLowerCase())
        );
      }
      
      // Apply limit if provided
      if (limit && limit > 0) {
        coaches = coaches.slice(0, limit);
      }
      
      return coaches;
    } catch (error) {
      console.error("Error searching coaches:", error);
      return [];
    }
  }
  
  async listCoaches(limit?: number, offset = 0): Promise<CoachProfile[]> {
    try {
      const query = db
        .select()
        .from(coachProfiles)
        .orderBy(desc(coachProfiles.createdAt))
        .offset(offset)
        .limit(limit || 10);
      
      return await query;
    } catch (error) {
      console.error("Error listing coaches:", error);
      return [];
    }
  }
  
  // Workout Plan methods
  async getFeaturedWorkoutPlans(limit?: number): Promise<WorkoutPlan[]> {
    try {
      const query = db
        .select()
        .from(workoutPlans)
        .where(
          and(
            eq(workoutPlans.isFeatured, true),
            eq(workoutPlans.isPublished, true)
          )
        )
        .orderBy(desc(workoutPlans.rating))
        .limit(limit || 10);
      
      return await query;
    } catch (error) {
      console.error("Error getting featured workout plans:", error);
      return [];
    }
  }
  
  async searchWorkoutPlans(query: string, category?: string, limit?: number): Promise<WorkoutPlan[]> {
    try {
      // In a real app, use full-text search
      let plans = await db
        .select()
        .from(workoutPlans)
        .where(eq(workoutPlans.isPublished, true));
      
      // Filter by search query
      plans = plans.filter(plan => {
        const titleMatch = plan.title.toLowerCase().includes(query.toLowerCase());
        const descriptionMatch = plan.description.toLowerCase().includes(query.toLowerCase());
        const goalsMatch = plan.goals.toLowerCase().includes(query.toLowerCase());
        
        return titleMatch || descriptionMatch || goalsMatch;
      });
      
      // Apply category filter if provided
      if (category) {
        plans = plans.filter(plan => 
          plan.category.toLowerCase() === category.toLowerCase()
        );
      }
      
      // Apply limit if provided
      if (limit && limit > 0) {
        plans = plans.slice(0, limit);
      }
      
      return plans;
    } catch (error) {
      console.error("Error searching workout plans:", error);
      return [];
    }
  }
  
  async getPurchasedWorkoutPlans(userId: number): Promise<WorkoutPlan[]> {
    try {
      // Get all purchases by the user that have a plan
      const userPurchases = await db
        .select()
        .from(purchases)
        .where(
          and(
            eq(purchases.userId, userId),
            eq(purchases.status, "completed"),
            isNotNull(purchases.planId)
          )
        );
      
      // Extract plan IDs from purchases
      const planIds = userPurchases
        .map(purchase => purchase.planId)
        .filter((planId): planId is number => planId !== null);
      
      if (planIds.length === 0) {
        return [];
      }
      
      // Get all the purchased plans
      const purchasedPlans = await db
        .select()
        .from(workoutPlans)
        .where(inArray(workoutPlans.id, planIds));
      
      return purchasedPlans;
    } catch (error) {
      console.error("Error getting purchased workout plans:", error);
      return [];
    }
  }
  
  // Review methods
  async getAverageRating(coachId?: number, planId?: number): Promise<number> {
    try {
      if (!coachId && !planId) {
        throw new Error("Either coachId or planId must be provided");
      }
      
      // Raw SQL for average computation to avoid TypeScript issues
      let whereClause = "";
      let params: any[] = [];
      
      if (coachId) {
        whereClause = "WHERE coach_id = $1";
        params.push(coachId);
      } else if (planId) {
        whereClause = "WHERE plan_id = $1";
        params.push(planId);
      }
      
      const result = await db.execute(
        sql`SELECT AVG(rating) as avg_rating FROM reviews ${sql.raw(whereClause)}`,
        params
      );
      
      if (result && result.rows && result.rows.length > 0) {
        const avgRating = result.rows[0].avg_rating;
        return avgRating ? Number(avgRating) : 0;
      }
      
      return 0;
    } catch (error) {
      console.error(`Error calculating average rating: ${error}`);
      return 0;
    }
  }
  
  // User Suggestions operations
  async getUserSuggestions(): Promise<UserSuggestion[]> {
    try {
      return await db
        .select()
        .from(userSuggestions)
        .orderBy(desc(userSuggestions.createdAt));
    } catch (error) {
      console.error("Error getting user suggestions:", error);
      return [];
    }
  }

  async getUserSuggestion(id: number): Promise<UserSuggestion | undefined> {
    try {
      const result = await db
        .select()
        .from(userSuggestions)
        .where(eq(userSuggestions.id, id));
      
      return result[0];
    } catch (error) {
      console.error("Error getting user suggestion:", error);
      return undefined;
    }
  }

  async createUserSuggestion(suggestion: InsertUserSuggestion): Promise<UserSuggestion> {
    try {
      const result = await db
        .insert(userSuggestions)
        .values({
          ...suggestion,
          status: suggestion.status || "new",
          adminNotes: suggestion.adminNotes || null,
        })
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("Error creating user suggestion:", error);
      throw error;
    }
  }

  async updateUserSuggestionStatus(id: number, status: string, adminNotes?: string): Promise<UserSuggestion | undefined> {
    try {
      const updateData: { status: string; adminNotes?: string; updatedAt: Date } = {
        status,
        updatedAt: new Date()
      };
      
      if (adminNotes !== undefined) {
        updateData.adminNotes = adminNotes;
      }
      
      const result = await db
        .update(userSuggestions)
        .set(updateData)
        .where(eq(userSuggestions.id, id))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("Error updating user suggestion status:", error);
      return undefined;
    }
  }

  async deleteUserSuggestion(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(userSuggestions)
        .where(eq(userSuggestions.id, id))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting user suggestion:", error);
      return false;
    }
  }
}

// Use in-memory storage during development, database storage in production
export const storage = process.env.DATABASE_URL 
  ? new DbStorage() 
  : new MemStorage();

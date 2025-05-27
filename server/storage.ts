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
  follows, type Follow, type InsertFollow,
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
import { eq, desc, and, asc, sql, or, isNull, isNotNull, inArray, like, notLike, count } from 'drizzle-orm';
import { db } from './db';

// Import feedback schema type from shared/schema
import { feedbacks, type Feedback, type InsertFeedback } from "@shared/schema";

export interface IStorage {
  // User operations
  getAllUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  updateUserCoachStatus(id: number, isCoach: boolean): Promise<User | undefined>;
  updateUserStripeInfo(id: number, stripeInfo: { customerId?: string, subscriptionId?: string }): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Follow operations
  isFollowing(followerId: number, followedId: number): Promise<boolean>;
  getFollowing(userId: number): Promise<User[]>; 
  getFollowers(userId: number): Promise<User[]>;
  followUser(followerId: number, followedId: number): Promise<void>;
  unfollowUser(followerId: number, followedId: number): Promise<void>;
  
  // Exercise operations
  getExercises(): Promise<Exercise[]>;
  getExercisesByCategory(category: string): Promise<Exercise[]>;
  getExercise(id: number): Promise<Exercise | undefined>;
  getExerciseById(id: number): Promise<Exercise | undefined>;
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  updateExercise(id: number, exercise: Partial<Exercise>): Promise<Exercise | undefined>;
  deleteExercise(id: number): Promise<boolean>;
  
  // Workout operations
  getWorkouts(userId: number): Promise<Workout[]>;
  getWorkout(id: number): Promise<Workout | undefined>;
  getWorkoutWithDetails(id: number): Promise<WorkoutWithDetails | undefined>;
  getRecentWorkouts(userId: number, limit: number): Promise<WorkoutWithDetails[]>;
  getCommunityWorkouts(limit: number): Promise<WorkoutWithDetails[]>;
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
  getTemplate(id: number): Promise<Template | undefined>;
  getTemplates(userId: number): Promise<Template[]>;
  getTemplateWithExercises(id: number): Promise<TemplateWithExercises | undefined>;
  createTemplate(template: InsertTemplate): Promise<Template>;
  updateTemplate(id: number, template: Partial<Template>): Promise<Template | undefined>;
  deleteTemplate(id: number): Promise<boolean>;
  
  // Template Exercise operations
  getTemplateExercise(id: number): Promise<TemplateExercise | undefined>;
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
  
  // Additional operations related to coaches and plans
  
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
  getAllWorkoutPlans(): Promise<WorkoutPlan[]>;
  createWorkoutPlan(plan: InsertWorkoutPlan): Promise<WorkoutPlan>;
  updateWorkoutPlan(id: number, plan: Partial<WorkoutPlan>): Promise<WorkoutPlan | undefined>;
  deleteWorkoutPlan(id: number): Promise<boolean>;
  getFeaturedWorkoutPlans(limit?: number): Promise<WorkoutPlan[]>;
  searchWorkoutPlans(query: string, category?: string, limit?: number): Promise<WorkoutPlan[]>;
  getPurchasedWorkoutPlans(userId: number): Promise<WorkoutPlan[]>;
  forkWorkoutPlan(planId: number, clientId: number, userId: number): Promise<WorkoutPlan | undefined>;
  getClientForkedPlans(coachId: number): Promise<WorkoutPlan[]>;
  getClientForkedPlan(planId: number): Promise<WorkoutPlan | undefined>;
  
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

  // Workout Plan Fork operations
  forkWorkoutPlan(originalPlanId: number, clientId: number, userId: number): Promise<WorkoutPlan | undefined>;
  getClientForkedPlans(coachId: number): Promise<WorkoutPlan[]>;
  getClientForkedPlan(planId: number): Promise<WorkoutPlan | undefined>;
  
  // Feedback operations
  saveFeedback(feedback: Feedback): Promise<Feedback>;
  getFeedback(): Promise<Feedback[]>;
  deleteFeedback(id: number): Promise<boolean>;
  
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
  private follows: Map<number, Follow>;
  private coachProfiles: Map<number, CoachProfile>;
  private workoutPlans: Map<number, WorkoutPlan>;
  private workoutPlanDays: Map<number, WorkoutPlanDay>;
  private planTemplates: Map<number, PlanTemplate>;
  private coachingServices: Map<number, CoachingService>;
  private purchases: Map<number, Purchase>;
  private reviews: Map<number, Review>;
  private userSuggestions: Map<number, UserSuggestion>;
  private feedbacks: Map<number, Feedback>;
  
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
  private followCurrentId: number;
  private coachProfileCurrentId: number;
  private workoutPlanCurrentId: number;
  private workoutPlanDayCurrentId: number;
  private planTemplateCurrentId: number;
  private coachingServiceCurrentId: number;
  private purchaseCurrentId: number;
  private reviewCurrentId: number;
  private userSuggestionCurrentId: number;
  private feedbackCurrentId: number;

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
    this.follows = new Map();
    this.coachProfiles = new Map();
    this.workoutPlans = new Map();
    this.workoutPlanDays = new Map();
    this.planTemplates = new Map();
    this.coachingServices = new Map();
    this.purchases = new Map();
    this.reviews = new Map();
    this.userSuggestions = new Map();
    this.feedbacks = new Map();
    
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
    this.followCurrentId = 1;
    this.coachProfileCurrentId = 1;
    this.workoutPlanCurrentId = 1;
    this.workoutPlanDayCurrentId = 1;
    this.planTemplateCurrentId = 1;
    this.coachingServiceCurrentId = 1;
    this.purchaseCurrentId = 1;
    this.reviewCurrentId = 1;
    this.userSuggestionCurrentId = 1;
    this.feedbackCurrentId = 1;
    
    // Seed initial users
    this.seedDefaultUsers();
    
    // Add some default exercises
    this.seedDefaultExercises();
  }
  
  // This method seeds the default users
  private seedDefaultUsers(): void {
    // Add Logan Lundgren (default user)
    const user1 = { 
      id: 1,
      username: "Logan Lundgren",
      password: "password",
      name: "Logan Lundgren",
      email: "logan@example.com",
      bio: "Fitness enthusiast and programmer",
      location: "Austin, TX",
      fitnessLevel: "Advanced",
      experienceYears: 5,
      goals: "Hit 405lb bench press",
      certifications: "ACE-CPT",
      socialMedia: JSON.stringify({
        instagram: "loganlundgren",
        twitter: "loganlundgren",
        facebook: "loganlundgren"
      }),
      isCoach: false,
      coachRegistrationDate: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null
    };
    
    // Add Jennifer Keller (coach)
    const user2 = {
      id: 2,
      username: "Jennifer Keller",
      password: "password",
      name: "Jennifer Keller",
      email: "jennifer@example.com",
      bio: "Marathon runner and nutrition coach",
      location: "Seattle, WA",
      fitnessLevel: "Expert",
      experienceYears: 8,
      goals: "Complete an ultramarathon",
      certifications: "NASM-CPT, NASM-CNC",
      socialMedia: null,
      isCoach: true,
      coachRegistrationDate: new Date(),
      stripeCustomerId: null,
      stripeSubscriptionId: null
    };
    
    this.users.set(1, user1);
    this.users.set(2, user2);
    
    console.log("Default users seeded:", this.users.size);
  }

  // User methods
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
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
  
  async deleteUser(id: number): Promise<boolean> {
    if (!this.users.has(id)) return false;
    
    // Delete the user account
    this.users.delete(id);
    
    // Delete associated data
    // This is a simplified version - in a real app, you'd need to cascade delete all related entities
    
    // Delete workouts
    for (const [workoutId, workout] of this.workouts.entries()) {
      if (workout.userId === id) {
        this.workouts.delete(workoutId);
      }
    }
    
    // Delete templates
    for (const [templateId, template] of this.templates.entries()) {
      if (template.userId === id) {
        this.templates.delete(templateId);
      }
    }
    
    // Delete goals
    for (const [goalId, goal] of this.goals.entries()) {
      if (goal.userId === id) {
        this.goals.delete(goalId);
      }
    }
    
    // Delete notifications
    for (const [notificationId, notification] of this.notifications.entries()) {
      if (notification.userId === id) {
        this.notifications.delete(notificationId);
      }
    }
    
    // Delete follows
    for (const [followId, follow] of this.follows.entries()) {
      if (follow.followerId === id || follow.followedId === id) {
        this.follows.delete(followId);
      }
    }
    
    return true;
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
  
  async getExerciseById(id: number): Promise<Exercise | undefined> {
    return this.exercises.get(id);
  }
  

  
  async createExercise(insertExercise: InsertExercise): Promise<Exercise> {
    const id = this.exerciseCurrentId++;
    const exercise: Exercise = { 
      ...insertExercise, 
      id,
      subcategory: insertExercise.subcategory ?? null,
      userId: insertExercise.userId ?? null,
      isCustom: insertExercise.isCustom ?? null,
      isHidden: insertExercise.isHidden ?? false
    };
    this.exercises.set(id, exercise);
    return exercise;
  }
  
  async updateExercise(id: number, exerciseUpdate: Partial<Exercise>): Promise<Exercise | undefined> {
    const exercise = this.exercises.get(id);
    
    if (!exercise) {
      return undefined;
    }
    
    const updatedExercise = {
      ...exercise,
      ...exerciseUpdate
    };
    
    this.exercises.set(id, updatedExercise);
    return updatedExercise;
  }
  
  async deleteExercise(id: number): Promise<boolean> {
    if (!this.exercises.has(id)) {
      return false;
    }
    return this.exercises.delete(id);
  }
  
  async deleteFeedback(id: number): Promise<boolean> {
    if (!this.feedbacks.has(id)) {
      return false;
    }
    return this.feedbacks.delete(id);
  }
  
  // Workout methods
  async getWorkouts(userId: number): Promise<Workout[]> {
    return Array.from(this.workouts.values()).filter(
      (workout) => workout.userId === userId
    );
  }
  
  async getWorkout(id: number): Promise<Workout | undefined> {
    return this.workouts.get(id);
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
  
  async getCommunityWorkouts(limit: number): Promise<WorkoutWithDetails[]> {
    // Get public workouts from all users
    const publicWorkouts = Array.from(this.workouts.values())
      .filter(workout => workout.isPublic === true)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
    
    const workoutsWithDetails = await Promise.all(
      publicWorkouts.map(workout => this.getWorkoutWithDetails(workout.id))
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
  async getTemplate(id: number): Promise<Template | undefined> {
    return this.templates.get(id);
  }
  
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
  async getTemplateExercise(id: number): Promise<TemplateExercise | undefined> {
    return this.templateExercises.get(id);
  }
  
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
        link: `/workout/${workout.id}`
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
  
  // Follow operations
  async isFollowing(followerId: number, followedId: number): Promise<boolean> {
    // Ensure we're not trying to check following for the same user
    if (followerId === followedId) {
      return false;
    }
    
    return Array.from(this.follows.values())
      .some(follow => follow.followerId === followerId && follow.followedId === followedId);
  }
  
  async getFollowing(userId: number): Promise<User[]> {
    const followedIds = Array.from(this.follows.values())
      .filter(follow => follow.followerId === userId)
      .map(follow => follow.followedId);
      
    return Array.from(this.users.values())
      .filter(user => followedIds.includes(user.id));
  }
  
  async getFollowers(userId: number): Promise<User[]> {
    const followerIds = Array.from(this.follows.values())
      .filter(follow => follow.followedId === userId)
      .map(follow => follow.followerId);
      
    return Array.from(this.users.values())
      .filter(user => followerIds.includes(user.id));
  }
  
  async followUser(followerId: number, followedId: number): Promise<void> {
    // Prevent users from following themselves
    if (followerId === followedId) {
      throw new Error("Cannot follow yourself");
    }
    
    // Check if the users exist
    const followerUser = this.users.get(followerId);
    const followedUser = this.users.get(followedId);
    
    if (!followerUser) {
      throw new Error("Follower user not found");
    }
    
    if (!followedUser) {
      throw new Error("User to follow not found");
    }
    
    // Check if already following
    const isAlreadyFollowing = await this.isFollowing(followerId, followedId);
    if (isAlreadyFollowing) {
      throw new Error("Already following this user");
    }
    
    // Create follow relationship
    const id = this.followCurrentId++;
    const follow = {
      id,
      followerId,
      followedId,
      createdAt: new Date()
    };
    this.follows.set(id, follow);
    
    // Create a notification for the followed user
    await this.createNotification({
      userId: followedId,
      title: "New Follower",
      message: `${followerUser.username} started following you`,
      type: "social",
      link: `/users/${followerId}`
    });
    
    console.log(`User ${followerId} followed user ${followedId} successfully`);
  }
  
  async unfollowUser(followerId: number, followedId: number): Promise<void> {
    // Prevent unfollowing yourself
    if (followerId === followedId) {
      throw new Error("Cannot unfollow yourself");
    }
    
    // Check if currently following
    const isFollowing = await this.isFollowing(followerId, followedId);
    if (!isFollowing) {
      throw new Error("Not currently following this user");
    }
    
    const follow = Array.from(this.follows.values())
      .find(follow => follow.followerId === followerId && follow.followedId === followedId);
    
    if (!follow) {
      throw new Error("Not following this user");
    }
    
    this.follows.delete(follow.id);
    console.log(`User ${followerId} unfollowed user ${followedId} successfully`);
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
  
  async getAllWorkoutPlans(): Promise<WorkoutPlan[]> {
    // Return all workout plans, regardless of publication status
    const plans = Array.from(this.workoutPlans.values());
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
  
  async forkWorkoutPlan(originalPlanId: number, clientId: number, userId: number): Promise<WorkoutPlan | undefined> {
    try {
      // Get the original plan
      const originalPlan = await this.getWorkoutPlan(originalPlanId);
      if (!originalPlan) return undefined;
      
      // Create a new forked plan
      const forkedPlan: InsertWorkoutPlan = {
        coachId: originalPlan.coachId, // Keep the same coach
        title: `${originalPlan.title} (Custom for client)`,
        description: originalPlan.description,
        price: 0, // Forked plans should be free as they're personalized
        durationWeeks: originalPlan.durationWeeks,
        difficultyLevel: originalPlan.difficultyLevel,
        category: originalPlan.category,
        featuredImageUrl: originalPlan.featuredImageUrl,
        goals: originalPlan.goals,
        equipment: originalPlan.equipment,
        isFeatured: false,
        isSoldOut: false,
        isPublished: true, // Make it immediately available
        parentPlanId: originalPlanId, // Link to parent plan
        clientId: clientId, // Assign to specific client
        isForked: true
      };
      
      // Create the forked plan
      const newPlan = await this.createWorkoutPlan(forkedPlan);
      
      // Now copy all templates from the original plan
      const planTemplates = Array.from(this.planTemplates.values())
        .filter(template => template.planId === originalPlanId);
      
      // Create new entries in plan_templates for each template
      for (const template of planTemplates) {
        const id = this.planTemplateCurrentId++;
        const newPlanTemplate: PlanTemplate = {
          id,
          planId: newPlan.id,
          templateId: template.templateId,
          weekNumber: template.weekNumber,
          dayNumber: template.dayNumber,
          order: template.order,
          notes: template.notes
        };
        this.planTemplates.set(id, newPlanTemplate);
      }
      
      // Get the client user details for notification
      const client = await this.getUser(clientId);
      if (client) {
        // Notify the client about the custom plan
        await this.createNotification({
          userId: clientId,
          title: "Custom Workout Plan",
          message: `Your coach has created a customized workout plan for you: ${newPlan.title}`,
          type: "plan",
          link: `/workout-plans/${newPlan.id}`
        });
      }
      
      return newPlan;
    } catch (error) {
      console.error("Error forking workout plan:", error);
      return undefined;
    }
  }
  
  async getClientForkedPlans(coachId: number): Promise<WorkoutPlan[]> {
    try {
      // Get all workout plans for this coach that are marked as forked and have a clientId
      return Array.from(this.workoutPlans.values())
        .filter(plan => plan.coachId === coachId && plan.isForked === true && plan.clientId !== null)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error("Error getting client forked plans:", error);
      return [];
    }
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
  
  // Feedback methods
  async saveFeedback(feedback: Feedback): Promise<Feedback> {
    const id = this.feedbackCurrentId++;
    const newFeedback = { 
      ...feedback, 
      id 
    };
    this.feedbacks.set(id, newFeedback);
    return newFeedback;
  }
  
  async getFeedback(): Promise<Feedback[]> {
    return Array.from(this.feedbacks.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
  
  // Workout Plan Fork operations for MemStorage
  async forkWorkoutPlan(originalPlanId: number, clientId: number, coachId: number): Promise<WorkoutPlan | undefined> {
    // Get the original plan
    const originalPlan = this.workoutPlans.get(originalPlanId);
    if (!originalPlan) {
      return undefined;
    }
    
    // Create a new forked plan
    const id = this.workoutPlanCurrentId++;
    const forkedPlan: WorkoutPlan = {
      ...originalPlan,
      id,
      title: `${originalPlan.title} (Custom for client)`,
      price: 0, // Forked plans should be free as they're personalized
      isFeatured: false,
      isSoldOut: false,
      isPublished: true, // Make it immediately available
      parentPlanId: originalPlanId, // Link to parent plan
      clientId: clientId, // Assign to specific client
      isForked: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.workoutPlans.set(id, forkedPlan);
    
    // Copy templates (in a real DB we'd have to do this in a transaction)
    const planTemplates = Array.from(this.planTemplates.values())
      .filter(template => template.planId === originalPlanId);
    
    for (const template of planTemplates) {
      const newTemplateId = this.planTemplateCurrentId++;
      const newTemplate: PlanTemplate = {
        ...template,
        id: newTemplateId,
        planId: id
      };
      this.planTemplates.set(newTemplateId, newTemplate);
    }
    
    // Create a "purchase" record so the client can access the plan
    const purchaseId = this.purchaseCurrentId++;
    const purchase: Purchase = {
      id: purchaseId,
      userId: clientId,
      planId: id,
      amount: 0, // Free for the client
      purchaseDate: new Date(),
      transactionId: `forked-${Date.now()}`,
      status: "completed"
    };
    this.purchases.set(purchaseId, purchase);
    
    // Create notification for the client
    const notificationId = this.notificationCurrentId++;
    const notification: Notification = {
      id: notificationId,
      userId: clientId,
      title: "Custom Workout Plan",
      message: `Your coach has created a customized workout plan for you: ${forkedPlan.title}`,
      type: "plan",
      link: `/workout-plans/${id}`,
      createdAt: new Date(),
      isRead: false
    };
    this.notifications.set(notificationId, notification);
    
    return forkedPlan;
  }
  
  async getClientForkedPlans(coachId: number): Promise<WorkoutPlan[]> {
    // For memory storage, we'll just filter the plans
    return Array.from(this.workoutPlans.values())
      .filter(plan => 
        plan.coachId === coachId && 
        plan.isForked === true && 
        plan.clientId !== null
      );
  }
  
  async getClientForkedPlan(planId: number): Promise<WorkoutPlan | undefined> {
    const plan = this.workoutPlans.get(planId);
    if (!plan || !plan.isForked) {
      return undefined;
    }
    return plan;
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
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  // Follow operations
  async isFollowing(followerId: number, followedId: number): Promise<boolean> {
    try {
      // Ensure we're not trying to check following for the same user
      if (followerId === followedId) {
        return false;
      }
      
      const result = await db.select()
        .from(follows)
        .where(and(
          eq(follows.followerId, followerId),
          eq(follows.followedId, followedId)
        ));
        
      return result.length > 0;
    } catch (error) {
      console.error("Error checking if following:", error);
      return false;
    }
  }
  
  async getFollowing(userId: number): Promise<User[]> {
    try {
      const followRows = await db.select({
        followedId: follows.followedId
      })
      .from(follows)
      .where(eq(follows.followerId, userId));
      
      if (followRows.length === 0) {
        return [];
      }
      
      const followedIds = followRows.map(row => row.followedId);
      
      const followedUsers = await db.select()
        .from(users)
        .where(inArray(users.id, followedIds));
        
      return followedUsers;
    } catch (error) {
      console.error("Error getting followed users:", error);
      return [];
    }
  }
  
  async getFollowers(userId: number): Promise<User[]> {
    try {
      const followRows = await db.select({
        followerId: follows.followerId
      })
      .from(follows)
      .where(eq(follows.followedId, userId));
      
      if (followRows.length === 0) {
        return [];
      }
      
      const followerIds = followRows.map(row => row.followerId);
      
      const followerUsers = await db.select()
        .from(users)
        .where(inArray(users.id, followerIds));
        
      return followerUsers;
    } catch (error) {
      console.error("Error getting followers:", error);
      return [];
    }
  }
  
  async followUser(followerId: number, followedId: number): Promise<void> {
    try {
      // Prevent following yourself
      if (followerId === followedId) {
        throw new Error("Cannot follow yourself");
      }
      
      // Check if the users exist
      const followerUser = await this.getUser(followerId);
      const followedUser = await this.getUser(followedId);
      
      if (!followerUser) {
        throw new Error("Follower user not found");
      }
      
      if (!followedUser) {
        throw new Error("User to follow not found");
      }
      
      // Check if already following
      const isAlreadyFollowing = await this.isFollowing(followerId, followedId);
      if (isAlreadyFollowing) {
        throw new Error("Already following this user");
      }
      
      // Create follow relationship
      await db.insert(follows).values({
        followerId,
        followedId
      });
      
      // Create notification for followed user
      await this.createNotification({
        userId: followedId,
        title: "New Follower",
        message: `${followerUser.username} started following you`,
        type: "social",
        link: `/users/${followerId}`
      });
      
      console.log(`User ${followerId} followed user ${followedId} successfully`);
    } catch (error) {
      console.error("Error following user:", error);
      throw error;
    }
  }
  
  async unfollowUser(followerId: number, followedId: number): Promise<void> {
    try {
      // Prevent unfollowing yourself
      if (followerId === followedId) {
        throw new Error("Cannot unfollow yourself");
      }
      
      // Check if currently following
      const isFollowing = await this.isFollowing(followerId, followedId);
      if (!isFollowing) {
        throw new Error("Not currently following this user");
      }
      
      const result = await db.delete(follows)
        .where(and(
          eq(follows.followerId, followerId),
          eq(follows.followedId, followedId)
        ));
        
      console.log(`User ${followerId} unfollowed user ${followedId} successfully`);
    } catch (error) {
      console.error("Error unfollowing user:", error);
      throw error;
    }
  }
  
  // Workout Plan operations
  async getWorkoutPlans(coachId?: number, publishedOnly: boolean = false): Promise<WorkoutPlan[]> {
    try {
      // Use raw SQL to avoid schema issues with missing columns
      const { pool } = await import('./db');
      
      let sql = `
        SELECT 
          id, coach_id, title, description, price, duration_weeks, 
          difficulty_level, category, featured_image_url, goals, equipment,
          is_featured, is_sold_out, is_published, created_at, updated_at,
          sales, rating, ratings_count
        FROM workout_plans
      `;
      
      const params: any[] = [];
      
      if (coachId) {
        sql += ` WHERE coach_id = $1`;
        params.push(coachId);
      }
      
      sql += ` ORDER BY created_at DESC`;
      
      const result = await pool.query(sql, params);
      
      if (!result || !result.rows) {
        return [];
      }
      
      // Convert from snake_case to camelCase
      const plans = result.rows.map(row => ({
        id: row.id,
        coachId: row.coach_id,
        title: row.title,
        description: row.description,
        price: row.price,
        durationWeeks: row.duration_weeks,
        difficultyLevel: row.difficulty_level,
        category: row.category,
        featuredImageUrl: row.featured_image_url,
        goals: row.goals,
        equipment: row.equipment,
        isFeatured: row.is_featured,
        isSoldOut: row.is_sold_out,
        isPublished: row.is_published,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        sales: row.sales,
        rating: row.rating,
        ratingsCount: row.ratings_count
      }));
      
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
  
  async getAllWorkoutPlans(): Promise<WorkoutPlan[]> {
    try {
      // Use raw SQL to avoid schema issues with missing columns
      const { pool } = await import('./db');
      
      const sql = `
        SELECT 
          id, coach_id, title, description, price, duration_weeks, 
          difficulty_level, category, featured_image_url, goals, equipment,
          is_featured, is_sold_out, is_published, created_at, updated_at,
          sales, rating, ratings_count
        FROM workout_plans
        ORDER BY created_at DESC
      `;
      
      const result = await pool.query(sql);
      
      if (!result || !result.rows) {
        return [];
      }
      
      // Convert from snake_case to camelCase
      const plans = result.rows.map(row => ({
        id: row.id,
        coachId: row.coach_id,
        title: row.title,
        description: row.description,
        price: row.price,
        durationWeeks: row.duration_weeks,
        difficultyLevel: row.difficulty_level,
        category: row.category,
        featuredImageUrl: row.featured_image_url,
        goals: row.goals,
        equipment: row.equipment,
        isFeatured: row.is_featured,
        isSoldOut: row.is_sold_out,
        isPublished: row.is_published,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        sales: row.sales,
        rating: row.rating,
        ratingsCount: row.ratings_count,
        // Add default values for the fork-specific fields
        parentPlanId: null,
        clientId: null,
        isForked: false
      }));
      
      console.log("DEBUGGING - Database getAllWorkoutPlans fetched", plans.length, "plans");
      return plans;
    } catch (error) {
      console.error("Error fetching all workout plans:", error);
      return [];
    }
  }
  
  async getWorkoutPlan(id: number): Promise<WorkoutPlan | undefined> {
    try {
      // Use raw SQL to avoid schema issues with missing columns
      const { pool } = await import('./db');
      
      const sql = `
        SELECT 
          id, coach_id, title, description, price, duration_weeks, 
          difficulty_level, category, featured_image_url, goals, equipment,
          is_featured, is_sold_out, is_published, created_at, updated_at,
          sales, rating, ratings_count
        FROM workout_plans
        WHERE id = $1
      `;
      
      const result = await pool.query(sql, [id]);
      
      if (!result || !result.rows || result.rows.length === 0) {
        return undefined;
      }
      
      // Convert from snake_case to camelCase
      const row = result.rows[0];
      return {
        id: row.id,
        coachId: row.coach_id,
        title: row.title,
        description: row.description,
        price: row.price,
        durationWeeks: row.duration_weeks,
        difficultyLevel: row.difficulty_level,
        category: row.category,
        featuredImageUrl: row.featured_image_url,
        goals: row.goals,
        equipment: row.equipment,
        isFeatured: row.is_featured,
        isSoldOut: row.is_sold_out,
        isPublished: row.is_published,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        sales: row.sales,
        rating: row.rating,
        ratingsCount: row.ratings_count,
        // Add default values for the fork-specific fields
        parentPlanId: null,
        clientId: null,
        isForked: false
      };
    } catch (error) {
      console.error("Error getting workout plan:", error);
      return undefined;
    }
  }
  
  async checkWorkoutPlanExists(id: number): Promise<boolean> {
    try {
      // Use raw SQL to avoid schema issues with missing columns
      const { pool } = await import('./db');
      
      const sql = `
        SELECT COUNT(*) as count
        FROM workout_plans
        WHERE id = $1
      `;
      
      const result = await pool.query(sql, [id]);
      
      if (!result || !result.rows || result.rows.length === 0) {
        return false;
      }
      
      const count = parseInt(result.rows[0].count);
      console.log(`Checking if workout plan with ID ${id} exists:`, count > 0);
      return count > 0;
    } catch (error) {
      console.error("Error checking if workout plan exists:", error);
      return false;
    }
  }
  
  async createWorkoutPlan(plan: InsertWorkoutPlan): Promise<WorkoutPlan> {
    try {
      // Use raw SQL to insert the workout plan to bypass schema issues
      // This ensures we only insert fields that definitely exist in the database
      const goals = typeof plan.goals === 'string' ? plan.goals : JSON.stringify(plan.goals || []);
      const equipment = typeof plan.equipment === 'string' ? plan.equipment : JSON.stringify(plan.equipment || []);
      
      console.log("Creating workout plan with raw SQL");
      
      // Use the pg pool directly to avoid Drizzle ORM issues
      const sql = `
        INSERT INTO workout_plans (
          coach_id, title, description, price, duration_weeks, 
          difficulty_level, category, featured_image_url, goals, equipment,
          is_featured, is_sold_out, is_published, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW()
        ) RETURNING *
      `;
      
      const values = [
        plan.coachId, 
        plan.title, 
        plan.description, 
        plan.price, 
        plan.durationWeeks,
        plan.difficultyLevel, 
        plan.category, 
        plan.featuredImageUrl, 
        goals, 
        equipment,
        plan.isFeatured || false, 
        plan.isSoldOut || false, 
        plan.isPublished || false
      ];
      
      // Import the pool from db.ts
      const { pool } = await import('./db');
      const result = await pool.query(sql, values);
      
      // We need to extract the first row
      if (result && result.rows && result.rows.length > 0) {
        // Convert snake_case column names to camelCase for consistency with the rest of the app
        const planData = result.rows[0];
        return {
          id: planData.id,
          coachId: planData.coach_id,
          title: planData.title,
          description: planData.description,
          price: planData.price,
          durationWeeks: planData.duration_weeks,
          difficultyLevel: planData.difficulty_level,
          category: planData.category,
          featuredImageUrl: planData.featured_image_url,
          goals: planData.goals,
          equipment: planData.equipment,
          isFeatured: planData.is_featured,
          isSoldOut: planData.is_sold_out,
          isPublished: planData.is_published,
          createdAt: planData.created_at,
          updatedAt: planData.updated_at,
          sales: planData.sales,
          rating: planData.rating,
          ratingsCount: planData.ratings_count
        };
      } else {
        throw new Error("Failed to insert workout plan - no rows returned");
      }
    } catch (error) {
      console.error("Error creating workout plan:", error);
      throw error;
    }
  }
  
  async forkWorkoutPlan(originalPlanId: number, clientId: number, coachId: number, customTitle?: string, customNotes?: string): Promise<WorkoutPlan | undefined> {
    try {
      // Get the original plan
      const originalPlan = await this.getWorkoutPlan(originalPlanId);
      if (!originalPlan) {
        throw new Error(`Original plan with ID ${originalPlanId} not found`);
      }
      
      console.log("Original plan to fork:", originalPlan);
      
      // Create a new forked plan - ONLY include the fields that definitely exist in the database
      // We must exclude any fields that might not exist in older database versions
      const forkedPlan = {
        coachId: originalPlan.coachId, // Keep the same coach
        title: customTitle || `${originalPlan.title} (Custom for client)`,
        description: customNotes ? 
          `${originalPlan.description}\n\nCOACH NOTES: ${customNotes}` : 
          originalPlan.description,
        price: 0, // Forked plans should be free as they're personalized
        durationWeeks: originalPlan.durationWeeks,
        difficultyLevel: originalPlan.difficultyLevel,
        category: originalPlan.category,
        featuredImageUrl: originalPlan.featuredImageUrl || null,
        goals: originalPlan.goals,
        equipment: originalPlan.equipment,
        isFeatured: false,
        isSoldOut: false,
        isPublished: true // Make it immediately available
      };
      
      console.log("Creating forked plan with data:", forkedPlan);
      
      // Create the forked plan with raw SQL to bypass schema issues
      const goals = typeof forkedPlan.goals === 'string' ? forkedPlan.goals : JSON.stringify(forkedPlan.goals || []);
      const equipment = typeof forkedPlan.equipment === 'string' ? forkedPlan.equipment : JSON.stringify(forkedPlan.equipment || []);
      
      console.log("Creating forked plan with raw SQL");
      
      // Use the pg pool directly to avoid Drizzle ORM issues
      const sql = `
        INSERT INTO workout_plans (
          coach_id, title, description, price, duration_weeks, 
          difficulty_level, category, featured_image_url, goals, equipment,
          is_featured, is_sold_out, is_published, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW()
        ) RETURNING *
      `;
      
      const values = [
        forkedPlan.coachId, 
        forkedPlan.title, 
        forkedPlan.description, 
        forkedPlan.price, 
        forkedPlan.durationWeeks,
        forkedPlan.difficultyLevel, 
        forkedPlan.category, 
        forkedPlan.featuredImageUrl, 
        goals, 
        equipment,
        forkedPlan.isFeatured, 
        forkedPlan.isSoldOut, 
        forkedPlan.isPublished
      ];
      
      // Import the pool from db.ts
      const { pool } = await import('./db');
      const result = await pool.query(sql, values);
      
      // Convert the result to a WorkoutPlan object
      if (!result || !result.rows || result.rows.length === 0) {
        throw new Error("Failed to create forked plan - no rows returned");
      }
      
      // Convert snake_case column names to camelCase
      const planData = result.rows[0];
      let newPlan = [{
        id: planData.id,
        coachId: planData.coach_id,
        title: planData.title,
        description: planData.description,
        price: planData.price,
        durationWeeks: planData.duration_weeks,
        difficultyLevel: planData.difficulty_level,
        category: planData.category,
        featuredImageUrl: planData.featured_image_url,
        goals: planData.goals,
        equipment: planData.equipment,
        isFeatured: planData.is_featured,
        isSoldOut: planData.is_sold_out,
        isPublished: planData.is_published,
        createdAt: planData.created_at,
        updatedAt: planData.updated_at
      }];
      
      // If we successfully created the plan, we can mark it as a forked plan separately
      // This avoids issues if those columns don't exist yet
      try {
        // After successfully creating the plan, try to set the fork-specific fields
        // Use the pool directly to avoid Drizzle ORM issues
        const updateSql = `
          UPDATE workout_plans 
          SET 
            is_forked = true,
            client_id = $1,
            parent_plan_id = $2
          WHERE id = $3
        `;
        
        const updateValues = [clientId, originalPlanId, newPlan[0].id];
        const { pool } = await import('./db');
        await pool.query(updateSql, updateValues);
        
        // Update our local plan object with these values for the return value
        newPlan[0].isForked = true;
        newPlan[0].clientId = clientId;
        newPlan[0].parentPlanId = originalPlanId;
        
      } catch (updateError) {
        // If this fails, the fork-specific columns probably don't exist yet
        // That's ok, the plan has still been created
        console.log("Could not set fork-specific fields - columns might not exist yet:", updateError);
      }
      
      // Now copy all templates from the original plan
      try {
        console.log("[DEBUG] About to fetch templates for plan ID:", originalPlanId);
        
        // First get the raw template data directly from the database
        const templatesQuery = `
          SELECT * FROM plan_templates 
          WHERE plan_id = $1
        `;
        
        console.log("[DEBUG] Running template query:", templatesQuery);
        const templatesResult = await pool.query(templatesQuery, [originalPlanId]);
        console.log("[DEBUG] Template query result:", JSON.stringify(templatesResult.rows, null, 2));
        
        const originalTemplates = templatesResult.rows;
        console.log(`[DEBUG] Found ${originalTemplates.length} templates to copy`);
        
        if (originalTemplates.length === 0) {
          console.log("[DEBUG] No templates found for original plan, skipping template copying");
        } else {
          // Copy each template using the raw database field names
          for (const template of originalTemplates) {
            try {
              console.log("[DEBUG] Copying template:", JSON.stringify(template, null, 2));
              console.log("[DEBUG] New plan ID for template:", newPlan[0].id);
              
              const templateSql = `
                INSERT INTO plan_templates (
                  plan_id, template_id, week_number, day_number, "order", notes
                ) VALUES (
                  $1, $2, $3, $4, $5, $6
                ) RETURNING *
              `;
              
              const templateValues = [
                newPlan[0].id,
                template.template_id,
                template.week_number,
                template.day_number,
                template.order || 1,
                template.notes
              ];
              
              console.log("[DEBUG] Template SQL:", templateSql);
              console.log("[DEBUG] Template values:", templateValues);
              
              const result = await pool.query(templateSql, templateValues);
              console.log("[DEBUG] Template insert result:", JSON.stringify(result.rows, null, 2));
            } catch (templateError) {
              console.error("[DEBUG] Error copying template:", templateError);
              // Continue with the next template if one fails
            }
          }
        }
      } catch (templatesError) {
        console.error("[DEBUG] Error in template copying process:", templatesError);
        // Continue even if template copying fails
      }
      
      // Get the client user details for notification
      const client = await this.getUser(clientId);
      if (client) {
        // Notify the client about the custom plan
        await this.createNotification({
          userId: clientId,
          title: "Custom Workout Plan",
          message: `Your coach has created a customized workout plan for you: ${newPlan[0].title}`,
          type: "plan",
          link: `/workout-plans/${newPlan[0].id}`
        });
      }
      
      // Create a "purchase" record so the client can access the plan
      try {
        // Use raw SQL again to avoid ORM issues
        const purchaseSql = `
          INSERT INTO purchases (
            user_id, plan_id, amount, transaction_id, status, purchase_date
          ) VALUES (
            $1, $2, $3, $4, $5, NOW()
          )
        `;
        
        const purchaseValues = [
          clientId,
          newPlan[0].id,
          0, // Free for the client
          `forked-${Date.now()}`,
          "completed"
        ];
        
        await pool.query(purchaseSql, purchaseValues);
      } catch (purchaseError) {
        console.error("Error creating purchase record:", purchaseError);
        // We can still return the plan even if purchase creation fails
      }
      
      return newPlan[0];
    } catch (error) {
      console.error("Error forking workout plan:", error);
      throw error;
    }
  }
  
  async getClientForkedPlans(coachId: number): Promise<WorkoutPlan[]> {
    try {
      // First get the coach profile to get the actual coach ID
      const coachProfile = await this.getCoachProfileByUserId(coachId);
      if (!coachProfile) {
        throw new Error("Coach profile not found");
      }
      
      // Safely try to get forked plans, and handle the case where the columns don't exist yet
      try {
        // First try to query using the new columns if they exist
        const plans = await db
          .select()
          .from(workoutPlans)
          .where(
            and(
              eq(workoutPlans.coachId, coachProfile.id),
              eq(workoutPlans.isForked, true),
              isNotNull(workoutPlans.clientId)
            )
          );
        
        return plans;
      } catch (queryError) {
        console.log("Error querying forked plans with new columns, likely they don't exist yet:", queryError);
        // Just return an empty array if the columns don't exist yet
        return [];
      }
    } catch (error) {
      console.error("Error getting client forked plans:", error);
      return [];
    }
  }
  
  async getClientForkedPlan(planId: number): Promise<WorkoutPlan | undefined> {
    try {
      try {
        // Try to get the plan with the isForked flag if it exists
        const [plan] = await db
          .select()
          .from(workoutPlans)
          .where(
            and(
              eq(workoutPlans.id, planId),
              eq(workoutPlans.isForked, true)
            )
          );
        
        return plan;
      } catch (queryError) {
        console.log("Error querying forked plan with isForked column, it likely doesn't exist:", queryError);
        // Fallback to just getting the plan by ID
        return await this.getWorkoutPlan(planId);
      }
    } catch (error) {
      console.error(`Error getting forked plan with ID ${planId}:`, error);
      return undefined;
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
      
      // TROUBLESHOOTING: Debug goals and equipment fields
      console.log("Input goals:", planUpdate.goals);
      console.log("Input equipment:", planUpdate.equipment);
      
      // Sanitize update data - remove undefined values
      const sanitizedUpdate: Record<string, any> = {};
      
      // Only include defined properties from the update
      Object.entries(planUpdate).forEach(([key, value]) => {
        if (value !== undefined) {
          sanitizedUpdate[key] = value;
        }
      });
      
      console.log("Sanitized update:", sanitizedUpdate);
      
      // Force updatedAt to ensure there's at least one field to update
      sanitizedUpdate.updatedAt = new Date();
      
      // Explicitly set isPublished if that's the action we're taking
      if (planUpdate.isPublished === true) {
        console.log("Publishing plan to marketplace");
        sanitizedUpdate.isPublished = true;
      }
      
      // Special handling for goals and equipment
      if (Array.isArray(sanitizedUpdate.goals)) {
        sanitizedUpdate.goals = JSON.stringify(sanitizedUpdate.goals);
      }
      
      if (Array.isArray(sanitizedUpdate.equipment)) {
        sanitizedUpdate.equipment = JSON.stringify(sanitizedUpdate.equipment);
      }
      
      console.log("Final update data for SQL:", sanitizedUpdate);
      
      // Make sure we have at least one field to update
      if (Object.keys(sanitizedUpdate).length === 0) {
        console.log("ERROR: Still no values to update after sanitization");
        sanitizedUpdate.updatedAt = new Date(); // Last resort failsafe
      }
      
      // Use raw SQL to update the plan
      const { pool } = await import('./db');
      
      // Build the SQL dynamically based on the sanitized update
      let sql = `UPDATE workout_plans SET updated_at = NOW()`;
      const values: any[] = [];
      let paramIndex = 1;
      
      // Add fields to update
      Object.entries(sanitizedUpdate).forEach(([key, value]) => {
        // Skip updatedAt as we're already setting it with NOW()
        if (key === 'updatedAt') return;
        
        // Convert camelCase to snake_case
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        sql += `, ${snakeKey} = $${paramIndex}`;
        values.push(value);
        paramIndex++;
      });
      
      // Add WHERE clause and RETURNING
      sql += ` WHERE id = $${paramIndex} RETURNING *`;
      values.push(id);
      
      console.log("Executing SQL:", sql);
      console.log("With values:", values);
      
      const result = await pool.query(sql, values);
      
      console.log("Update result:", result);
      
      if (!result || !result.rows || result.rows.length === 0) {
        return undefined;
      }
      
      // Convert from snake_case to camelCase
      const row = result.rows[0];
      return {
        id: row.id,
        coachId: row.coach_id,
        title: row.title,
        description: row.description,
        price: row.price,
        durationWeeks: row.duration_weeks,
        difficultyLevel: row.difficulty_level,
        category: row.category,
        featuredImageUrl: row.featured_image_url,
        goals: row.goals,
        equipment: row.equipment,
        isFeatured: row.is_featured,
        isSoldOut: row.is_sold_out,
        isPublished: row.is_published,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        sales: row.sales,
        rating: row.rating,
        ratingsCount: row.ratings_count,
        parentPlanId: null,
        clientId: null,
        isForked: false
      };
    } catch (error) {
      console.error("Error updating workout plan:", error);
      return undefined;
    }
  }
  
  async deleteWorkoutPlan(id: number): Promise<boolean> {
    try {
      console.log("[DELETE-STORAGE] Starting deletion process for plan ID:", id);
      
      // Try using raw SQL for more direct control
      const { pool } = await import('./db');
      
      // First check if the plan exists
      const checkPlanSql = "SELECT * FROM workout_plans WHERE id = $1";
      const checkResult = await pool.query(checkPlanSql, [id]);
      
      if (!checkResult.rows || checkResult.rows.length === 0) {
        console.log("[DELETE-STORAGE] Plan not found with ID:", id);
        return false;
      }
      
      console.log("[DELETE-STORAGE] Found plan to delete:", checkResult.rows[0]);
      
      // Delete in specific order to avoid foreign key conflicts
      // 1. First delete purchases (if any)
      console.log("[DELETE-STORAGE] Deleting related purchases");
      await pool.query("DELETE FROM purchases WHERE plan_id = $1", [id]);
      
      // 2. Delete reviews (if any)
      console.log("[DELETE-STORAGE] Deleting related reviews");
      await pool.query("DELETE FROM reviews WHERE plan_id = $1", [id]);
      
      // 3. Delete template exercises (if any - this might involve multiple steps with joins)
      console.log("[DELETE-STORAGE] Finding and deleting template exercises");
      // First need to find template IDs from plan_templates
      const templateIdsSql = "SELECT template_id FROM plan_templates WHERE plan_id = $1";
      const templateIdsResult = await pool.query(templateIdsSql, [id]);
      
      if (templateIdsResult.rows && templateIdsResult.rows.length > 0) {
        const templateIds = templateIdsResult.rows.map(row => row.template_id);
        console.log("[DELETE-STORAGE] Found template IDs:", templateIds);
        
        if (templateIds.length > 0) {
          // Then delete template exercises using those IDs
          const placeholders = templateIds.map((_, idx) => `$${idx + 1}`).join(',');
          const deleteExercisesSql = `DELETE FROM template_exercises WHERE template_id IN (${placeholders})`;
          await pool.query(deleteExercisesSql, templateIds);
        }
      }
      
      // 4. Delete plan templates
      console.log("[DELETE-STORAGE] Deleting plan templates");
      await pool.query("DELETE FROM plan_templates WHERE plan_id = $1", [id]);
      
      // 5. Delete workout plan days
      console.log("[DELETE-STORAGE] Deleting workout plan days");
      await pool.query("DELETE FROM workout_plan_days WHERE plan_id = $1", [id]);
      
      // 6. Finally delete the plan itself
      console.log("[DELETE-STORAGE] Deleting the workout plan");
      const result = await pool.query("DELETE FROM workout_plans WHERE id = $1 RETURNING *", [id]);
      
      const success = result.rows && result.rows.length > 0;
      console.log("[DELETE-STORAGE] Deletion " + (success ? "successful" : "failed"));
      
      return success;
    } catch (error) {
      console.error("[DELETE-STORAGE] Error deleting workout plan:", error);
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
  async getAllUsers(): Promise<User[]> {
    // Filter out test/demo accounts and only return real registered users
    return await db.select().from(users).where(
      and(
        notLike(users.username, "demo%"),
        notLike(users.email, "demo@%"),
        notLike(users.username, "test%"),
        notLike(users.email, "test@%")
      )
    );
  }
  
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    // Ensure all optional fields are explicitly set to null if not provided
    const userWithDefaults = {
      ...insertUser,
      name: insertUser.name ?? null,
      email: insertUser.email ?? null,
      bio: insertUser.bio ?? null,
      location: insertUser.location ?? null,
      fitnessLevel: insertUser.fitnessLevel ?? null,
      experienceYears: insertUser.experienceYears ?? null,
      goals: insertUser.goals ?? null,
      certifications: insertUser.certifications ?? null,
      socialMedia: insertUser.socialMedia ?? null,
      isCoach: insertUser.isCoach ?? false,
      coachRegistrationDate: insertUser.coachRegistrationDate ?? null,
      stripeCustomerId: insertUser.stripeCustomerId ?? null,
      stripeSubscriptionId: insertUser.stripeSubscriptionId ?? null
    };
    
    const result = await db.insert(users).values(userWithDefaults).returning();
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
  
  async deleteUser(id: number): Promise<boolean> {
    try {
      // First delete all related records manually since CASCADE DELETE might not be properly set up
      console.log(`Starting deletion of user ID ${id} and all associated data...`);
      
      // Using a transaction to ensure all operations succeed or fail together
      return await db.transaction(async (tx) => {
        // Get workouts by this user to delete their exercises later
        const userWorkouts = await tx.select({ id: workouts.id })
          .from(workouts)
          .where(eq(workouts.userId, id));
        
        const workoutIds = userWorkouts.map(w => w.id);
        
        if (workoutIds.length > 0) {
          // Delete sets for each workout exercise
          console.log("Deleting user's workout sets...");
          await tx.delete(sets)
            .where(
              inArray(
                sets.workoutExerciseId,
                tx.select({ id: workoutExercises.id })
                  .from(workoutExercises)
                  .where(inArray(workoutExercises.workoutId, workoutIds))
              )
            );
          
          // Delete workout exercises 
          console.log("Deleting user's workout exercises...");
          await tx.delete(workoutExercises)
            .where(inArray(workoutExercises.workoutId, workoutIds));
            
          // Delete comments for these workouts
          console.log("Deleting workout comments...");
          await tx.delete(comments)
            .where(inArray(comments.workoutId, workoutIds));
            
          // Delete likes for these workouts
          console.log("Deleting workout likes...");
          await tx.delete(likes)
            .where(inArray(likes.workoutId, workoutIds));
        }
        
        // Get templates by this user to delete their exercises later
        const userTemplates = await tx.select({ id: templates.id })
          .from(templates)
          .where(eq(templates.userId, id));
          
        const templateIds = userTemplates.map(t => t.id);
        
        if (templateIds.length > 0) {
          // Delete template exercises
          console.log("Deleting user's template exercises...");
          await tx.delete(templateExercises)
            .where(inArray(templateExercises.templateId, templateIds));
        }
        
        // If user is a coach, get and handle their coach profile and plans
        const userResults = await tx.select().from(users).where(eq(users.id, id));
        const user = userResults.length > 0 ? userResults[0] : null;
        if (user && user.isCoach) {
          const coachProfile = await tx.select({ id: coachProfiles.id })
            .from(coachProfiles)
            .where(eq(coachProfiles.userId, id));
            
          if (coachProfile.length > 0) {
            const coachId = coachProfile[0].id;
            
            // Get coach's workout plans
            const coachPlans = await tx.select({ id: workoutPlans.id })
              .from(workoutPlans)
              .where(eq(workoutPlans.coachId, coachId));
              
            const planIds = coachPlans.map(p => p.id);
            
            if (planIds.length > 0) {
              // Delete plan templates
              console.log("Deleting coach's plan templates...");
              await tx.delete(planTemplates)
                .where(inArray(planTemplates.planId, planIds));
                
              // Delete plan days
              console.log("Deleting coach's plan days...");
              await tx.delete(workoutPlanDays)
                .where(inArray(workoutPlanDays.planId, planIds));
                
              // Delete plan reviews
              console.log("Deleting coach's plan reviews...");
              await tx.delete(reviews)
                .where(inArray(reviews.planId, planIds));
                
              // Delete plan purchases/transactions
              console.log("Deleting plan purchases...");
              await tx.delete(purchases)
                .where(inArray(purchases.planId, planIds));
            }
              
            // Delete coach reviews
            console.log("Deleting coach reviews...");
            await tx.delete(reviews)
              .where(eq(reviews.coachId, coachId));
          }
            
          // Delete coach profile
          console.log("Deleting coach profile...");
          await tx.delete(coachProfiles)
            .where(eq(coachProfiles.userId, id));
        }
        
        // Delete user's workouts
        console.log("Deleting user's workouts...");
        await tx.delete(workouts).where(eq(workouts.userId, id));
        
        // Delete user's templates
        console.log("Deleting user's templates...");
        await tx.delete(templates).where(eq(templates.userId, id));
        
        // Delete user's goals
        console.log("Deleting user's goals...");
        await tx.delete(goals).where(eq(goals.userId, id));
        
        // Delete user's notifications
        console.log("Deleting user's notifications...");
        await tx.delete(notifications).where(eq(notifications.userId, id));
        
        // Delete follows where this user is following or being followed
        console.log("Deleting user's follow relationships...");
        await tx.delete(follows).where(eq(follows.followerId, id));
        await tx.delete(follows).where(eq(follows.followedId, id));
        
        // Delete user's comments
        console.log("Deleting user's remaining comments...");
        await tx.delete(comments).where(eq(comments.userId, id));
        
        // Remaining reviews by this user
        console.log("Deleting user's remaining reviews...");
        await tx.delete(reviews).where(eq(reviews.userId, id));
        
        // Finally delete the user
        console.log("Deleting user account...");
        const result = await tx.delete(users).where(eq(users.id, id)).returning();
        
        console.log(`User ID ${id} deletion completed successfully.`);
        return result.length > 0;
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
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
  
  async getExerciseById(id: number): Promise<Exercise | undefined> {
    const result = await db.select().from(exercises).where(eq(exercises.id, id));
    return result[0];
  }
  
  async findExerciseByReferenceId(referenceId: number, userId: number): Promise<Exercise | undefined> {
    const result = await db.select().from(exercises)
      .where(and(
        eq(exercises.referenceId, referenceId),
        eq(exercises.userId, userId)
      ));
    return result[0];
  }
  
  async createExercise(exercise: InsertExercise): Promise<Exercise> {
    const result = await db.insert(exercises).values(exercise).returning();
    return result[0];
  }
  
  async updateExercise(id: number, exerciseUpdate: Partial<Exercise>): Promise<Exercise | undefined> {
    try {
      const result = await db
        .update(exercises)
        .set(exerciseUpdate)
        .where(eq(exercises.id, id))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("Update exercise error:", error);
      return undefined;
    }
  }
  
  async deleteExercise(id: number): Promise<boolean> {
    try {
      // Check if exercise exists
      const exerciseExists = await this.getExercise(id);
      if (!exerciseExists) {
        return false;
      }
      
      // Delete the exercise
      const result = await db.delete(exercises).where(eq(exercises.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Delete exercise error:", error);
      return false;
    }
  }
  
  // Workout operations
  async getWorkouts(userId: number): Promise<Workout[]> {
    return await db.select().from(workouts).where(eq(workouts.userId, userId));
  }
  
  async getWorkout(id: number): Promise<Workout | undefined> {
    const result = await db.select().from(workouts).where(eq(workouts.id, id));
    return result.length > 0 ? result[0] : undefined;
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
  
  async getCommunityWorkouts(limit: number = 50): Promise<WorkoutWithDetails[]> {
    // Get public workouts from all users, sorted by date
    // Use a much higher default limit to ensure we get all workouts
    const workoutResults = await db
      .select()
      .from(workouts)
      .where(eq(workouts.isPublic, true))
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
  async getTemplate(id: number): Promise<Template | undefined> {
    const results = await db
      .select()
      .from(templates)
      .where(eq(templates.id, id));
    
    return results.length > 0 ? results[0] : undefined;
  }
  
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
  
  async getTemplateExercise(id: number): Promise<TemplateExercise | undefined> {
    try {
      const result = await db
        .select()
        .from(templateExercises)
        .where(eq(templateExercises.id, id));
      
      if (result.length === 0) {
        return undefined;
      }
      
      const exerciseResult = await db
        .select()
        .from(exercises)
        .where(eq(exercises.id, result[0].exerciseId));
        
      return {
        ...result[0],
        exercise: exerciseResult[0]
      };
    } catch (error) {
      console.error('Error getting template exercise:', error);
      return undefined;
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
      
      // Create a notification for the new goal with a link to the goals page
      await this.createNotification({
        userId: newGoal.userId,
        title: "New Goal Created",
        message: `You've set a new goal: ${newGoal.title}`,
        type: "goal",
        link: `/goals/${newGoal.id}` // Direct link to the specific goal
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
          type: "achievement",
          link: `/goals/${goal.id}` // Direct link to the completed goal
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
            type: "progress",
            link: `/goals/${goal.id}` // Direct link to the goal
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
          type: "milestone",
          link: `/goals/${goal.id}` // Direct link to the goal with the milestone
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
      console.log('No users found in database. Initializing default exercises only.');
      
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
  
  // MemStorage implementation of deleteFeedback
  async deleteFeedback(id: number): Promise<boolean> {
    // Check if the feedback exists
    if (!this.feedbacks.has(id)) {
      return false;
    }
    
    // Delete the feedback from the Map
    return this.feedbacks.delete(id);
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
  
  // Feedback methods
  async saveFeedback(feedback: Feedback): Promise<Feedback> {
    try {
      const { feedbacks } = await import("@shared/schema");
      
      const result = await db
        .insert(feedbacks)
        .values(feedback)
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("Error saving feedback:", error);
      throw error;
    }
  }
  
  async getFeedback(): Promise<Feedback[]> {
    try {
      const { feedbacks } = await import("@shared/schema");
      const { desc } = await import("drizzle-orm");
      
      return await db
        .select()
        .from(feedbacks)
        .orderBy(desc(feedbacks.timestamp));
    } catch (error) {
      console.error("Error getting feedbacks:", error);
      return [];
    }
  }
  
  async deleteFeedback(id: number): Promise<boolean> {
    try {
      const { feedbacks } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      
      const result = await db
        .delete(feedbacks)
        .where(eq(feedbacks.id, id))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting feedback:", error);
      return false;
    }
  }
  
  // Direct Messages Methods
  
  async createMessageThread(): Promise<any> {
    try {
      // Import message-related tables and types
      const { messageThreads } = await import("@shared/schema");
      
      const [thread] = await db
        .insert(messageThreads)
        .values({})
        .returning();
      
      return thread;
    } catch (error) {
      console.error("Error creating message thread:", error);
      throw error;
    }
  }
  
  async addParticipantToThread(threadId: number, userId: number): Promise<any> {
    try {
      // Import message-related tables and types
      const { messageParticipants } = await import("@shared/schema");
      
      const [participant] = await db
        .insert(messageParticipants)
        .values({
          threadId,
          userId,
          isRead: false
        })
        .returning();
      
      return participant;
    } catch (error) {
      console.error("Error adding participant to thread:", error);
      throw error;
    }
  }
  
  async sendMessage(threadId: number, senderId: number, content: string): Promise<any> {
    try {
      // Import message-related tables and types
      const { messageThreads, messageParticipants, messages } = await import("@shared/schema");
      const { eq, ne, and } = await import("drizzle-orm");
      
      const [message] = await db
        .insert(messages)
        .values({
          threadId,
          senderId,
          content
        })
        .returning();
      
      // Update thread updateAt timestamp
      await db
        .update(messageThreads)
        .set({ 
          updatedAt: new Date() 
        })
        .where(eq(messageThreads.id, threadId));
      
      // Mark as unread for all participants except sender
      await db
        .update(messageParticipants)
        .set({ 
          isRead: false 
        })
        .where(
          and(
            eq(messageParticipants.threadId, threadId),
            ne(messageParticipants.userId, senderId)
          )
        );
      
      return message;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }
  
  async getThreadsByUserId(userId: number): Promise<any[]> {
    try {
      // Import messaging tables from schema
      const { messageThreads, messageParticipants, messages, users } = await import("@shared/schema");
      const { eq, ne, and, desc } = await import("drizzle-orm");
      
      // Get all threads where the user is a participant
      const userThreads = await db
        .select({
          threadId: messageParticipants.threadId,
          isRead: messageParticipants.isRead,
          lastReadAt: messageParticipants.lastReadAt,
          updatedAt: messageThreads.updatedAt
        })
        .from(messageParticipants)
        .innerJoin(messageThreads, eq(messageParticipants.threadId, messageThreads.id))
        .where(eq(messageParticipants.userId, userId))
        .orderBy(desc(messageThreads.updatedAt));
      
      // For each thread, get participants and last message
      const threadsWithDetails = await Promise.all(
        userThreads.map(async (thread) => {
          // Get all participants (excluding current user)
          const participants = await db
            .select({
              userId: messageParticipants.userId,
              username: users.username,
              name: users.name
            })
            .from(messageParticipants)
            .innerJoin(users, eq(messageParticipants.userId, users.id))
            .where(
              and(
                eq(messageParticipants.threadId, thread.threadId),
                ne(messageParticipants.userId, userId)
              )
            );
          
          // Get last message in thread
          const [lastMessage] = await db
            .select({
              id: messages.id,
              content: messages.content,
              senderId: messages.senderId,
              senderName: users.username,
              createdAt: messages.createdAt
            })
            .from(messages)
            .innerJoin(users, eq(messages.senderId, users.id))
            .where(eq(messages.threadId, thread.threadId))
            .orderBy(desc(messages.createdAt))
            .limit(1);
          
          return {
            threadId: thread.threadId,
            participants,
            lastMessage,
            isRead: thread.isRead,
            updatedAt: thread.updatedAt
          };
        })
      );
      
      return threadsWithDetails;
    } catch (error) {
      console.error("Error getting threads by user ID:", error);
      return [];
    }
  }
  
  async getThreadMessages(threadId: number, userId: number): Promise<any[]> {
    try {
      // Import messaging tables from schema
      const { messageThreads, messageParticipants, messages, users } = await import("@shared/schema");
      const { eq, and, asc } = await import("drizzle-orm");
      
      // First check if the user is a participant in this thread
      const participant = await db
        .select()
        .from(messageParticipants)
        .where(
          and(
            eq(messageParticipants.threadId, threadId),
            eq(messageParticipants.userId, userId)
          )
        );
      
      if (participant.length === 0) {
        throw new Error("User is not a participant in this thread");
      }
      
      // Mark thread as read for this user
      await db
        .update(messageParticipants)
        .set({ 
          isRead: true,
          lastReadAt: new Date()
        })
        .where(
          and(
            eq(messageParticipants.threadId, threadId),
            eq(messageParticipants.userId, userId)
          )
        );
      
      // Get all messages with sender details
      const messagesTable = messages; // Rename to avoid naming conflict
      const messagesList = await db
        .select({
          id: messagesTable.id,
          senderId: messagesTable.senderId,
          content: messagesTable.content,
          createdAt: messagesTable.createdAt,
          senderName: users.username
        })
        .from(messagesTable)
        .innerJoin(users, eq(messagesTable.senderId, users.id))
        .where(eq(messagesTable.threadId, threadId))
        .orderBy(asc(messagesTable.createdAt));
      
      return messagesList;
    } catch (error) {
      console.error("Error getting thread messages:", error);
      return [];
    }
  }
  
  async getOrCreateThread(userId: number, otherUserId: number): Promise<number> {
    try {
      // Import messaging tables from schema
      const { messageThreads, messageParticipants, messages } = await import("@shared/schema");
      const { eq, or } = await import("drizzle-orm");
      const { sql } = await import("drizzle-orm/sql");
      
      // Check if a thread already exists between these users
      const existingThreads = await db
        .select({
          threadId: messageParticipants.threadId,
          participantCount: sql`count(*)`.as('participant_count')
        })
        .from(messageParticipants)
        .where(
          or(
            eq(messageParticipants.userId, userId),
            eq(messageParticipants.userId, otherUserId)
          )
        )
        .groupBy(messageParticipants.threadId)
        .having(sql`count(*) = 2`);
      
      // Filter to find a thread where both users are participants
      for (const threadInfo of existingThreads) {
        const participants = await db
          .select()
          .from(messageParticipants)
          .where(eq(messageParticipants.threadId, threadInfo.threadId));
        
        const userIds = new Set(participants.map(p => p.userId));
        if (userIds.has(userId) && userIds.has(otherUserId)) {
          return threadInfo.threadId;
        }
      }
      
      // If no thread exists, create a new one
      const thread = await this.createMessageThread();
      await this.addParticipantToThread(thread.id, userId);
      await this.addParticipantToThread(thread.id, otherUserId);
      
      return thread.id;
    } catch (error) {
      console.error("Error getting or creating thread:", error);
      throw error;
    }
  }
  
  async getUnreadMessageCount(userId: number): Promise<number> {
    try {
      // Import messaging tables from schema
      const { messageParticipants } = await import("@shared/schema");
      const { eq, and } = await import("drizzle-orm");
      const { sql } = await import("drizzle-orm/sql");
      
      const result = await db
        .select({
          count: sql`count(*)`.as('count')
        })
        .from(messageParticipants)
        .where(
          and(
            eq(messageParticipants.userId, userId),
            eq(messageParticipants.isRead, false)
          )
        );
      
      return parseInt(result[0].count.toString()) || 0;
    } catch (error) {
      console.error("Error getting unread message count:", error);
      return 0;
    }
  }
}

// Use in-memory storage during development, database storage in production
export const storage = process.env.DATABASE_URL 
  ? new DbStorage() 
  : new MemStorage();

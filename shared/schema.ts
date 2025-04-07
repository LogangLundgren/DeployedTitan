import { pgTable, text, serial, integer, boolean, timestamp, real, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  email: text("email"),
  bio: text("bio"),
  location: text("location"),
  fitnessLevel: text("fitness_level"),
  experienceYears: integer("experience_years"),
  goals: text("goals"),
  certifications: text("certifications"),
  // Store social media as JSON in a text field
  socialMedia: text("social_media"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  bio: true,
  location: true,
  fitnessLevel: true,
  experienceYears: true,
  goals: true,
  certifications: true,
  socialMedia: true,
});

export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  userId: integer("user_id").references(() => users.id),
  isCustom: boolean("is_custom").default(false),
});

export const insertExerciseSchema = createInsertSchema(exercises).pick({
  name: true,
  category: true,
  subcategory: true,
  userId: true,
  isCustom: true,
});

export const workouts = pgTable("workouts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  notes: text("notes"),
  duration: integer("duration"),
  userId: integer("user_id").references(() => users.id).notNull(),
  category: text("category"),
  isPublic: boolean("is_public").default(false),
});

export const insertWorkoutSchema = createInsertSchema(workouts).pick({
  name: true,
  date: true,
  notes: true,
  duration: true,
  userId: true,
  category: true,
  isPublic: true,
});

export const workoutExercises = pgTable("workout_exercises", {
  id: serial("id").primaryKey(),
  workoutId: integer("workout_id").references(() => workouts.id).notNull(),
  exerciseId: integer("exercise_id").references(() => exercises.id).notNull(),
  order: integer("order").notNull(),
});

export const insertWorkoutExerciseSchema = createInsertSchema(workoutExercises).pick({
  workoutId: true,
  exerciseId: true,
  order: true,
});

export const sets = pgTable("sets", {
  id: serial("id").primaryKey(),
  workoutExerciseId: integer("workout_exercise_id").references(() => workoutExercises.id).notNull(),
  weight: real("weight"),
  reps: integer("reps"),
  notes: text("notes"),
  order: integer("order").notNull(),
});

export const insertSetSchema = createInsertSchema(sets).pick({
  workoutExerciseId: true,
  weight: true,
  reps: true,
  notes: true,
  order: true,
});

// Workout template model
export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  userId: integer("user_id").references(() => users.id).notNull(),
  category: text("category"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTemplateSchema = createInsertSchema(templates).pick({
  name: true,
  description: true,
  userId: true,
  category: true,
});

// Template exercises model
export const templateExercises = pgTable("template_exercises", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").references(() => templates.id).notNull(),
  exerciseId: integer("exercise_id").references(() => exercises.id).notNull(),
  order: integer("order").notNull(),
  defaultSets: integer("default_sets"),
  defaultReps: integer("default_reps"),
  defaultWeight: real("default_weight"),
  notes: text("notes"),
});

export const insertTemplateExerciseSchema = createInsertSchema(templateExercises).pick({
  templateId: true,
  exerciseId: true,
  order: true,
  defaultSets: true,
  defaultReps: true,
  defaultWeight: true,
  notes: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;

export type Workout = typeof workouts.$inferSelect;
export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;

export type WorkoutExercise = typeof workoutExercises.$inferSelect;
export type InsertWorkoutExercise = z.infer<typeof insertWorkoutExerciseSchema>;

export type Set = typeof sets.$inferSelect;
export type InsertSet = z.infer<typeof insertSetSchema>;

export type Template = typeof templates.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;

export type TemplateExercise = typeof templateExercises.$inferSelect;
export type InsertTemplateExercise = z.infer<typeof insertTemplateExerciseSchema>;

export interface WorkoutWithDetails extends Workout {
  exercises: (WorkoutExercise & {
    exerciseDetails: Exercise;
    sets: Set[];
  })[];
  totalSets: number;
  totalExercises: number;
  volume: number;
  comments?: Comment[];
  likes?: Like[];
  likesCount?: number;
  commentsCount?: number;
  isLikedByCurrentUser?: boolean;
}

export interface TemplateWithExercises extends Template {
  exercises: (TemplateExercise & {
    exerciseDetails: Exercise;
  })[];
}

// Notifications model
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title"),
  message: text("message").notNull(),
  type: text("type").notNull(), // "info", "success", "warning", "error", "goal", "achievement", "progress", "milestone"
  isRead: boolean("is_read").default(false),
  link: text("link"), // Optional link to navigate to
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  title: true,
  message: true,
  type: true,
  link: true,
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Goals schema
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  targetValue: real("target_value").notNull(),
  currentValue: real("current_value").default(0).notNull(),
  metricType: text("metric_type").notNull(), // weight, reps, volume, workouts, etc.
  exerciseId: integer("exercise_id").references(() => exercises.id),
  category: text("category"), // Strength, Endurance, Habit, etc.
  startDate: timestamp("start_date").defaultNow().notNull(),
  targetDate: timestamp("target_date"),
  completedDate: timestamp("completed_date"),
  isCompleted: boolean("is_completed").default(false).notNull(),
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertGoalSchema = createInsertSchema(goals);

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;

// Milestones schema
export const milestones = pgTable("milestones", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id").notNull().references(() => goals.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  targetValue: real("target_value").notNull(),
  isCompleted: boolean("is_completed").default(false).notNull(),
  completedDate: timestamp("completed_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMilestoneSchema = createInsertSchema(milestones);

export type Milestone = typeof milestones.$inferSelect;
export type InsertMilestone = z.infer<typeof insertMilestoneSchema>;

// Media files schema
export const mediaFiles = pgTable("media_files", {
  id: serial("id").primaryKey(),
  workoutId: integer("workout_id").references(() => workouts.id, { onDelete: "cascade" }),
  workoutExerciseId: integer("workout_exercise_id").references(() => workoutExercises.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id).notNull(),
  fileType: varchar("file_type", { length: 10 }).notNull(), // "image" or "video"
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size"), // size in bytes
  mimeType: varchar("mime_type", { length: 255 }),
  caption: text("caption"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMediaFileSchema = createInsertSchema(mediaFiles).pick({
  workoutId: true,
  workoutExerciseId: true,
  userId: true,
  fileType: true,
  fileUrl: true,
  fileName: true,
  fileSize: true,
  mimeType: true,
  caption: true,
});

export type MediaFile = typeof mediaFiles.$inferSelect;
export type InsertMediaFile = z.infer<typeof insertMediaFileSchema>;

// Comments schema
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  workoutId: integer("workout_id").references(() => workouts.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  workoutId: true,
  userId: true,
  content: true,
});

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

// Likes schema
export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  workoutId: integer("workout_id").references(() => workouts.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLikeSchema = createInsertSchema(likes).pick({
  workoutId: true,
  userId: true,
});

export type Like = typeof likes.$inferSelect;
export type InsertLike = z.infer<typeof insertLikeSchema>;

// Coach profile schema (extends user but with coaching specific fields)
export const coachProfiles = pgTable("coach_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  title: text("title").notNull(), // e.g. "Strength Coach", "Fitness Expert"
  experience: text("experience").notNull(),
  specialties: text("specialties").notNull(), // JSON array of specialties
  biography: text("biography").notNull(),
  hourlyRate: real("hourly_rate"),
  rating: real("rating"),
  ratingsCount: integer("ratings_count").default(0),
  isVerified: boolean("is_verified").default(false),
  isAvailableForHire: boolean("is_available_for_hire").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCoachProfileSchema = createInsertSchema(coachProfiles).pick({
  userId: true,
  title: true,
  experience: true,
  specialties: true,
  biography: true,
  hourlyRate: true,
  isAvailableForHire: true,
});

export type CoachProfile = typeof coachProfiles.$inferSelect;
export type InsertCoachProfile = z.infer<typeof insertCoachProfileSchema>;

// Workout plans schema (packages of templates sold by coaches)
export const workoutPlans = pgTable("workout_plans", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id").references(() => coachProfiles.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: real("price").notNull(),
  durationWeeks: integer("duration_weeks").notNull(),
  difficultyLevel: text("difficulty_level").notNull(), // beginner, intermediate, advanced
  category: text("category").notNull(), // strength, endurance, fat loss, etc.
  featuredImageUrl: text("featured_image_url"),
  goals: text("goals").notNull(), // JSON array of goals this plan addresses
  equipment: text("equipment"), // JSON array of required equipment
  isFeatured: boolean("is_featured").default(false),
  isSoldOut: boolean("is_sold_out").default(false),
  rating: real("rating"),
  ratingsCount: integer("ratings_count").default(0),
  sales: integer("sales").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertWorkoutPlanSchema = createInsertSchema(workoutPlans).pick({
  coachId: true,
  title: true,
  description: true,
  price: true,
  durationWeeks: true,
  difficultyLevel: true,
  category: true,
  featuredImageUrl: true,
  goals: true,
  equipment: true,
  isFeatured: true,
  isSoldOut: true,
});

export type WorkoutPlan = typeof workoutPlans.$inferSelect;
export type InsertWorkoutPlan = z.infer<typeof insertWorkoutPlanSchema>;

// Workout plan days schema (days in a workout plan)
export const workoutPlanDays = pgTable("workout_plan_days", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").references(() => workoutPlans.id, { onDelete: "cascade" }).notNull(),
  dayNumber: integer("day_number").notNull(),
  templateId: integer("template_id").references(() => templates.id),
  title: text("title").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWorkoutPlanDaySchema = createInsertSchema(workoutPlanDays).pick({
  planId: true,
  dayNumber: true,
  templateId: true,
  title: true,
  description: true,
});

export type WorkoutPlanDay = typeof workoutPlanDays.$inferSelect;
export type InsertWorkoutPlanDay = z.infer<typeof insertWorkoutPlanDaySchema>;

// Plan templates schema (templates included in a workout plan)
export const planTemplates = pgTable("plan_templates", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").references(() => workoutPlans.id, { onDelete: "cascade" }).notNull(),
  templateId: integer("template_id").references(() => templates.id, { onDelete: "cascade" }).notNull(),
  weekNumber: integer("week_number").notNull(),
  dayNumber: integer("day_number").notNull(),
  order: integer("order").notNull(),
  notes: text("notes"),
});

export const insertPlanTemplateSchema = createInsertSchema(planTemplates).pick({
  planId: true,
  templateId: true,
  weekNumber: true,
  dayNumber: true,
  order: true,
  notes: true,
});

export type PlanTemplate = typeof planTemplates.$inferSelect;
export type InsertPlanTemplate = z.infer<typeof insertPlanTemplateSchema>;

// Coaching services schema
export const coachingServices = pgTable("coaching_services", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id").references(() => coachProfiles.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: real("price").notNull(),
  durationType: text("duration_type").notNull(), // one-time, weekly, monthly, etc.
  serviceType: text("service_type").notNull(), // 1-on-1, group, consultation, etc.
  isAvailable: boolean("is_available").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCoachingServiceSchema = createInsertSchema(coachingServices).pick({
  coachId: true,
  title: true,
  description: true,
  price: true,
  durationType: true,
  serviceType: true,
  isAvailable: true,
});

export type CoachingService = typeof coachingServices.$inferSelect;
export type InsertCoachingService = z.infer<typeof insertCoachingServiceSchema>;

// User purchases schema
export const purchases = pgTable("purchases", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  planId: integer("plan_id").references(() => workoutPlans.id),
  serviceId: integer("service_id").references(() => coachingServices.id),
  transactionId: text("transaction_id").notNull(),
  amount: real("amount").notNull(),
  status: text("status").notNull(), // completed, refunded, etc.
  purchaseDate: timestamp("purchase_date").defaultNow().notNull(),
});

export const insertPurchaseSchema = createInsertSchema(purchases).pick({
  userId: true,
  planId: true,
  serviceId: true,
  transactionId: true,
  amount: true,
  status: true,
});

export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;

// Reviews schema for plans and coaches
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  coachId: integer("coach_id").references(() => coachProfiles.id),
  planId: integer("plan_id").references(() => workoutPlans.id),
  rating: integer("rating").notNull(),
  review: text("review"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertReviewSchema = createInsertSchema(reviews).pick({
  userId: true,
  coachId: true,
  planId: true,
  rating: true,
  review: true,
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

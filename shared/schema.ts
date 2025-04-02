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

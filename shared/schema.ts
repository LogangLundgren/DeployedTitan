import { pgTable, text, serial, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  email: text("email"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
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
});

export const insertWorkoutSchema = createInsertSchema(workouts).pick({
  name: true,
  date: true,
  notes: true,
  duration: true,
  userId: true,
  category: true,
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
}

export interface TemplateWithExercises extends Template {
  exercises: (TemplateExercise & {
    exerciseDetails: Exercise;
  })[];
}

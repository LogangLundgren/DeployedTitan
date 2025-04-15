import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import Stripe from "stripe";
import { hashPassword, verifyPassword, requireAuth, requireOwnership } from "./auth";

// Initialize Stripe with the secret key
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required environment variable: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-03-31.basil",
});
import { 
  insertUserSchema, 
  insertWorkoutSchema, 
  insertWorkoutExerciseSchema, 
  insertSetSchema, 
  insertExerciseSchema,
  insertTemplateSchema,
  insertTemplateExerciseSchema,
  insertNotificationSchema,
  insertGoalSchema,
  insertMilestoneSchema,
  insertCommentSchema,
  insertLikeSchema,
  insertCoachProfileSchema,
  insertCoachingServiceSchema,
  insertWorkoutPlanSchema,
  insertPlanTemplateSchema,
  insertReviewSchema,
  insertPurchaseSchema,
  insertWorkoutPlanDaySchema,
  insertUserSuggestionSchema,
  Workout,
  TemplateExercise,
  User,
  WorkoutWithDetails,
  Goal,
  Milestone,
  Comment,
  Like,
  CoachProfile,
  WorkoutPlan,
  CoachingService,
  PlanTemplate,
  Purchase,
  Review,
  UserSuggestion
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  // User authentication routes
  app.post("/api/register", async (req, res) => {
    try {
      const { username, email, password, name } = req.body;
      
      if (!username || !password || !email) {
        return res.status(400).json({ 
          message: "Username, email, and password are required" 
        });
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      // Check if email already exists
      const users = await storage.getAllUsers();
      const emailExists = users.some((user: User) => user.email === email);
      if (emailExists) {
        return res.status(409).json({ message: "Email already in use" });
      }
      
      // Hash the password
      const hashedPassword = await hashPassword(password);
      
      // Create the user
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        email,
        name: name || null,
        bio: null,
        location: null,
        fitnessLevel: null,
        experienceYears: null,
        goals: null,
        certifications: null,
        socialMedia: null,
        isCoach: false,
        coachRegistrationDate: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null
      });
      
      // Set session
      req.session.userId = user.id;
      
      // Return the user without password
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(201).json({
        message: "User registered successfully",
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });
  
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Verify password
      const isPasswordValid = await verifyPassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Set session
      req.session.userId = user.id;
      
      // Return the user data without password
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(200).json({
        message: "Login successful",
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });
  
  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password: _, ...userDataWithoutPassword } = user;
      
      // Parse socialMedia JSON string if it exists
      const userWithoutPassword = {
        ...userDataWithoutPassword,
        socialMedia: userDataWithoutPassword.socialMedia ? JSON.parse(userDataWithoutPassword.socialMedia) : null
      };
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.patch("/api/users/:id", async (req, res) => {
    try {
      console.log("Received PATCH request to /api/users/:id");
      console.log("Request body:", req.body);
      console.log("Content-Type:", req.headers['content-type']);
      
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updateSchema = z.object({
        name: z.string().optional(),
        username: z.string().optional(),
        email: z.string().email().optional(),
        bio: z.string().nullable().optional(),
        location: z.string().nullable().optional(),
        fitnessLevel: z.string().nullable().optional(),
        experienceYears: z.coerce.number().nullable().optional(),
        goals: z.string().nullable().optional(),
        certifications: z.string().nullable().optional(),
        socialMedia: z.object({
          instagram: z.string().optional().default(''),
          twitter: z.string().optional().default(''),
          facebook: z.string().optional().default(''),
        }).optional().nullable(),
      });
      
      const updateData = updateSchema.safeParse(req.body);
      
      if (!updateData.success) {
        return res.status(400).json({ message: "Invalid update data", errors: updateData.error.errors });
      }
      
      // Convert socialMedia object to string if it exists
      const dataToUpdate = { 
        ...updateData.data,
        socialMedia: updateData.data.socialMedia ? JSON.stringify(updateData.data.socialMedia) : undefined
      };
      
      // Update the user in the database
      const updatedUser = await storage.updateUser(userId, dataToUpdate);
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user" });
      }
      
      // Remove password from response
      const { password: _, ...userDataWithoutPassword } = updatedUser;
      
      // Parse socialMedia JSON string if it exists
      const userWithoutPassword = {
        ...userDataWithoutPassword,
        socialMedia: userDataWithoutPassword.socialMedia ? JSON.parse(userDataWithoutPassword.socialMedia) : null
      };
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Update user error:", error);
      console.error("Update request body:", req.body);
      // Safe way to report errors without referencing potentially undefined variables
      if (error instanceof z.ZodError) {
        console.error("Update validation errors:", error.errors);
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Exercise routes
  app.get("/api/exercises", async (req, res) => {
    try {
      const category = req.query.category as string;
      let exercises;
      
      if (category) {
        exercises = await storage.getExercisesByCategory(category);
      } else {
        exercises = await storage.getExercises();
      }
      
      res.status(200).json(exercises);
    } catch (error) {
      console.error("Get exercises error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/exercises", async (req, res) => {
    try {
      const exerciseData = insertExerciseSchema.safeParse(req.body);
      
      if (!exerciseData.success) {
        return res.status(400).json({ message: "Invalid exercise data", errors: exerciseData.error.errors });
      }
      
      const exercise = await storage.createExercise(exerciseData.data);
      
      res.status(201).json(exercise);
    } catch (error) {
      console.error("Create exercise error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Workout routes
  app.get("/api/workouts", requireAuth, requireOwnership, async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Valid user ID is required" });
      }
      
      // We should return full workout details when getting all workouts
      const workoutBasics = await storage.getWorkouts(userId);
      
      // Get full details for each workout
      const workoutsWithDetails = await Promise.all(
        workoutBasics.map(workout => storage.getWorkoutWithDetails(workout.id))
      );
      
      // Filter out any undefined results
      const validWorkouts = workoutsWithDetails.filter(workout => workout !== undefined) as WorkoutWithDetails[];
      
      res.status(200).json(validWorkouts);
    } catch (error) {
      console.error("Get workouts error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/workouts/recent", requireAuth, requireOwnership, async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      const limit = parseInt(req.query.limit as string) || 3;
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Valid user ID is required" });
      }
      
      const recentWorkouts = await storage.getRecentWorkouts(userId, limit);
      
      res.status(200).json(recentWorkouts);
    } catch (error) {
      console.error("Get recent workouts error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/workouts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid workout ID is required" });
      }
      
      const workout = await storage.getWorkoutWithDetails(id);
      
      if (!workout) {
        return res.status(404).json({ message: "Workout not found" });
      }
      
      res.status(200).json(workout);
    } catch (error) {
      console.error("Get workout details error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/workouts", requireAuth, async (req, res) => {
    try {
      const workoutData = insertWorkoutSchema.safeParse(req.body);
      
      if (!workoutData.success) {
        return res.status(400).json({ message: "Invalid workout data", errors: workoutData.error.errors });
      }
      
      const workout = await storage.createWorkout(workoutData.data);
      
      res.status(201).json(workout);
    } catch (error) {
      console.error("Create workout error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.put("/api/workouts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid workout ID is required" });
      }
      
      const updateSchema = z.object({
        name: z.string().optional(),
        date: z.coerce.date().optional(),
        notes: z.string().optional(),
        duration: z.number().optional(),
        category: z.string().optional()
      });
      
      const updateData = updateSchema.safeParse(req.body);
      
      if (!updateData.success) {
        return res.status(400).json({ message: "Invalid update data", errors: updateData.error.errors });
      }
      
      // Transform the validated data to ensure proper types
      const updatePayload: Partial<Workout> = {
        ...updateData.data,
        // If date is provided, ensure it's a Date object
        ...(updateData.data.date && { date: new Date(updateData.data.date) })
      };
      
      const updatedWorkout = await storage.updateWorkout(id, updatePayload);
      
      if (!updatedWorkout) {
        return res.status(404).json({ message: "Workout not found" });
      }
      
      res.status(200).json(updatedWorkout);
    } catch (error) {
      console.error("Update workout error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.delete("/api/workouts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid workout ID is required" });
      }
      
      const deleted = await storage.deleteWorkout(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Workout not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Delete workout error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Workout Exercise routes
  app.post("/api/workout-exercises", async (req, res) => {
    try {
      const workoutExerciseData = insertWorkoutExerciseSchema.safeParse(req.body);
      
      if (!workoutExerciseData.success) {
        return res.status(400).json({ message: "Invalid workout exercise data", errors: workoutExerciseData.error.errors });
      }
      
      const workoutExercise = await storage.createWorkoutExercise(workoutExerciseData.data);
      
      res.status(201).json(workoutExercise);
    } catch (error) {
      console.error("Create workout exercise error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.delete("/api/workout-exercises/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid workout exercise ID is required" });
      }
      
      const deleted = await storage.deleteWorkoutExercise(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Workout exercise not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Delete workout exercise error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Set routes
  app.post("/api/sets", async (req, res) => {
    try {
      const setData = insertSetSchema.safeParse(req.body);
      
      if (!setData.success) {
        return res.status(400).json({ message: "Invalid set data", errors: setData.error.errors });
      }
      
      const set = await storage.createSet(setData.data);
      
      res.status(201).json(set);
    } catch (error) {
      console.error("Create set error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.put("/api/sets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid set ID is required" });
      }
      
      const updateSchema = z.object({
        weight: z.number().nullable().optional(),
        reps: z.number().nullable().optional(),
        notes: z.string().nullable().optional(),
        order: z.number().optional()
      });
      
      const updateData = updateSchema.safeParse(req.body);
      
      if (!updateData.success) {
        return res.status(400).json({ message: "Invalid update data", errors: updateData.error.errors });
      }
      
      const updatedSet = await storage.updateSet(id, updateData.data);
      
      if (!updatedSet) {
        return res.status(404).json({ message: "Set not found" });
      }
      
      res.status(200).json(updatedSet);
    } catch (error) {
      console.error("Update set error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.delete("/api/sets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid set ID is required" });
      }
      
      const deleted = await storage.deleteSet(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Set not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Delete set error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Template routes
  app.get("/api/templates", requireAuth, requireOwnership, async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Valid user ID is required" });
      }
      
      const templates = await storage.getTemplates(userId);
      
      res.status(200).json(templates);
    } catch (error) {
      console.error("Get templates error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid template ID is required" });
      }
      
      const template = await storage.getTemplateWithExercises(id);
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.status(200).json(template);
    } catch (error) {
      console.error("Get template details error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/templates", async (req, res) => {
    try {
      const templateData = insertTemplateSchema.safeParse(req.body);
      
      if (!templateData.success) {
        return res.status(400).json({ message: "Invalid template data", errors: templateData.error.errors });
      }
      
      const template = await storage.createTemplate(templateData.data);
      
      res.status(201).json(template);
    } catch (error) {
      console.error("Create template error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.put("/api/templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid template ID is required" });
      }
      
      const updateSchema = z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        category: z.string().optional()
      });
      
      const updateData = updateSchema.safeParse(req.body);
      
      if (!updateData.success) {
        return res.status(400).json({ message: "Invalid update data", errors: updateData.error.errors });
      }
      
      const updatedTemplate = await storage.updateTemplate(id, updateData.data);
      
      if (!updatedTemplate) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.status(200).json(updatedTemplate);
    } catch (error) {
      console.error("Update template error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.delete("/api/templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid template ID is required" });
      }
      
      try {
        const deleted = await storage.deleteTemplate(id);
        
        if (!deleted) {
          return res.status(404).json({ message: "Template not found" });
        }
        
        res.status(204).end();
      } catch (error: any) {
        // Check if the error is a foreign key constraint violation
        if (error.code === '23503') {
          return res.status(400).json({ 
            message: "This template cannot be deleted because it is being used in workout plans",
            detail: error.detail
          });
        }
        throw error; // Re-throw for the outer catch block
      }
    } catch (error) {
      console.error("Delete template error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Template Exercise routes
  app.post("/api/template-exercises", async (req, res) => {
    try {
      const templateExerciseData = insertTemplateExerciseSchema.safeParse(req.body);
      
      if (!templateExerciseData.success) {
        return res.status(400).json({ 
          message: "Invalid template exercise data", 
          errors: templateExerciseData.error.errors 
        });
      }
      
      const templateExercise = await storage.createTemplateExercise(templateExerciseData.data);
      
      res.status(201).json(templateExercise);
    } catch (error) {
      console.error("Create template exercise error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.put("/api/template-exercises/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid template exercise ID is required" });
      }
      
      console.log("Update template exercise request body:", req.body);
      console.log("Content-Type:", req.headers['content-type']);
      
      const updateSchema = z.object({
        order: z.number().nullable().optional(),
        defaultSets: z.number().nullable().optional(),
        defaultReps: z.number().nullable().optional(),
        defaultWeight: z.number().nullable().optional(),
        notes: z.string().nullable().optional()
      });
      
      const updateData = updateSchema.safeParse(req.body);
      
      if (!updateData.success) {
        return res.status(400).json({ message: "Invalid update data", errors: updateData.error.errors });
      }
      
      console.log("Validated update data:", updateData.data);
      // Ensure at least one field is present to update
      if (Object.keys(updateData.data).length === 0) {
        return res.status(400).json({ message: "At least one field must be provided for update" });
      }
      
      // Filter out undefined values and ensure proper typing
      const filteredUpdateData: Partial<TemplateExercise> = {};
      
      if (updateData.data.defaultSets !== undefined) {
        filteredUpdateData.defaultSets = updateData.data.defaultSets;
      }
      
      if (updateData.data.defaultReps !== undefined) {
        filteredUpdateData.defaultReps = updateData.data.defaultReps;
      }
      
      if (updateData.data.defaultWeight !== undefined) {
        filteredUpdateData.defaultWeight = updateData.data.defaultWeight;
      }
      
      if (updateData.data.notes !== undefined) {
        filteredUpdateData.notes = updateData.data.notes;
      }
      
      if (updateData.data.order !== undefined && updateData.data.order !== null) {
        filteredUpdateData.order = updateData.data.order;
      }
      
      console.log("Filtered update data:", filteredUpdateData);
      
      const updatedTemplateExercise = await storage.updateTemplateExercise(id, filteredUpdateData);
      
      if (!updatedTemplateExercise) {
        return res.status(404).json({ message: "Template exercise not found" });
      }
      
      res.status(200).json(updatedTemplateExercise);
    } catch (error) {
      console.error("Update template exercise error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.delete("/api/template-exercises/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid template exercise ID is required" });
      }
      
      const deleted = await storage.deleteTemplateExercise(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Template exercise not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Delete template exercise error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Create workout from template
  app.post("/api/templates/:id/create-workout", async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      
      if (isNaN(templateId)) {
        return res.status(400).json({ message: "Valid template ID is required" });
      }
      
      const { userId, isPublic } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      // Get template with exercises
      const template = await storage.getTemplateWithExercises(templateId);
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      // Create new workout
      const workout = await storage.createWorkout({
        name: template.name,
        date: new Date(),
        userId: userId,
        category: template.category,
        notes: `Created from template: ${template.name}`,
        isPublic: isPublic === true // convert to boolean in case undefined/null
      });
      
      // Add exercises from template to the workout
      for (const templateExercise of template.exercises) {
        const workoutExercise = await storage.createWorkoutExercise({
          workoutId: workout.id,
          exerciseId: templateExercise.exerciseId,
          order: templateExercise.order
        });
        
        // Create default sets if specified in template
        if (templateExercise.defaultSets) {
          for (let i = 0; i < templateExercise.defaultSets; i++) {
            await storage.createSet({
              workoutExerciseId: workoutExercise.id,
              weight: templateExercise.defaultWeight || null,
              reps: templateExercise.defaultReps || null,
              order: i,
              notes: null
            });
          }
        }
      }
      
      // Get the complete workout with all details
      const workoutWithDetails = await storage.getWorkoutWithDetails(workout.id);
      
      res.status(201).json(workoutWithDetails);
    } catch (error) {
      console.error("Create workout from template error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Notification routes
  app.get("/api/notifications", requireAuth, requireOwnership, async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Valid user ID is required" });
      }
      
      const notifications = await storage.getNotifications(userId);
      
      res.status(200).json(notifications);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/notifications/unread-count", requireAuth, requireOwnership, async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Valid user ID is required" });
      }
      
      const count = await storage.getUnreadNotificationsCount(userId);
      
      res.status(200).json({ count });
    } catch (error) {
      console.error("Get unread notifications count error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/notifications", async (req, res) => {
    try {
      const notificationData = insertNotificationSchema.safeParse(req.body);
      
      if (!notificationData.success) {
        return res.status(400).json({ message: "Invalid notification data", errors: notificationData.error.errors });
      }
      
      const notification = await storage.createNotification(notificationData.data);
      
      res.status(201).json(notification);
    } catch (error) {
      console.error("Create notification error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.patch("/api/notifications/:id/mark-read", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid notification ID is required" });
      }
      
      const notification = await storage.markNotificationAsRead(id);
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      res.status(200).json(notification);
    } catch (error) {
      console.error("Mark notification as read error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.patch("/api/notifications/mark-all-read", async (req, res) => {
    try {
      const userId = parseInt(req.body.userId as string);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Valid user ID is required" });
      }
      
      const success = await storage.markAllNotificationsAsRead(userId);
      
      if (!success) {
        return res.status(404).json({ message: "No unread notifications found" });
      }
      
      res.status(200).json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Mark all notifications as read error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Goal routes
  app.get("/api/goals", requireAuth, requireOwnership, async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Valid user ID is required" });
      }
      
      const goals = await storage.getGoals(userId);
      
      res.status(200).json(goals);
    } catch (error) {
      console.error("Get goals error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/goals/public", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || undefined;
      
      const publicGoals = await storage.getPublicGoals(limit);
      
      res.status(200).json(publicGoals);
    } catch (error) {
      console.error("Get public goals error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/goals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid goal ID is required" });
      }
      
      const goal = await storage.getGoal(id);
      
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      res.status(200).json(goal);
    } catch (error) {
      console.error("Get goal error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/goals", async (req, res) => {
    try {
      // Modify the schema on the fly to parse date strings
      const goalSchema = z.object({
        userId: z.number(),
        title: z.string(),
        description: z.string().optional(),
        targetValue: z.number(),
        currentValue: z.number(),
        metricType: z.string(),
        exerciseId: z.number().nullable().optional(),
        category: z.string(),
        startDate: z.string().transform(str => new Date(str)),
        targetDate: z.string().transform(str => new Date(str)),
        isPublic: z.boolean(),
        isCompleted: z.boolean()
      });
      
      const goalData = goalSchema.safeParse(req.body);
      
      if (!goalData.success) {
        return res.status(400).json({ message: "Invalid goal data", errors: goalData.error.errors });
      }
      
      const goal = await storage.createGoal(goalData.data);
      
      res.status(201).json(goal);
    } catch (error) {
      console.error("Create goal error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/goals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid goal ID is required" });
      }
      
      const updateSchema = z.object({
        name: z.string().optional(),
        description: z.string().nullable().optional(),
        targetValue: z.number().optional(),
        currentValue: z.number().optional(),
        unit: z.string().optional(),
        deadline: z.coerce.date().nullable().optional(),
        category: z.string().optional(),
        isPublic: z.boolean().optional(),
        isCompleted: z.boolean().optional()
      });
      
      const updateData = updateSchema.safeParse(req.body);
      
      if (!updateData.success) {
        return res.status(400).json({ message: "Invalid update data", errors: updateData.error.errors });
      }
      
      const updatedGoal = await storage.updateGoal(id, updateData.data);
      
      if (!updatedGoal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      res.status(200).json(updatedGoal);
    } catch (error) {
      console.error("Update goal error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/goals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid goal ID is required" });
      }
      
      const deleted = await storage.deleteGoal(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Delete goal error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/goals/:id/progress", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid goal ID is required" });
      }
      
      const updateSchema = z.object({
        currentValue: z.number()
      });
      
      const updateData = updateSchema.safeParse(req.body);
      
      if (!updateData.success) {
        return res.status(400).json({ message: "Invalid update data", errors: updateData.error.errors });
      }
      
      const updatedGoal = await storage.updateGoalProgress(id, updateData.data.currentValue);
      
      if (!updatedGoal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      res.status(200).json(updatedGoal);
    } catch (error) {
      console.error("Update goal progress error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Milestone routes
  app.get("/api/milestones", async (req, res) => {
    try {
      const goalId = parseInt(req.query.goalId as string);
      
      if (isNaN(goalId)) {
        return res.status(400).json({ message: "Valid goal ID is required" });
      }
      
      const milestones = await storage.getMilestones(goalId);
      
      res.status(200).json(milestones);
    } catch (error) {
      console.error("Get milestones error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/milestones", async (req, res) => {
    try {
      const milestoneData = insertMilestoneSchema.safeParse(req.body);
      
      if (!milestoneData.success) {
        return res.status(400).json({ message: "Invalid milestone data", errors: milestoneData.error.errors });
      }
      
      const milestone = await storage.createMilestone(milestoneData.data);
      
      res.status(201).json(milestone);
    } catch (error) {
      console.error("Create milestone error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/milestones/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid milestone ID is required" });
      }
      
      const updateSchema = z.object({
        description: z.string().optional(),
        targetValue: z.number().optional(),
        rewards: z.string().nullable().optional(),
        isCompleted: z.boolean().optional()
      });
      
      const updateData = updateSchema.safeParse(req.body);
      
      if (!updateData.success) {
        return res.status(400).json({ message: "Invalid update data", errors: updateData.error.errors });
      }
      
      const updatedMilestone = await storage.updateMilestone(id, updateData.data);
      
      if (!updatedMilestone) {
        return res.status(404).json({ message: "Milestone not found" });
      }
      
      res.status(200).json(updatedMilestone);
    } catch (error) {
      console.error("Update milestone error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/milestones/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid milestone ID is required" });
      }
      
      const deleted = await storage.deleteMilestone(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Milestone not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Delete milestone error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/milestones/:id/complete", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid milestone ID is required" });
      }
      
      const completedMilestone = await storage.completeMilestone(id);
      
      if (!completedMilestone) {
        return res.status(404).json({ message: "Milestone not found" });
      }
      
      res.status(200).json(completedMilestone);
    } catch (error) {
      console.error("Complete milestone error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Comment routes
  app.get("/api/comments/:workoutId", async (req, res) => {
    try {
      const workoutId = parseInt(req.params.workoutId);
      
      if (isNaN(workoutId)) {
        return res.status(400).json({ message: "Valid workout ID is required" });
      }
      
      const comments = await storage.getComments(workoutId);
      
      res.status(200).json(comments);
    } catch (error) {
      console.error("Get comments error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/comments", async (req, res) => {
    try {
      const commentData = insertCommentSchema.safeParse(req.body);
      
      if (!commentData.success) {
        return res.status(400).json({ message: "Invalid comment data", errors: commentData.error.errors });
      }
      
      const comment = await storage.createComment(commentData.data);
      
      res.status(201).json(comment);
    } catch (error) {
      console.error("Create comment error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.put("/api/comments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid comment ID is required" });
      }
      
      const { content } = req.body;
      
      if (!content || typeof content !== 'string') {
        return res.status(400).json({ message: "Content is required and must be a string" });
      }
      
      const updatedComment = await storage.updateComment(id, content);
      
      if (!updatedComment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      res.status(200).json(updatedComment);
    } catch (error) {
      console.error("Update comment error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.delete("/api/comments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid comment ID is required" });
      }
      
      const deleted = await storage.deleteComment(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Delete comment error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Like routes
  app.get("/api/likes/:workoutId", async (req, res) => {
    try {
      const workoutId = parseInt(req.params.workoutId);
      
      if (isNaN(workoutId)) {
        return res.status(400).json({ message: "Valid workout ID is required" });
      }
      
      const likes = await storage.getLikes(workoutId);
      
      res.status(200).json(likes);
    } catch (error) {
      console.error("Get likes error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/likes/:workoutId/count", async (req, res) => {
    try {
      const workoutId = parseInt(req.params.workoutId);
      
      if (isNaN(workoutId)) {
        return res.status(400).json({ message: "Valid workout ID is required" });
      }
      
      const count = await storage.getLikeCount(workoutId);
      
      res.status(200).json({ count });
    } catch (error) {
      console.error("Get like count error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/likes/:workoutId/users/:userId", async (req, res) => {
    try {
      const workoutId = parseInt(req.params.workoutId);
      const userId = parseInt(req.params.userId);
      
      if (isNaN(workoutId) || isNaN(userId)) {
        return res.status(400).json({ message: "Valid workout ID and user ID are required" });
      }
      
      const isLiked = await storage.isLikedByUser(workoutId, userId);
      
      res.status(200).json({ isLiked });
    } catch (error) {
      console.error("Is workout liked error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/likes/toggle", async (req, res) => {
    try {
      const { workoutId, userId } = req.body;
      
      if (!workoutId || !userId || isNaN(workoutId) || isNaN(userId)) {
        return res.status(400).json({ message: "Valid workout ID and user ID are required" });
      }
      
      const result = await storage.toggleLike(workoutId, userId);
      
      res.status(200).json({ success: result });
    } catch (error) {
      console.error("Toggle like error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Coach Profile routes
  app.get("/api/coaches", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
      const featured = req.query.featured === 'true';
      const query = req.query.query as string;
      const category = req.query.category as string;
      
      let coaches;
      
      if (featured) {
        coaches = await storage.getFeaturedCoaches(limit);
      } else if (query) {
        coaches = await storage.searchCoaches(query, category, limit);
      } else {
        coaches = await storage.listCoaches(limit, offset);
      }
      
      // Get user data for each coach
      const coachesWithUserInfo = await Promise.all(
        coaches.map(async (coach) => {
          const user = await storage.getUser(coach.userId);
          if (!user) return coach;
          
          // Remove password from user data
          const { password: _, ...userWithoutPassword } = user;
          
          return {
            ...coach,
            user: {
              ...userWithoutPassword,
              socialMedia: userWithoutPassword.socialMedia ? JSON.parse(userWithoutPassword.socialMedia) : null
            }
          };
        })
      );
      
      res.status(200).json(coachesWithUserInfo);
    } catch (error) {
      console.error("Get coaches error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Coach profile routes for the settings page
  app.get("/api/coaches/profile", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Valid user ID is required" });
      }
      
      const coachProfile = await storage.getCoachProfile(userId);
      
      if (!coachProfile) {
        return res.status(404).json({ message: "Coach profile not found" });
      }
      
      res.status(200).json(coachProfile);
    } catch (error) {
      console.error("Get coach profile error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/coaches/profile/new", async (req, res) => {
    try {
      const coachProfileData = {
        data: {
          userId: req.body.userId,
          title: req.body.title,
          biography: req.body.biography,
          experience: req.body.experience,
          specialties: req.body.specialties,
          hourlyRate: req.body.hourlyRate || 0,
          isAvailableForHire: req.body.isAvailableForHire || true,
          rating: null,
          ratingsCount: 0,
          isVerified: false
        }
      };
      
      // Check if profile already exists for this user
      const existingProfile = await storage.getCoachProfile(coachProfileData.data.userId);
      
      if (existingProfile) {
        return res.status(400).json({ message: "Coach profile already exists for this user" });
      }
      
      const coachProfile = await storage.createCoachProfile(coachProfileData.data);
      res.status(201).json(coachProfile);
    } catch (error) {
      console.error("Create coach profile error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.patch("/api/coaches/profile/:id", async (req, res) => {
    try {
      const id = req.params.id === 'new' ? 0 : parseInt(req.params.id);
      
      // If it's a new profile request, handle it with the POST endpoint
      if (id === 0) {
        const newProfileResponse = await fetch(`${req.protocol}://${req.get('host')}/api/coaches/profile/new`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(req.body)
        });
        
        const newProfileData = await newProfileResponse.json();
        return res.status(newProfileResponse.status).json(newProfileData);
      }
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid coach profile ID is required" });
      }
      
      const coachProfile = await storage.getCoachProfileById(id);
      
      if (!coachProfile) {
        return res.status(404).json({ message: "Coach profile not found" });
      }
      
      // Create update object with only the fields that are being updated
      const updatedProfileData: Partial<any> = {};
      
      if (req.body.userId !== undefined) updatedProfileData.userId = req.body.userId;
      if (req.body.title !== undefined) updatedProfileData.title = req.body.title;
      if (req.body.biography !== undefined) updatedProfileData.biography = req.body.biography;
      if (req.body.experience !== undefined) updatedProfileData.experience = req.body.experience;
      if (req.body.specialties !== undefined) updatedProfileData.specialties = req.body.specialties;
      if (req.body.hourlyRate !== undefined) updatedProfileData.hourlyRate = req.body.hourlyRate;
      if (req.body.isAvailableForHire !== undefined) updatedProfileData.isAvailableForHire = req.body.isAvailableForHire;
      
      const updatedProfile = await storage.updateCoachProfile(id, updatedProfileData);
      res.status(200).json(updatedProfile);
    } catch (error) {
      console.error("Update coach profile error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/coaches/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid coach ID is required" });
      }
      
      const coach = await storage.getCoachProfileById(id);
      
      if (!coach) {
        return res.status(404).json({ message: "Coach profile not found" });
      }
      
      // Get user data
      const user = await storage.getUser(coach.userId);
      if (!user) {
        return res.status(404).json({ message: "Coach user data not found" });
      }
      
      // Remove password from user data
      const { password: _, ...userWithoutPassword } = user;
      
      const coachWithUser = {
        ...coach,
        user: {
          ...userWithoutPassword,
          socialMedia: userWithoutPassword.socialMedia ? JSON.parse(userWithoutPassword.socialMedia) : null
        }
      };
      
      res.status(200).json(coachWithUser);
    } catch (error) {
      console.error("Get coach profile error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/users/:userId/coach-profile", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Valid user ID is required" });
      }
      
      const coachProfile = await storage.getCoachProfile(userId);
      
      if (!coachProfile) {
        return res.status(404).json({ message: "Coach profile not found for this user" });
      }
      
      res.status(200).json(coachProfile);
    } catch (error) {
      console.error("Get user coach profile error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/coach-profiles", async (req, res) => {
    try {
      const coachProfileData = insertCoachProfileSchema.safeParse(req.body);
      
      if (!coachProfileData.success) {
        return res.status(400).json({ message: "Invalid coach profile data", errors: coachProfileData.error.errors });
      }
      
      // Check if user exists
      const user = await storage.getUser(coachProfileData.data.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user already has a coach profile
      const existingProfile = await storage.getCoachProfile(coachProfileData.data.userId);
      if (existingProfile) {
        return res.status(409).json({ message: "User already has a coach profile" });
      }
      
      const coachProfile = await storage.createCoachProfile(coachProfileData.data);
      
      res.status(201).json(coachProfile);
    } catch (error) {
      console.error("Create coach profile error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.put("/api/coach-profiles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid coach profile ID is required" });
      }
      
      const updateSchema = z.object({
        title: z.string().optional(),
        experience: z.string().optional(),
        specialties: z.string().optional(),
        biography: z.string().optional(),
        hourlyRate: z.number().nullable().optional(),
        isAvailableForHire: z.boolean().optional(),
      });
      
      const updateData = updateSchema.safeParse(req.body);
      
      if (!updateData.success) {
        return res.status(400).json({ message: "Invalid update data", errors: updateData.error.errors });
      }
      
      const updatedCoachProfile = await storage.updateCoachProfile(id, updateData.data);
      
      if (!updatedCoachProfile) {
        return res.status(404).json({ message: "Coach profile not found" });
      }
      
      res.status(200).json(updatedCoachProfile);
    } catch (error) {
      console.error("Update coach profile error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Workout Plans routes
  app.get("/api/workout-plans", async (req, res) => {
    try {
      const coachId = req.query.coachId ? parseInt(req.query.coachId as string) : undefined;
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const featured = req.query.featured === 'true';
      const query = req.query.query as string;
      const category = req.query.category as string;
      const publishedOnly = req.query.publishedOnly === 'true'; // Only true when explicitly set to true
      
      console.log("MARKETPLACE DEBUG - API request params:", { 
        coachId, userId, limit, featured, query, category, publishedOnly 
      });
      
      let plans;
      
      if (coachId) {
        // When viewing as a coach, show all plans (both published and unpublished)
        plans = await storage.getWorkoutPlans(coachId, publishedOnly);
      } else if (userId) {
        // When viewing purchased plans, show all
        plans = await storage.getPurchasedWorkoutPlans(userId);
      } else if (featured) {
        // Featured plans should already be filtered by isPublished
        plans = await storage.getFeaturedWorkoutPlans(limit);
      } else if (query) {
        // For marketplace search, only show published plans by default
        plans = await storage.searchWorkoutPlans(query, category, limit);
        console.log("MARKETPLACE DEBUG - Results after DB query:", 
          plans.map(p => ({id: p.id, title: p.title, isPublished: p.isPublished}))
        );
      } else {
        // For general browsing in marketplace
        console.log("MARKETPLACE DEBUG - Fetching ALL plans with published flag:", publishedOnly);
        // Important - this API is called from marketplace with publishedOnly=true
        // Get all plans from the database first
        plans = await storage.getAllWorkoutPlans();
        
        console.log("MARKETPLACE DEBUG - Got ALL plans before filtering:", 
          plans.map(p => ({id: p.id, title: p.title, isPublished: p.isPublished}))
        );
        
        // Filter by category if needed
        if (category) {
          plans = plans.filter(plan => plan.category === category);
        }
        
        // Now filter published plans only
        if (publishedOnly) {
          console.log("MARKETPLACE DEBUG - Filtering for published plans only");
          // CRITICAL FIX: Force a proper boolean check here
          plans = plans.filter(plan => plan.isPublished === true);
          console.log("MARKETPLACE DEBUG - After published filtering:", 
            plans.map(p => ({id: p.id, title: p.title, isPublished: p.isPublished}))
          );
        }
        
        // Apply limit if needed
        if (limit && limit > 0) {
          plans = plans.slice(0, limit);
        }
      }
      
      res.status(200).json(plans);
    } catch (error) {
      console.error("Get workout plans error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Check if workout plan exists
  app.get("/api/workout-plans/:id/check", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid workout plan ID is required" });
      }
      
      const exists = await storage.checkWorkoutPlanExists(id);
      res.json({ exists, id });
    } catch (error) {
      console.error("Error checking workout plan existence:", error);
      res.status(500).json({ message: "Failed to check workout plan existence" });
    }
  });
  
  app.get("/api/workout-plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid workout plan ID is required" });
      }
      
      const plan = await storage.getWorkoutPlan(id);
      
      if (!plan) {
        return res.status(404).json({ message: "Workout plan not found" });
      }
      
      // Get coach profile
      const coach = await storage.getCoachProfileById(plan.coachId);
      if (!coach) {
        return res.status(404).json({ message: "Coach profile not found" });
      }
      
      // Get user data for coach
      const user = await storage.getUser(coach.userId);
      if (!user) {
        return res.status(404).json({ message: "Coach user data not found" });
      }
      
      // Remove password from user data
      const { password: _, ...userWithoutPassword } = user;
      
      // Get plan templates
      const planTemplates = await storage.getPlanTemplates(id);
      
      // Get full template details for each plan template
      const templatesWithDetails = await Promise.all(
        planTemplates.map(async (pt) => {
          const template = await storage.getTemplateWithExercises(pt.templateId);
          return {
            ...pt,
            template
          };
        })
      );
      
      // Filter out any templates that couldn't be found
      const validTemplates = templatesWithDetails.filter(pt => pt.template !== undefined);
      
      const planWithDetails = {
        ...plan,
        coach: {
          ...coach,
          user: {
            ...userWithoutPassword,
            socialMedia: userWithoutPassword.socialMedia ? JSON.parse(userWithoutPassword.socialMedia) : null
          }
        },
        templates: validTemplates,
        // Parse JSON strings if they exist
        goals: plan.goals ? JSON.parse(plan.goals) : [],
        equipment: plan.equipment ? JSON.parse(plan.equipment) : []
      };
      
      res.status(200).json(planWithDetails);
    } catch (error) {
      console.error("Get workout plan error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/workout-plans", async (req, res) => {
    try {
      // Prepare data for validation - parse JSON strings if provided
      const rawData = {
        ...req.body,
        goals: typeof req.body.goals === 'string' ? req.body.goals : JSON.stringify(req.body.goals || []),
        equipment: typeof req.body.equipment === 'string' ? req.body.equipment : JSON.stringify(req.body.equipment || [])
      };
      
      const workoutPlanData = insertWorkoutPlanSchema.safeParse(rawData);
      
      if (!workoutPlanData.success) {
        return res.status(400).json({ message: "Invalid workout plan data", errors: workoutPlanData.error.errors });
      }
      
      // Check if coach exists
      const coach = await storage.getCoachProfileById(workoutPlanData.data.coachId);
      if (!coach) {
        return res.status(404).json({ message: "Coach profile not found" });
      }
      
      const workoutPlan = await storage.createWorkoutPlan(workoutPlanData.data);
      
      res.status(201).json(workoutPlan);
    } catch (error) {
      console.error("Create workout plan error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // The workout plan check endpoint is already defined above

  app.put("/api/workout-plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid workout plan ID is required" });
      }
      
      console.log("TROUBLESHOOTING - Updating workout plan with ID:", id);
      console.log("TROUBLESHOOTING - Raw request body:", req.body);
      
      // Check if this is a publishing request
      const isPublishingRequest = req.body.isPublished === true;
      console.log("TROUBLESHOOTING - Is publishing request:", isPublishingRequest);
      
      const updateSchema = z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        price: z.number().optional(),
        durationWeeks: z.number().optional(),
        difficultyLevel: z.string().optional(),
        category: z.string().optional(),
        featuredImageUrl: z.string().nullable().optional(),
        goals: z.union([z.string(), z.array(z.string())]).optional(),
        equipment: z.union([z.string(), z.array(z.string())]).optional(),
        isFeatured: z.boolean().optional(),
        isSoldOut: z.boolean().optional(),
        isPublished: z.boolean().optional(),
        planTemplates: z.array(z.number()).optional(),
        updatedAt: z.any().optional(), // Allow client to force timestamp updates
      });
      // CRITICAL: Special handling for publish requests with just isPublished=true
      if (req.body.isPublished === true && Object.keys(req.body).length === 1) {
        console.log("PUBLISH UPDATE DETECTED - Direct publish request!");
        
        // Get the existing plan first to maintain all other data
        const existingPlan = await storage.getWorkoutPlan(id);
        if (!existingPlan) {
          return res.status(404).json({ message: "Workout plan not found" });
        }
        
        // Only update the isPublished flag
        const updatedPlan = await storage.updateWorkoutPlan(id, {
          isPublished: true,
          updatedAt: new Date()
        });
        
        if (!updatedPlan) {
          return res.status(500).json({ message: "Failed to publish workout plan" });
        }
        
        return res.status(200).json(updatedPlan);
      }
      
      // TROUBLESHOOTING: Use safeParse to get detailed error information
      const updateData = updateSchema.safeParse(req.body);
      
      if (!updateData.success) {
        console.error("TROUBLESHOOTING - Schema validation failed:", updateData.error.errors);
        return res.status(400).json({ 
          message: "Invalid update data", 
          errors: updateData.error.errors 
        });
      }
      
      // Process goals and equipment to ensure proper JSON string format for storage
      const processedData = {
        ...updateData.data,
        // If goals is an array, stringify it, otherwise keep as is
        goals: Array.isArray(updateData.data.goals) 
          ? JSON.stringify(updateData.data.goals) 
          : updateData.data.goals,
        // If equipment is an array, stringify it, otherwise keep as is
        equipment: Array.isArray(updateData.data.equipment) 
          ? JSON.stringify(updateData.data.equipment) 
          : updateData.data.equipment
      };
      
      // Extract planTemplates from update data to handle separately
      const { planTemplates, ...dataToUpdate } = processedData;
      
      // Ensure we always have data to update
      dataToUpdate.updatedAt = new Date();
      
      // TROUBLESHOOTING: Log the processed data before database update
      console.log("TROUBLESHOOTING - Final data to update workout plan:", dataToUpdate);
      
      // Double check the isPublished flag is set correctly for publishing action
      if (isPublishingRequest) {
        console.log("TROUBLESHOOTING - Setting workout plan to published state");
        dataToUpdate.isPublished = true;
      }
      
      // Update the workout plan with our robust storage function
      const updatedWorkoutPlan = await storage.updateWorkoutPlan(id, dataToUpdate);
      
      if (!updatedWorkoutPlan) {
        return res.status(404).json({ message: "Workout plan not found" });
      }
      
      // If plan templates are provided, update them
      if (planTemplates && planTemplates.length > 0) {
        // First, get existing plan templates
        const existingTemplates = await storage.getPlanTemplates(id);
        
        // Delete all existing plan template associations
        for (const template of existingTemplates) {
          await storage.deletePlanTemplate(template.id);
        }
        
        // Create new plan template associations
        for (const templateId of planTemplates) {
          await storage.createPlanTemplate({
            planId: id,
            templateId,
            weekNumber: 1, // Default values
            dayNumber: 1,
            order: 1,
            notes: null
          });
        }
      }
      
      if (!updatedWorkoutPlan) {
        return res.status(404).json({ message: "Workout plan not found" });
      }
      
      res.status(200).json(updatedWorkoutPlan);
    } catch (error) {
      console.error("Update workout plan error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.delete("/api/workout-plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid workout plan ID is required" });
      }
      
      const deleted = await storage.deleteWorkoutPlan(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Workout plan not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Delete workout plan error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Dedicated endpoint for publishing workout plans
  app.post("/api/workout-plans/:id/publish", async (req, res) => {
    try {
      console.log("PUBLISH ENDPOINT TRIGGERED - THIS IS OUR NEW ENDPOINT");
      
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid workout plan ID is required" });
      }
      
      // Get the current plan to make sure it exists
      const plan = await storage.getWorkoutPlan(id);
      
      if (!plan) {
        return res.status(404).json({ message: "Workout plan not found" });
      }
      
      console.log(`Publishing workout plan ${id}: "${plan.title}"`);
      
      // Update only the isPublished field to true
      const updatedPlan = await storage.updateWorkoutPlan(id, {
        isPublished: true,
        // Including updatedAt ensures we get a new timestamp
        updatedAt: new Date()
      });
      
      if (!updatedPlan) {
        return res.status(500).json({ message: "Failed to publish workout plan" });
      }
      
      // Return the full updated plan
      res.status(200).json(updatedPlan);
    } catch (error) {
      console.error("Publish workout plan error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Plan Template routes
  app.get("/api/workout-plans/:planId/templates", async (req, res) => {
    try {
      const planId = parseInt(req.params.planId);
      
      if (isNaN(planId)) {
        return res.status(400).json({ message: "Valid workout plan ID is required" });
      }
      
      const planTemplates = await storage.getPlanTemplates(planId);
      
      // Get full template details for each plan template
      const templatesWithDetails = await Promise.all(
        planTemplates.map(async (pt) => {
          const template = await storage.getTemplateWithExercises(pt.templateId);
          return {
            ...pt,
            template
          };
        })
      );
      
      // Filter out any templates that couldn't be found
      const validTemplates = templatesWithDetails.filter(pt => pt.template !== undefined);
      
      res.status(200).json(validTemplates);
    } catch (error) {
      console.error("Get plan templates error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/plan-templates", async (req, res) => {
    try {
      const planTemplateData = insertPlanTemplateSchema.safeParse(req.body);
      
      if (!planTemplateData.success) {
        return res.status(400).json({ message: "Invalid plan template data", errors: planTemplateData.error.errors });
      }
      
      // Check if plan exists
      const plan = await storage.getWorkoutPlan(planTemplateData.data.planId);
      if (!plan) {
        return res.status(404).json({ message: "Workout plan not found" });
      }
      
      // Check if template exists
      const template = await storage.getTemplateWithExercises(planTemplateData.data.templateId);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      const planTemplate = await storage.createPlanTemplate(planTemplateData.data);
      
      res.status(201).json(planTemplate);
    } catch (error) {
      console.error("Create plan template error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.put("/api/plan-templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid plan template ID is required" });
      }
      
      const updateSchema = z.object({
        weekNumber: z.number().optional(),
        dayNumber: z.number().optional(),
        order: z.number().optional(),
        notes: z.string().nullable().optional(),
      });
      
      const updateData = updateSchema.safeParse(req.body);
      
      if (!updateData.success) {
        return res.status(400).json({ message: "Invalid update data", errors: updateData.error.errors });
      }
      
      const updatedPlanTemplate = await storage.updatePlanTemplate(id, updateData.data);
      
      if (!updatedPlanTemplate) {
        return res.status(404).json({ message: "Plan template not found" });
      }
      
      res.status(200).json(updatedPlanTemplate);
    } catch (error) {
      console.error("Update plan template error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.delete("/api/plan-templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid plan template ID is required" });
      }
      
      const deleted = await storage.deletePlanTemplate(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Plan template not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Delete plan template error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Workout Plan Day routes
  app.get("/api/workout-plan-days", async (req, res) => {
    try {
      const planId = parseInt(req.query.planId as string);
      
      if (isNaN(planId)) {
        return res.status(400).json({ message: "Valid workout plan ID is required" });
      }
      
      const workoutPlanDays = await storage.getWorkoutPlanDays(planId);
      res.status(200).json(workoutPlanDays);
    } catch (error) {
      console.error("Get workout plan days error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/workout-plan-days/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid workout plan day ID is required" });
      }
      
      const workoutPlanDay = await storage.getWorkoutPlanDay(id);
      
      if (!workoutPlanDay) {
        return res.status(404).json({ message: "Workout plan day not found" });
      }
      
      res.status(200).json(workoutPlanDay);
    } catch (error) {
      console.error("Get workout plan day error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/workout-plan-days", async (req, res) => {
    try {
      const workoutPlanDayData = insertWorkoutPlanDaySchema.safeParse(req.body);
      
      if (!workoutPlanDayData.success) {
        return res.status(400).json({ message: "Invalid workout plan day data", errors: workoutPlanDayData.error.errors });
      }
      
      // Check if plan exists
      const plan = await storage.getWorkoutPlan(workoutPlanDayData.data.planId);
      if (!plan) {
        return res.status(404).json({ message: "Workout plan not found" });
      }
      
      // Create the workout plan day
      const workoutPlanDay = await storage.createWorkoutPlanDay(workoutPlanDayData.data);
      res.status(201).json(workoutPlanDay);
    } catch (error) {
      console.error("Create workout plan day error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.put("/api/workout-plan-days/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid workout plan day ID is required" });
      }
      
      // Check if workout plan day exists
      const existingWorkoutPlanDay = await storage.getWorkoutPlanDay(id);
      if (!existingWorkoutPlanDay) {
        return res.status(404).json({ message: "Workout plan day not found" });
      }
      
      // Update the workout plan day
      const updatedWorkoutPlanDay = await storage.updateWorkoutPlanDay(id, req.body);
      res.status(200).json(updatedWorkoutPlanDay);
    } catch (error) {
      console.error("Update workout plan day error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.delete("/api/workout-plan-days/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid workout plan day ID is required" });
      }
      
      const deleted = await storage.deleteWorkoutPlanDay(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Workout plan day not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Delete workout plan day error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Coaching Service routes
  app.get("/api/coaching-services", async (req, res) => {
    try {
      const coachId = parseInt(req.query.coachId as string);
      
      if (isNaN(coachId)) {
        return res.status(400).json({ message: "Valid coach ID is required" });
      }
      
      const services = await storage.getCoachingServices(coachId);
      
      res.status(200).json(services);
    } catch (error) {
      console.error("Get coaching services error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/coaching-services/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid coaching service ID is required" });
      }
      
      const service = await storage.getCoachingService(id);
      
      if (!service) {
        return res.status(404).json({ message: "Coaching service not found" });
      }
      
      res.status(200).json(service);
    } catch (error) {
      console.error("Get coaching service error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/coaching-services", async (req, res) => {
    try {
      const serviceData = insertCoachingServiceSchema.safeParse(req.body);
      
      if (!serviceData.success) {
        return res.status(400).json({ message: "Invalid coaching service data", errors: serviceData.error.errors });
      }
      
      // Check if coach exists
      const coach = await storage.getCoachProfileById(serviceData.data.coachId);
      if (!coach) {
        return res.status(404).json({ message: "Coach profile not found" });
      }
      
      const service = await storage.createCoachingService(serviceData.data);
      
      res.status(201).json(service);
    } catch (error) {
      console.error("Create coaching service error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.put("/api/coaching-services/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid coaching service ID is required" });
      }
      
      const updateSchema = z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        price: z.number().optional(),
        durationType: z.string().optional(),
        serviceType: z.string().optional(),
        isAvailable: z.boolean().optional(),
      });
      
      const updateData = updateSchema.safeParse(req.body);
      
      if (!updateData.success) {
        return res.status(400).json({ message: "Invalid update data", errors: updateData.error.errors });
      }
      
      const updatedService = await storage.updateCoachingService(id, updateData.data);
      
      if (!updatedService) {
        return res.status(404).json({ message: "Coaching service not found" });
      }
      
      res.status(200).json(updatedService);
    } catch (error) {
      console.error("Update coaching service error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.delete("/api/coaching-services/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid coaching service ID is required" });
      }
      
      const deleted = await storage.deleteCoachingService(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Coaching service not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Delete coaching service error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Purchase routes
  app.get("/api/purchases", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Valid user ID is required" });
      }
      
      const purchases = await storage.getPurchases(userId);
      
      // Enhanced purchases with details
      const enhancedPurchases = await Promise.all(
        purchases.map(async (purchase) => {
          let planDetails = null;
          let serviceDetails = null;
          
          if (purchase.planId) {
            planDetails = await storage.getWorkoutPlan(purchase.planId);
          }
          
          if (purchase.serviceId) {
            serviceDetails = await storage.getCoachingService(purchase.serviceId);
          }
          
          return {
            ...purchase,
            planDetails,
            serviceDetails
          };
        })
      );
      
      res.status(200).json(enhancedPurchases);
    } catch (error) {
      console.error("Get purchases error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/purchases", async (req, res) => {
    try {
      const purchaseData = insertPurchaseSchema.safeParse(req.body);
      
      if (!purchaseData.success) {
        return res.status(400).json({ message: "Invalid purchase data", errors: purchaseData.error.errors });
      }
      
      // Check if user exists
      const user = await storage.getUser(purchaseData.data.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if either planId or serviceId is provided, but not both
      if (!purchaseData.data.planId && !purchaseData.data.serviceId) {
        return res.status(400).json({ message: "Either planId or serviceId must be provided" });
      }
      
      if (purchaseData.data.planId && purchaseData.data.serviceId) {
        return res.status(400).json({ message: "Cannot purchase both a plan and a service in a single transaction" });
      }
      
      // Check if plan or service exists
      if (purchaseData.data.planId) {
        const plan = await storage.getWorkoutPlan(purchaseData.data.planId);
        if (!plan) {
          return res.status(404).json({ message: "Workout plan not found" });
        }
      }
      
      if (purchaseData.data.serviceId) {
        const service = await storage.getCoachingService(purchaseData.data.serviceId);
        if (!service) {
          return res.status(404).json({ message: "Coaching service not found" });
        }
      }
      
      const purchase = await storage.createPurchase(purchaseData.data);
      
      res.status(201).json(purchase);
    } catch (error) {
      console.error("Create purchase error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.put("/api/purchases/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid purchase ID is required" });
      }
      
      const { status } = req.body;
      
      if (!status || typeof status !== 'string') {
        return res.status(400).json({ message: "Valid status string is required" });
      }
      
      const updatedPurchase = await storage.updatePurchaseStatus(id, status);
      
      if (!updatedPurchase) {
        return res.status(404).json({ message: "Purchase not found" });
      }
      
      res.status(200).json(updatedPurchase);
    } catch (error) {
      console.error("Update purchase status error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Review routes
  app.get("/api/reviews", async (req, res) => {
    try {
      const coachId = req.query.coachId ? parseInt(req.query.coachId as string) : undefined;
      const planId = req.query.planId ? parseInt(req.query.planId as string) : undefined;
      
      if (!coachId && !planId) {
        return res.status(400).json({ message: "Either coachId or planId must be provided" });
      }
      
      const reviews = await storage.getReviews(coachId, planId);
      
      // Get user data for each review
      const reviewsWithUserInfo = await Promise.all(
        reviews.map(async (review) => {
          const user = await storage.getUser(review.userId);
          if (!user) return review;
          
          // Remove password from user data
          const { password: _, ...userWithoutPassword } = user;
          
          return {
            ...review,
            user: userWithoutPassword
          };
        })
      );
      
      res.status(200).json(reviewsWithUserInfo);
    } catch (error) {
      console.error("Get reviews error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/reviews", async (req, res) => {
    try {
      const reviewData = insertReviewSchema.safeParse(req.body);
      
      if (!reviewData.success) {
        return res.status(400).json({ message: "Invalid review data", errors: reviewData.error.errors });
      }
      
      // Check if user exists
      const user = await storage.getUser(reviewData.data.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if either coachId or planId is provided, but not both
      if (!reviewData.data.coachId && !reviewData.data.planId) {
        return res.status(400).json({ message: "Either coachId or planId must be provided" });
      }
      
      if (reviewData.data.coachId && reviewData.data.planId) {
        return res.status(400).json({ message: "Cannot review both a coach and a plan in a single review" });
      }
      
      // Check if coach or plan exists
      if (reviewData.data.coachId) {
        const coach = await storage.getCoachProfileById(reviewData.data.coachId);
        if (!coach) {
          return res.status(404).json({ message: "Coach profile not found" });
        }
      }
      
      if (reviewData.data.planId) {
        const plan = await storage.getWorkoutPlan(reviewData.data.planId);
        if (!plan) {
          return res.status(404).json({ message: "Workout plan not found" });
        }
      }
      
      const review = await storage.createReview(reviewData.data);
      
      res.status(201).json(review);
    } catch (error) {
      console.error("Create review error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.put("/api/reviews/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid review ID is required" });
      }
      
      const updateSchema = z.object({
        rating: z.number().min(1).max(5),
        review: z.string().optional()
      });
      
      const updateData = updateSchema.safeParse(req.body);
      
      if (!updateData.success) {
        return res.status(400).json({ message: "Invalid update data", errors: updateData.error.errors });
      }
      
      const updatedReview = await storage.updateReview(
        id, 
        updateData.data.review || "", 
        updateData.data.rating
      );
      
      if (!updatedReview) {
        return res.status(404).json({ message: "Review not found" });
      }
      
      res.status(200).json(updatedReview);
    } catch (error) {
      console.error("Update review error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.delete("/api/reviews/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid review ID is required" });
      }
      
      const deleted = await storage.deleteReview(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Review not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Delete review error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Payment processing routes
  // These will be added when implementing Stripe integration
  
  // Workout Plans endpoints
  // This endpoint has been moved above
  
  app.get("/api/workout-plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const includePlanTemplates = req.query.includePlanTemplates === 'true';
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid workout plan ID is required" });
      }
      
      const plan = await storage.getWorkoutPlan(id);
      
      if (!plan) {
        return res.status(404).json({ message: "Workout plan not found" });
      }
      
      const planDays = await storage.getWorkoutPlanDays(id);
      
      // Fetch plan templates if requested
      let planTemplates = [];
      if (includePlanTemplates) {
        planTemplates = await storage.getPlanTemplates(id);
        
        // For each template, fetch the exercises
        for (const planTemplate of planTemplates) {
          if (planTemplate.template) {
            const exercises = await storage.getTemplateExercises(planTemplate.template.id);
            planTemplate.template.exercises = exercises;
          }
        }
      }
      
      res.status(200).json({
        ...plan,
        days: planDays,
        planTemplates: includePlanTemplates ? planTemplates : undefined
      });
    } catch (error) {
      console.error("Get workout plan details error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/workout-plans", async (req, res) => {
    try {
      const planData = insertWorkoutPlanSchema.safeParse(req.body);
      
      if (!planData.success) {
        return res.status(400).json({ message: "Invalid workout plan data", errors: planData.error.errors });
      }
      
      const plan = await storage.createWorkoutPlan(planData.data);
      
      res.status(201).json(plan);
    } catch (error) {
      console.error("Create workout plan error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Purchases endpoints
  app.get("/api/purchases", async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const purchases = await storage.getPurchases(userId);
      
      // For each purchase, fetch plan or service details
      const purchasesWithDetails = await Promise.all(
        purchases.map(async (purchase) => {
          let planDetails = null;
          let serviceDetails = null;
          
          if (purchase.planId) {
            planDetails = await storage.getWorkoutPlan(purchase.planId);
          }
          
          if (purchase.serviceId) {
            serviceDetails = await storage.getCoachingService(purchase.serviceId);
          }
          
          return {
            ...purchase,
            planDetails,
            serviceDetails
          };
        })
      );
      
      res.status(200).json(purchasesWithDetails);
    } catch (error) {
      console.error("Get purchases error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/purchases", async (req, res) => {
    try {
      const purchaseData = insertPurchaseSchema.safeParse(req.body);
      
      if (!purchaseData.success) {
        return res.status(400).json({ message: "Invalid purchase data", errors: purchaseData.error.errors });
      }
      
      const purchase = await storage.createPurchase(purchaseData.data);
      
      // Update the plan or service sales counts
      if (purchase.planId) {
        const plan = await storage.getWorkoutPlan(purchase.planId);
        if (plan) {
          await storage.updateWorkoutPlan(purchase.planId, {
            sales: (plan.sales || 0) + 1
          });
        }
      }
      
      res.status(201).json(purchase);
    } catch (error) {
      console.error("Create purchase error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Development routes for testing/demo purposes
  // Custom Exercise route - allowing users to create their own exercises
  app.post("/api/exercises/custom", async (req, res) => {
    try {
      const exerciseData = insertExerciseSchema.safeParse(req.body);
      
      if (!exerciseData.success) {
        return res.status(400).json({ message: "Invalid exercise data", errors: exerciseData.error.errors });
      }
      
      // Add isCustom flag to the exercise
      const customExercise = {
        ...exerciseData.data,
        isCustom: true,
      };
      
      const exercise = await storage.createExercise(customExercise);
      
      // Create notification for the user
      if (exercise.userId) {
        await storage.createNotification({
          userId: exercise.userId,
          title: "New Custom Exercise",
          message: `You've created a new custom exercise: ${exercise.name}`,
          type: "info"
        });
      }
      
      res.status(201).json(exercise);
    } catch (error) {
      console.error("Create custom exercise error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/seed/workout-plans", async (req, res) => {
    try {
      // This endpoint is for development only
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ message: "Not available in production" });
      }
      
      const { coachId } = req.body;
      
      if (!coachId) {
        return res.status(400).json({ message: "Coach ID is required" });
      }
      
      const sampleWorkoutPlans = [
        {
          title: "12-Week Strength Builder",
          description: "A comprehensive strength program designed for intermediate lifters looking to increase their main lifts.",
          coachId,
          price: 49.99,
          durationWeeks: 12,
          difficultyLevel: "intermediate",
          category: "strength",
          goals: JSON.stringify(["increase strength", "build muscle", "improve technique"]),
          equipment: JSON.stringify(["barbell", "dumbbells", "squat rack"]),
          isPublished: true
        },
        {
          title: "Fat Loss Accelerator",
          description: "High-intensity program focused on rapid fat loss and conditioning in just 6 weeks.",
          coachId,
          price: 34.99,
          durationWeeks: 6,
          difficultyLevel: "beginner",
          category: "fat loss",
          goals: JSON.stringify(["lose weight", "improve conditioning", "increase endurance"]),
          equipment: JSON.stringify(["bodyweight", "dumbbells", "kettlebells"]),
          isPublished: true
        },
        {
          title: "Bodybuilding Foundations",
          description: "Classic bodybuilding program to build muscle across all major muscle groups.",
          coachId,
          price: 59.99,
          durationWeeks: 8,
          difficultyLevel: "intermediate",
          category: "hypertrophy",
          goals: JSON.stringify(["build muscle", "improve aesthetics", "increase strength"]),
          equipment: JSON.stringify(["barbell", "dumbbells", "cables", "machines"]),
          isPublished: true
        }
      ];
      
      const createdPlans = [];
      
      // Create the workout plans
      for (const planData of sampleWorkoutPlans) {
        const plan = await storage.createWorkoutPlan(planData);
        createdPlans.push(plan);
        
        // Create sample days for each plan
        for (let day = 1; day <= 5; day++) {
          await storage.createWorkoutPlanDay({
            planId: plan.id,
            dayNumber: day,
            templateId: null, // Would be set to an actual template in real usage
            title: `Day ${day}`,
            description: `Workout for day ${day} of the program`
          });
        }
      }
      
      res.status(201).json({
        message: "Sample workout plans created successfully",
        plans: createdPlans
      });
    } catch (error) {
      console.error("Create sample workout plans error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/seed/purchases", async (req, res) => {
    try {
      // This endpoint is for development only
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ message: "Not available in production" });
      }
      
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      // Get all workout plans for demo data
      const allPlans = await storage.getWorkoutPlans(undefined);
      
      if (allPlans.length === 0) {
        return res.status(404).json({ message: "No workout plans found to create sample purchases" });
      }
      
      // Create sample purchases for development
      const samplePurchases = [];
      
      for (const plan of allPlans.slice(0, 3)) { // Limit to first 3 plans
        const purchase = await storage.createPurchase({
          userId: userId,
          planId: plan.id,
          serviceId: null,
          transactionId: `demo-txn-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          amount: plan.price,
          status: "completed"
        });
        
        samplePurchases.push(purchase);
        
        // Update plan sales count
        await storage.updateWorkoutPlan(plan.id, {
          sales: (plan.sales || 0) + 1
        });
      }
      
      res.status(201).json({
        message: "Sample purchases created successfully",
        purchases: samplePurchases
      });
    } catch (error) {
      console.error("Create sample purchases error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Payment processing routes with Stripe
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      if (!req.body.amount) {
        return res.status(400).json({ message: "Amount is required" });
      }
      
      const { amount, planId, userId } = req.body;
      
      // Create a payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          planId: planId ? planId.toString() : undefined,
          userId: userId ? userId.toString() : undefined
        }
      });
      
      res.status(200).json({ 
        clientSecret: paymentIntent.client_secret, 
        paymentIntentId: paymentIntent.id 
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ 
        message: "Failed to create payment intent", 
        error: error.message 
      });
    }
  });
  
  // Coach registration payment intent
  app.post("/api/create-coach-payment-intent", async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      // Fixed price for coach registration: $4.99
      const amount = 499; // in cents
      
      // Create a payment intent for coach registration
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: "usd",
        metadata: {
          userId: userId.toString(),
          type: "coach_registration"
        }
      });
      
      res.status(200).json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error: any) {
      console.error("Error creating coach payment intent:", error);
      res.status(500).json({
        message: "Failed to create coach payment intent",
        error: error.message
      });
    }
  });
  
  app.post("/api/confirm-payment", async (req, res) => {
    try {
      const { paymentIntentId, planId, userId, serviceId } = req.body;
      
      if (!paymentIntentId) {
        return res.status(400).json({ message: "Payment intent ID is required" });
      }
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      // Retrieve the payment intent to check its status
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ 
          message: "Payment has not succeeded", 
          status: paymentIntent.status 
        });
      }
      
      // Create a purchase record in our database
      const purchase = await storage.createPurchase({
        userId: parseInt(userId),
        planId: planId ? parseInt(planId) : null,
        serviceId: serviceId ? parseInt(serviceId) : null,
        status: "completed",
        amount: paymentIntent.amount / 100, // Convert back from cents
        transactionId: paymentIntentId,
        purchaseDate: new Date()
      });
      
      // If this is a plan purchase, update the plan sales count
      if (planId) {
        const plan = await storage.getWorkoutPlan(parseInt(planId));
        if (plan) {
          // Update the plan with incremented sales count
          await storage.updateWorkoutPlan(plan.id, {
            sales: (plan.sales || 0) + 1
          });
        }
      }
      
      res.status(200).json({ 
        success: true, 
        purchase 
      });
    } catch (error: any) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ 
        message: "Failed to confirm payment", 
        error: error.message 
      });
    }
  });
  
  // Confirm coach registration payment and update user status
  app.post("/api/confirm-coach-registration", async (req, res) => {
    try {
      const { paymentIntentId, userId } = req.body;
      
      if (!paymentIntentId) {
        return res.status(400).json({ message: "Payment intent ID is required" });
      }
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      // Retrieve the payment intent to check its status
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      // Verify this is a coach registration payment
      if (paymentIntent.metadata.type !== 'coach_registration') {
        return res.status(400).json({ message: "Invalid payment type" });
      }
      
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ 
          message: "Payment has not succeeded", 
          status: paymentIntent.status 
        });
      }
      
      // Record the purchase first
      const purchase = await storage.createPurchase({
        userId: parseInt(userId),
        status: "completed",
        amount: paymentIntent.amount / 100, // Convert back from cents
        transactionId: paymentIntentId,
        purchaseDate: new Date(),
        planId: null,
        serviceId: null
      });
      
      // Update the user to coach status
      const user = await storage.updateUserCoachStatus(parseInt(userId), true);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create a notification for the user
      await storage.createNotification({
        userId: parseInt(userId),
        title: "Coach Registration Complete",
        message: "Congratulations! You're now registered as a coach. Set up your profile to start creating and selling workout plans.",
        type: "registration"
      });
      
      res.status(200).json({
        success: true,
        user: {
          id: user.id,
          isCoach: user.isCoach
        }
      });
    } catch (error: any) {
      console.error("Error confirming coach registration:", error);
      res.status(500).json({
        message: "Failed to confirm coach registration",
        error: error.message
      });
    }
  });
  
  // Testing-only endpoint for registering as a coach without payment
  // NOTE: This endpoint should be removed before production launch!
  app.post("/api/register-as-coach-test", async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      // Update the user to coach status
      const user = await storage.updateUserCoachStatus(parseInt(userId), true);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create a notification for the user
      await storage.createNotification({
        userId: parseInt(userId),
        title: "Coach Registration Complete (Test Mode)",
        message: "This is a test registration. You're now registered as a coach. Set up your profile to start creating and selling workout plans.",
        type: "registration"
      });
      
      res.status(200).json({
        success: true,
        user: {
          id: user.id,
          isCoach: user.isCoach
        }
      });
    } catch (error: any) {
      console.error("Error in test coach registration:", error);
      res.status(500).json({
        message: "Failed to register as coach",
        error: error.message
      });
    }
  });

  app.get("/api/checkout-config", (req, res) => {
    // Send the publishable key to the client
    if (!process.env.VITE_STRIPE_PUBLIC_KEY) {
      return res.status(500).json({ message: "Stripe public key not configured" });
    }
    
    res.status(200).json({
      publishableKey: process.env.VITE_STRIPE_PUBLIC_KEY
    });
  });
  
  // Endpoint to initialize a checkout for a workout plan
  // Authentication endpoints
  app.get("/api/auth/status", async (req: Request, res: Response) => {
    try {
      // Get userId from cookie
      const userId = req.cookies?.userId;
      
      if (!userId) {
        return res.status(200).json({ isLoggedIn: false });
      }
      
      const user = await storage.getUser(parseInt(userId));
      
      if (!user) {
        return res.status(200).json({ isLoggedIn: false });
      }
      
      // Return minimal user info
      res.status(200).json({
        id: user.id,
        username: user.username,
        isLoggedIn: true
      });
    } catch (error) {
      console.error("Auth status error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Logout endpoint to clear the authentication cookie
  app.post("/api/logout", (req: Request, res: Response) => {
    try {
      // Destroy the session
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
          return res.status(500).json({ message: "Internal server error" });
        }
        
        res.status(200).json({ message: "Logged out successfully" });
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // /api/user endpoint gets the full user data for the authenticated user
  app.get("/api/user", async (req: Request, res: Response) => {
    try {
      // Get userId from session
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user data without password
      const { password: _, ...userWithoutPassword } = user;
      
      // Parse socialMedia if it exists
      const userResponse = {
        ...userWithoutPassword,
        socialMedia: userWithoutPassword.socialMedia ? JSON.parse(userWithoutPassword.socialMedia) : null
      };
      
      console.log("GET /api/user returning:", userResponse);
      return res.status(200).json(userResponse);
    } catch (error) {
      console.error("Error fetching user:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/init-plan-checkout", async (req: Request, res: Response) => {
    try {
      console.log("CHECKOUT DEBUG - Request body:", req.body);
      
      // Get userId from session
      const userId = req.session.userId;
      
      if (!userId) {
        console.log("CHECKOUT DEBUG - User not authenticated");
        return res.status(401).json({ message: "Authentication required" });
      }
      
      console.log("CHECKOUT DEBUG - Using authenticated user ID:", userId);
      
      const { planId } = req.body;
      
      if (!planId) {
        console.log("CHECKOUT DEBUG - Missing plan ID");
        return res.status(400).json({ message: "Plan ID is required" });
      }
      
      console.log(`CHECKOUT DEBUG - Fetching plan with ID: ${planId}`);
      const plan = await storage.getWorkoutPlan(parseInt(planId));
      
      if (!plan) {
        console.log("CHECKOUT DEBUG - Plan not found");
        return res.status(404).json({ message: "Workout plan not found" });
      }
      
      console.log(`CHECKOUT DEBUG - Found plan: ${plan.title}, price: ${plan.price}`);
      
      // Create a payment intent
      console.log("CHECKOUT DEBUG - Creating Stripe payment intent");
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(plan.price * 100), // Convert to cents
        currency: "usd",
        metadata: {
          planId: planId.toString(),
          userId: userId.toString(),
          planTitle: plan.title
        }
      });
      
      console.log(`CHECKOUT DEBUG - Payment intent created: ${paymentIntent.id}`);
      console.log(`CHECKOUT DEBUG - Client secret: ${paymentIntent.client_secret?.substring(0, 10)}...`);
      
      res.status(200).json({ 
        clientSecret: paymentIntent.client_secret,
        planTitle: plan.title,
        planPrice: plan.price,
        paymentIntentId: paymentIntent.id 
      });
    } catch (error: any) {
      console.error("Error initializing plan checkout:", error);
      res.status(500).json({ 
        message: "Failed to initialize checkout", 
        error: error.message 
      });
    }
  });
  
  // User Suggestions routes
  app.get("/api/user-suggestions", async (req, res) => {
    try {
      const suggestions = await storage.getUserSuggestions();
      res.status(200).json(suggestions);
    } catch (error) {
      console.error("Error fetching user suggestions:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/user-suggestions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid suggestion ID is required" });
      }
      
      const suggestion = await storage.getUserSuggestion(id);
      
      if (!suggestion) {
        return res.status(404).json({ message: "Suggestion not found" });
      }
      
      res.status(200).json(suggestion);
    } catch (error) {
      console.error("Error fetching user suggestion:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/user-suggestions", async (req, res) => {
    try {
      const suggestionData = insertUserSuggestionSchema.safeParse(req.body);
      
      if (!suggestionData.success) {
        return res.status(400).json({ 
          message: "Invalid suggestion data", 
          errors: suggestionData.error.errors 
        });
      }
      
      const suggestion = await storage.createUserSuggestion(suggestionData.data);
      res.status(201).json(suggestion);
    } catch (error) {
      console.error("Error creating user suggestion:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.patch("/api/user-suggestions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid suggestion ID is required" });
      }
      
      const updateSchema = z.object({
        status: z.string(),
        adminNotes: z.string().optional()
      });
      
      const updateData = updateSchema.safeParse(req.body);
      
      if (!updateData.success) {
        return res.status(400).json({ 
          message: "Invalid update data", 
          errors: updateData.error.errors 
        });
      }
      
      const updatedSuggestion = await storage.updateUserSuggestionStatus(
        id, 
        updateData.data.status, 
        updateData.data.adminNotes
      );
      
      if (!updatedSuggestion) {
        return res.status(404).json({ message: "Suggestion not found" });
      }
      
      res.status(200).json(updatedSuggestion);
    } catch (error) {
      console.error("Error updating user suggestion:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.delete("/api/user-suggestions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid suggestion ID is required" });
      }
      
      const deleted = await storage.deleteUserSuggestion(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Suggestion not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting user suggestion:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  const httpServer = createServer(app);

  return httpServer;
}

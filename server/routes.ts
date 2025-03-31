import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
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
  Workout,
  TemplateExercise,
  WorkoutWithDetails,
  Goal,
  Milestone
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // User routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // In a real app, you would use sessions or JWT here
      // For simplicity, just return the user without the password
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.safeParse(req.body);
      
      if (!userData.success) {
        return res.status(400).json({ message: "Invalid user data", errors: userData.error.errors });
      }
      
      const existingUser = await storage.getUserByUsername(userData.data.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      const user = await storage.createUser(userData.data);
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Create user error:", error);
      res.status(500).json({ message: "Internal server error" });
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
  app.get("/api/workouts", async (req, res) => {
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
  
  app.get("/api/workouts/recent", async (req, res) => {
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
  
  app.post("/api/workouts", async (req, res) => {
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
  
  app.put("/api/workouts/:id", async (req, res) => {
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
  
  app.delete("/api/workouts/:id", async (req, res) => {
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
  app.get("/api/templates", async (req, res) => {
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
      
      const deleted = await storage.deleteTemplate(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.status(204).end();
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
      
      const { userId } = req.body;
      
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
        notes: `Created from template: ${template.name}`
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
  app.get("/api/notifications", async (req, res) => {
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
  
  app.get("/api/notifications/unread-count", async (req, res) => {
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
  app.get("/api/goals", async (req, res) => {
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
      const goalData = insertGoalSchema.safeParse(req.body);
      
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

  const httpServer = createServer(app);

  return httpServer;
}

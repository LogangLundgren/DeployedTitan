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
  Workout
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
      
      const workouts = await storage.getWorkouts(userId);
      
      res.status(200).json(workouts);
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
        weight: z.number().optional(),
        reps: z.number().optional(),
        notes: z.string().optional(),
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
        order: z.number().optional(),
        defaultSets: z.number().optional(),
        defaultReps: z.number().optional(),
        defaultWeight: z.number().optional(),
        notes: z.string().optional()
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
      
      const updatedTemplateExercise = await storage.updateTemplateExercise(id, updateData.data);
      
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

  const httpServer = createServer(app);

  return httpServer;
}

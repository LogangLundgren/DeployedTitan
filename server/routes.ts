import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertWorkoutSchema, insertWorkoutExerciseSchema, insertSetSchema, insertExerciseSchema } from "@shared/schema";
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
        date: z.string().or(z.date()).optional(),
        notes: z.string().optional(),
        duration: z.number().optional(),
        category: z.string().optional()
      });
      
      const updateData = updateSchema.safeParse(req.body);
      
      if (!updateData.success) {
        return res.status(400).json({ message: "Invalid update data", errors: updateData.error.errors });
      }
      
      const updatedWorkout = await storage.updateWorkout(id, updateData.data);
      
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

  const httpServer = createServer(app);

  return httpServer;
}

import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import Stripe from "stripe";
import { hashPassword, verifyPassword, requireAuth, requireAuthWithUser, requireOwnership } from "./auth";
import { eq, and, or, like, isNotNull } from "drizzle-orm";

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
  
  // Get all users for discovery (this needs to come before the :id route to avoid routing conflict)
  app.get("/api/users/discover", async (req, res) => {
    try {
      const currentUserId = req.user?.id;
      
      // Get all active users
      // Only show users that are valid and ensure there's a fixed list of protected users
      // This will keep only the Logan Main account (ID: 9) when cleanup happens
      const protectedUserIds = [9]; // Logan Main (ID: 9)
      const users = await storage.getAllUsers();
      
      // Remove passwords and filter out current user, deleted accounts, and ensure admin is visible
      const filteredUsers = await Promise.all(
        users
          .filter(user => {
            // Keep protected users, active accounts, but filter out current user
            const isProtected = protectedUserIds.includes(user.id);
            const isCurrentUser = currentUserId && user.id === currentUserId;
            const hasUsername = !!user.username; // Filter out users without username
            
            return (isProtected || hasUsername) && !isCurrentUser;
          })
          .map(async user => {
            const { password: _, ...userDataWithoutPassword } = user;
            
            // Check if the current user is following this user
            let isFollowing = false;
            if (currentUserId) {
              isFollowing = await storage.isFollowing(currentUserId, user.id);
            }
            
            // Get accurate user statistics
            const followers = await storage.getFollowers(user.id);
            const followersCount = followers.length;
            
            const following = await storage.getFollowing(user.id);
            const followingCount = following.length;
            
            const workouts = await storage.getWorkouts(user.id);
            const workoutsCount = workouts.length;
            
            return {
              ...userDataWithoutPassword,
              isFollowing,
              followersCount,
              followingCount,
              workoutsCount
            };
          })
      );
      
      res.json(filteredUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Error fetching users", error: String(error) });
    }
  });

  // Follow a user
  app.post("/api/users/:id/follow", requireAuthWithUser, async (req, res) => {
    try {
      // Get user ID from the authenticated session (req.user is guaranteed by requireAuthWithUser)
      const followerId = req.user.id;
      const targetUserId = parseInt(req.params.id);
      
      if (isNaN(targetUserId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Let the storage layer handle the validation for better encapsulation
      try {
        await storage.followUser(followerId, targetUserId);
        
        // Return the updated follow status
        const userProfile = await storage.getUser(targetUserId);
        const isFollowing = true;
        const followerCount = (await storage.getFollowers(targetUserId)).length;
        
        res.status(200).json({ 
          success: true, 
          isFollowing,
          followerCount,
          message: "Successfully followed user"
        });
      } catch (followError: any) {
        // Handle specific error cases with appropriate status codes
        if (followError.message === "Cannot follow yourself") {
          return res.status(400).json({ message: followError.message });
        } else if (followError.message === "Already following this user") {
          return res.status(400).json({ message: followError.message });
        } else if (followError.message === "User to follow not found") {
          return res.status(404).json({ message: followError.message });
        } else {
          throw followError; // Re-throw for the general error handler
        }
      }
    } catch (error) {
      console.error("Follow user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Unfollow a user
  app.post("/api/users/:id/unfollow", requireAuthWithUser, async (req, res) => {
    try {
      // Get user ID from the authenticated session (req.user is guaranteed by requireAuthWithUser)
      const followerId = req.user.id;
      const targetUserId = parseInt(req.params.id);
      
      if (isNaN(targetUserId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Let the storage layer handle the validation for better encapsulation
      try {
        await storage.unfollowUser(followerId, targetUserId);
        
        // Return the updated follow status
        const userProfile = await storage.getUser(targetUserId);
        const isFollowing = false;
        const followerCount = (await storage.getFollowers(targetUserId)).length;
        
        res.status(200).json({ 
          success: true, 
          isFollowing,
          followerCount,
          message: "Successfully unfollowed user"
        });
      } catch (unfollowError: any) {
        // Handle specific error cases with appropriate status codes
        if (unfollowError.message === "Cannot unfollow yourself") {
          return res.status(400).json({ message: unfollowError.message });
        } else if (unfollowError.message === "Not currently following this user") {
          return res.status(400).json({ message: unfollowError.message });
        } else if (unfollowError.message === "User to unfollow not found") {
          return res.status(404).json({ message: unfollowError.message });
        } else {
          throw unfollowError; // Re-throw for the general error handler
        }
      }
    } catch (error) {
      console.error("Unfollow user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get users that the current user is following
  app.get("/api/users/following", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      
      if (!userId) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const following = await storage.getFollowing(userId);
      res.json(following);
    } catch (error) {
      console.error("Error fetching following users:", error);
      res.status(500).json({ message: "Error fetching following users", error: String(error) });
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
      
      // Check if the current user follows this user
      let isFollowing = false;
      
      // Get accurate user statistics
      const followers = await storage.getFollowers(userId);
      const followersCount = followers.length;
      
      const following = await storage.getFollowing(userId);
      const followingCount = following.length;
      
      const workouts = await storage.getWorkouts(userId);
      const workoutsCount = workouts.length;
      
      // Check follow status if authenticated
      if (req.user && req.user.id) {
        isFollowing = await storage.isFollowing(req.user.id, userId);
      }
      
      // Return extended user info with accurate statistics
      res.status(200).json({
        ...userWithoutPassword,
        isFollowing,
        followersCount,
        followingCount,
        workoutsCount
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Enhanced user profile endpoint for profile page
  app.get("/api/users/:id/profile", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Format profile picture URL if available
      let profilePicture = null;
      
      // No profile picture field exists in schema, set to default value
      
      // Format social media JSON if it exists
      let socialMedia = null;
      if (user.socialMedia) {
        try {
          if (typeof user.socialMedia === 'string') {
            socialMedia = JSON.parse(user.socialMedia);
          } else {
            socialMedia = user.socialMedia;
          }
        } catch (e) {
          console.error("Error parsing social media data:", e);
        }
      }
      
      // Build profile response - omitting sensitive information
      const profile = {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        bio: user.bio,
        location: user.location,
        fitnessLevel: user.fitnessLevel,
        experienceYears: user.experienceYears,
        goals: user.goals,
        certifications: user.certifications,
        socialMedia: socialMedia,
        isCoach: user.isCoach,
        profilePicture: profilePicture
      };
      
      res.status(200).json(profile);
    } catch (error) {
      console.error("Get user profile error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User statistics endpoint
  app.get("/api/users/:id/stats", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Get user workout count
      const workouts = await storage.getWorkouts(userId);
      const workoutsCount = workouts.length;
      
      // Get follower count
      const followers = await storage.getFollowers(userId);
      const followersCount = followers.length;
      
      // Get following count
      const following = await storage.getFollowing(userId);
      const followingCount = following.length;
      
      // Check if the requesting user is following this user
      let isFollowing = false;
      if (req.user && req.user.id) {
        isFollowing = await storage.isFollowing(req.user.id, userId);
      }
      
      res.status(200).json({
        workoutsCount,
        followersCount,
        followingCount,
        isFollowing
      });
    } catch (error) {
      console.error("Get user stats error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get user followers
  app.get("/api/users/:id/followers", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const followers = await storage.getFollowers(userId);
      
      // Remove passwords from follower data and filter out deleted accounts
      const sanitizedFollowers = followers
        .filter(follower => !!follower.username) // Only include users with a username
        .map(follower => {
          const { password: _, ...followerData } = follower;
          return {
            ...followerData,
            socialMedia: followerData.socialMedia ? JSON.parse(followerData.socialMedia) : null
          };
        });
      
      res.status(200).json(sanitizedFollowers);
    } catch (error) {
      console.error("Get followers error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get users the specified user is following
  app.get("/api/users/:id/following", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const following = await storage.getFollowing(userId);
      
      // Remove passwords from following data and filter out deleted accounts
      const sanitizedFollowing = following
        .filter(followedUser => !!followedUser.username) // Only include users with a username
        .map(followedUser => {
          const { password: _, ...followedData } = followedUser;
          return {
            ...followedData,
            socialMedia: followedData.socialMedia ? JSON.parse(followedData.socialMedia) : null
          };
        });
      
      res.status(200).json(sanitizedFollowing);
    } catch (error) {
      console.error("Get following error:", error);
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
      const userId = req.user?.id; // Get user ID if authenticated
      let exercises;
      
      if (category) {
        exercises = await storage.getExercisesByCategory(category);
      } else {
        exercises = await storage.getExercises();
      }
      
      // Filter to show standard exercises (no userId/user_id) and user's custom exercises
      // Handle both camelCase and snake_case property names
      const filteredExercises = exercises.filter(exercise => {
        const exerciseUserId = exercise.userId || exercise.user_id;
        return exerciseUserId === null || exerciseUserId === undefined || 
               (userId && exerciseUserId === userId);
      });
      
      res.status(200).json(filteredExercises);
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
  app.get("/api/workouts", requireAuth, async (req, res) => {
    try {
      // Use the authenticated user's ID from req.user
      const userId = req.user.id;
      
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
  
  app.get("/api/workouts/recent", requireAuth, async (req, res) => {
    try {
      // Use the authenticated user's ID from req.user
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 3;
      
      const recentWorkouts = await storage.getRecentWorkouts(userId, limit);
      
      res.status(200).json(recentWorkouts);
    } catch (error) {
      console.error("Get recent workouts error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get workouts for a specific user (for profile viewing)
  app.get("/api/users/:id/workouts", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Get the user's basic workouts
      const workouts = await storage.getWorkouts(userId);
      
      // Filter to only include public workouts if not the current user
      let filteredWorkouts = workouts;
      
      // If authenticated and viewing another user's workouts, only show public ones
      if (req.user && req.user.id !== userId) {
        filteredWorkouts = workouts.filter(workout => workout.isPublic);
      } else if (!req.user) {
        // If not authenticated, only show public workouts
        filteredWorkouts = workouts.filter(workout => workout.isPublic);
      }
      
      // Get full details for each workout
      const workoutsWithDetails = await Promise.all(
        filteredWorkouts.map(async workout => {
          const details = await storage.getWorkoutWithDetails(workout.id);
          
          if (!details) return null;
          
          // Calculate additional stats for each workout
          const exercises = details.exercises || [];
          const totalExercises = exercises.length;
          let totalSets = 0;
          let volume = 0;
          
          exercises.forEach(ex => {
            // Count sets for each exercise
            totalSets += ex.sets?.length || 0;
            
            // Calculate volume (weight × reps × sets)
            ex.sets?.forEach(set => {
              if (set.weight && set.reps) {
                volume += set.weight * set.reps;
              }
            });
          });
          
          return {
            ...details,
            totalExercises,
            totalSets,
            volume
          };
        })
      );
      
      // Filter out any null results
      const validWorkouts = workoutsWithDetails.filter(w => w !== null);
      
      res.status(200).json(validWorkouts);
    } catch (error) {
      console.error("Get user workouts error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Endpoint for community workouts (public workouts from all users)
  // No authentication required since these are public workouts
  app.get("/api/workouts/community", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      
      // Get public workouts from all users with higher default limit (50 instead of 10)
      let communityWorkouts = await storage.getCommunityWorkouts(limit);
      
      // Filter out workouts from deleted users
      // Only show workouts from users that still exist (have a username)
      const activeUserIds = new Set();
      const protectedUserIds = [9]; // Logan Main (ID: 9)
      
      // Get all active users to filter workouts
      const allUsers = await storage.getAllUsers();
      allUsers.forEach(user => {
        // Consider a user active if they have a username or are a protected user
        if (user.username || protectedUserIds.includes(user.id)) {
          activeUserIds.add(user.id);
        }
      });
      
      // Only show workouts from active users
      communityWorkouts = communityWorkouts.filter(workout => 
        activeUserIds.has(workout.userId)
      );
      
      res.status(200).json(communityWorkouts);
    } catch (error) {
      console.error("Get community workouts error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/workouts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid workout ID is required" });
      }
      
      const workout = await storage.getWorkoutWithDetails(id);
      
      if (!workout) {
        return res.status(404).json({ message: "Workout not found" });
      }
      
      // Check if the workout belongs to the current user or is public
      if (workout.userId !== req.user.id && !workout.isPublic) {
        return res.status(403).json({ 
          message: "Access denied. You can only access your own workouts or public workouts." 
        });
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
      
      // Check if the workout belongs to the current user
      const existingWorkout = await storage.getWorkout(id);
      if (!existingWorkout) {
        return res.status(404).json({ message: "Workout not found" });
      }
      
      // Ensure the workout belongs to the authenticated user
      if (existingWorkout.userId !== req.user.id) {
        return res.status(403).json({ 
          message: "Access denied. You can only modify your own workouts." 
        });
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
      
      // Check if the workout belongs to the current user
      const existingWorkout = await storage.getWorkout(id);
      if (!existingWorkout) {
        return res.status(404).json({ message: "Workout not found" });
      }
      
      // Ensure the workout belongs to the authenticated user
      if (existingWorkout.userId !== req.user.id) {
        return res.status(403).json({ 
          message: "Access denied. You can only delete your own workouts." 
        });
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
  
  // Create a workout from a template
  app.post("/api/workouts/from-template", requireAuth, async (req, res) => {
    try {
      const { templateId } = req.body;
      
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      if (!templateId || isNaN(templateId)) {
        return res.status(400).json({ message: "Valid template ID is required" });
      }
      
      // Get the template with its exercises
      const template = await storage.getTemplateWithExercises(templateId);
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      // Check template ownership
      if (template.userId !== req.user.id) {
        return res.status(403).json({ 
          message: "Access denied. You can only use your own templates." 
        });
      }
      
      // Create a new workout based on the template
      const workout = await storage.createWorkout({
        name: template.name,
        userId: req.user.id,
        date: new Date(),
        notes: template.description || null,
        duration: 0,
        category: template.category || null,
        isComplete: false,
        isPublic: false
      });
      
      // Add template exercises to the workout
      if (template.exercises && template.exercises.length > 0) {
        for (const templateExercise of template.exercises) {
          await storage.createWorkoutExercise({
            workoutId: workout.id,
            exerciseId: templateExercise.exerciseId,
            order: templateExercise.order,
            notes: templateExercise.notes
          });
        }
      }
      
      // Get the complete workout with details
      const workoutWithDetails = await storage.getWorkoutWithDetails(workout.id);
      
      res.status(201).json(workoutWithDetails);
    } catch (error) {
      console.error("Create workout from template error:", error);
      res.status(500).json({ message: "Failed to create workout from template" });
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
  app.get("/api/templates", requireAuth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const userId = req.user.id;
      const templates = await storage.getTemplates(userId);
      
      res.status(200).json(templates);
    } catch (error) {
      console.error("Get templates error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/templates/:id", requireAuth, requireOwnership, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid template ID is required" });
      }
      
      const template = await storage.getTemplateWithExercises(id);
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      // Verify the template belongs to the authenticated user
      if (template.userId !== req.user?.id) {
        return res.status(403).json({ message: "You do not have permission to access this template" });
      }
      
      res.status(200).json(template);
    } catch (error) {
      console.error("Get template details error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/templates", requireAuth, async (req, res) => {
    try {
      // Clone the request body and add the authenticated user's ID
      const requestBody = { ...req.body, userId: req.user?.id };
      
      const templateData = insertTemplateSchema.safeParse(requestBody);
      
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
  
  app.put("/api/templates/:id", requireAuth, requireOwnership, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid template ID is required" });
      }
      
      // First verify this is the user's template
      const template = await storage.getTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      if (template.userId !== req.user?.id) {
        return res.status(403).json({ message: "You do not have permission to update this template" });
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
  
  app.delete("/api/templates/:id", requireAuth, requireOwnership, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid template ID is required" });
      }
      
      // First verify this is the user's template
      const template = await storage.getTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      if (template.userId !== req.user?.id) {
        return res.status(403).json({ message: "You do not have permission to delete this template" });
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
  app.post("/api/template-exercises", requireAuth, async (req, res) => {
    try {
      const templateExerciseData = insertTemplateExerciseSchema.safeParse(req.body);
      
      if (!templateExerciseData.success) {
        return res.status(400).json({ 
          message: "Invalid template exercise data", 
          errors: templateExerciseData.error.errors 
        });
      }
      
      // Verify that the user owns the template
      const templateId = templateExerciseData.data.templateId;
      const template = await storage.getTemplate(templateId);
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      if (template.userId !== req.user?.id) {
        return res.status(403).json({ message: "You do not have permission to add exercises to this template" });
      }
      
      const templateExercise = await storage.createTemplateExercise(templateExerciseData.data);
      
      res.status(201).json(templateExercise);
    } catch (error) {
      console.error("Create template exercise error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.put("/api/template-exercises/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid template exercise ID is required" });
      }
      
      // Get the template exercise
      const templateExercise = await storage.getTemplateExercise(id);
      
      if (!templateExercise) {
        return res.status(404).json({ message: "Template exercise not found" });
      }
      
      // Verify that the user owns the template that this exercise belongs to
      const template = await storage.getTemplate(templateExercise.templateId);
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      if (template.userId !== req.user?.id) {
        return res.status(403).json({ message: "You do not have permission to update this template exercise" });
      }
      
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
      
      const updatedTemplateExercise = await storage.updateTemplateExercise(id, filteredUpdateData);
      
      res.status(200).json(updatedTemplateExercise);
    } catch (error) {
      console.error("Update template exercise error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.delete("/api/template-exercises/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid template exercise ID is required" });
      }
      
      // Get the template exercise to check ownership
      const templateExercise = await storage.getTemplateExercise(id);
      
      if (!templateExercise) {
        return res.status(404).json({ message: "Template exercise not found" });
      }
      
      // Get the template to verify ownership
      const template = await storage.getTemplate(templateExercise.templateId);
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      // Verify that the authenticated user owns the template
      if (template.userId !== req.user?.id) {
        return res.status(403).json({ message: "You don't have permission to delete this template exercise" });
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
  app.post("/api/templates/:id/create-workout", requireAuth, async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      
      if (isNaN(templateId)) {
        return res.status(400).json({ message: "Valid template ID is required" });
      }
      
      if (!req.user || !req.session.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const { isPublic } = req.body;
      const userId = req.session.userId;
      
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
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      // Use authenticated user's ID from session
      const userId = req.user.id;
      
      const notifications = await storage.getNotifications(userId);
      
      res.status(200).json(notifications);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/notifications/unread-count", requireAuth, async (req, res) => {
    try {
      // Use authenticated user's ID from session
      const userId = req.user.id;
      
      const count = await storage.getUnreadNotificationsCount(userId);
      
      res.status(200).json({ count });
    } catch (error) {
      console.error("Get unread notifications count error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/notifications", requireAuth, async (req, res) => {
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
  
  app.patch("/api/notifications/:id/mark-read", requireAuth, async (req, res) => {
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
  
  app.patch("/api/notifications/mark-all-read", requireAuth, async (req, res) => {
    try {
      // Use authenticated user's ID from session
      const userId = req.user.id;
      
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
  app.get("/api/goals", requireAuth, async (req, res) => {
    try {
      // Use the authenticated user's ID from req.user
      const userId = req.user.id;
      
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
  
  // Get public goals for a specific user (for profile viewing)
  app.get("/api/users/:id/goals/public", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Check if the user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get all public goals for this specific user
      const goals = await storage.getGoals(userId);
      
      // Filter to only include public goals
      const publicGoals = goals.filter(goal => goal.isPublic);
      
      res.status(200).json(publicGoals);
    } catch (error) {
      console.error("Get user public goals error:", error);
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

  app.post("/api/goals", requireAuth, async (req, res) => {
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

  app.put("/api/goals/:id", requireAuth, async (req, res) => {
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

  app.delete("/api/goals/:id", requireAuth, async (req, res) => {
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

  app.patch("/api/goals/:id/progress", requireAuth, async (req, res) => {
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

  app.post("/api/milestones", requireAuth, async (req, res) => {
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

  app.put("/api/milestones/:id", requireAuth, async (req, res) => {
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

  app.delete("/api/milestones/:id", requireAuth, async (req, res) => {
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

  app.post("/api/milestones/:id/complete", requireAuth, async (req, res) => {
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
  
  app.post("/api/comments", requireAuth, async (req, res) => {
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
  
  app.put("/api/comments/:id", requireAuth, requireOwnership, async (req, res) => {
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
  
  app.delete("/api/comments/:id", requireAuth, requireOwnership, async (req, res) => {
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
  
  app.post("/api/likes/toggle", requireAuth, async (req, res) => {
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
  app.post("/api/exercises/custom", requireAuth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const exerciseData = insertExerciseSchema.safeParse(req.body);
      
      if (!exerciseData.success) {
        return res.status(400).json({ message: "Invalid exercise data", errors: exerciseData.error.errors });
      }
      
      // Add isCustom flag and ensure userId is the authenticated user
      const customExercise = {
        ...exerciseData.data,
        userId: req.user.id, // Set userId to authenticated user
        isCustom: true,
      };
      
      const exercise = await storage.createExercise(customExercise);
      
      // Create notification for the user
      await storage.createNotification({
        userId: req.user.id,
        title: "New Custom Exercise",
        message: `You've created a new custom exercise: ${exercise.name}`,
        type: "info"
      });
      
      res.status(201).json(exercise);
    } catch (error) {
      console.error("Create custom exercise error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Delete any exercise (custom or standard)
  app.delete("/api/exercises/:id", requireAuth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const exerciseId = parseInt(req.params.id);
      
      if (isNaN(exerciseId)) {
        return res.status(400).json({ message: "Valid exercise ID is required" });
      }
      
      // Get the exercise to check if it exists
      const exercise = await storage.getExercise(exerciseId);
      
      if (!exercise) {
        return res.status(404).json({ message: "Exercise not found" });
      }
      
      // Delete the exercise
      const deleted = await storage.deleteExercise(exerciseId);
      
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete exercise" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Delete exercise error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Keep backward compatibility for custom exercise deletion
  app.delete("/api/exercises/custom/:id", requireAuth, async (req, res) => {
    try {
      // Redirect to the main delete endpoint
      const exerciseId = parseInt(req.params.id);
      
      if (isNaN(exerciseId)) {
        return res.status(400).json({ message: "Valid exercise ID is required" });
      }
      
      // Forward to the main delete endpoint
      const response = await fetch(`${req.protocol}://${req.get('host')}/api/exercises/${exerciseId}`, {
        method: 'DELETE',
        headers: {
          'Cookie': req.headers.cookie || '',
        }
      });
      
      // Return the same status code
      res.status(response.status).end();
    } catch (error) {
      console.error("Delete custom exercise error:", error);
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
  
  // Delete user account endpoint
  app.delete("/api/user", async (req: Request, res: Response) => {
    try {
      // Get userId from session
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Delete the user account
      const success = await storage.deleteUser(userId);
      
      if (success) {
        // Log the user out by destroying their session
        req.session.destroy((err) => {
          if (err) {
            console.error("Error destroying session after account deletion:", err);
            return res.status(500).json({ message: "Error during logout after account deletion" });
          }
          res.clearCookie("connect.sid"); // Clear the session cookie
          return res.status(200).json({ message: "Account deleted successfully" });
        });
      } else {
        return res.status(500).json({ message: "Failed to delete account" });
      }
    } catch (error) {
      console.error("Error deleting user account:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Admin endpoint to get all users
  app.get("/api/users", async (req: Request, res: Response) => {
    try {
      // Only allow admin (Logan Main) to perform this operation
      if (!req.user || req.user.id !== 9) {
        return res.status(403).json({ message: "Unauthorized. Only admin user can access all users." });
      }
      
      const users = await storage.getAllUsers();
      res.status(200).json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  
  // Admin endpoint to get all users (for admin dashboard)
  app.get("/api/admin/users", async (req: Request, res: Response) => {
    try {
      // Only allow admin (Logan Main) to perform this operation
      if (!req.user || req.user.id !== 9) {
        return res.status(403).json({ message: "Unauthorized. Only admin user can perform this operation." });
      }
      
      // Get all users
      const users = await storage.getAllUsers();
      
      // Remove passwords for security
      const sanitizedUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return {
          ...userWithoutPassword,
          isProtected: user.id === 9 // Mark Logan Main as protected
        };
      });
      
      return res.status(200).json(sanitizedUsers);
    } catch (error) {
      console.error("Error fetching users for admin:", error);
      return res.status(500).json({ message: "Internal server error fetching users" });
    }
  });
  
  // Admin endpoint to delete a specific user
  app.delete("/api/admin/users/:id", async (req: Request, res: Response) => {
    try {
      // Only allow admin (Logan Main) to perform this operation
      if (!req.user || req.user.id !== 9) {
        return res.status(403).json({ message: "Unauthorized. Only admin user can perform this operation." });
      }
      
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Prevent deleting the admin user (Logan Main)
      if (userId === 9) {
        return res.status(403).json({ message: "Cannot delete the admin user (Logan Main)" });
      }
      
      // Get the user first to check if they exist
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Delete the user
      const success = await storage.deleteUser(userId);
      
      if (success) {
        return res.status(200).json({ 
          message: `Successfully deleted user ${user.username} (ID: ${userId})`,
          success: true
        });
      } else {
        return res.status(500).json({ 
          message: `Failed to delete user ${user.username} (ID: ${userId})`,
          success: false
        });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      return res.status(500).json({ message: "Internal server error deleting user" });
    }
  });

  // Admin endpoint to delete all users except Logan Main
  app.delete("/api/admin/cleanup-users", async (req: Request, res: Response) => {
    try {
      // Only allow admin (Logan Main) to perform this operation
      if (!req.user || req.user.id !== 9) {
        return res.status(403).json({ message: "Unauthorized. Only admin user can perform this operation." });
      }
      
      console.log("Admin user initiated cleanup of all users except Logan Main (ID: 9)");
      
      // Get all users except Logan Main
      const users = await storage.getAllUsers();
      const usersToDelete = users.filter(user => user.id !== 9);
      
      console.log(`Found ${usersToDelete.length} users to delete`);
      
      // Track results
      const results = {
        total: usersToDelete.length,
        success: 0,
        failed: 0,
        details: [] as {id: number, username: string, status: 'success' | 'failed'}[]
      };
      
      // Delete each user
      for (const user of usersToDelete) {
        try {
          console.log(`Deleting user ${user.username} (ID: ${user.id})...`);
          const success = await storage.deleteUser(user.id);
          
          if (success) {
            results.success++;
            results.details.push({
              id: user.id,
              username: user.username,
              status: 'success'
            });
            console.log(`Successfully deleted user ${user.username} (ID: ${user.id})`);
          } else {
            results.failed++;
            results.details.push({
              id: user.id,
              username: user.username,
              status: 'failed'
            });
            console.log(`Failed to delete user ${user.username} (ID: ${user.id})`);
          }
        } catch (error) {
          console.error(`Error deleting user ${user.id}:`, error);
          results.failed++;
          results.details.push({
            id: user.id,
            username: user.username,
            status: 'failed'
          });
        }
      }
      
      console.log(`User cleanup completed. Success: ${results.success}, Failed: ${results.failed}`);
      
      return res.status(200).json({
        message: `User cleanup completed. ${results.success} users deleted, ${results.failed} failed.`,
        results
      });
    } catch (error) {
      console.error("Error performing user cleanup:", error);
      return res.status(500).json({ message: "Internal server error during user cleanup" });
    }
  });
  
  app.delete("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Only allow this operation for authorized users (protecting Logan Main)
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Protect the Logan Main account (ID 9)
      if (userId === 9) {
        return res.status(403).json({ message: "Cannot delete Logan Main account" });
      }
      
      const userToDelete = await storage.getUser(userId);
      if (!userToDelete) {
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log(`Admin request to delete user ${userToDelete.username} (ID: ${userId})`);
      
      // Delete the user account with robust cascading
      const success = await storage.deleteUser(userId);
      
      if (success) {
        return res.status(200).json({ 
          message: `User ${userToDelete.username} deleted successfully`,
          username: userToDelete.username
        });
      } else {
        return res.status(500).json({ message: "Failed to delete account" });
      }
    } catch (error) {
      console.error("Error deleting user account:", error);
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
  
  // Direct messaging routes
  
  // Get all message threads for the current user
  app.get("/api/messages/threads", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const userId = req.session.userId;
      const threads = await storage.getThreadsByUserId(userId);
      res.json(threads);
    } catch (error) {
      console.error("Error fetching message threads:", error);
      res.status(500).json({ message: "Failed to fetch message threads" });
    }
  });
  
  // Get message thread between the current user and another user, or create if doesn't exist
  app.get("/api/messages/thread/:userId", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const currentUserId = req.session.userId;
      const otherUserId = parseInt(req.params.userId);
      
      if (isNaN(otherUserId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Don't allow messaging yourself
      if (currentUserId === otherUserId) {
        return res.status(400).json({ message: "Cannot message yourself" });
      }
      
      const threadId = await storage.getOrCreateThread(currentUserId, otherUserId);
      res.json({ threadId });
    } catch (error) {
      console.error("Error getting or creating message thread:", error);
      res.status(500).json({ message: "Failed to get or create message thread" });
    }
  });
  
  // Get messages in a thread
  app.get("/api/messages/thread/:threadId/messages", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const userId = req.session.userId;
      const threadId = parseInt(req.params.threadId);
      
      if (isNaN(threadId)) {
        return res.status(400).json({ message: "Invalid thread ID" });
      }
      
      const messages = await storage.getThreadMessages(threadId, userId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching thread messages:", error);
      
      if (error.message === "User is not a participant in this thread") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.status(500).json({ message: "Failed to fetch thread messages" });
    }
  });
  
  // Send a message
  app.post("/api/messages/thread/:threadId/send", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const senderId = req.session.userId;
      const threadId = parseInt(req.params.threadId);
      const { content } = req.body;
      
      if (isNaN(threadId)) {
        return res.status(400).json({ message: "Invalid thread ID" });
      }
      
      if (!content || content.trim() === '') {
        return res.status(400).json({ message: "Message content cannot be empty" });
      }
      
      // Check if user is a participant in this thread
      const participant = await db
        .select()
        .from(messageParticipants)
        .where(
          and(
            eq(messageParticipants.threadId, threadId),
            eq(messageParticipants.userId, senderId)
          )
        );
        
      if (participant.length === 0) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const message = await storage.sendMessage(threadId, senderId, content);
      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });
  
  // Get unread message count
  app.get("/api/messages/unread-count", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const userId = req.session.userId;
      const count = await storage.getUnreadMessageCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread message count:", error);
      res.status(500).json({ message: "Failed to fetch unread message count" });
    }
  });
  
  // Search for users to start a conversation with
  app.get("/api/users/search", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const query = req.query.q as string;
    const currentUserId = req.session.userId;
    
    if (!query || query.length < 2) {
      return res.json([]);
    }

    try {
      // Import the users table from schema
      const { users: usersTable } = await import("@shared/schema");
      
      // Fetch all users
      const searchUsers = await db
        .select({
          id: usersTable.id,
          username: usersTable.username,
          name: usersTable.name
        })
        .from(usersTable)
        .where(
          or(
            like(usersTable.username, `%${query}%`),
            and(
              isNotNull(usersTable.name),
              like(usersTable.name, `%${query}%`)
            )
          )
        );
        
      // Filter out the current user
      const filteredUsers = Array.isArray(searchUsers) 
        ? searchUsers.filter(user => user.id !== currentUserId)
        : [];
        
      res.json(filteredUsers);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });
  
  // Start a new conversation with a user
  app.post("/api/messages/start-conversation", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { userId, message } = req.body;
    const currentUserId = req.session.userId;
    
    if (!userId || !message) {
      return res.status(400).json({ message: "User ID and message are required" });
    }

    try {
      // Check if thread already exists between these users
      const threadId = await storage.getOrCreateThread(currentUserId, userId);
      
      // Send the message
      const sentMessage = await storage.sendMessage(threadId, currentUserId, message);
      
      res.json({ threadId, message: sentMessage });
    } catch (error) {
      console.error("Error starting conversation:", error);
      res.status(500).json({ message: "Failed to start conversation" });
    }
  });
  
  // Contact a coach (create a thread and send first message)
  app.post("/api/coaches/:coachId/contact", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const userId = req.session.userId;
      const coachId = parseInt(req.params.coachId);
      const { message } = req.body;
      
      if (isNaN(coachId)) {
        return res.status(400).json({ message: "Invalid coach ID" });
      }
      
      if (!message || message.trim() === '') {
        return res.status(400).json({ message: "Message cannot be empty" });
      }
      
      // Get the coach's user ID
      const [coach] = await db
        .select()
        .from(coachProfiles)
        .where(eq(coachProfiles.id, coachId));
        
      if (!coach) {
        return res.status(404).json({ message: "Coach not found" });
      }
      
      // Create or get a thread between the user and the coach
      const threadId = await storage.getOrCreateThread(userId, coach.userId);
      
      // Send the message
      const sentMessage = await storage.sendMessage(threadId, userId, message);
      
      res.status(201).json({ 
        threadId,
        message: sentMessage
      });
    } catch (error) {
      console.error("Error contacting coach:", error);
      res.status(500).json({ message: "Failed to contact coach" });
    }
  });
  
  const httpServer = createServer(app);

  return httpServer;
}

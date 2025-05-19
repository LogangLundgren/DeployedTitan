import { Router, Request, Response } from 'express';
import { requireAuth } from '../auth';
import { db } from '../db';
import { eq, and } from 'drizzle-orm';
import { users, workouts, coachProfiles } from '@shared/schema';

const router = Router();

// Get the current user's coach
router.get('/api/coach/my-coach', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // First, find user's coach relationship
    // In a real application, this would be fetched from a coach-client relationship table
    // For this implementation, we'll just check if any coach has this user as a client
    const coachProfile = await db.query.coachProfiles.findFirst({
      where: (profile) => eq(profile.userId, userId)
    });
    
    if (!coachProfile) {
      return res.status(404).json({ message: 'No coach assigned' });
    }
    
    // Get the coach's user information
    const coach = await db.query.users.findFirst({
      where: (user) => eq(user.id, coachProfile.userId),
      columns: {
        id: true,
        username: true,
        name: true,
        email: true,
        bio: true,
        isCoach: true,
      }
    });
    
    if (!coach) {
      return res.status(404).json({ message: 'Coach not found' });
    }
    
    return res.status(200).json({
      ...coach,
      coachId: coachProfile.id,
    });
  } catch (error) {
    console.error('Error fetching coach:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Share a workout with a coach
router.post('/api/coach/share-workout', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const { workoutId, coachId, notes } = req.body;
    
    if (!workoutId || !coachId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Verify that the workout belongs to the current user
    const workout = await db.query.workouts.findFirst({
      where: (workout) => and(
        eq(workout.id, workoutId),
        eq(workout.userId, userId)
      )
    });
    
    if (!workout) {
      return res.status(404).json({ message: 'Workout not found or does not belong to the current user' });
    }
    
    // Verify coach exists
    const coach = await db.query.coachProfiles.findFirst({
      where: (profile) => eq(profile.id, coachId)
    });
    
    if (!coach) {
      return res.status(404).json({ message: 'Coach not found' });
    }
    
    // In a real application, we would create a coach notification or add to a coach-client activity feed
    // For this implementation, we'll just update the workout with a coachShared flag and notes
    
    // Update the workout with coach-specific notes
    await db.update(workouts)
      .set({ 
        coachNotes: notes || null,
        coachShared: true,
        updatedAt: new Date()
      })
      .where(eq(workouts.id, workoutId));
    
    // Fetch the updated workout
    const updatedWorkout = await db.query.workouts.findFirst({
      where: (workout) => eq(workout.id, workoutId)
    });
    
    return res.status(200).json(updatedWorkout);
  } catch (error) {
    console.error('Error sharing workout with coach:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
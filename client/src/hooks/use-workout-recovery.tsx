import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';

const STORAGE_KEY = 'titan_workout_draft';

interface StoredWorkoutData {
  workoutId?: number;
  workoutName: string;
  workoutDate: string;
  workoutNotes: string;
  exercises: any[];
  lastUpdated: number;
  currentPath: string; // Store the path where workout was being created
}

export function useWorkoutRecovery() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const [hasPendingWorkout, setHasPendingWorkout] = useState(false);
  const [pendingWorkoutData, setPendingWorkoutData] = useState<StoredWorkoutData | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    // Check for saved workout data on app load
    const checkForSavedWorkout = () => {
      try {
        const savedData = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
        if (!savedData) return;

        const parsedData: StoredWorkoutData = JSON.parse(savedData);
        
        // Check if the saved workout is recent (within last 24 hours)
        const isRecent = Date.now() - parsedData.lastUpdated < 24 * 60 * 60 * 1000;
        
        if (isRecent && parsedData.exercises.length > 0) {
          setHasPendingWorkout(true);
          setPendingWorkoutData(parsedData);
          
          // If user is not already on workout logger, redirect them
          if (!location.startsWith('/workout-logger')) {
            setLocation('/workout-logger');
          }
        }
      } catch (error) {
        console.error('Error checking for saved workout:', error);
      }
    };

    // Only check once when the user is authenticated
    checkForSavedWorkout();
  }, [user?.id, location, setLocation]);

  const clearPendingWorkout = () => {
    if (user?.id) {
      localStorage.removeItem(`${STORAGE_KEY}_${user.id}`);
      setHasPendingWorkout(false);
      setPendingWorkoutData(null);
    }
  };

  return {
    hasPendingWorkout,
    pendingWorkoutData,
    clearPendingWorkout
  };
}
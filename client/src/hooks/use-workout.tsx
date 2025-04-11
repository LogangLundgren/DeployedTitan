import { useState } from "react";
import { WorkoutWithDetails } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useWorkoutDelete() {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const deleteWorkout = async (workout: WorkoutWithDetails) => {
    if (!workout || !workout.id) return false;
    
    try {
      setIsDeleting(true);
      
      await apiRequest(`/api/workouts/${workout.id}`, {
        method: 'DELETE'
      });
      
      toast({
        title: "Workout deleted",
        description: `Successfully deleted "${workout.name}"`,
      });
      
      // Invalidate any queries that fetch workouts
      queryClient.invalidateQueries({ queryKey: ['/api/workouts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/workouts/recent'] });
      
      // Dispatch a custom event to notify components that a workout was deleted
      // This is a safer approach than relying on query cache subscriptions
      document.dispatchEvent(new CustomEvent('workout-deleted', {
        detail: { workoutId: workout.id }
      }));
      
      return true;
    } catch (error) {
      console.error('Error deleting workout:', error);
      toast({
        title: "Error",
        description: "Failed to delete workout. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteWorkout,
    isDeleting
  };
}
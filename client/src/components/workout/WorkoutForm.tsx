import { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { 
  Exercise, 
  InsertWorkout, 
  WorkoutWithDetails, 
  Workout, 
  WorkoutExercise 
} from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ExerciseCard from "./ExerciseCard";
import AddExerciseModal from "./AddExerciseModal";
import WorkoutSummary from "./WorkoutSummary";
import WorkoutSocialModal from "./WorkoutSocialModal";
import { Button } from "@/components/ui/button";
import { Plus, Save } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

// Extend window interface to include our custom property
declare global {
  interface Window {
    saveToLocalStorageTimeout?: number;
  }
}

export interface ExerciseWithSets {
  id?: number;
  exerciseId: number;
  exerciseDetails: Exercise;
  sets: {
    id?: number;
    weight: number | null;
    reps: number | null;
    notes: string | null;
    order: number;
  }[];
  order: number;
}

interface WorkoutFormProps {
  workout?: WorkoutWithDetails;
  onWorkoutCreated?: (workout: WorkoutWithDetails) => void;
  onWorkoutSaved?: () => void;
}

// Interface for the workout data to be stored in localStorage
interface StoredWorkoutData {
  workoutId?: number;
  workoutName: string;
  workoutDate: string;
  workoutNotes: string;
  exercises: ExerciseWithSets[];
  duration: number;
  lastUpdated: number; // timestamp
}

const STORAGE_KEY = 'titan_fitness_active_workout';

export default function WorkoutForm({ workout, onWorkoutCreated, onWorkoutSaved }: WorkoutFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Use authenticated user ID
  const userId = user?.id;
  
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [savedWorkout, setSavedWorkout] = useState<Workout | null>(null);
  const [workoutName, setWorkoutName] = useState(workout?.name || "Monday Push Day");
  const [workoutDate, setWorkoutDate] = useState(
    workout?.date 
      ? format(new Date(workout.date), "yyyy-MM-dd") 
      : format(new Date(), "yyyy-MM-dd")
  );
  const [workoutNotes, setWorkoutNotes] = useState(workout?.notes || "");
  const [exercises, setExercises] = useState<ExerciseWithSets[]>([]);
  const [duration, setDuration] = useState(workout?.duration || 45);
  const [workoutId, setWorkoutId] = useState<number | undefined>(workout?.id);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  
  // Fetch exercises for the modal
  const { data: availableExercises } = useQuery<Exercise[]>({
    queryKey: ['/api/exercises'],
    queryFn: async () => {
      const res = await fetch('/api/exercises');
      if (!res.ok) throw new Error('Failed to fetch exercises');
      return res.json();
    }
  });
  
  // Save workout data to localStorage
  const saveToLocalStorage = () => {
    if (!userId || !autoSaveEnabled) return;
    
    const workoutData: StoredWorkoutData = {
      workoutId,
      workoutName,
      workoutDate,
      workoutNotes,
      exercises,
      duration,
      lastUpdated: Date.now()
    };
    
    try {
      localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(workoutData));
      console.log('Workout data saved to local storage');
    } catch (error) {
      console.error('Error saving workout data to local storage:', error);
    }
  };
  
  // Load workout data from localStorage
  const loadFromLocalStorage = () => {
    if (!userId || !autoSaveEnabled) return;
    
    try {
      const savedData = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
      if (!savedData) return;
      
      const parsedData: StoredWorkoutData = JSON.parse(savedData);
      
      // If we have a workout from props, don't use localStorage data
      if (workout) {
        // Delete the stored workout data as we're now using a fresh workout
        localStorage.removeItem(`${STORAGE_KEY}_${userId}`);
        return;
      }
      
      // Use the saved data
      setWorkoutId(parsedData.workoutId);
      setWorkoutName(parsedData.workoutName);
      setWorkoutDate(parsedData.workoutDate);
      setWorkoutNotes(parsedData.workoutNotes);
      setExercises(parsedData.exercises);
      setDuration(parsedData.duration);
      
      toast({
        title: "Workout Recovered",
        description: "Your previous workout data has been restored.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error loading workout data from local storage:', error);
    }
  };
  
  // Initialize exercises from workout if provided
  useEffect(() => {
    if (workout) {
      const formattedExercises: ExerciseWithSets[] = workout.exercises.map(ex => ({
        id: ex.id,
        exerciseId: ex.exerciseId,
        exerciseDetails: ex.exerciseDetails,
        sets: ex.sets.map(set => ({
          id: set.id,
          weight: set.weight,
          reps: set.reps,
          notes: set.notes,
          order: set.order
        })),
        order: ex.order
      }));
      
      setExercises(formattedExercises);
      setWorkoutId(workout.id);
    } else {
      // If no workout provided, try to load from localStorage
      loadFromLocalStorage();
    }
  }, [workout, userId]);
  
  // Save to localStorage when workout details change
  useEffect(() => {
    if (exercises.length > 0 && autoSaveEnabled) {
      debouncedSaveToLocalStorage();
    }
  }, [workoutName, workoutDate, workoutNotes, duration, exercises]);
  
  // Clear localStorage when workout is submitted successfully
  useEffect(() => {
    return () => {
      // On unmount, clean up the timeout
      if (window.saveToLocalStorageTimeout) {
        clearTimeout(window.saveToLocalStorageTimeout);
      }
    };
  }, []);
  
  // Handling saving or updating workout
  const saveWorkoutMutation = useMutation({
    mutationFn: async () => {
      if (!workoutName.trim()) {
        throw new Error('Workout name is required');
      }
      
      if (exercises.length === 0) {
        throw new Error('Please add at least one exercise');
      }
      
      // If workout already exists (created from template), update it
      if (workoutId) {
        // Update basic workout info
        const workoutUpdateData = {
          name: workoutName,
          date: new Date(workoutDate), // Convert string date to Date object
          notes: workoutNotes || null,
          duration,
          category: workout?.category || 'Strength'
        };
        
        await apiRequest('PUT', `/api/workouts/${workoutId}`, workoutUpdateData);
        
        // Update sets (this is simplified - in a more complete implementation, we would
        // track which sets are new, updated, or deleted)
        for (const exercise of exercises) {
          for (const set of exercise.sets) {
            if (set.id) {
              // Update existing set
              const setData = {
                weight: set.weight,
                reps: set.reps,
                notes: set.notes || null
              };
              
              await apiRequest('PUT', `/api/sets/${set.id}`, setData);
            } else {
              // Create new set
              const setData = {
                workoutExerciseId: exercise.id,
                weight: set.weight,
                reps: set.reps,
                notes: set.notes || null,
                order: set.order
              };
              
              await apiRequest('POST', '/api/sets', setData);
            }
          }
        }
        
        // Fetch the updated workout
        const response = await apiRequest<WorkoutWithDetails>('GET', `/api/workouts/${workoutId}`);
        return response;
      } else {
        // Create a new workout
        const workoutData: InsertWorkout = {
          name: workoutName,
          date: new Date(workoutDate), // Convert string date to Date object
          notes: workoutNotes || null,
          duration,
          userId,
          category: 'Strength'  // Could be made dynamic in a more complete implementation
        };
        
        const workout = await apiRequest<Workout>('POST', '/api/workouts', workoutData);
        
        // Create workout exercises and sets
        for (const exercise of exercises) {
          const workoutExerciseData = {
            workoutId: workout.id,
            exerciseId: exercise.exerciseId,
            order: exercise.order
          };
          
          const workoutExercise = await apiRequest<WorkoutExercise>('POST', '/api/workout-exercises', workoutExerciseData);
          
          // Create sets for each workout exercise
          for (const set of exercise.sets) {
            const setData = {
              workoutExerciseId: workoutExercise.id,
              weight: set.weight,
              reps: set.reps,
              notes: set.notes || null,
              order: set.order
            };
            
            await apiRequest('POST', '/api/sets', setData);
          }
        }
        
        return workout;
      }
    },
    onSuccess: async (data) => {
      toast({
        title: workoutId ? "Workout updated successfully" : "Workout saved successfully",
        description: workoutId ? "Your changes have been saved" : "Your workout has been logged",
        variant: "default",
      });
      
      // Clear local storage after successful save
      if (userId) {
        try {
          localStorage.removeItem(`${STORAGE_KEY}_${userId}`);
          console.log('Workout data cleared from local storage after successful save');
        } catch (error) {
          console.error('Error clearing workout data from local storage:', error);
        }
      }
      
      // If it's a new workout, reset the form
      if (!workoutId) {
        setExercises([]);
        setWorkoutName("");
        setWorkoutNotes("");
        setWorkoutDate(format(new Date(), "yyyy-MM-dd"));
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/workouts/recent', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/workouts'] });
      
      // If we have a callback, get the full workout details and pass them back
      if (onWorkoutCreated) {
        try {
          // Fetch the complete workout details with exercises and sets
          const workoutWithDetails = await apiRequest<WorkoutWithDetails>(
            'GET', `/api/workouts/${data.id}`
          );
          onWorkoutCreated(workoutWithDetails);
        } catch (error) {
          console.error("Error fetching complete workout details:", error);
        }
      }
      
      // Set the saved workout and open the social sharing modal
      setSavedWorkout(data);
      setShowSocialModal(true);
      
      // Navigate to history tab after saving only if the user closes the social modal without sharing
      // This is now handled in the social modal's onClose
    },
    onError: (error) => {
      toast({
        title: workoutId ? "Failed to update workout" : "Failed to save workout",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });
  
  const handleAddExercise = (exercise: Exercise) => {
    setExercises(prev => [
      ...prev,
      {
        exerciseId: exercise.id,
        exerciseDetails: exercise,
        sets: [
          {
            weight: 0,
            reps: 0,
            notes: null,
            order: 1
          }
        ],
        order: prev.length + 1
      }
    ]);
    setShowAddExerciseModal(false);
  };
  
  const handleRemoveExercise = (index: number) => {
    setExercises(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleAddSet = (exerciseIndex: number) => {
    setExercises(prev => {
      const updated = [...prev];
      const sets = [...updated[exerciseIndex].sets];
      sets.push({
        weight: sets[sets.length - 1]?.weight || 0,
        reps: sets[sets.length - 1]?.reps || 0,
        notes: null,
        order: sets.length + 1
      });
      updated[exerciseIndex] = { ...updated[exerciseIndex], sets };
      return updated;
    });
  };
  
  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    setExercises(prev => {
      const updated = [...prev];
      const sets = updated[exerciseIndex].sets.filter((_, i) => i !== setIndex);
      // Reorder sets
      sets.forEach((set, i) => {
        set.order = i + 1;
      });
      updated[exerciseIndex] = { ...updated[exerciseIndex], sets };
      return updated;
    });
  };
  
  const handleUpdateSet = (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps' | 'notes', value: number | string | null) => {
    setExercises(prev => {
      const updated = [...prev];
      const sets = [...updated[exerciseIndex].sets];
      sets[setIndex] = { 
        ...sets[setIndex], 
        [field]: field === 'notes' ? value : Number(value) 
      };
      updated[exerciseIndex] = { ...updated[exerciseIndex], sets };
      return updated;
    });
    
    // Save to local storage after a short delay to avoid excessive saves
    // when the user is typing rapidly
    if (autoSaveEnabled) {
      debouncedSaveToLocalStorage();
    }
  };
  
  // Setup a debounced version of saveToLocalStorage
  const debouncedSaveToLocalStorage = () => {
    // Clear any existing timeout
    if (window.saveToLocalStorageTimeout) {
      clearTimeout(window.saveToLocalStorageTimeout);
    }
    
    // Set a new timeout
    window.saveToLocalStorageTimeout = setTimeout(() => {
      saveToLocalStorage();
    }, 500); // 500ms delay
  };
  
  const calculateTotalVolume = () => {
    let volume = 0;
    exercises.forEach(exercise => {
      exercise.sets.forEach(set => {
        if (set.weight && set.reps) {
          volume += set.weight * set.reps;
        }
      });
    });
    return volume;
  };
  
  const totalSets = exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
  
  return (
    <>
      {/* Workout Details */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="workout-name" className="block text-sm font-medium text-gray-400 mb-1">Workout Name</label>
            <input 
              type="text" 
              id="workout-name" 
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              placeholder="e.g., Upper Body Strength"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="workout-date" className="block text-sm font-medium text-gray-400 mb-1">Date</label>
            <input 
              type="date" 
              id="workout-date" 
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              value={workoutDate}
              onChange={(e) => setWorkoutDate(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label htmlFor="workout-notes" className="block text-sm font-medium text-gray-400 mb-1">Notes (optional)</label>
          <textarea 
            id="workout-notes" 
            className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            rows={2}
            placeholder="Add any notes about this workout..."
            value={workoutNotes}
            onChange={(e) => setWorkoutNotes(e.target.value)}
          />
        </div>
      </div>
      
      {/* Exercise List */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Exercises</h3>
          <Button 
            onClick={() => setShowAddExerciseModal(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Exercise
          </Button>
        </div>
        
        {exercises.length > 0 ? (
          exercises.map((exercise, index) => (
            <ExerciseCard
              key={index}
              exercise={exercise}
              onRemove={() => handleRemoveExercise(index)}
              onAddSet={() => handleAddSet(index)}
              onRemoveSet={(setIndex) => handleRemoveSet(index, setIndex)}
              onUpdateSet={(setIndex, field, value) => handleUpdateSet(index, setIndex, field, value)}
            />
          ))
        ) : (
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-200 mb-2"
            >
              <path d="M6.3 12.3a5 5 0 0 0 7.4 6.8" />
              <path d="M3.34 7A15.12 15.12 0 0 0 2 12c0 5.56 3.8 10.73 9.5 12" />
              <path d="M7 17.2A15.12 15.12 0 0 0 12 22c2.72 0 5.4-.95 7.6-2.77" />
              <path d="M19 13.8a15.12 15.12 0 0 0 1-3.8c0-.76-.07-1.51-.2-2.24" />
              <path d="M13.73 2.32A15.1 15.1 0 0 0 12 2C6.44 2 2.2 5.88 2 10.5" />
              <path d="M21.49 5.5C20.45 4.9 19.2 4.5 18 4.5c-1 0-2.38.18-3.5.5" />
              <path d="M12.5 7v5.25L15 15" />
            </svg>
            <p className="text-gray-400 mb-4 text-center">Add exercises to your workout</p>
            <Button
              onClick={() => setShowAddExerciseModal(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Exercise
            </Button>
          </div>
        )}
      </div>
      
      {/* Workout Summary */}
      {exercises.length > 0 && (
        <WorkoutSummary 
          duration={duration}
          setDuration={setDuration}
          volume={calculateTotalVolume()}
          totalSets={totalSets}
          totalExercises={exercises.length}
        />
      )}
      
      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row-reverse gap-3">
        <Button 
          onClick={() => saveWorkoutMutation.mutate()}
          disabled={saveWorkoutMutation.isPending}
        >
          {saveWorkoutMutation.isPending ? "Saving..." : workoutId ? "Update Workout" : "Save Workout"}
        </Button>
        <Button variant="outline">
          Cancel
        </Button>
      </div>
      
      {/* Exercise Modal */}
      <AddExerciseModal 
        isOpen={showAddExerciseModal}
        onClose={() => setShowAddExerciseModal(false)}
        exercises={availableExercises || []}
        onAddExercise={handleAddExercise}
      />
      
      {/* Social Sharing Modal */}
      {savedWorkout && (
        <WorkoutSocialModal 
          workout={savedWorkout}
          isOpen={showSocialModal}
          onClose={() => {
            setShowSocialModal(false);
            setSavedWorkout(null);
            // Now that the user has closed the social modal, proceed with the original navigation
            if (onWorkoutSaved) {
              onWorkoutSaved();
            }
          }}
        />
      )}
    </>
  );
}

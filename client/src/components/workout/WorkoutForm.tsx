import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Plus, Trash2, Clock, Save } from "lucide-react";
import { WorkoutWithDetails, Exercise, Workout } from "@shared/schema";
import { format } from "date-fns";

// Extend Window interface for timeout
declare global {
  interface Window {
    saveToLocalStorageTimeout?: number;
  }
}

interface ExerciseWithSets {
  id?: number;
  exerciseId: number;
  exerciseDetails: Exercise;
  sets: {
    id?: number;
    weight: number | null;
    reps: number | null;
    notes: string | null;
    order: number;
    isCompleted?: boolean;
  }[];
  order: number;
}

interface WorkoutFormProps {
  workout?: WorkoutWithDetails;
  onWorkoutCreated?: (workout: WorkoutWithDetails) => void;
  onWorkoutSaved?: (workout: WorkoutWithDetails) => void;
}

interface StoredWorkoutData {
  workoutId?: number;
  workoutName: string;
  workoutDate: string;
  workoutNotes: string;
  exercises: ExerciseWithSets[];
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
  const [savedWorkout, setSavedWorkout] = useState<Workout | null>(null);
  const [workoutName, setWorkoutName] = useState(workout?.name || "Monday Push Day");
  const [workoutDate, setWorkoutDate] = useState(
    workout?.date 
      ? format(new Date(workout.date), "yyyy-MM-dd") 
      : format(new Date(), "yyyy-MM-dd")
  );
  const [workoutNotes, setWorkoutNotes] = useState(workout?.notes || "");
  const [exercises, setExercises] = useState<ExerciseWithSets[]>([]);
  const [workoutId, setWorkoutId] = useState<number | undefined>(workout?.id);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Fetch exercises for the modal
  const { data: availableExercises } = useQuery<Exercise[]>({
    queryKey: ['/api/exercises'],
    queryFn: async () => {
      const res = await fetch('/api/exercises');
      if (!res.ok) throw new Error('Failed to fetch exercises');
      return res.json();
    }
  });

  // Auto-save to localStorage with debouncing
  const saveToLocalStorage = () => {
    if (!userId || !autoSaveEnabled) return;
    
    const dataToSave: StoredWorkoutData = {
      workoutId,
      workoutName,
      workoutDate,
      workoutNotes,
      exercises,
      lastUpdated: Date.now()
    };
    
    try {
      localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(dataToSave));
      setLastSavedTime(new Date());
      console.log('Workout data saved to local storage');
    } catch (error) {
      console.error('Error saving to local storage:', error);
    }
  };

  // Debounced save function
  const debouncedSaveToLocalStorage = () => {
    setIsSaving(true);
    // Clear existing timeout
    if (window.saveToLocalStorageTimeout) {
      clearTimeout(window.saveToLocalStorageTimeout);
    }
    
    // Set new timeout
    window.saveToLocalStorageTimeout = setTimeout(() => {
      saveToLocalStorage();
      setIsSaving(false);
    }, 150); // 150ms debounce
  };

  // Extend the Window interface to include our custom timeout
  declare global {
    interface Window {
      saveToLocalStorageTimeout?: number;
    }
  }

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
          reps: set.reps,
          weight: set.weight,
          isCompleted: set.isCompleted || false,
          notes: set.notes || "",
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
  }, [workoutName, workoutDate, workoutNotes, exercises]);
  
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
        
        // Return updated workout data
        const response = await apiRequest('GET', `/api/workouts/${workoutId}`);
        return await response.json();
      } else {
        // Create new workout
        const workoutData = {
          name: workoutName,
          date: new Date(workoutDate),
          notes: workoutNotes || null,
          category: "Strength",
          isPublic: false, // Always default to private
          exercises: exercises.map((exercise) => ({
            exerciseId: exercise.exerciseId,
            sets: exercise.sets.map((set, index) => ({
              weight: set.weight,
              reps: set.reps,
              notes: set.notes || null,
              order: index + 1,
            })),
            order: exercise.order,
          })),
        };

        const response = await apiRequest('POST', '/api/workouts', workoutData);
        const data = await response.json();
        return data;
      }
    },
    onSuccess: async (data) => {
      // Clear auto-saved data after successful save
      if (userId) {
        localStorage.removeItem(`${STORAGE_KEY}_${userId}`);
        console.log('Workout data cleared from local storage after successful save');
      }
      
      toast({
        title: workoutId ? "Workout Updated!" : "Workout Saved!",
        description: `Your workout "${workoutName}" has been ${workoutId ? 'updated' : 'saved'} successfully.`,
        variant: "default",
      });
      
      // Reset form
      if (!workoutId) {
        setWorkoutName("My Workout");
        setExercises([]);
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
          onWorkoutCreated(await workoutWithDetails.json());
        } catch (error) {
          console.error("Error fetching complete workout details:", error);
        }
      }
      
      // Workout saved successfully - no popup needed
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
    
    // Save immediately when adding exercises
    if (autoSaveEnabled) {
      saveToLocalStorage();
    }
  };
  
  const handleRemoveExercise = (index: number) => {
    setExercises(prev => prev.filter((_, i) => i !== index));
    
    // Save immediately when removing exercises
    if (autoSaveEnabled) {
      saveToLocalStorage();
    }
  };
  
  const handleAddSet = (exerciseIndex: number) => {
    setExercises(prev => prev.map((exercise, i) => 
      i === exerciseIndex 
        ? {
            ...exercise,
            sets: [
              ...exercise.sets,
              {
                weight: exercise.sets[exercise.sets.length - 1]?.weight || 0,
                reps: exercise.sets[exercise.sets.length - 1]?.reps || 0,
                notes: null,
                order: exercise.sets.length + 1
              }
            ]
          }
        : exercise
    ));
    
    // Save immediately when adding sets
    if (autoSaveEnabled) {
      saveToLocalStorage();
    }
  };
  
  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    setExercises(prev => prev.map((exercise, i) => 
      i === exerciseIndex 
        ? {
            ...exercise,
            sets: exercise.sets.filter((_, i) => i !== setIndex)
          }
        : exercise
    ));
    
    // Save immediately when removing sets
    if (autoSaveEnabled) {
      saveToLocalStorage();
    }
  };
  
  const handleSetChange = (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps' | 'notes', value: number | string | null) => {
    setExercises(prev => prev.map((exercise, i) => 
      i === exerciseIndex 
        ? {
            ...exercise,
            sets: exercise.sets.map((set, i) => 
              i === setIndex 
                ? { ...set, [field]: value }
                : set
            )
          }
        : exercise
    ));
    
    // Save immediately when modifying sets
    if (autoSaveEnabled) {
      // Use debounced save for input changes
      debouncedSaveToLocalStorage();
    }
  };

  // Calculate total workout statistics
  const totalSets = exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
  const totalVolume = exercises.reduce((total, exercise) => {
    const exerciseVolume = exercise.sets.reduce((setTotal, set) => {
      const weight = set.weight || 0;
      const reps = set.reps || 0;
      return setTotal + (weight * reps);
    }, 0);
    return total + exerciseVolume;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Workout Header Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Workout Details
            {lastSavedTime && (
              <Badge variant="secondary" className="ml-auto text-xs">
                {isSaving ? "Saving..." : `Saved ${format(lastSavedTime, "HH:mm:ss")}`}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="workout-name">Workout Name</Label>
              <Input
                id="workout-name"
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                placeholder="Enter workout name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workout-date">Date</Label>
              <Input
                id="workout-date"
                type="date"
                value={workoutDate}
                onChange={(e) => setWorkoutDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="workout-notes">Notes</Label>
            <Textarea
              id="workout-notes"
              value={workoutNotes}
              onChange={(e) => setWorkoutNotes(e.target.value)}
              placeholder="Add any notes about your workout..."
              rows={3}
            />
          </div>
          
          {/* Workout Stats */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{exercises.length}</div>
              <div className="text-sm text-muted-foreground">Exercises</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{totalSets}</div>
              <div className="text-sm text-muted-foreground">Total Sets</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{totalVolume.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Volume (lbs)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exercises Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Exercises</CardTitle>
            <Button onClick={() => setShowAddExerciseModal(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Exercise
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {exercises.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No exercises added yet. Click "Add Exercise" to get started!</p>
            </div>
          ) : (
            exercises.map((exercise, exerciseIndex) => (
              <div key={exerciseIndex} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{exercise.exerciseDetails.name}</h3>
                    <p className="text-sm text-muted-foreground">{exercise.exerciseDetails.category}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveExercise(exerciseIndex)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Sets */}
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground">
                    <div className="col-span-2">Set</div>
                    <div className="col-span-3">Weight (lbs)</div>
                    <div className="col-span-3">Reps</div>
                    <div className="col-span-3">Notes</div>
                    <div className="col-span-1"></div>
                  </div>
                  
                  {exercise.sets.map((set, setIndex) => (
                    <div key={setIndex} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-2 text-sm font-medium">
                        {setIndex + 1}
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="number"
                          value={set.weight || ''}
                          onChange={(e) => handleSetChange(exerciseIndex, setIndex, 'weight', e.target.value ? Number(e.target.value) : null)}
                          placeholder="0"
                          min="0"
                          step="0.5"
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="number"
                          value={set.reps || ''}
                          onChange={(e) => handleSetChange(exerciseIndex, setIndex, 'reps', e.target.value ? Number(e.target.value) : null)}
                          placeholder="0"
                          min="0"
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          value={set.notes || ''}
                          onChange={(e) => handleSetChange(exerciseIndex, setIndex, 'notes', e.target.value)}
                          placeholder="Notes"
                        />
                      </div>
                      <div className="col-span-1">
                        {exercise.sets.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveSet(exerciseIndex, setIndex)}
                            className="text-destructive hover:text-destructive p-1"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddSet(exerciseIndex)}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Set
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={() => saveWorkoutMutation.mutate()}
          disabled={saveWorkoutMutation.isPending || exercises.length === 0}
          size="lg"
        >
          {saveWorkoutMutation.isPending ? (
            <>
              <Clock className="mr-2 h-4 w-4 animate-spin" />
              {workoutId ? "Updating..." : "Saving..."}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {workoutId ? "Update Workout" : "Save Workout"}
            </>
          )}
        </Button>
      </div>

      {/* Add Exercise Modal */}
      {showAddExerciseModal && availableExercises && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Add Exercise</h2>
              <Button variant="ghost" onClick={() => setShowAddExerciseModal(false)}>
                ×
              </Button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableExercises.map((exercise) => (
                <div
                  key={exercise.id}
                  onClick={() => handleAddExercise(exercise)}
                  className="p-3 border rounded-lg hover:bg-muted cursor-pointer"
                >
                  <div className="font-medium">{exercise.name}</div>
                  <div className="text-sm text-muted-foreground">{exercise.category}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
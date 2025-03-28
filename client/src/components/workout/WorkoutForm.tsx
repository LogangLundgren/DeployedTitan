import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Exercise, InsertWorkout, WorkoutWithDetails } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ExerciseCard from "./ExerciseCard";
import AddExerciseModal from "./AddExerciseModal";
import WorkoutSummary from "./WorkoutSummary";

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

export default function WorkoutForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // In a real app, this would use the authenticated user's ID
  const userId = 1;
  
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [workoutName, setWorkoutName] = useState("Monday Push Day");
  const [workoutDate, setWorkoutDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [workoutNotes, setWorkoutNotes] = useState("");
  const [exercises, setExercises] = useState<ExerciseWithSets[]>([]);
  const [duration, setDuration] = useState(45);
  
  // Fetch exercises for the modal
  const { data: availableExercises } = useQuery<Exercise[]>({
    queryKey: ['/api/exercises'],
    queryFn: async () => {
      const res = await fetch('/api/exercises');
      if (!res.ok) throw new Error('Failed to fetch exercises');
      return res.json();
    }
  });
  
  const saveWorkoutMutation = useMutation({
    mutationFn: async () => {
      if (!workoutName.trim()) {
        throw new Error('Workout name is required');
      }
      
      if (exercises.length === 0) {
        throw new Error('Please add at least one exercise');
      }
      
      // 1. Create the workout
      const workoutData: InsertWorkout = {
        name: workoutName,
        date: new Date(workoutDate),
        notes: workoutNotes || null,
        duration,
        userId,
        category: 'Strength'  // Could be made dynamic in a more complete implementation
      };
      
      const workoutRes = await apiRequest('POST', '/api/workouts', workoutData);
      const workout = await workoutRes.json();
      
      // 2. Create workout exercises and sets
      for (const exercise of exercises) {
        const workoutExerciseData = {
          workoutId: workout.id,
          exerciseId: exercise.exerciseId,
          order: exercise.order
        };
        
        const workoutExerciseRes = await apiRequest('POST', '/api/workout-exercises', workoutExerciseData);
        const workoutExercise = await workoutExerciseRes.json();
        
        // 3. Create sets for each workout exercise
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
    },
    onSuccess: () => {
      toast({
        title: "Workout saved successfully",
        description: "Your workout has been logged",
        variant: "default",
      });
      
      // Reset form or redirect
      setExercises([]);
      setWorkoutName("");
      setWorkoutNotes("");
      setWorkoutDate(format(new Date(), "yyyy-MM-dd"));
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/workouts/recent', userId] });
    },
    onError: (error) => {
      toast({
        title: "Failed to save workout",
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
          <button 
            className="flex items-center bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
            onClick={() => setShowAddExerciseModal(true)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-1"
            >
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
            Add Exercise
          </button>
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
            <button 
              className="flex items-center bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
              onClick={() => setShowAddExerciseModal(true)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-1"
              >
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
              Add Exercise
            </button>
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
        <button 
          className="bg-primary text-white px-6 py-3 rounded-md hover:bg-primary/90 transition-colors font-medium"
          onClick={() => saveWorkoutMutation.mutate()}
          disabled={saveWorkoutMutation.isPending}
        >
          {saveWorkoutMutation.isPending ? "Saving..." : "Save Workout"}
        </button>
        <button className="text-gray-400 px-6 py-3 rounded-md border border-gray-200 hover:bg-gray-100 transition-colors">
          Cancel
        </button>
      </div>
      
      {/* Exercise Modal */}
      <AddExerciseModal 
        isOpen={showAddExerciseModal}
        onClose={() => setShowAddExerciseModal(false)}
        exercises={availableExercises || []}
        onAddExercise={handleAddExercise}
      />
    </>
  );
}

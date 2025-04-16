import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { WorkoutWithDetails, Exercise } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface PersonalRecord {
  exerciseId: number;
  exerciseName: string;
  category: string;
  maxWeight: number;
  maxReps: number;
  maxVolume: number;
  dateAchieved: string;
  workoutId: number;
}

interface PersonalRecordsProps {
  userId?: number; // Made optional since we'll use the authenticated user
}

export default function PersonalRecords({ userId }: PersonalRecordsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [records, setRecords] = useState<PersonalRecord[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [recordView, setRecordView] = useState<"weight" | "reps" | "volume">("weight");

  // Fetch recent workouts
  const { data: workouts, isLoading: workoutsLoading } = useQuery<WorkoutWithDetails[]>({
    queryKey: ['/api/workouts/recent', userId],
    queryFn: async () => {
      try {
        // Request more workouts for accurate personal records
        const res = await fetch(`/api/workouts/recent?userId=${userId}&limit=100`);
        if (!res.ok) throw new Error('Failed to fetch workouts');
        return res.json();
      } catch (error) {
        console.error('Error fetching workouts:', error);
        return [];
      }
    }
  });

  // Fetch all exercises
  const { data: exercises, isLoading: exercisesLoading } = useQuery<Exercise[]>({
    queryKey: ['/api/exercises'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/exercises');
        if (!res.ok) throw new Error('Failed to fetch exercises');
        return res.json();
      } catch (error) {
        console.error('Error fetching exercises:', error);
        return [];
      }
    }
  });

  // Process workout data to extract personal records
  useEffect(() => {
    if (!workouts || !exercises) return;

    // Extract unique categories
    const uniqueCategoriesSet = new Set<string>();
    exercises.forEach(ex => uniqueCategoriesSet.add(ex.category));
    const uniqueCategories = Array.from(uniqueCategoriesSet);
    setCategories(uniqueCategories);

    // Map to track personal records by exercise
    const personalRecords = new Map<number, PersonalRecord>();

    // Process all workouts to find personal records
    workouts.forEach(workout => {
      workout.exercises.forEach(exerciseEntry => {
        const exerciseId = exerciseEntry.exerciseDetails.id;
        const exerciseDetails = exercises.find(ex => ex.id === exerciseId);
        
        if (!exerciseDetails) return;

        // Calculate max values for this exercise occurrence
        let maxWeight = 0;
        let maxReps = 0;
        let maxVolume = 0;

        exerciseEntry.sets.forEach(set => {
          if (set.weight) {
            maxWeight = Math.max(maxWeight, set.weight);
          }
          if (set.reps) {
            maxReps = Math.max(maxReps, set.reps);
          }
          if (set.weight && set.reps) {
            const volume = set.weight * set.reps;
            maxVolume = Math.max(maxVolume, volume);
          }
        });

        // Check if this is a new record
        const currentRecord = personalRecords.get(exerciseId);
        
        if (!currentRecord || 
            maxWeight > currentRecord.maxWeight || 
            maxReps > currentRecord.maxReps || 
            maxVolume > currentRecord.maxVolume) {
          
          // Determine which records were broken
          const newRecord: PersonalRecord = currentRecord ? {...currentRecord} : {
            exerciseId,
            exerciseName: exerciseDetails.name,
            category: exerciseDetails.category,
            maxWeight: 0,
            maxReps: 0,
            maxVolume: 0,
            dateAchieved: typeof workout.date === 'string' ? workout.date : new Date(workout.date as any).toISOString(),
            workoutId: workout.id
          };
          
          if (!currentRecord || maxWeight > currentRecord.maxWeight) {
            newRecord.maxWeight = maxWeight;
            newRecord.dateAchieved = typeof workout.date === 'string' ? workout.date : new Date(workout.date as any).toISOString();
          }
          
          if (!currentRecord || maxReps > currentRecord.maxReps) {
            newRecord.maxReps = maxReps;
            newRecord.dateAchieved = typeof workout.date === 'string' ? workout.date : new Date(workout.date as any).toISOString();
          }
          
          if (!currentRecord || maxVolume > currentRecord.maxVolume) {
            newRecord.maxVolume = maxVolume;
            newRecord.dateAchieved = typeof workout.date === 'string' ? workout.date : new Date(workout.date as any).toISOString();
          }
          
          personalRecords.set(exerciseId, newRecord);
        }
      });
    });

    // Convert map to array
    setRecords(Array.from(personalRecords.values()));
  }, [workouts, exercises]);

  // Filter records by category
  const filteredRecords = selectedCategory === "all" 
    ? records 
    : records.filter(record => record.category === selectedCategory);

  // Sort records by the selected view (weight, reps, or volume)
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    if (recordView === "weight") {
      return b.maxWeight - a.maxWeight;
    } else if (recordView === "reps") {
      return b.maxReps - a.maxReps;
    } else {
      return b.maxVolume - a.maxVolume;
    }
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Personal Records</CardTitle>
        <CardDescription>Your all-time best performances</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="w-full sm:w-1/3">
              <label className="text-sm font-medium mb-1.5 text-gray-500 block">
                Filter by Category
              </label>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Tabs 
              value={recordView} 
              onValueChange={(v) => setRecordView(v as "weight" | "reps" | "volume")}
              className="w-full sm:w-2/3"
            >
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="weight">Max Weight</TabsTrigger>
                <TabsTrigger value="reps">Max Reps</TabsTrigger>
                <TabsTrigger value="volume">Max Volume</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {workoutsLoading || exercisesLoading ? (
            <div className="h-60 flex items-center justify-center">
              <p className="text-gray-500">Loading records...</p>
            </div>
          ) : sortedRecords.length === 0 ? (
            <div className="h-60 flex items-center justify-center flex-col">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-300 mb-2"
              >
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
              </svg>
              <p className="text-gray-400">No records found. Log some workouts to see your personal bests!</p>
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exercise</TableHead>
                    <TableHead className="hidden md:table-cell">Category</TableHead>
                    <TableHead className="text-right">
                      {recordView === "weight" ? "Max Weight" : 
                       recordView === "reps" ? "Max Reps" : "Max Volume"}
                    </TableHead>
                    <TableHead className="text-right">Date Achieved</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedRecords.map(record => (
                    <TableRow key={record.exerciseId}>
                      <TableCell className="font-medium">{record.exerciseName}</TableCell>
                      <TableCell className="hidden md:table-cell">{record.category}</TableCell>
                      <TableCell className="text-right">
                        {recordView === "weight" ? `${record.maxWeight} lbs` : 
                         recordView === "reps" ? record.maxReps : `${record.maxVolume} lbs`}
                      </TableCell>
                      <TableCell className="text-right">{formatDate(record.dateAchieved)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
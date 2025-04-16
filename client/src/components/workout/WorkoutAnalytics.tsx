import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { WorkoutWithDetails, Exercise } from "@shared/schema";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Label
} from "recharts";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define the type for our filtered workout data
interface WorkoutData {
  date: string;
  weight: number;
  reps: number;
  volume: number;
  formattedDate?: string;
}

// Define the metric options
type MetricType = 'weight' | 'reps' | 'volume';

interface WorkoutAnalyticsProps {
  userId?: number; // Made optional since we'll use the authenticated user
}

export default function WorkoutAnalytics({ userId }: WorkoutAnalyticsProps) {
  // State for chart controls
  const [selectedExercise, setSelectedExercise] = useState<number | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('weight');
  const [dateRange, setDateRange] = useState<number>(30); // Days
  const [chartData, setChartData] = useState<WorkoutData[]>([]);

  // Fetch recent workouts
  const { data: recentWorkouts, isLoading: workoutsLoading } = useQuery<WorkoutWithDetails[]>({
    queryKey: ['/api/workouts/recent'],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/workouts/recent?limit=50`);
        if (!res.ok) throw new Error('Failed to fetch recent workouts');
        return res.json();
      } catch (error) {
        console.error('Error fetching recent workouts:', error);
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
  
  // Set default selected exercise when data loads
  useEffect(() => {
    if (exercises && exercises.length > 0 && !selectedExercise) {
      setSelectedExercise(exercises[0].id);
    }
  }, [exercises, selectedExercise]);

  // Process workout data for the selected exercise
  useEffect(() => {
    if (recentWorkouts && selectedExercise) {
      const filteredData: WorkoutData[] = [];
      
      // Get all workouts that include the selected exercise
      recentWorkouts.forEach(workout => {
        const exerciseEntry = workout.exercises.find(ex => 
          ex.exerciseDetails.id === selectedExercise
        );
        
        if (exerciseEntry) {
          // Calculate average weight and total reps for this exercise in this workout
          let totalWeight = 0;
          let totalReps = 0;
          let totalVolume = 0;
          
          exerciseEntry.sets.forEach(set => {
            if (set.weight && set.reps) {
              totalWeight += set.weight;
              totalReps += set.reps;
              totalVolume += set.weight * set.reps;
            }
          });
          
          const avgWeight = exerciseEntry.sets.length > 0 
            ? totalWeight / exerciseEntry.sets.length 
            : 0;
          
          // Convert workout.date (which is a timestamp from DB) to string format
          let dateStr = '';
          
          if (typeof workout.date === 'string') {
            dateStr = workout.date;
          } else if (workout.date instanceof Date) {
            dateStr = format(workout.date, 'yyyy-MM-dd');
          } else {
            // For any other type, convert to Date first then format
            dateStr = format(new Date(String(workout.date)), 'yyyy-MM-dd');
          }
          
          filteredData.push({
            date: dateStr,
            weight: parseFloat(avgWeight.toFixed(1)),
            reps: totalReps,
            volume: totalVolume
          });
        }
      });
      
      // Sort by date (oldest to newest)
      filteredData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Update chart data
      setChartData(filteredData);
    }
  }, [recentWorkouts, selectedExercise]);

  // Get the current exercise name
  const currentExerciseName = exercises?.find(ex => ex.id === selectedExercise)?.name || 'Select Exercise';

  // Format chart data
  const formatChartData = () => {
    return chartData.map(data => ({
      ...data,
      formattedDate: format(new Date(data.date), 'MM/dd'),
      date: data.date,
    }));
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-4">Exercise Progress Analytics</h3>
        <p className="text-gray-500 mb-4">Track your progress on specific exercises over time</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Exercise Selection */}
          <div>
            <label className="text-sm font-medium mb-1.5 text-gray-500 block">Select Exercise</label>
            <Select
              value={selectedExercise?.toString() || ''}
              onValueChange={(value) => setSelectedExercise(parseInt(value))}
              disabled={exercisesLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Exercise" />
              </SelectTrigger>
              <SelectContent>
                {exercises?.map(exercise => (
                  <SelectItem key={exercise.id} value={exercise.id.toString()}>
                    {exercise.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Date Range */}
          <div>
            <label className="text-sm font-medium mb-1.5 text-gray-500 block">Date Range</label>
            <Select
              value={dateRange.toString()}
              onValueChange={(value) => setDateRange(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Metrics Tabs */}
        <Tabs
          defaultValue="weight"
          value={selectedMetric}
          onValueChange={(value) => setSelectedMetric(value as MetricType)}
          className="mb-6"
        >
          <TabsList className="grid grid-cols-3 mb-2">
            <TabsTrigger value="weight">Weight</TabsTrigger>
            <TabsTrigger value="reps">Reps</TabsTrigger>
            <TabsTrigger value="volume">Volume</TabsTrigger>
          </TabsList>
          
          <div className="h-72">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={formatChartData()}
                  margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis 
                    dataKey="formattedDate"
                    stroke="#888888"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#888888"
                    fontSize={12}
                    tickFormatter={(value) => 
                      selectedMetric === 'volume' && value > 1000 
                        ? `${(value/1000).toFixed(1)}k` 
                        : value.toString()
                    }
                  >
                    <Label
                      value={selectedMetric === 'weight' ? 'Weight (lbs)' : selectedMetric === 'reps' ? 'Total Reps' : 'Volume'}
                      angle={-90}
                      position="insideLeft"
                      style={{ textAnchor: 'middle', fontSize: '12px', fill: '#888888' }}
                    />
                  </YAxis>
                  <Tooltip
                    formatter={(value: number) => [
                      value, 
                      selectedMetric === 'weight' 
                        ? 'Avg Weight (lbs)' 
                        : selectedMetric === 'reps' 
                          ? 'Total Reps' 
                          : 'Volume (lbs)'
                    ]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey={selectedMetric}
                    stroke="hsl(240, 50%, 30%)"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name={currentExerciseName}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center flex-col">
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
                  <path d="M3 3v18h18" />
                  <path d="m19 9-5 5-4-4-3 3" />
                </svg>
                <p className="text-gray-400">
                  {exercisesLoading || workoutsLoading
                    ? "Loading data..."
                    : selectedExercise 
                      ? "No data available for selected exercise"
                      : "Select an exercise to view progress"}
                </p>
              </div>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { WorkoutWithDetails, Exercise } from "@shared/schema";
import RecentWorkouts from "@/components/workout/RecentWorkouts";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Label
} from "recharts";
import { format, subDays, parseISO } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define the type for our filtered workout data
interface WorkoutData {
  date: string; // Ensure this is explicitly a string
  weight: number;
  reps: number;
  volume: number;
  formattedDate?: string; // Optional formatted date for display
}

// Define the metric options
type MetricType = 'weight' | 'reps' | 'volume';

export default function Dashboard() {
  // In a real app, this would use the authenticated user's ID
  const userId = 1;

  // State for chart controls
  const [selectedExercise, setSelectedExercise] = useState<number | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('weight');
  const [dateRange, setDateRange] = useState<number>(30); // Days
  const [chartData, setChartData] = useState<WorkoutData[]>([]);

  // Fetch recent workouts
  const { data: recentWorkouts, isLoading: workoutsLoading } = useQuery<WorkoutWithDetails[]>({
    queryKey: ['/api/workouts/recent', userId],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/workouts/recent?userId=${userId}&limit=10`);
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
    <main className="flex-grow container mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <p className="text-gray-500">Welcome to your fitness dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Link href="/workouts">
              <a className="flex items-center justify-between w-full p-3 bg-primary/5 hover:bg-primary/10 text-primary rounded-md transition-colors">
                <span className="font-medium">Log Workout</span>
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
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <path d="M15 3h6v6" />
                  <path d="M10 14 21 3" />
                </svg>
              </a>
            </Link>
            <Link href="/progress">
              <a className="flex items-center justify-between w-full p-3 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
                <span className="font-medium">Track Progress</span>
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
                >
                  <path d="M3 3v18h18" />
                  <path d="m19 9-5 5-4-4-3 3" />
                </svg>
              </a>
            </Link>
            <Link href="/nutrition">
              <a className="flex items-center justify-between w-full p-3 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
                <span className="font-medium">Log Nutrition</span>
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
                >
                  <path d="M15.5 2H8.6c-.4 0-.8.2-1.1.5-.3.3-.5.7-.5 1.1v12.8c0 .4.2.8.5 1.1.3.3.7.5 1.1.5h9.8c.4 0 .8-.2 1.1-.5.3-.3.5-.7.5-1.1V6.5L15.5 2z" />
                  <path d="M3 7.6v12.8c0 .4.2.8.5 1.1.3.3.7.5 1.1.5h9.8" />
                  <path d="M15 2v5h5" />
                </svg>
              </a>
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium mb-4">Weekly Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400">Workouts</p>
              <p className="text-2xl font-medium">4</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Volume</p>
              <p className="text-2xl font-medium">32,400 lbs</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Duration</p>
              <p className="text-2xl font-medium">173 min</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Calories</p>
              <p className="text-2xl font-medium">2,450</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium mb-4">Your Program</h3>
          <div className="text-center">
            <div className="h-36 flex items-center justify-center flex-col">
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
                <path d="M18 11.5V9a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v1.4" />
                <path d="M14 10V8a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
                <path d="M10 9.9V9a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v5" />
                <path d="M6 14v0a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
                <path d="m7 9 4.5 7L16 9" />
              </svg>
              <p className="text-gray-400 mb-2">No active program</p>
              <Link href="/programs">
                <a className="text-primary text-sm">Browse Programs</a>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Chart */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Exercise Progress</CardTitle>
          <CardDescription>Track your progress over time</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      <RecentWorkouts workouts={recentWorkouts?.slice(0, 3) || []} isLoading={workoutsLoading} />
    </main>
  );
}

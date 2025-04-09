import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { WorkoutWithDetails, Exercise } from "@shared/schema";
import RecentWorkouts from "@/components/workout/RecentWorkouts";
import PersonalRecords from "@/components/workout/PersonalRecords";
import MonthlyComparison from "@/components/workout/MonthlyComparison";
import WorkoutHeatmap from "@/components/workout/WorkoutHeatmap";
import ExerciseFrequency from "@/components/workout/ExerciseFrequency";
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
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

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
      
      {/* Goals Section - moved from Goals.tsx */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Your Goals</h2>
          <Link href="/goals">
            <span className="text-primary hover:underline font-medium flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v8" />
                <path d="M8 12h8" />
              </svg>
              Manage Goals
            </span>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* This is a simplified version of the Goals component */}
          {/* We'll just show a few sample goals for now */}
          <Card>
            <CardHeader className="pb-4">
              <Badge variant="default">Strength</Badge>
              <CardTitle className="mt-2">Bench Press 200 lbs</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span>175 / 200 lbs</span>
                </div>
                <Progress value={87.5} className="h-2" />
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Started: Apr 1, 2025</span>
                <span>Target: Jun 15, 2025</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-4">
              <Badge variant="secondary">Endurance</Badge>
              <CardTitle className="mt-2">Run 10K under 50 min</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span>55 / 50 min</span>
                </div>
                <Progress value={90} className="h-2" />
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Started: Mar 15, 2025</span>
                <span>Target: May 20, 2025</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-4">
              <Badge variant="outline">Flexibility</Badge>
              <CardTitle className="mt-2">Touch toes for 30 sec</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span>20 / 30 sec</span>
                </div>
                <Progress value={66.6} className="h-2" />
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Started: Apr 5, 2025</span>
                <span>Target: May 5, 2025</span>
              </div>
            </CardContent>
          </Card>
          
          <Link href="/goals">
            <Card className="border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer flex items-center justify-center h-full">
              <CardContent className="flex flex-col items-center justify-center py-10">
                <div className="rounded-full bg-primary/10 p-3 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v8" />
                    <path d="M8 12h8" />
                  </svg>
                </div>
                <p className="text-primary font-medium">Add New Goal</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Enhanced Analytics Dashboard */}
      <Tabs defaultValue="progress" className="mb-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-xl">Fitness Analytics</CardTitle>
                <CardDescription>Advanced insights into your training data</CardDescription>
              </div>
              <TabsList>
                <TabsTrigger value="progress">Progress</TabsTrigger>
                <TabsTrigger value="records">Records</TabsTrigger>
                <TabsTrigger value="comparison">Comparison</TabsTrigger>
                <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
                <TabsTrigger value="frequency">Frequency</TabsTrigger>
              </TabsList>
            </div>
          </CardHeader>
          <CardContent className="pt-2 pb-4">
            <TabsContent value="progress" className="mt-0">
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
                
                {/* Metrics Selection */}
                <div className="md:col-span-2">
                  <label className="text-sm font-medium mb-1.5 text-gray-500 block">Metrics</label>
                  <Tabs
                    defaultValue="weight"
                    value={selectedMetric}
                    onValueChange={(value) => setSelectedMetric(value as MetricType)}
                    className="w-full"
                  >
                    <TabsList className="grid grid-cols-3 w-full">
                      <TabsTrigger value="weight">Weight</TabsTrigger>
                      <TabsTrigger value="reps">Reps</TabsTrigger>
                      <TabsTrigger value="volume">Volume</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
              
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
            </TabsContent>
            
            <TabsContent value="records" className="mt-0">
              <div className="py-2">
                <PersonalRecords userId={userId} />
              </div>
            </TabsContent>
            
            <TabsContent value="comparison" className="mt-0">
              <div className="py-2">
                <MonthlyComparison userId={userId} />
              </div>
            </TabsContent>
            
            <TabsContent value="heatmap" className="mt-0">
              <div className="py-2">
                <WorkoutHeatmap userId={userId} />
              </div>
            </TabsContent>
            
            <TabsContent value="frequency" className="mt-0">
              <div className="py-2">
                <ExerciseFrequency userId={userId} />
              </div>
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>

      <RecentWorkouts workouts={recentWorkouts?.slice(0, 3) || []} isLoading={workoutsLoading} />
    </main>
  );
}

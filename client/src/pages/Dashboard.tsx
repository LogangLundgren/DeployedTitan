import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { WorkoutWithDetails, Exercise } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

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

// GoalsDisplay component to handle fetching and displaying goals
function GoalsDisplay() {
  const { user } = useAuth();
  
  // Get user's goals with proper user ID filtering
  const { data: goals = [], isLoading: goalsLoading } = useQuery({
    queryKey: ['/api/goals'],
    queryFn: () => fetch(`/api/goals`).then(res => {
      if (!res.ok) {
        throw new Error('Failed to fetch goals');
      }
      return res.json();
    }),
    enabled: !!user, // Only run query if user is authenticated
    staleTime: 60000, // 1 minute cache to avoid excessive requests
  });
  
  // Helper function to calculate progress percentage
  const calculateProgress = (current: number, target: number) => {
    return Math.min(Math.round((current / target) * 100), 100);
  };
  
  // Helper function to format dates
  const formatDate = (date: Date | string | null) => {
    if (!date) return 'No date set';
    return format(new Date(date), "MMM d, yyyy");
  };
  
  if (goalsLoading) {
    return (
      <>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="h-20 bg-gray-100"></CardHeader>
            <CardContent className="h-24 py-4">
              <div className="h-4 bg-gray-100 mb-2 rounded"></div>
              <div className="h-4 bg-gray-100 w-3/4 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </>
    );
  }
  
  if (goals.length === 0) {
    return (
      <div className="col-span-3 lg:col-span-4">
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-muted p-3 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
              </svg>
            </div>
            <p className="text-muted-foreground mb-4">You don't have any goals yet</p>
            <Link href="/goals">
              <span className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90">
                Create Your First Goal
              </span>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <>
      {goals.slice(0, 3).map((goal: any) => (
        <Card key={goal.id}>
          <CardHeader className="pb-4">
            <Badge variant={goal.isPublic ? "default" : "outline"}>
              {goal.category}
            </Badge>
            <CardTitle className="mt-2">{goal.title}</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Progress</span>
                <span>
                  {goal.currentValue} / {goal.targetValue} {goal.metricType}
                </span>
              </div>
              <Progress 
                value={calculateProgress(goal.currentValue, goal.targetValue)} 
                className="h-2" 
              />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Started: {formatDate(goal.startDate)}</span>
              <span>Target: {formatDate(goal.targetDate)}</span>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {/* Always show the "Add New Goal" card */}
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
    </>
  );
}

// User Feedback component
function UserFeedbackForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [feedback, setFeedback] = useState("");
  const [subject, setSubject] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedback.trim()) {
      toast({
        title: "Feedback required",
        description: "Please enter your feedback before submitting.",
        variant: "destructive",
      });
      return;
    }
    
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to submit feedback.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Send the feedback to the server using the user suggestions API
      const response = await fetch('/api/user-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          subject: subject || "General Feedback",
          content: feedback,
          category: "Feature Request"
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }
      
      setSubmitted(true);
      setFeedback("");
      setSubject("");
      
      toast({
        title: "Feedback submitted",
        description: "Thank you for your feedback! We appreciate your input.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem submitting your feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const resetForm = () => {
    setSubmitted(false);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Help Us Improve</CardTitle>
        <CardDescription>
          Share your feedback and suggestions to help us make Titan Fitness better for you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {submitted ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Thank You!</h3>
            <p className="text-muted-foreground mb-6">
              Your feedback has been submitted and will help us improve Titan Fitness.
            </p>
            <Button onClick={resetForm} variant="outline">Submit Another Suggestion</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="subject" className="text-sm font-medium">
                Subject
              </label>
              <Input 
                id="subject"
                placeholder="E.g., Feature request, UI improvements"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="feedback" className="text-sm font-medium">
                Your Suggestion
              </label>
              <Textarea
                id="feedback"
                placeholder="Share your ideas, feedback, or report issues..."
                rows={5}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : "Submit Feedback"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  
  // State for chart controls
  const [selectedExercise, setSelectedExercise] = useState<number | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('weight');
  const [dateRange, setDateRange] = useState<number>(30); // Days
  const [chartData, setChartData] = useState<WorkoutData[]>([]);

  // Fetch recent workouts - these should be for the authenticated user only
  const { data: recentWorkouts, isLoading: workoutsLoading, refetch: refetchWorkouts } = useQuery<WorkoutWithDetails[]>({
    queryKey: ['/api/workouts/recent'],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/workouts/recent?limit=10`);
        if (!res.ok) {
          console.log('Failed to fetch recent workouts. Status:', res.status);
          return []; // Return empty array instead of throwing
        }
        return res.json();
      } catch (error) {
        console.error('Error fetching recent workouts:', error);
        return []; // Return empty array on error
      }
    },
    enabled: !!user, // Only run query if user is authenticated
    staleTime: 60000, // 1 minute cache
    retry: false, // Don't retry on failure
  });
  
  // Listen for workout deletion events to refresh data
  useEffect(() => {
    // We're using a simpler approach to prevent any infinite loop issues
    
    // Set up listener for the workout deletion mutation event
    const handleMutationStatusChange = () => {
      // Only refresh when needed
      setTimeout(() => {
        refetchWorkouts();
      }, 300); // Small delay to avoid race conditions
    };
    
    // Use a DOM event-based approach which is simpler
    document.addEventListener('workout-deleted', handleMutationStatusChange);
    
    return () => {
      document.removeEventListener('workout-deleted', handleMutationStatusChange);
    };
  }, [refetchWorkouts]);

  // Fetch exercises (both standard and user-created) with auth
  const { data: exercises, isLoading: exercisesLoading } = useQuery<Exercise[]>({
    queryKey: ['/api/exercises'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/exercises');
        if (!res.ok) {
          console.log('Failed to fetch exercises. Status:', res.status);
          return []; // Return empty array instead of throwing
        }
        return res.json();
      } catch (error) {
        console.error('Error fetching exercises:', error);
        return []; // Return empty array on error
      }
    },
    enabled: !!user, // Only run query if user is authenticated
    staleTime: 60000, // 1 minute cache
    retry: false // Don't retry on failure
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
      
      {/* Goals Section - using real data from API */}
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
          {/* GoalsDisplay component fetches goals using the authenticated user ID */}
          <GoalsDisplay />
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
                <PersonalRecords userId={user?.id} />
              </div>
            </TabsContent>
            
            <TabsContent value="comparison" className="mt-0">
              <div className="py-2">
                <MonthlyComparison userId={user?.id} />
              </div>
            </TabsContent>
            
            <TabsContent value="heatmap" className="mt-0">
              <div className="py-2">
                <WorkoutHeatmap userId={user?.id} />
              </div>
            </TabsContent>
            
            <TabsContent value="frequency" className="mt-0">
              <div className="py-2">
                <ExerciseFrequency userId={user?.id} />
              </div>
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
      
      {/* User Feedback "Suggestions Box" Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Your Feedback</h2>
        </div>
        <UserFeedbackForm />
      </div>
      
      {/* Admin Dashboard Link - Only visible to founders/admins */}
      <div className="mb-8 mt-12">
        <Card className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-2 text-amber-600 dark:text-amber-400"
                  >
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" x2="12" y1="19" y2="22"></line>
                  </svg>
                  Founder Access
                </h3>
                <p className="text-sm text-muted-foreground">
                  Access the admin dashboard to view user suggestions and manage platform analytics.
                </p>
              </div>
              <Button asChild>
                <Link href="/admin">View Admin Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "../lib/queryClient";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Goal, Milestone } from "@shared/schema";

// Constants for goal categories
const GOAL_CATEGORIES = [
  { value: "strength", label: "Strength" },
  { value: "endurance", label: "Endurance" },
  { value: "flexibility", label: "Flexibility" },
  { value: "weight", label: "Weight Management" },
  { value: "habit", label: "Habit Building" },
  { value: "performance", label: "Performance" },
];

// Constants for goal metric types
const METRIC_TYPES = [
  { value: "weight", label: "Weight (lbs/kg)" },
  { value: "reps", label: "Repetitions" },
  { value: "sets", label: "Sets" },
  { value: "time", label: "Time (minutes)" },
  { value: "distance", label: "Distance (miles/km)" },
  { value: "workouts", label: "Number of Workouts" },
];

// Form schema for creating a new goal
const goalFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  currentValue: z.coerce.number().min(0, "Current value must be 0 or higher"),
  targetValue: z.coerce.number().min(1, "Target value must be at least 1"),
  exerciseId: z.number().nullable(),
  metricType: z.string().min(1, "Please select a metric type"),
  targetDate: z.date({
    required_error: "Please select a target date",
  }),
  category: z.string().min(1, "Please select a category"),
  isPublic: z.boolean().default(false),
});

// Form schema for creating a milestone
const milestoneFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  targetValue: z.coerce.number().min(1, "Target value must be at least 1"),
  description: z.string().optional(),
});

export default function Goals() {
  const userId = 1; // Hardcoded user ID for demo
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  
  // Query all goals (both user's goals and public goals)
  const { data: goals = [], isLoading: goalsLoading } = useQuery({
    queryKey: ['/api/goals', userId],
    queryFn: () => fetch(`/api/goals?userId=${userId}`).then(res => res.json()),
  });

  // Query milestones for selected goal
  const { data: milestones = [], isLoading: milestonesLoading } = useQuery({
    queryKey: ['/api/milestones', selectedGoal?.id],
    queryFn: () => 
      selectedGoal 
        ? fetch(`/api/milestones?goalId=${selectedGoal.id}`).then(res => res.json())
        : Promise.resolve([]),
    enabled: !!selectedGoal,
  });

  // Query exercises for goal form
  const { data: exercises = [], isLoading: exercisesLoading } = useQuery({
    queryKey: ['/api/exercises'],
    queryFn: () => fetch('/api/exercises').then(res => res.json()),
  });

  // Query public goals to include in the main list
  const { data: publicGoals = [], isLoading: publicGoalsLoading } = useQuery({
    queryKey: ['/api/goals/public'],
    queryFn: () => fetch('/api/goals/public').then(res => res.json()),
  });

  // Mutation for creating a goal
  const createGoalMutation = useMutation({
    mutationFn: (data: z.infer<typeof goalFormSchema>) => 
      fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...data, 
          userId, 
          startDate: new Date(),
        }),
      }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Goal created",
        description: "Your new goal has been created successfully.",
      });
      setIsAddingGoal(false);
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create goal. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation for creating a milestone
  const createMilestoneMutation = useMutation({
    mutationFn: (data: z.infer<typeof milestoneFormSchema>) => 
      fetch('/api/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...data, 
          goalId: selectedGoal?.id,
          isCompleted: false,
        }),
      }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Milestone created",
        description: "Your new milestone has been created successfully.",
      });
      setIsAddingMilestone(false);
      queryClient.invalidateQueries({ queryKey: ['/api/milestones'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create milestone. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation for updating goal progress
  const updateGoalProgressMutation = useMutation({
    mutationFn: ({ goalId, currentValue }: { goalId: number, currentValue: number }) => 
      fetch(`/api/goals/${goalId}/progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentValue }),
      }).then(res => res.json()),
    onSuccess: (data) => {
      toast({
        title: "Progress updated",
        description: "Your goal progress has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      if (selectedGoal) {
        setSelectedGoal(data);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update progress. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation for completing a milestone
  const completeMilestoneMutation = useMutation({
    mutationFn: (milestoneId: number) => 
      fetch(`/api/milestones/${milestoneId}/complete`, {
        method: 'PATCH',
      }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Milestone completed",
        description: "Great job completing this milestone!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/milestones'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete milestone. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Form hook for creating a goal
  const goalForm = useForm<z.infer<typeof goalFormSchema>>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      title: "",
      description: "",
      currentValue: 0,
      targetValue: 100,
      exerciseId: null,
      metricType: "",
      category: "",
      isPublic: false,
    },
  });

  // Form hook for creating a milestone
  const milestoneForm = useForm<z.infer<typeof milestoneFormSchema>>({
    resolver: zodResolver(milestoneFormSchema),
    defaultValues: {
      title: "",
      targetValue: 0,
      description: "",
    },
  });

  // Form hook for updating goal progress
  const progressForm = useForm({
    defaultValues: {
      currentValue: selectedGoal?.currentValue || 0,
    },
  });

  // Handle goal form submission
  const onGoalSubmit = (values: z.infer<typeof goalFormSchema>) => {
    createGoalMutation.mutate(values);
  };

  // Handle milestone form submission
  const onMilestoneSubmit = (values: z.infer<typeof milestoneFormSchema>) => {
    createMilestoneMutation.mutate(values);
  };

  // Handle progress form submission
  const onProgressSubmit = (values: any) => {
    if (selectedGoal) {
      updateGoalProgressMutation.mutate({
        goalId: selectedGoal.id,
        currentValue: values.currentValue,
      });
    }
  };

  // Handle milestone completion
  const handleCompleteMilestone = (milestoneId: number) => {
    completeMilestoneMutation.mutate(milestoneId);
  };

  // Calculate progress percentage
  const calculateProgress = (current: number, target: number) => {
    return Math.min(Math.round((current / target) * 100), 100);
  };

  // Function to format dates
  const formatDate = (date: Date | null) => {
    if (!date) return 'No date set';
    return format(new Date(date), "MMM d, yyyy");
  };

  // Function to select a goal and view its details
  const viewGoalDetails = (goal: Goal) => {
    setSelectedGoal(goal);
    progressForm.setValue("currentValue", goal.currentValue);
  };

  // Helper function to get the metric type label
  const getMetricTypeLabel = (type: string) => {
    const metricType = METRIC_TYPES.find(m => m.value === type);
    return metricType ? metricType.label.split(' ')[0] : type;
  };

  // Helper function to find exercise name
  const getExerciseName = (exerciseId: number | null) => {
    if (!exerciseId) return null;
    const exercise = exercises.find((e: any) => e.id === exerciseId);
    return exercise ? exercise.name : null;
  };

  // Combine user goals and public goals, removing duplicates
  const allGoals = [...goals];
  if (publicGoals.length > 0) {
    publicGoals.forEach((publicGoal: any) => {
      if (!allGoals.some(g => g.id === publicGoal.id)) {
        allGoals.push(publicGoal);
      }
    });
  }

  return (
    <main className="container py-6">
      <h1 className="text-3xl font-bold mb-8">Goals & Progress Tracking</h1>
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">All Goals</h2>
          <Dialog open={isAddingGoal} onOpenChange={setIsAddingGoal}>
            <DialogTrigger asChild>
              <Button>Create New Goal</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Goal</DialogTitle>
                <DialogDescription>
                  Set a new fitness goal to track your progress over time.
                </DialogDescription>
              </DialogHeader>
              <Form {...goalForm}>
                <form onSubmit={goalForm.handleSubmit(onGoalSubmit)} className="space-y-4">
                  <FormField
                    control={goalForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Goal Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Squat 300 lbs" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={goalForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Add details about your goal..." 
                            {...field} 
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={goalForm.control}
                      name="currentValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Value</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={goalForm.control}
                      name="targetValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Value</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={goalForm.control}
                    name="exerciseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exercise (Optional)</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value && value !== "none" ? parseInt(value) : null)} 
                          value={field.value?.toString() || "none"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an exercise (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No specific exercise</SelectItem>
                            {exercisesLoading ? (
                              <SelectItem value="" disabled>Loading exercises...</SelectItem>
                            ) : exercises.map((exercise: any) => (
                              <SelectItem key={exercise.id} value={exercise.id.toString()}>
                                {exercise.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select a specific exercise to track or leave blank for general goals
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={goalForm.control}
                    name="metricType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Metric Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a metric type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {METRIC_TYPES.map((metric) => (
                              <SelectItem key={metric.value} value={metric.value}>
                                {metric.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={goalForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {GOAL_CATEGORIES.map((category) => (
                              <SelectItem key={category.value} value={category.value}>
                                {category.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={goalForm.control}
                    name="targetDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Target Date</FormLabel>
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          className="rounded-md border"
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={goalForm.control}
                    name="isPublic"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Make this goal public</FormLabel>
                          <FormDescription>
                            Public goals are visible to others and can inspire the community.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={createGoalMutation.isPending}
                    >
                      {createGoalMutation.isPending ? "Creating..." : "Create Goal"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {goalsLoading || publicGoalsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-32 bg-gray-100"></CardHeader>
                <CardContent className="h-24 py-4">
                  <div className="h-4 bg-gray-100 mb-2 rounded"></div>
                  <div className="h-4 bg-gray-100 w-3/4 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : allGoals.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-primary/10 p-6 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">No Goals Found</h3>
              <p className="text-center text-muted-foreground mb-6">
                Create your first fitness goal to start tracking your progress.
              </p>
              <Button onClick={() => setIsAddingGoal(true)}>
                Create Your First Goal
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allGoals.map((goal: Goal) => (
              <Card key={goal.id} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex justify-between">
                    <Badge variant={goal.isPublic ? "default" : "outline"}>
                      {goal.isPublic ? "Public" : "Private"}
                    </Badge>
                    <Badge variant="secondary">{goal.category}</Badge>
                  </div>
                  <CardTitle className="mt-2">{goal.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {goal.description || "No description provided"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>
                        {goal.currentValue} / {goal.targetValue} {getMetricTypeLabel(goal.metricType)}
                      </span>
                    </div>
                    <Progress
                      value={calculateProgress(goal.currentValue, goal.targetValue)}
                      className="h-2"
                    />
                  </div>
                  {goal.exerciseId && (
                    <div className="mb-2 text-sm">
                      <span className="font-medium">Exercise: </span>
                      <span>{getExerciseName(goal.exerciseId)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Started: {formatDate(goal.startDate)}</span>
                    <span>Target: {formatDate(goal.targetDate)}</span>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4 bg-muted/20">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => viewGoalDetails(goal)}
                  >
                    View Details
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {selectedGoal && (
          <Dialog 
            open={!!selectedGoal} 
            onOpenChange={(open) => !open && setSelectedGoal(null)}
          >
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-xl">{selectedGoal.title}</DialogTitle>
                  <Badge variant={selectedGoal.isPublic ? "default" : "outline"}>
                    {selectedGoal.isPublic ? "Public" : "Private"}
                  </Badge>
                </div>
                <DialogDescription>
                  {selectedGoal.description || "No description provided"}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Progress section */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Current Progress</h3>
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>
                        {calculateProgress(selectedGoal.currentValue, selectedGoal.targetValue)}% Complete
                      </span>
                      <span>
                        {selectedGoal.currentValue} / {selectedGoal.targetValue} {getMetricTypeLabel(selectedGoal.metricType)}
                      </span>
                    </div>
                    <Progress
                      value={calculateProgress(selectedGoal.currentValue, selectedGoal.targetValue)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span>Started: {formatDate(selectedGoal.startDate)}</span>
                    <span>Target: {formatDate(selectedGoal.targetDate)}</span>
                    <span>Category: {selectedGoal.category}</span>
                    {selectedGoal.exerciseId && (
                      <span>Exercise: {getExerciseName(selectedGoal.exerciseId)}</span>
                    )}
                  </div>
                </div>
                
                <Separator />
                
                {/* Update progress form */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Update Progress</h3>
                  <form 
                    onSubmit={progressForm.handleSubmit(onProgressSubmit)}
                    className="flex items-end gap-4"
                  >
                    <div className="flex-1">
                      <label className="text-sm font-medium mb-1.5 block">
                        Current Value
                      </label>
                      <Input
                        type="number"
                        {...progressForm.register("currentValue")}
                        defaultValue={selectedGoal.currentValue}
                      />
                    </div>
                    <Button 
                      type="submit" 
                      disabled={updateGoalProgressMutation.isPending}
                      className="mb-0"
                    >
                      {updateGoalProgressMutation.isPending ? "Updating..." : "Update Progress"}
                    </Button>
                  </form>
                </div>
                
                <Separator />
                
                {/* Milestones section */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-medium">Milestones</h3>
                    <Dialog open={isAddingMilestone} onOpenChange={setIsAddingMilestone}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          Add Milestone
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Add Milestone</DialogTitle>
                          <DialogDescription>
                            Create a milestone to track key achievements toward your goal.
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...milestoneForm}>
                          <form onSubmit={milestoneForm.handleSubmit(onMilestoneSubmit)} className="space-y-4">
                            <FormField
                              control={milestoneForm.control}
                              name="title"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Milestone Title</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., Halfway there!" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={milestoneForm.control}
                              name="targetValue"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Target Value</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder={`Should be between ${selectedGoal.currentValue} and ${selectedGoal.targetValue}`}
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    This value represents the point at which the milestone is achieved
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={milestoneForm.control}
                              name="description"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Description (Optional)</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Add details about this milestone..."
                                      {...field}
                                      value={field.value || ""}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <DialogFooter>
                              <Button 
                                type="submit"
                                disabled={createMilestoneMutation.isPending}
                              >
                                {createMilestoneMutation.isPending ? "Creating..." : "Create Milestone"}
                              </Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  {milestonesLoading ? (
                    <div className="space-y-3">
                      {[...Array(2)].map((_, i) => (
                        <div key={i} className="bg-muted h-16 rounded-md animate-pulse"></div>
                      ))}
                    </div>
                  ) : milestones.length === 0 ? (
                    <div className="text-center py-8 border rounded-md bg-muted/10">
                      <p className="text-muted-foreground mb-2">No milestones yet</p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setIsAddingMilestone(true)}
                      >
                        Create your first milestone
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {milestones.sort((a: Milestone, b: Milestone) => a.targetValue - b.targetValue).map((milestone: Milestone) => (
                        <div 
                          key={milestone.id}
                          className={`p-4 rounded-md border flex items-start justify-between ${milestone.isCompleted ? 'bg-primary/5 border-primary/20' : 'bg-card'}`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{milestone.title}</h4>
                              {milestone.isCompleted && (
                                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                  Completed
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Target: {milestone.targetValue} {getMetricTypeLabel(selectedGoal.metricType)}
                            </p>
                            {milestone.description && (
                              <p className="text-sm mt-1">{milestone.description}</p>
                            )}
                            {milestone.completedDate && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Completed on {formatDate(milestone.completedDate)}
                              </p>
                            )}
                          </div>
                          {!milestone.isCompleted && selectedGoal.currentValue >= milestone.targetValue && (
                            <Button
                              size="sm"
                              onClick={() => handleCompleteMilestone(milestone.id)}
                              disabled={completeMilestoneMutation.isPending}
                            >
                              Mark Complete
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </main>
  );
}
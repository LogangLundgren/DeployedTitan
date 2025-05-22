import { useState, useEffect } from "react";
import { WorkoutWithDetails } from "@shared/schema";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import WorkoutForm from "@/components/workout/WorkoutForm";
import WorkoutHistory from "@/components/workout/WorkoutHistory";
import TemplateSelector from "@/components/workout/TemplateSelector";
import CustomExerciseModal from "@/components/workout/CustomExerciseModal";
import EnhancedAnalytics from "@/components/workout/EnhancedAnalytics";
import ExerciseLibrary from "./ExerciseLibrary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { 
  Clock, 
  FileText, 
  DollarSign, 
  Plus, 
  Loader2, 
  ChevronRight, 
  Tag, 
  Calendar, 
  Dumbbell,
  ArrowRight
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import Templates from "./Templates";
import { useLocation, Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

// Interface for a workout plan in a purchase
interface WorkoutPlan {
  id: number;
  coachId: number;
  title: string;
  description: string;
  price: number;
  durationWeeks: number;
  difficultyLevel: string;
  category: string;
  featuredImageUrl: string | null;
  goals: string;
  equipment: string;
  sales: number | null;
  rating: number | null;
  ratingsCount: number | null;
  createdAt: string;
  updatedAt: string;
}

// Interface for a purchase
interface Purchase {
  id: number;
  userId: number;
  planId: number | null;
  serviceId: number | null;
  transactionId: string;
  amount: number;
  status: string;
  createdAt: string;
  planDetails?: WorkoutPlan;
}

// Component to display purchased workout plans
function PurchasedWorkoutPlans({ 
  onWorkoutCreated, 
  updateTab 
}: { 
  onWorkoutCreated: (workout: WorkoutWithDetails) => void;
  updateTab: (tab: 'new' | 'history' | 'analytics' | 'exercises' | 'plans') => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<WorkoutPlan | null>(null);
  const [isCreateFromPlanOpen, setIsCreateFromPlanOpen] = useState(false);
  
  // Fetch user's purchased plans
  const { 
    data: purchases, 
    isLoading, 
    error 
  } = useQuery<Purchase[]>({
    queryKey: ['/api/purchases/my-purchases'],
    enabled: !!user?.id
  });
  
  // Filter to show only workout plans (not services)
  const workoutPlans = purchases?.filter(p => p.planId && p.planDetails);
  
  // Query for plan templates when a plan is selected
  const {
    data: planTemplates,
    isLoading: isTemplatesLoading,
    isError: isTemplatesError
  } = useQuery({
    queryKey: ['/api/workout-plans', selectedPlan?.id, 'templates'],
    queryFn: async () => {
      const response = await fetch(`/api/workout-plans/${selectedPlan?.id}/templates`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch plan templates');
      }
      return response.json();
    },
    enabled: !!selectedPlan
  });
  
  // Create a workout from a template in the plan
  const handleCreateWorkout = async (templateId: number) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create a workout",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // First, fetch the template to get its details
      const templateResponse = await fetch(`/api/templates/${templateId}`, {
        credentials: 'include'
      });
      
      if (!templateResponse.ok) {
        throw new Error('Failed to fetch template details');
      }
      
      const templateData = await templateResponse.json();
      
      // Now create a workout from this template
      // Use the dedicated endpoint for creating workouts from templates
      const response = await fetch(`/api/templates/${templateId}/create-workout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isPublic: false, // Default to private workout
          name: selectedPlan ? `${selectedPlan.title}: ${templateData.name || 'Workout'}` : 'New Workout',
          notes: `Created from purchased plan: ${selectedPlan?.title || ''}`
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        throw new Error(errorData.message || 'Failed to create workout from template');
      }
      
      const workout = await response.json();
      
      toast({
        title: "Workout Created",
        description: "Now you can log weights and reps for your workout.",
        variant: "default"
      });
      
      setIsCreateFromPlanOpen(false);
      setSelectedPlan(null);
      
      // First switch to the New Workout tab 
      updateTab('new');
      
      // Notify parent component that a workout was created
      // This will set currentWorkout and isWorkoutStarted to true
      onWorkoutCreated(workout);
      
    } catch (error) {
      console.error('Error creating workout:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create workout. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="p-4 border rounded-lg">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-md" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="py-4 text-center text-destructive">
        <p>Failed to load your workout plans. Please try again later.</p>
      </div>
    );
  }
  
  if (!workoutPlans || workoutPlans.length === 0) {
    return (
      <div className="py-8 text-center border rounded-lg bg-muted/10">
        <h3 className="text-lg font-medium mb-2">No Workout Plans Found</h3>
        <p className="text-muted-foreground mb-4">
          You haven't purchased any workout plans yet.
        </p>
        <Button onClick={() => window.location.href = '/marketplace'}>
          Browse Marketplace
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* List of purchased plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workoutPlans.map((purchase) => {
          const plan = purchase.planDetails!;
          
          return (
            <Card key={purchase.id} className="h-full flex flex-col hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Badge className="mb-2">{plan.category}</Badge>
                  <Badge variant="outline" className="font-normal">
                    {plan.difficultyLevel}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{plan.title}</CardTitle>
                <CardDescription>
                  {plan.durationWeeks} week{plan.durationWeeks !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-grow pb-2">
                <div className="line-clamp-3 text-sm text-gray-600">
                  {plan.description}
                </div>
                
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="p-2 bg-muted/50 rounded">
                    <Calendar className="h-4 w-4 mx-auto mb-1" />
                    <span>{plan.durationWeeks} weeks</span>
                  </div>
                  <div className="p-2 bg-muted/50 rounded">
                    <Dumbbell className="h-4 w-4 mx-auto mb-1" />
                    <span>{plan.difficultyLevel}</span>
                  </div>
                  <div className="p-2 bg-muted/50 rounded">
                    <Tag className="h-4 w-4 mx-auto mb-1" />
                    <span>{plan.category}</span>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="pt-2">
                <Button 
                  className="w-full" 
                  onClick={() => {
                    setSelectedPlan(plan);
                    setIsCreateFromPlanOpen(true);
                  }}
                >
                  Log Workout from Plan
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
      
      {/* Dialog for selecting templates */}
      <Dialog 
        open={isCreateFromPlanOpen && !!selectedPlan} 
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateFromPlanOpen(false);
            setSelectedPlan(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Start Workout from {selectedPlan?.title}</DialogTitle>
            <DialogDescription>
              Select a template from this plan to start your workout
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {isTemplatesLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <Skeleton className="h-16 w-full" key={i} />
                ))}
              </div>
            ) : isTemplatesError ? (
              <div className="text-center py-4 text-destructive">
                <p>Failed to load templates. Please try again.</p>
              </div>
            ) : !planTemplates || planTemplates.length === 0 ? (
              <div className="text-center py-4">
                <p>No templates found for this plan.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {planTemplates.map((template: any) => (
                  <div 
                    key={template.id}
                    className="p-4 border rounded-lg flex justify-between items-center hover:bg-accent/10 cursor-pointer"
                    onClick={() => handleCreateWorkout(template.templateId)}
                  >
                    <div>
                      <h4 className="font-medium">{template.template?.name || `Week ${template.weekNumber}, Day ${template.dayNumber}`}</h4>
                      <p className="text-sm text-muted-foreground">
                        {template.template?.description || template.notes || `Workout for day ${template.dayNumber}`}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsCreateFromPlanOpen(false);
                setSelectedPlan(null);
              }}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type TabType = 'new' | 'history' | 'analytics' | 'exercises' | 'plans';

export default function WorkoutLogger() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('new');
  const [location, setLocation] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Check URL parameters for tab selection
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam && ['new', 'history', 'analytics', 'exercises', 'plans'].includes(tabParam)) {
      setActiveTab(tabParam as TabType);
    } else if (tabParam === 'templates') {
      // Redirect templates tab to new (programs) tab
      setActiveTab('new');
      const newUrl = `/workouts?tab=new`;
      window.history.replaceState(null, '', newUrl);
    }
  }, [location]);
  
  // Function to update the active tab and the URL
  const updateActiveTab = (value: TabType) => {
    setActiveTab(value);
    // Update URL with tab parameter but maintain the current path
    const newUrl = `/workouts?tab=${value}`;
    window.history.replaceState(null, '', newUrl);
  };
  const [currentWorkout, setCurrentWorkout] = useState<WorkoutWithDetails | null>(null);
  const [isWorkoutStarted, setIsWorkoutStarted] = useState(false);
  
  // Get authenticated user's ID
  const { user } = useAuth();
  
  // Handle when a new workout is created from template
  const handleWorkoutCreated = (workout: WorkoutWithDetails) => {
    setCurrentWorkout(workout);
    setIsWorkoutStarted(true);
  };
  
  // Handle when a workout is saved and redirect to history
  const handleWorkoutSaved = () => {
    updateActiveTab('history');
    setIsWorkoutStarted(false);
    setCurrentWorkout(null);
  };
  
  return (
    <main className="flex-grow container mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Workout Logger</h2>
        <p className="text-gray-500">Track your workouts and monitor your progress</p>
      </div>
      
      {currentWorkout && (
        <Alert className="mb-6 border-green-100 bg-green-50">
          <Clock className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Workout Started!</AlertTitle>
          <AlertDescription className="text-green-700">
            Your workout "{currentWorkout.name}" has been created from template with {currentWorkout.exercises.length} exercises.
          </AlertDescription>
        </Alert>
      )}
      
      <Card className="mb-6 border-0 shadow-sm overflow-hidden">
        <CardHeader className="pb-0 pt-6 px-6">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl">
                {currentWorkout && isWorkoutStarted ? "Log Your Workout" : "Start a Workout"}
              </CardTitle>
              <CardDescription>
                {currentWorkout && isWorkoutStarted 
                  ? "Record your sets, weights, and reps for each exercise" 
                  : "Choose a template or create a new workout from scratch"}
              </CardDescription>
            </div>
            <div className="flex gap-1">
              {currentWorkout && isWorkoutStarted && (
                <div className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 font-medium">
                  Workout Active
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => {
            if (currentWorkout && isWorkoutStarted && value === 'new') {
              // If trying to go back to new tab while workout is in progress,
              // show a confirm dialog (this would be better with a real dialog)
              if (confirm("Are you sure you want to abandon your current workout?")) {
                setCurrentWorkout(null);
                setIsWorkoutStarted(false);
                updateActiveTab(value as TabType);
              }
            } else {
              updateActiveTab(value as TabType);
            }
          }}
          className="w-full"
        >
          <div className="px-6 border-b">
            <TabsList className="justify-start h-12 p-0 bg-transparent border-b-0 w-full">
              <TabsTrigger 
                value="new"
                className="h-12 px-4 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none data-[state=active]:text-primary"
              >
                <div className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.29 7 12 12 20.71 7"></polyline>
                    <line x1="12" y1="22" x2="12" y2="12"></line>
                  </svg>
                  Programs & Plans
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="history"
                className="h-12 px-4 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none data-[state=active]:text-primary"
              >
                <div className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 8v4l2 2"/>
                    <circle cx="12" cy="12" r="10"/>
                  </svg>
                  History
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="analytics"
                className="h-12 px-4 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none data-[state=active]:text-primary"
              >
                <div className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3v18h18"/>
                    <path d="m19 9-5 5-4-4-3 3"/>
                  </svg>
                  Analytics
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="exercises"
                className="h-12 px-4 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none data-[state=active]:text-primary"
              >
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 18h8"/>
                    <path d="M3 22h18"/>
                    <path d="M14 22a7 7 0 1 0 0-14h-4"/>
                    <path d="M4 14.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0Z"/>
                  </svg>
                  Exercises
                </div>
              </TabsTrigger>

            </TabsList>
          </div>
          
          <CardContent className="p-0">
            <TabsContent value="new" className="p-0 m-0">
              {currentWorkout && isWorkoutStarted ? (
                // When a workout is started, show the workout form
                <div className="p-6">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium">{currentWorkout.name}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 mr-1" />
                          <span>{currentWorkout.exercises.length} exercises</span>
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />
                          <span>{currentWorkout.totalSets} sets</span>
                        </div>
                      </div>
                    </div>
                    <WorkoutForm 
                      workout={currentWorkout}
                      onWorkoutSaved={handleWorkoutSaved}
                    />
                  </div>
                </div>
              ) : (
                // Combined Programs & Plans view
                <div>
                  {/* Programs Section */}
                  <div className="p-4 flex justify-between items-center border-b">
                    <h3 className="text-lg font-semibold">Your Workout Programs</h3>
                    <div className="flex gap-2">
                      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Plus className="mr-1 h-4 w-4" />
                            New Template
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create New Template</DialogTitle>
                            <DialogDescription>
                              Create a workout template you can reuse for future workouts.
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target as HTMLFormElement);
                            const name = formData.get('name') as string;
                            const description = formData.get('description') as string;
                            const category = formData.get('category') as string;
                            
                            // Create the template
                            fetch('/api/templates', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json'
                              },
                              body: JSON.stringify({
                                name,
                                description,
                                category
                              }),
                              credentials: 'include'
                            })
                            .then(response => {
                              if (!response.ok) throw new Error('Failed to create template');
                              return response.json();
                            })
                            .then(data => {
                              toast({
                                title: "Template Created",
                                description: "Your template has been created successfully.",
                              });
                              setIsCreateDialogOpen(false);
                              // Refresh the template selectors
                              queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
                            })
                            .catch(error => {
                              toast({
                                title: "Error",
                                description: "Failed to create template. Please try again.",
                                variant: "destructive"
                              });
                              console.error(error);
                            });
                          }} 
                          className="space-y-4"
                          >
                            <div className="space-y-2">
                              <Label htmlFor="name">Template Name</Label>
                              <Input id="name" name="name" placeholder="e.g., Push Day" required />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="description">Description</Label>
                              <Textarea 
                                id="description" 
                                name="description"
                                placeholder="Brief description of this template..." 
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="category">Category</Label>
                              <Select name="category" defaultValue="Strength">
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Strength">Strength</SelectItem>
                                  <SelectItem value="Hypertrophy">Hypertrophy</SelectItem>
                                  <SelectItem value="Endurance">Endurance</SelectItem>
                                  <SelectItem value="HIIT">HIIT</SelectItem>
                                  <SelectItem value="Cardio">Cardio</SelectItem>
                                  <SelectItem value="Flexibility">Flexibility</SelectItem>
                                  <SelectItem value="Recovery">Recovery</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <DialogFooter>
                              <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setIsCreateDialogOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button type="submit">
                                Create Template
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => window.location.href = '/marketplace'}
                      >
                        Browse Marketplace
                      </Button>
                    </div>
                  </div>
                  <div>
                    <TemplateSelector 
                      userId={user?.id}
                      onWorkoutCreated={handleWorkoutCreated} 
                    />
                  </div>

                  {/* Purchased Plans Section */}
                  <div className="border-t">
                    <div className="p-4 border-b">
                      <h3 className="text-lg font-semibold">Your Purchased Plans</h3>
                    </div>
                    <div className="p-4">
                      <PurchasedWorkoutPlans 
                        onWorkoutCreated={handleWorkoutCreated}
                        updateTab={updateActiveTab}
                      />
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="history" className="p-0 m-0">
              <WorkoutHistory 
                onViewWorkout={(workout) => {
                  setCurrentWorkout(workout);
                  setIsWorkoutStarted(true);
                  setActiveTab('new');
                }}
              />
            </TabsContent>
            
            <TabsContent value="analytics" className="p-0 m-0">
              <EnhancedAnalytics />
            </TabsContent>
            
            <TabsContent value="exercises" className="p-0 m-0">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-800">Exercise Library</h3>
                  <CustomExerciseModal onExerciseCreated={() => {
                    toast({
                      title: "Exercise created",
                      description: "Your custom exercise has been added to your library.",
                    });
                    queryClient.invalidateQueries({ queryKey: ['/api/exercises'] });
                  }} />
                </div>
                
                {/* Importing the ExerciseLibrary component */}
                <div className="exercise-library-container">
                  {/* We're reusing the component from the ExerciseLibrary page */}
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {user && <ExerciseLibrary />}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="plans" className="p-0 m-0">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-800">My Workout Plans</h3>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => window.location.href = '/marketplace'}
                  >
                    Browse Marketplace
                  </Button>
                </div>
                
                <PurchasedWorkoutPlans 
                  onWorkoutCreated={handleWorkoutCreated}
                  updateTab={updateActiveTab}
                />
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </main>
  );
}
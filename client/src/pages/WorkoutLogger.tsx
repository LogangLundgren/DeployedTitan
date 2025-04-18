import { useState, useEffect } from "react";
import { WorkoutWithDetails } from "@shared/schema";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import WorkoutForm from "@/components/workout/WorkoutForm";
import WorkoutHistory from "@/components/workout/WorkoutHistory";
import TemplateSelector from "@/components/workout/TemplateSelector";
import CustomExerciseModal from "@/components/workout/CustomExerciseModal";
import EnhancedAnalytics from "@/components/workout/EnhancedAnalytics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, FileText, DollarSign, Plus, Loader2 } from "lucide-react";
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

type TabType = 'new' | 'history' | 'analytics';

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
    if (tabParam && ['new', 'history', 'analytics'].includes(tabParam)) {
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
                    <path d="M12 2v20"/>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                  Programs
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
                // When no workout is started, show the template selector
                <div>
                  <div className="p-4 flex justify-between items-center border-b">
                    <h3 className="text-lg font-semibold">Your Workout Programs</h3>
                    <div className="flex gap-2">
                      <CustomExerciseModal onExerciseCreated={() => {
                        toast({
                          title: "Exercise created",
                          description: "Your custom exercise has been added to your library.",
                        });
                      }} />
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
                    </div>
                  </div>
                  <div>
                    <TemplateSelector 
                      userId={user?.id}
                      onWorkoutCreated={handleWorkoutCreated} 
                    />
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
          </CardContent>
        </Tabs>
      </Card>
    </main>
  );
}
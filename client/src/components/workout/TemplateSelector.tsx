import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Globe, Lock, Loader2, Play, ArrowRight, Calendar } from "lucide-react";
import { Link } from "wouter";
import { Template, TemplateWithExercises, WorkoutWithDetails } from "@shared/schema";

interface TemplateSelectorProps {
  userId: number;
  onWorkoutCreated?: (workout: WorkoutWithDetails) => void;
}

export default function TemplateSelector({ userId, onWorkoutCreated }: TemplateSelectorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State to track if we're creating a workout
  const [creatingWorkoutId, setCreatingWorkoutId] = useState<number | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [isStartWorkoutDialogOpen, setIsStartWorkoutDialogOpen] = useState(false);
  
  // Fetch all templates for the user
  const { data: templates, isLoading } = useQuery<Template[]>({
    queryKey: ['/api/templates', userId],
    queryFn: async () => {
      return await apiRequest<Template[]>(`/api/templates?userId=${userId}`);
    }
  });
  
  // Mutation to create a workout from a template
  const createWorkoutMutation = useMutation({
    mutationFn: async ({ templateId, isPublic }: { templateId: number, isPublic: boolean }) => {
      return await apiRequest<WorkoutWithDetails>(`/api/templates/${templateId}/create-workout`, {
        method: 'POST',
        body: JSON.stringify({ userId, isPublic }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },
    onSuccess: (workout) => {
      toast({
        title: 'Workout created',
        description: 'Your workout has been created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/workouts/recent'] });
      
      // Call the callback if provided
      if (onWorkoutCreated) {
        onWorkoutCreated(workout);
      }
      
      // Close the dialog
      setIsStartWorkoutDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to create workout: ${error.message}`,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setCreatingWorkoutId(null);
    }
  });
  
  // Open start workout dialog
  const openStartWorkoutDialog = (templateId: number) => {
    setSelectedTemplateId(templateId);
    setIsPublic(false); // Reset to private by default
    setIsStartWorkoutDialogOpen(true);
  };
  
  // Start a workout from a template
  const startWorkout = () => {
    if (selectedTemplateId) {
      setCreatingWorkoutId(selectedTemplateId);
      createWorkoutMutation.mutate({ templateId: selectedTemplateId, isPublic });
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading templates...</span>
      </div>
    );
  }
  
  if (!templates || templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No Templates Found</h3>
        <p className="text-muted-foreground max-w-md mb-6">
          You haven't created any workout templates yet. Templates make it easy to quickly start a workout with predefined exercises.
        </p>
        <Button onClick={() => location.assign('/workouts?tab=templates')}>
          Create Your First Template
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-4 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle>{template.name}</CardTitle>
              {template.description && (
                <CardDescription>{template.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="pb-3">
              {template.category && (
                <Badge variant="secondary" className="mb-2">
                  {template.category}
                </Badge>
              )}
            </CardContent>
            <CardFooter className="flex justify-between pt-0">
              <Link href={`/templates/${template.id}`}>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </Link>
              <Button 
                onClick={() => openStartWorkoutDialog(template.id)}
                disabled={createWorkoutMutation.isPending && creatingWorkoutId === template.id}
                size="sm"
              >
                {createWorkoutMutation.isPending && creatingWorkoutId === template.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start Workout
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      {/* Start Workout Dialog */}
      <Dialog open={isStartWorkoutDialogOpen} onOpenChange={setIsStartWorkoutDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Start Workout</DialogTitle>
            <DialogDescription>
              Create a new workout based on this template. Choose sharing options before you begin.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="flex flex-col space-y-1.5">
              <h3 className="text-sm font-medium leading-none">
                Workout Privacy
              </h3>
              <p className="text-sm text-muted-foreground">
                Choose whether to share this workout with other users
              </p>
            </div>
            
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <div className="flex items-center">
                  {isPublic ? (
                    <Globe className="mr-2 h-4 w-4 text-blue-500" />
                  ) : (
                    <Lock className="mr-2 h-4 w-4 text-amber-500" />
                  )}
                  <span className="font-medium">
                    {isPublic ? 'Public Workout' : 'Private Workout'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isPublic 
                    ? 'This workout will be visible in the social feed and on your profile'
                    : 'Only you can see this workout'}
                </p>
              </div>
              
              <Switch
                checked={isPublic}
                onCheckedChange={setIsPublic}
                aria-label="Toggle workout visibility"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStartWorkoutDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={startWorkout}
              disabled={createWorkoutMutation.isPending}
            >
              {createWorkoutMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : 'Start Workout'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
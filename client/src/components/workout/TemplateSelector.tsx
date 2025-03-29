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
import { Loader2, Play, ArrowRight, Calendar } from "lucide-react";
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
  
  // Fetch all templates for the user
  const { data: templates, isLoading } = useQuery<Template[]>({
    queryKey: ['/api/templates', userId],
    queryFn: async () => {
      return await apiRequest<Template[]>(`/api/templates?userId=${userId}`);
    }
  });
  
  // Mutation to create a workout from a template
  const createWorkoutMutation = useMutation({
    mutationFn: async (templateId: number) => {
      return await apiRequest<WorkoutWithDetails>(`/api/templates/${templateId}/create-workout`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
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
  
  // Start a workout from a template
  const startWorkout = (templateId: number) => {
    setCreatingWorkoutId(templateId);
    createWorkoutMutation.mutate(templateId);
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
        <Link href="/templates">
          <Button>
            Create Your First Template
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
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
                onClick={() => startWorkout(template.id)}
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
    </div>
  );
}
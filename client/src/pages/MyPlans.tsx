import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { 
  Star, 
  PlusCircle,
  Edit,
  Trash2,
  AlertTriangle,
  Eye,
  LayoutGrid
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface WorkoutPlan {
  id: number;
  title: string;
  description: string;
  durationWeeks: number;
  difficultyLevel: string;
  category: string;
  price: number;
  rating: number | null;
  coachId: number;
  isPublished?: boolean;
  isFeatured?: boolean;
  sales?: number;
  ratingsCount?: number;
  equipment?: string | null;
  featuredImageUrl?: string | null;
}

export default function MyPlans() {
  const [location, setLocation] = useLocation();
  const [planToDelete, setPlanToDelete] = useState<WorkoutPlan | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user: authUser } = useAuth();
  const userId = authUser?.id;
  
  // Fetch user info to check if they're a coach
  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ['/api/user'],
    queryFn: () => fetch('/api/user').then(res => res.json()),
    enabled: !!userId
  });

  // Fetch coach profile if user is a coach
  const { data: coachProfile, isLoading: isCoachProfileLoading } = useQuery({
    queryKey: ['/api/coach-profile'],
    queryFn: () => fetch('/api/coach-profile').then(res => res.json()),
    enabled: !!userId && !!user?.isCoach
  });
  
  // Fetch coach's workout plans if user is a coach and we have their coach profile
  const { 
    data: coachPlans = [], 
    isLoading: isCoachPlansLoading 
  } = useQuery({
    queryKey: ['/api/workout-plans/my-plans'],
    queryFn: () => fetch('/api/workout-plans/my-plans').then(res => res.json()),
    enabled: !!userId && !!user?.isCoach
  });
  
  // Delete workout plan mutation
  const deletePlanMutation = useMutation({
    mutationFn: async (planId: number) => {
      console.log(`Attempting to delete plan with ID: ${planId}`);
      
      // Use fetch directly to get the exact response
      try {
        const response = await fetch(`/api/workout-plans/${planId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
        });
        
        console.log('Delete plan response status:', response.status);
        
        if (!response.ok) {
          // Try to parse error message if available
          try {
            const errorData = await response.json();
            console.error('Delete plan error response:', errorData);
            throw new Error(errorData.message || 'Failed to delete plan');
          } catch (parseError) {
            // If response can't be parsed as JSON
            throw new Error(`Delete failed with status: ${response.status}`);
          }
        }
        
        return response; // The endpoint returns 204 No Content on successful delete
      } catch (error) {
        console.error('Error deleting plan:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('Plan deletion successful, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['/api/workout-plans/my-plans'] });
      queryClient.invalidateQueries({ queryKey: ['/api/workout-plans'] }); // Also invalidate marketplace plans
      toast({
        title: "Plan deleted",
        description: "The workout plan has been deleted successfully."
      });
      setConfirmDialogOpen(false);
      setPlanToDelete(null);
    },
    onError: (error) => {
      console.error('Delete plan mutation error:', error);
      toast({
        title: "Error",
        description: `Failed to delete plan: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive"
      });
    }
  });
  
  // Publish/unpublish workout plan mutation
  const publishPlanMutation = useMutation({
    mutationFn: async ({ planId, isPublished }: { planId: number, isPublished: boolean }) => {
      // Use the specialized publish endpoint for publishing, and regular update for unpublishing
      if (isPublished) {
        return await apiRequest("POST", `/api/workout-plans/${planId}/publish`, {});
      } else {
        return await apiRequest("PUT", `/api/workout-plans/${planId}`, { isPublished: false });
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/workout-plans/my-plans'] });
      queryClient.invalidateQueries({ queryKey: ['/api/workout-plans'] }); // Also invalidate marketplace plans
      
      // Use the mutation variables to determine the action, not the response data
      const isPublishing = variables.isPublished;
      
      toast({
        title: isPublishing ? "Plan published" : "Plan unpublished",
        description: isPublishing 
          ? "Your workout plan is now live in the marketplace!" 
          : "Your workout plan has been removed from the marketplace.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update publication status. Please try again later.",
        variant: "destructive",
      });
    }
  });

  // Star rating display component
  const StarRating = ({ rating }: { rating: number | null }) => {
    if (rating === null) return <span>No ratings yet</span>;
    
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < Math.floor(rating) 
                ? "text-yellow-400 fill-yellow-400" 
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const isLoading = isUserLoading || (user?.isCoach && (isCoachProfileLoading || isCoachPlansLoading));

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            My Workout Plans
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your created workout plans for clients
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="default" onClick={() => setLocation('/create-plan')}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Plan
          </Button>
        </div>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2">Loading your coach plans...</p>
          </div>
        ) : coachPlans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coachPlans.map((plan: WorkoutPlan) => (
              <Card key={plan.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-semibold line-clamp-2">{plan.title}</CardTitle>
                    <Badge variant={plan.isPublished ? "default" : "outline"}>
                      {plan.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2 mt-1">
                    {plan.category} • {plan.difficultyLevel} • {plan.durationWeeks} weeks
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="line-clamp-3 text-sm text-gray-600 dark:text-gray-400">{plan.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center">
                      <span className="font-medium">${plan.price}</span>
                      {plan.sales > 0 && (
                        <span className="text-xs text-gray-500 ml-2">
                          {plan.sales} {plan.sales === 1 ? 'sale' : 'sales'}
                        </span>
                      )}
                    </div>
                    <StarRating rating={plan.rating} />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between pt-2 border-t">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setLocation(`/edit-plan/${plan.id}`)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setPlanToDelete(plan);
                        setConfirmDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setLocation(`/workout-plans/${plan.id}`)}>
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Switch 
                      id={`publish-${plan.id}`}
                      checked={plan.isPublished}
                      onCheckedChange={(isChecked) => {
                        publishPlanMutation.mutate({
                          planId: plan.id, 
                          isPublished: isChecked
                        });
                      }}
                    />
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border rounded-lg bg-gray-50 dark:bg-gray-900">
            <LayoutGrid className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium">No workout plans yet</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating your first workout plan for your clients.
            </p>
            <Button className="mt-6" onClick={() => setLocation('/create-plan')}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Plan
            </Button>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the workout plan "{planToDelete?.title}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (planToDelete) {
                  deletePlanMutation.mutate(planToDelete.id);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
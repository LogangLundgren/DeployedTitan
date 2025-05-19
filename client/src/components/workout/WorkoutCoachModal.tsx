import { useState, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Workout, User } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; 
import { useAuth } from "@/hooks/use-auth";

interface WorkoutCoachModalProps {
  workout: Workout;
  isOpen: boolean;
  onClose: () => void;
}

export default function WorkoutCoachModal({ workout, isOpen, onClose }: WorkoutCoachModalProps) {
  const [notes, setNotes] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Get coach information if the user has a coach
  const { data: coachData, isLoading: isLoadingCoach } = useQuery({
    queryKey: ['/api/coach/my-coach'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/coach/my-coach');
        if (!res.ok) {
          if (res.status === 404) {
            return null; // User doesn't have a coach
          }
          throw new Error('Failed to fetch coach data');
        }
        return await res.json();
      } catch (error) {
        console.error("Error fetching coach data:", error);
        return null;
      }
    },
    enabled: !!user,
  });

  // Determine if user has a coach
  const hasCoach = !!coachData;

  // Share workout with coach
  const shareWithCoachMutation = useMutation({
    mutationFn: async () => {
      if (!workout?.id || !hasCoach) {
        throw new Error("Cannot share workout - either no workout ID or no coach assigned");
      }
      
      setIsUploading(true);
      setUploadProgress(25);
      
      // First update the workout with completion status
      const updateResponse = await apiRequest(
        "PATCH",
        `/api/workouts/${workout.id}`,
        {
          isComplete: true,
          // We'll use the caption field to store coach notes temporarily
          // until the schema is updated
          caption: `COACH_NOTE: ${notes || ""}`
        }
      );

      if (!updateResponse.ok) {
        throw new Error("Failed to update workout");
      }
      
      setUploadProgress(50);
      
      // Then share with coach via coach-client endpoint
      // We'll create a simple notification for the coach
      const shareResponse = await apiRequest(
        "POST",
        `/api/notifications/create`,
        {
          userId: coachData.id,
          title: "New Workout Shared",
          message: `Client ${workout.userId} shared a workout: ${workout.name}`,
          type: "WORKOUT_SHARED",
          linkUrl: `/workouts/${workout.id}`
        }
      );
      
      setUploadProgress(100);
      
      if (!shareResponse.ok) {
        throw new Error("Failed to share workout with coach");
      }

      return await shareResponse.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/workouts'] });
      
      toast({
        title: "Workout shared with coach",
        description: "Your coach has been notified about your completed workout"
      });
      
      // Close the modal
      onClose();
    },
    onError: (error) => {
      console.error("Error sharing workout with coach:", error);
      setIsUploading(false);
      setUploadProgress(0);
      
      toast({
        title: "Error",
        description: "Failed to share workout with coach. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Just save the workout without sharing (for users without a coach)
  const saveWorkoutMutation = useMutation({
    mutationFn: async () => {
      if (!workout?.id) {
        throw new Error("No workout ID found");
      }
      
      setIsUploading(true);
      setUploadProgress(50);
      
      // Update the workout with completion status
      const response = await apiRequest(
        "PATCH",
        `/api/workouts/${workout.id}`,
        {
          isComplete: true,
          // Add a note in caption if the user entered one
          caption: notes ? `PERSONAL_NOTE: ${notes}` : undefined
        }
      );

      setUploadProgress(100);
      
      if (!response.ok) {
        throw new Error("Failed to update workout");
      }

      return await response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/workouts'] });
      
      toast({
        title: "Workout saved",
        description: "Your workout has been saved successfully"
      });
      
      // Close the modal
      onClose();
    },
    onError: (error) => {
      console.error("Error saving workout:", error);
      setIsUploading(false);
      setUploadProgress(0);
      
      toast({
        title: "Error",
        description: "Failed to save workout. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasCoach) {
      shareWithCoachMutation.mutate();
    } else {
      saveWorkoutMutation.mutate();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Workout Complete!</DialogTitle>
          <DialogDescription>
            {hasCoach 
              ? "Share your workout results with your coach for feedback and tracking" 
              : "Your workout has been completed successfully"}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {hasCoach && (
            <>
              <div className="bg-muted/40 rounded-lg p-4 flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>
                    {coachData?.name?.substring(0, 2).toUpperCase() || 
                     coachData?.username?.substring(0, 2).toUpperCase() || 'CO'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-medium">Your Coach</h4>
                  <p className="text-sm text-muted-foreground">
                    {coachData?.name || coachData?.username}
                  </p>
                </div>
                <div className="ml-auto">
                  <div className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                    Active
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="notes" className="text-sm font-medium">
                  Notes for your coach (optional)
                </label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="How did your workout feel? Any challenges or achievements to mention to your coach?"
                  className="resize-none h-24"
                />
              </div>
            </>
          )}
          
          {/* Workout summary to show the workout details */}
          <div className="space-y-1 border rounded-md p-4">
            <h3 className="font-medium">{workout.name}</h3>
            <div className="text-sm text-muted-foreground">
              <p>Category: {workout.category || 'Strength'}</p>
              <p>Date: {new Date(workout.date).toLocaleDateString()}</p>
              {workout.notes && <p>Notes: {workout.notes}</p>}
            </div>
          </div>
          
          {/* Show upload progress if we're currently uploading */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{hasCoach ? "Sharing with coach..." : "Saving workout..."}</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
          
          <DialogFooter className="mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={shareWithCoachMutation.isPending || saveWorkoutMutation.isPending || isUploading}
            >
              Skip
            </Button>
            <Button 
              type="submit"
              disabled={shareWithCoachMutation.isPending || saveWorkoutMutation.isPending || isUploading}
            >
              {(shareWithCoachMutation.isPending || saveWorkoutMutation.isPending || isUploading) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {hasCoach ? "Sharing..." : "Saving..."}
                </>
              ) : (
                <>
                  {hasCoach ? (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Share with Coach
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Complete Workout
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
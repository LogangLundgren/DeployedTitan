import { useState, useEffect } from "react";
import { WorkoutWithDetails } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface WorkoutEditModalProps {
  workout: WorkoutWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function WorkoutEditModal({ workout, isOpen, onClose }: WorkoutEditModalProps) {
  const { toast } = useToast();
  const [caption, setCaption] = useState(workout?.notes || "");
  const [name, setName] = useState(workout?.name || "");
  const [isPublic, setIsPublic] = useState(workout?.isPublic || false);

  // Reset form when workout changes
  useEffect(() => {
    if (workout) {
      setCaption(workout.notes || "");
      setName(workout.name || "");
      setIsPublic(workout.isPublic || false);
    }
  }, [workout]);

  const updateWorkoutMutation = useMutation({
    mutationFn: async () => {
      if (!workout) return null;

      const response = await apiRequest(
        "PUT",
        `/api/workouts/${workout.id}`,
        {
          name,
          notes: caption,
          isPublic
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update workout");
      }

      return await response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/workouts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/workouts/community'] });

      toast({
        title: "Workout updated",
        description: "Your workout has been updated successfully"
      });

      onClose();
    },
    onError: (error) => {
      console.error("Error updating workout:", error);
      toast({
        title: "Error",
        description: "Failed to update workout. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateWorkoutMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Workout Post</DialogTitle>
            <DialogDescription>
              Update your workout details and social sharing options
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="workout-name">Workout Name</Label>
              <Input
                id="workout-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter workout name"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="caption">Caption</Label>
              <Textarea
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption to your workout..."
                rows={4}
              />
              <p className="text-sm text-muted-foreground">
                This caption will appear on your social feed posts.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
              <Label htmlFor="public">Make this workout public</Label>
            </div>
          </div>
          
          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateWorkoutMutation.isPending}
            >
              {updateWorkoutMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
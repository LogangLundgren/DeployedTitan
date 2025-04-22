import { useState } from "react";
import { useNavigate } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Workout } from "@shared/schema";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, ImagePlus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface WorkoutSocialModalProps {
  workout: Workout;
  isOpen: boolean;
  onClose: () => void;
}

export default function WorkoutSocialModal({ workout, isOpen, onClose }: WorkoutSocialModalProps) {
  const [caption, setCaption] = useState(workout.caption || "");
  const [isPublic, setIsPublic] = useState(workout.isPublic || true);
  const [isComplete, setIsComplete] = useState(true);
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Update the social aspects of the workout
  const updateWorkoutMutation = useMutation({
    mutationFn: async () => {
      // First, update the workout with caption and completion status
      const response = await apiRequest(
        "PATCH",
        `/api/workouts/${workout.id}`,
        {
          caption,
          isPublic,
          isComplete,
          // In a real implementation, we would upload images and then update mediaUrls
          // For now, we'll just update the text fields
          mediaUrls: imageFiles ? "placeholder_for_future_image_urls" : null
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
        title: "Workout shared",
        description: isPublic 
          ? "Your workout has been shared with the community" 
          : "Your workout has been saved"
      });
      
      // Close the modal and navigate to social feed if it was shared publicly
      onClose();
      if (isPublic) {
        navigate("/social");
      }
    },
    onError: (error) => {
      console.error("Error updating workout:", error);
      toast({
        title: "Error",
        description: "Failed to share workout. Please try again.",
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Share Your Workout</DialogTitle>
          <DialogDescription>
            Add a caption and photos to share your workout with the Titan Fitness community.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="How did your workout feel? Any achievements to celebrate?"
              className="resize-none h-24"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="images">Add Photos</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-dashed rounded-md p-4 flex flex-col items-center justify-center text-center">
                <Input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => setImageFiles(e.target.files)}
                />
                <Label htmlFor="images" className="cursor-pointer w-full h-full flex flex-col items-center justify-center gap-2">
                  <ImagePlus className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Click to add photos</span>
                </Label>
              </div>
              {imageFiles && imageFiles.length > 0 && (
                <div className="border rounded-md p-2 flex items-center">
                  <div className="text-sm">
                    <p className="font-medium">{imageFiles.length} photo{imageFiles.length > 1 ? 's' : ''} selected</p>
                    <p className="text-muted-foreground text-xs">Click again to change</p>
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Image upload will be available in a future update</p>
          </div>
          
          <div className="flex items-center space-x-2 py-2">
            <Checkbox 
              id="isPublic" 
              checked={isPublic}
              onCheckedChange={(checked) => setIsPublic(checked === true)}
            />
            <Label htmlFor="isPublic" className="text-sm font-medium leading-none cursor-pointer">
              Share with community
            </Label>
          </div>
          
          <DialogFooter className="mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={updateWorkoutMutation.isPending}
            >
              Skip
            </Button>
            <Button 
              type="submit"
              disabled={updateWorkoutMutation.isPending}
            >
              {updateWorkoutMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sharing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {isPublic ? "Share Workout" : "Save & Finish"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
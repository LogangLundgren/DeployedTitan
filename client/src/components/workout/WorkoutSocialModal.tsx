import { useState, useRef } from "react";
import { useLocation } from "wouter";
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
import { Loader2, Upload, ImagePlus, X, Camera, Video } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";

interface WorkoutSocialModalProps {
  workout: Workout;
  isOpen: boolean;
  onClose: () => void;
}

export default function WorkoutSocialModal({ workout, isOpen, onClose }: WorkoutSocialModalProps) {
  // Debug workout object
  console.log("Workout in social modal:", workout);
  
  const [caption, setCaption] = useState(workout?.caption || "");
  const [isPublic, setIsPublic] = useState(workout?.isPublic !== false);
  const [isComplete, setIsComplete] = useState(true);
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);
  const [selectedImages, setSelectedImages] = useState<{ file: File; preview: string }[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Handle file selection and create image previews
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    setImageFiles(e.target.files);
    
    // Create previews for selected images
    const newSelectedImages: { file: File; preview: string }[] = [];
    
    Array.from(e.target.files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        return; // Skip non-image files
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newSelectedImages.push({
            file,
            preview: event.target.result as string
          });
          
          if (newSelectedImages.length === e.target.files!.length) {
            setSelectedImages(newSelectedImages);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Upload selected images to the server
  const uploadImagesMutation = useMutation({
    mutationFn: async () => {
      if (!selectedImages.length) return null;
      
      setIsUploading(true);
      
      // Convert images to base64 format for upload
      const uploadedFiles = selectedImages.map(image => {
        return {
          fileName: image.file.name,
          fileType: image.file.type,
          fileSize: image.file.size,
          fileUrl: image.preview,
          mimeType: image.file.type
        };
      });
      
      const uploadResponse = await apiRequest(
        "POST",
        "/api/media/upload",
        {
          uploadedFiles,
          workoutId: workout.id,
          caption
        }
      );
      
      if (!uploadResponse.ok) {
        throw new Error("Failed to upload images");
      }
      
      const result = await uploadResponse.json();
      setUploadProgress(100);
      return result;
    }
  });
  
  // Update the social aspects of the workout
  const updateWorkoutMutation = useMutation({
    mutationFn: async () => {
      // Check if we have a valid workout ID
      if (!workout?.id) {
        console.error("No workout ID found in social modal");
        throw new Error("No workout ID found. Cannot share workout.");
      }
      
      console.log("Updating workout with ID:", workout.id);
      
      // Upload images first if we have any
      let mediaUrls = null;
      
      if (selectedImages.length > 0) {
        setIsUploading(true);
        try {
          // Simulate upload progress (in a real app, this would come from the upload API)
          for (let i = 0; i <= 100; i += 10) {
            setUploadProgress(i);
            if (i < 100) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
          
          // Upload the images
          // In a production app, this would be a real API call to upload files
          // For now, we'll just simulate it
          const imageUrls = selectedImages.map((image, index) => ({
            url: image.preview,
            id: `temp-id-${index}`
          }));
          
          mediaUrls = JSON.stringify(imageUrls.map(img => img.url));
          
        } catch (error) {
          console.error("Error uploading images:", error);
          throw new Error("Failed to upload images");
        }
      }
      
      // Update the workout with caption and completion status
      const response = await apiRequest(
        "PATCH",
        `/api/workouts/${workout.id}`,
        {
          caption,
          isPublic,
          isComplete,
          mediaUrls
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
        setLocation("/social");
      }
    },
    onError: (error) => {
      console.error("Error updating workout:", error);
      setIsUploading(false);
      setUploadProgress(0);
      
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
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                />
                <Label htmlFor="images" className="cursor-pointer w-full h-full flex flex-col items-center justify-center gap-2">
                  <ImagePlus className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Click to add photos</span>
                </Label>
              </div>
              {selectedImages.length > 0 && (
                <div className="border rounded-md p-2 flex items-center">
                  <div className="text-sm">
                    <p className="font-medium">{selectedImages.length} photo{selectedImages.length > 1 ? 's' : ''} selected</p>
                    <p className="text-muted-foreground text-xs">Click again to change</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Image previews */}
            {selectedImages.length > 0 && (
              <div className="mt-4">
                <div className="flex gap-2 mb-2 items-center">
                  <Label>Selected Photos</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="h-7 px-2"
                    onClick={() => {
                      setSelectedImages([]);
                      setImageFiles(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {selectedImages.map((image, index) => (
                    <div key={index} className="relative aspect-square rounded-md overflow-hidden border">
                      <img 
                        src={image.preview}
                        alt={`Selected image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 bg-background/80 hover:bg-background rounded-full"
                        onClick={() => {
                          const newImages = [...selectedImages];
                          newImages.splice(index, 1);
                          setSelectedImages(newImages);
                          
                          // If we've removed all images, reset the input
                          if (newImages.length === 0) {
                            setImageFiles(null);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                            }
                          }
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
          
          {/* Show upload progress if we're currently uploading */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading images...</span>
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
              disabled={updateWorkoutMutation.isPending || isUploading}
            >
              Skip
            </Button>
            <Button 
              type="submit"
              disabled={updateWorkoutMutation.isPending || isUploading}
            >
              {updateWorkoutMutation.isPending || isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isUploading ? `Uploading... ${uploadProgress}%` : "Sharing..."}
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
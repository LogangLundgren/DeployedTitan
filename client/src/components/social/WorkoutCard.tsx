import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { WorkoutWithExtraStats } from "@shared/schema";
import { demoUsers } from "@/pages/Social";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLikes } from "@/context/likes-context";
import WorkoutEditModal from "./WorkoutEditModal";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Heart, MessageCircle, MoreVertical, Edit, Trash2 } from "lucide-react";

interface WorkoutCardProps {
  workout: WorkoutWithExtraStats;
  formatDate: (date: Date | string) => string;
  formatTime: (date: Date | string) => string;
}

export default function WorkoutCard({ workout, formatDate, formatTime }: WorkoutCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { hasLiked, toggleLike, getLikesCount } = useLikes();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const isOwner = user && workout.userId === user.id;
  
  // Check if workout is liked by current user
  const isLiked = hasLiked(workout.id);
  const likesCount = getLikesCount(workout.id);
  
  // Fetch comment count
  useEffect(() => {
    const fetchCommentCount = async () => {
      try {
        const response = await apiRequest(`GET`, `/api/comments/${workout.id}`);
        const comments = await response.json();
        setCommentCount(comments.length);
      } catch (error) {
        console.error('Error fetching comments:', error);
      }
    };
    
    fetchCommentCount();
  }, [workout.id]);

  // Format for display
  const userDisplayName = user && workout.userId === user.id 
    ? "You" 
    : demoUsers.find(u => u.id === workout.userId)?.name || "User " + workout.userId;

  // Delete workout mutation
  const deleteWorkoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "DELETE",
        `/api/workouts/${workout.id}`,
        {}
      );

      if (!response.ok) {
        throw new Error("Failed to delete workout");
      }

      return await response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/workouts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/workouts/community'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });

      toast({
        title: "Workout deleted",
        description: "Your workout has been deleted successfully"
      });
    },
    onError: (error) => {
      console.error("Error deleting workout:", error);
      toast({
        title: "Error",
        description: "Failed to delete workout. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this workout?")) {
      deleteWorkoutMutation.mutate();
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarImage src={""} />
                <AvatarFallback>
                  {user && workout.userId === user.id ? "ME" : "U" + workout.userId}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{userDisplayName}</div>
                <div className="text-sm text-muted-foreground">
                  {formatDate(workout.date)} at {formatTime(workout.date)}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">{workout.category || "Workout"}</Badge>
              
              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">More options</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive" 
                      onClick={handleDelete}
                      disabled={deleteWorkoutMutation.isPending}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {deleteWorkoutMutation.isPending ? "Deleting..." : "Delete"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="mb-2">
            <Link href={`/workout/${workout.id}`}>
              <span className="text-lg font-medium hover:underline cursor-pointer">{workout.name}</span>
            </Link>
            <p className="text-muted-foreground mt-1">
              {workout.caption || workout.notes || "Completed a workout"}
            </p>
            
            {/* Display workout image if available */}
            {workout.mediaUrls && (
              <div className="mt-3">
                {(() => {
                  try {
                    const mediaUrls = JSON.parse(workout.mediaUrls as string);
                    if (Array.isArray(mediaUrls) && mediaUrls.length > 0) {
                      return (
                        <div className="rounded-md overflow-hidden mt-2">
                          <img 
                            src={mediaUrls[0].startsWith('/uploads') ? window.location.origin + mediaUrls[0] : mediaUrls[0]} 
                            alt="Workout media" 
                            className="w-full h-auto max-h-80 object-cover"
                            onError={(e) => {
                              console.error('Image failed to load:', mediaUrls[0]);
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      );
                    }
                    return null;
                  } catch (error) {
                    console.error('Error parsing mediaUrls:', error);
                    return null;
                  }
                })()}
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4 text-center">
            <div>
              <div className="text-xl font-semibold">
                {workout.duration} min
              </div>
              <div className="text-xs text-muted-foreground">Duration</div>
            </div>
            <div>
              <div className="text-xl font-semibold">
                {typeof workout.totalExercises === 'number' ? workout.totalExercises : '0'}
              </div>
              <div className="text-xs text-muted-foreground">Exercises</div>
            </div>
            <div>
              <div className="text-xl font-semibold">
                {typeof workout.volume === 'number' ? `${workout.volume} lbs` : '0 lbs'}
              </div>
              <div className="text-xs text-muted-foreground">Volume</div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-0 flex justify-between">
          <div className="flex space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`h-8 px-2 ${isLiked ? 'text-red-500 hover:text-red-600' : ''}`}
              onClick={() => toggleLike(workout.id)}
            >
              <Heart className={`h-4 w-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
              {likesCount > 0 ? `${likesCount}` : 'Like'}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2"
              onClick={() => setLocation(`/workouts/${workout.id}`)}
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              {commentCount > 0 ? `${commentCount}` : 'Comment'}
            </Button>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setLocation(`/workouts/${workout.id}`)}
          >
            View Details
          </Button>
        </CardFooter>
      </Card>

      {/* Edit Modal */}
      <WorkoutEditModal
        workout={workout}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </>
  );
}
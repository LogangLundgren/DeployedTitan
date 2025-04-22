import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useLikes } from "@/context/likes-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Loader2, 
  Heart, 
  MessageCircle,
  Clock,
  Dumbbell,
  Weight,
  ArrowLeft
} from "lucide-react";

interface WorkoutComment {
  id: number;
  userId: number;
  workoutId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    username: string;
    name: string;
  };
}

export default function WorkoutDetail() {
  const { id } = useParams();
  const workoutId = id ? parseInt(id) : 0;
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { hasLiked, toggleLike, getLikesCount } = useLikes();
  const [commentText, setCommentText] = useState("");
  
  // Redirect to social feed if no valid ID
  useEffect(() => {
    if (!id || isNaN(workoutId) || workoutId <= 0) {
      console.log("Missing or invalid workout ID, redirecting to social feed");
      setLocation('/social');
    }
  }, [id, workoutId, setLocation]);

  // Check if workout is liked by current user
  const isLiked = hasLiked(workoutId);
  const likesCount = getLikesCount(workoutId);
  
  // Fetch workout details
  const { 
    data: workout, 
    isLoading: workoutLoading, 
    isError: workoutError,
    refetch: refetchWorkout
  } = useQuery({
    queryKey: ['/api/workouts', workoutId],
    queryFn: async () => {
      const response = await apiRequest(`GET`, `/api/workouts/${workoutId}`);
      return await response.json();
    },
    enabled: !isNaN(workoutId),
  });
  
  // Fetch workout comments
  const { 
    data: comments = [], 
    isLoading: commentsLoading,
    refetch: refetchComments
  } = useQuery({
    queryKey: ['/api/comments', workoutId],
    queryFn: async () => {
      const response = await apiRequest(`GET`, `/api/comments/${workoutId}`);
      return await response.json();
    },
    enabled: !isNaN(workoutId),
  });
  
  // Format dates
  const formatDate = (date: string | Date) => {
    return format(new Date(date), 'PPP');
  };
  
  const formatTime = (date: string | Date) => {
    return format(new Date(date), 'p');
  };
  
  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user?.id) {
        throw new Error("You must be logged in to comment");
      }
      
      const response = await apiRequest(
        "POST", 
        "/api/comments", 
        { 
          workoutId,
          userId: user.id,
          content
        }
      );
      return await response.json();
    },
    onSuccess: () => {
      setCommentText("");
      refetchComments();
      toast({
        title: "Comment added",
        description: "Your comment has been posted successfully."
      });
    },
    onError: (error) => {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      const response = await apiRequest(
        "DELETE",
        `/api/comments/${commentId}`
      );
      return await response.json();
    },
    onSuccess: () => {
      refetchComments();
      toast({
        title: "Comment deleted",
        description: "Your comment has been deleted successfully."
      });
    },
    onError: (error) => {
      console.error("Error deleting comment:", error);
      toast({
        title: "Error",
        description: "Failed to delete comment. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    addCommentMutation.mutate(commentText);
  };
  
  const handleDeleteComment = (commentId: number) => {
    if (confirm("Are you sure you want to delete this comment?")) {
      deleteCommentMutation.mutate(commentId);
    }
  };
  
  if (workoutLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (workoutError || !workout) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-4">Workout Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The workout you're looking for doesn't exist or has been deleted.
        </p>
        <Button onClick={() => setLocation('/social')}>
          Back to Social Feed
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Button 
        variant="outline" 
        className="mb-6" 
        onClick={() => setLocation('/social')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Feed
      </Button>
      
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage src="" />
              <AvatarFallback>
                {workout.userId === user?.id ? "ME" : "U" + workout.userId}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{workout.name}</CardTitle>
              <CardDescription>
                {formatDate(workout.date)} at {formatTime(workout.date)}
              </CardDescription>
            </div>
          </div>
          <div className="flex justify-between items-center mt-2">
            <Badge variant="outline">{workout.category || "Workout"}</Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Caption */}
          {workout.caption && (
            <p className="text-muted-foreground mb-6">{workout.caption}</p>
          )}
          
          {/* Display workout image if available */}
          {workout.mediaUrls && (
            <div className="mb-6">
              {(() => {
                try {
                  const mediaUrls = JSON.parse(workout.mediaUrls as string);
                  if (Array.isArray(mediaUrls) && mediaUrls.length > 0) {
                    return (
                      <div className="rounded-md overflow-hidden">
                        <img 
                          src={mediaUrls[0].startsWith('/uploads') ? window.location.origin + mediaUrls[0] : mediaUrls[0]} 
                          alt="Workout media" 
                          className="w-full h-auto max-h-[400px] object-contain bg-muted/30"
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
          
          <div className="grid grid-cols-3 gap-4 mb-6 text-center">
            <div className="bg-muted/50 rounded-lg p-4">
              <Clock className="h-5 w-5 mx-auto mb-2 text-primary" />
              <div className="text-xl font-semibold">
                {workout.duration} min
              </div>
              <div className="text-xs text-muted-foreground">Duration</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <Dumbbell className="h-5 w-5 mx-auto mb-2 text-primary" />
              <div className="text-xl font-semibold">
                {workout.totalExercises || 0}
              </div>
              <div className="text-xs text-muted-foreground">Exercises</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <Weight className="h-5 w-5 mx-auto mb-2 text-primary" />
              <div className="text-xl font-semibold">
                {workout.volume || 0} lbs
              </div>
              <div className="text-xs text-muted-foreground">Volume</div>
            </div>
          </div>
          
          {workout.notes && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Notes</h3>
              <p className="text-muted-foreground">{workout.notes}</p>
            </div>
          )}
          
          {workout.exercises && workout.exercises.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Exercises</h3>
              <div className="space-y-4">
                {workout.exercises.map((exercise: any) => (
                  <Card key={exercise.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{exercise.exerciseDetails?.name || "Exercise"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {exercise.sets && exercise.sets.length > 0 ? (
                        <div className="text-sm">
                          <div className="grid grid-cols-3 font-medium mb-2">
                            <div>Set</div>
                            <div>Weight</div>
                            <div>Reps</div>
                          </div>
                          {exercise.sets.map((set: any, index: number) => (
                            <div key={set.id} className="grid grid-cols-3 py-1 border-t border-border/50">
                              <div>{index + 1}</div>
                              <div>{set.weight} lbs</div>
                              <div>{set.reps}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">No sets recorded</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between border-t pt-6">
          <div className="flex space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`${isLiked ? 'text-red-500 hover:text-red-600' : ''}`}
              onClick={() => toggleLike(workoutId)}
            >
              <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
              {likesCount > 0 ? `${likesCount} Likes` : 'Like'}
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => document.getElementById('comment-input')?.focus()}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              {comments.length > 0 ? `${comments.length} Comments` : 'Comment'}
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      {/* Comments Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold mb-4">Comments</h2>
        
        {/* Comment Form */}
        <form onSubmit={handleSubmitComment} className="space-y-4">
          <Textarea
            id="comment-input"
            placeholder="Write a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="min-h-[120px]"
          />
          <Button 
            type="submit" 
            disabled={addCommentMutation.isPending || !commentText.trim()}
          >
            {addCommentMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Posting...
              </>
            ) : (
              'Post Comment'
            )}
          </Button>
        </form>
        
        <Separator className="my-6" />
        
        {/* Comments List */}
        {commentsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment: WorkoutComment) => (
              <div key={comment.id} className="flex space-x-4">
                <Avatar>
                  <AvatarImage src="" />
                  <AvatarFallback>
                    {comment.userId === user?.id ? "ME" : "U" + comment.userId}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="font-medium mb-1">
                        {comment.userId === user?.id ? "You" : comment.user?.name || `User ${comment.userId}`}
                      </div>
                      {comment.userId === user?.id && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-muted-foreground"
                          onClick={() => handleDeleteComment(comment.id)}
                          disabled={deleteCommentMutation.isPending}
                        >
                          {deleteCommentMutation.isPending ? 
                            <Loader2 className="h-4 w-4 animate-spin" /> : 
                            <span className="text-xs">×</span>
                          }
                        </Button>
                      )}
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 ml-2">
                    {formatDate(comment.createdAt)} at {formatTime(comment.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
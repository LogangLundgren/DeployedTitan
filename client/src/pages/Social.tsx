import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "../lib/queryClient";
import { Link, useLocation, useSearch } from "wouter";
import { useFollow } from "@/context/follow-context";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Messages } from "@/components/messages/Messages";
import WorkoutCard from "@/components/social/WorkoutCard";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { format } from "date-fns";
import type { User, Workout, WorkoutWithDetails, Goal } from "@shared/schema";

// Extended workout type with stats for the social feed
export interface WorkoutWithExtraStats extends Workout {
  totalExercises?: number;
  volume?: number;
}

// Comment type
export interface WorkoutComment {
  id: number;
  userId: number;
  username: string;
  text: string;
  createdAt: Date;
}

// Demo data (in a real app, this would come from the API)
export const demoUsers = [
  { id: 2, username: "JessicaFitPro", name: "Jessica Chen", profilePicture: "" },
  { id: 3, username: "StrengthCoach", name: "Mike Johnson", profilePicture: "" },
  { id: 4, username: "RunnerGirl", name: "Sarah Williams", profilePicture: "" },
  { id: 5, username: "IronPumper", name: "Alex Rodriguez", profilePicture: "" },
];

interface UserProfile {
  id: number;
  username: string;
  name: string;
  profilePicture: string;
  bio?: string;
  workoutsCount?: number;
  followersCount?: number;
  followingCount?: number;
  isFollowing: boolean; // Required for follow feature
}

// No need to redefine WorkoutComment here

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatDate(date: Date | string) {
  return format(new Date(date), "MMM d, yyyy");
}

function formatTime(date: Date | string) {
  return format(new Date(date), "h:mm a");
}

// Component for activity feed
function ActivityFeed() {
  const { user } = useAuth();
  const { isFollowing, toggleFollow, getFollowerCount } = useFollow();
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutWithDetails | null>(null);
  const [newComment, setNewComment] = useState<string>("");
  
  // Query users for suggested users section
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users/discover'],
    queryFn: async () => {
      const response = await fetch('/api/users/discover');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      return response.json();
    }
  });
  
  // Follow/unfollow user mutation
  const followUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      // Determine action based on current following state
      const currentlyFollowing = isFollowing[userId] || false;
      const action = currentlyFollowing ? 'unfollow' : 'follow';
      
      // Call the appropriate API endpoint
      const response = await fetch(`/api/users/${userId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${action} user`);
      }
      
      return { 
        success: true, 
        userId, 
        isFollowing: !currentlyFollowing
      };
    },
    onSuccess: (result) => {
      // Get user name for context update
      const userObj = users.find((u: any) => u.id === result.userId);
      const userName = userObj?.name || "User";
      
      // Update the follow context - now using toggleFollow which handles both follow and unfollow
      toggleFollow(result.userId);
      
      // Refresh the users data
      queryClient.invalidateQueries({ queryKey: ['/api/users/discover'] });
    }
  });
  
  // Handler function for follow/unfollow button
  const handleFollowUser = (userId: number) => {
    followUserMutation.mutate(userId);
  };
  
  // Query recent workouts from the community (public workouts from all users)
  const { data: communityWorkouts = [], isLoading: workoutsLoading, refetch } = useQuery({
    queryKey: ['/api/workouts/community'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/workouts/community');
        if (!response.ok) throw new Error('Failed to fetch community workouts');
        const workouts = await response.json();
        return workouts;
      } catch (error) {
        console.error("Error fetching community workouts:", error);
        return [];
      }
    },
    // Reduce stale time to ensure frequent refreshes
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });

  // Query user's goals instead of public goals
  const { data: userGoals = [], isLoading: goalsLoading } = useQuery({
    queryKey: ['/api/goals', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const response = await fetch(`/api/goals?userId=${user.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user goals');
      }
      return response.json();
    },
    enabled: !!user
  });

  // Comment query - store comments in state for immediate updates
  const [commentsState, setCommentsState] = useState<WorkoutComment[]>([]);
  
  // Initialize default comments for the selected workout
  useEffect(() => {
    if (selectedWorkout) {
      // In a real implementation, this would fetch from a real endpoint
      // Start with empty comments array for deployment readiness
      const mockComments: WorkoutComment[] = [];
      setCommentsState(mockComments);
    }
  }, [selectedWorkout]);
  
  const { data: workoutComments = [], refetch: refetchComments } = useQuery({
    queryKey: ['/api/comments', selectedWorkout?.id],
    queryFn: async () => {
      if (!selectedWorkout) return [];
      
      try {
        // In a real implementation, this would fetch from a real endpoint
        // Here we'll mock the comments data
        return commentsState;
      } catch (error) {
        console.error("Error fetching comments:", error);
        return [];
      }
    },
    enabled: !!selectedWorkout,
  });

  // Keep track of likes in local state for immediate UI updates
  const [likedWorkouts, setLikedWorkouts] = useState<number[]>([]);
  // Keep track of like counts for each workout
  const [likeCounts, setLikeCounts] = useState<Record<number, number>>({});
  // Track the currently selected comment for possible deletion
  const [selectedComment, setSelectedComment] = useState<WorkoutComment | null>(null);
  
  // Initialize like counts from the community workouts data
  useEffect(() => {
    if (communityWorkouts.length > 0) {
      const counts: Record<number, number> = {};
      communityWorkouts.forEach(workout => {
        // Initialize each workout with 0 likes
        counts[workout.id] = 0;
      });
      setLikeCounts(counts);
    }
  }, [communityWorkouts]);
  
  // Like workout mutation
  const likeWorkoutMutation = useMutation({
    mutationFn: async (workoutId: number) => {
      // In a real implementation, this would call a real endpoint
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
      
      return { success: true, liked: true, workoutId };
    },
    onSuccess: (result) => {
      toast({
        title: "Workout liked",
        description: "Your appreciation has been shared with the user.",
      });
      
      // Add the workout to liked workouts for immediate UI update
      setLikedWorkouts(prev => [...prev, result.workoutId]);
      // Increment the like count for this workout
      setLikeCounts(prev => ({
        ...prev,
        [result.workoutId]: (prev[result.workoutId] || 0) + 1
      }));
      
      // Don't refresh the feed to avoid regenerating random data
      // In a real implementation with API backend, we would refetch
      // refetch();
    },
  });
  
  // Unlike workout mutation
  const unlikeWorkoutMutation = useMutation({
    mutationFn: async (workoutId: number) => {
      // In a real implementation, this would call a real endpoint
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
      
      return { success: true, liked: false, workoutId };
    },
    onSuccess: (result) => {
      toast({
        title: "Unliked workout",
        description: "Your like has been removed.",
      });
      
      // Remove the workout from liked workouts for immediate UI update
      setLikedWorkouts(prev => prev.filter(id => id !== result.workoutId));
      // Decrement the like count for this workout
      setLikeCounts(prev => ({
        ...prev,
        [result.workoutId]: Math.max((prev[result.workoutId] || 0) - 1, 0)
      }));
    },
  });
  
  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (data: { workoutId: number, userId: number, content: string }) => {
      // In a real implementation, this would call a real endpoint
      // Here we'll mock the response
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      
      // Return a mock comment
      return {
        id: Math.floor(Math.random() * 1000) + 10,
        userId: data.userId,
        username: "You",
        text: data.content,
        createdAt: new Date(),
      };
    },
    onSuccess: (newComment) => {
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully.",
      });
      setNewComment('');
      
      // Immediately update the comments state to show the new comment
      setCommentsState(prev => [...prev, newComment]);
      
      // Don't refresh for mock data to avoid regenerating random comments
      // In a real implementation with API backend, we would refetch
      // refetchComments();
    },
  });
  
  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      // In a real implementation, this would call a real endpoint
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
      
      return { success: true, commentId };
    },
    onSuccess: (result) => {
      toast({
        title: "Comment deleted",
        description: "Your comment has been removed.",
      });
      
      // Remove the comment from state immediately
      setCommentsState(prev => prev.filter(comment => comment.id !== result.commentId));
      setSelectedComment(null);
    },
  });

  const handleLikeWorkout = (workoutId: number) => {
    // If already liked, unlike it. Otherwise, like it.
    if (likedWorkouts.includes(workoutId)) {
      unlikeWorkoutMutation.mutate(workoutId);
    } else {
      likeWorkoutMutation.mutate(workoutId);
    }
  };

  // We're using inline function for comment submission in the button's onClick

  const calculateProgress = (current: number, target: number) => {
    return Math.min(Math.round((current / target) * 100), 100);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-center sm:text-left">Activity Feed</h2>
        
        {workoutsLoading ? (
          <div className="space-y-8 max-w-3xl mx-auto">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-24 bg-gray-200 rounded"></div>
                      <div className="h-3 w-16 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 w-3/4 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : communityWorkouts.length === 0 ? (
          <Card className="max-w-3xl mx-auto shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-primary/10 p-6 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <path d="M17 6.1H3" />
                  <path d="M21 12.1H3" />
                  <path d="M15.5 18.1H3" />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">No Recent Activity</h3>
              <p className="text-center text-muted-foreground mb-6">
                Follow more users to see their workouts and achievements in your feed.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8 max-w-3xl mx-auto">
            {communityWorkouts.map((workout: WorkoutWithExtraStats) => (
              <WorkoutCard 
                key={workout.id}
                workout={workout}
                formatDate={formatDate}
                formatTime={formatTime}
              />
            ))}
          </div>
        )}
      </div>

      {/* Comment delete confirmation dialog */}
      {selectedComment && (
        <AlertDialog open={!!selectedComment} onOpenChange={(open) => !open && setSelectedComment(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Comment</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this comment? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteCommentMutation.mutate(selectedComment.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      
      {selectedWorkout && (
        <Dialog 
          open={!!selectedWorkout} 
          onOpenChange={(open) => !open && setSelectedWorkout(null)}
        >
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <div className="flex items-center space-x-4 mb-2">
                {user && selectedWorkout.userId === user.id ? (
                  <Avatar>
                    <AvatarImage src={""} />
                    <AvatarFallback>ME</AvatarFallback>
                  </Avatar>
                ) : (
                  <Link href={`/users/${selectedWorkout.userId}`}>
                    <Avatar className="cursor-pointer hover:opacity-90 transition-opacity">
                      <AvatarImage src={""} />
                      <AvatarFallback>
                        {"U" + selectedWorkout.userId}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                )}
                <div>
                  <DialogTitle className="text-xl">
                    {user && selectedWorkout.userId === user.id ? (
                      "Your workout"
                    ) : (
                      <Link href={`/users/${selectedWorkout.userId}`}>
                        <span className="hover:underline cursor-pointer">
                          {(demoUsers.find(u => u.id === selectedWorkout.userId)?.name || "User") + "'s workout"}
                        </span>
                      </Link>
                    )}
                  </DialogTitle>
                  <DialogDescription>
                    {formatDate(selectedWorkout.date)} at {formatTime(selectedWorkout.date)}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">{selectedWorkout.name}</h3>
                <p className="text-muted-foreground">
                  {selectedWorkout.notes || "No additional notes for this workout."}
                </p>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-muted/20 rounded-md">
                  <div className="text-xl font-semibold">
                    {selectedWorkout.duration} min
                  </div>
                  <div className="text-xs text-muted-foreground">Duration</div>
                </div>
                <div className="p-3 bg-muted/20 rounded-md">
                  <div className="text-xl font-semibold">
                    {typeof selectedWorkout.totalExercises === 'number' ? selectedWorkout.totalExercises : '0'}
                  </div>
                  <div className="text-xs text-muted-foreground">Exercises</div>
                </div>
                <div className="p-3 bg-muted/20 rounded-md">
                  <div className="text-xl font-semibold">
                    {typeof selectedWorkout.volume === 'number' ? `${selectedWorkout.volume} lbs` : '0 lbs'}
                  </div>
                  <div className="text-xs text-muted-foreground">Volume</div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-3">Comments</h4>
                <div className="space-y-3 max-h-[200px] overflow-y-auto mb-4">
                  {commentsState.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">
                      No comments yet. Be the first to comment!
                    </p>
                  ) : (
                    commentsState.map((comment: WorkoutComment) => (
                      <div key={comment.id} className="flex items-start space-x-3">
                        {user && comment.userId === user.id ? (
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>ME</AvatarFallback>
                          </Avatar>
                        ) : (
                          <Link href={`/users/${comment.userId}`}>
                            <Avatar className="h-8 w-8 cursor-pointer hover:opacity-90 transition-opacity">
                              <AvatarFallback>
                                {getInitials(comment.username)}
                              </AvatarFallback>
                            </Avatar>
                          </Link>
                        )}
                        <div className="bg-muted p-3 rounded-md text-sm flex-1 relative group">
                          <div className="font-medium mb-1">
                            {user && comment.userId === user.id ? (
                              "You"
                            ) : (
                              <Link href={`/users/${comment.userId}`}>
                                <span className="hover:underline cursor-pointer">{comment.username}</span>
                              </Link>
                            )}
                          </div>
                          <p>{comment.text}</p>
                          <div className="text-xs text-muted-foreground mt-1 flex justify-between items-center">
                            <span>{formatDate(comment.createdAt)}</span>
                            {user && comment.userId === user.id && (
                              <button 
                                className="text-xs text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => setSelectedComment(comment)}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {/* Comment input field */}
                <div className="flex items-start space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>ME</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex">
                    <Input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1"
                    />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="ml-2"
                      onClick={() => {
                        if (newComment.trim() && user) {
                          addCommentMutation.mutate({
                            workoutId: selectedWorkout.id,
                            userId: user.id,
                            content: newComment
                          });
                        }
                      }}
                      disabled={!newComment.trim() || addCommentMutation.isPending || !user}
                    >
                      Post
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Component for people discovery
// Component for discovering people to follow
function PeopleDiscover() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Local state for users to enable real-time UI updates
  const [users, setUsers] = useState<UserProfile[]>([]);
  
  // Query users from real API endpoint
  const { isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users/discover'],
    queryFn: async () => {
      const response = await fetch('/api/users/discover');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      return response.json();
    }
  });
  
  // Initialize the users state when data is fetched
  useEffect(() => {
    if (usersLoading === false) {
      // Use the imported queryClient instead of useQueryClient hook
      const data = queryClient.getQueryData<UserProfile[]>(['/api/users/discover']);
      if (data) {
        setUsers(data);
      }
    }
  }, [usersLoading]);

  // Follow user mutation
  // Use the updated follow context with our new interface
  const { isFollowing, toggleFollow, getFollowerCount } = useFollow();
  
  // Initialize users with isFollowing data from the context
  useEffect(() => {
    if (users.length > 0 && Object.keys(isFollowing).length > 0) {
      // Create a shallow copy with updated isFollowing flags from the follow context
      const updatedUsers = users.map(user => ({
        ...user,
        isFollowing: isFollowing[user.id] || false
      }));
      
      // Always update to ensure the UI is in sync with the context
      setUsers(updatedUsers);
    }
  }, [users, isFollowing]); // This will run when either users or isFollowing changes
  
  // We'll use our FollowContext directly instead of duplicating the logic
  const handleFollowUser = (userId: number) => {
    // Toggle the follow status using our context method
    toggleFollow(userId);
    
    // Update local state for immediate UI feedback
    setUsers(prev => 
      prev.map(user => 
        user.id === userId 
          ? { ...user, isFollowing: !user.isFollowing }
          : user
      )
    );
  };
  
  // Filter users based on search query, ensure user exists and has name/username properties
  const filteredUsers = users.filter((user: UserProfile) => 
    user && user.name && user.username && (
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold">People to Follow</h2>
        
        <div className="w-full sm:w-auto relative">
          <Input 
            type="search"
            placeholder="Search for users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-[260px] pr-10"
          />
          {searchQuery && (
            <button
              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      {usersLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-full bg-gray-200"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    <div className="h-3 w-16 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-4 w-3/4 bg-gray-200 rounded mb-3"></div>
                <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-primary/10 p-6 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2">No Users Found</h3>
            <p className="text-center text-muted-foreground mb-6">
              {searchQuery ? 
                `No users matching "${searchQuery}" were found. Try a different search term.` : 
                "We couldn't find any users to suggest at this time."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user: UserProfile) => (
            <Card key={user.id}>
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-4">
                  <Link href={`/users/${user.id}`}>
                    <Avatar className="h-16 w-16 cursor-pointer hover:opacity-90 transition-opacity">
                      <AvatarImage src={user.profilePicture} />
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div>
                    <Link href={`/users/${user.id}`}>
                      <CardTitle className="text-lg hover:underline cursor-pointer">{user.name}</CardTitle>
                    </Link>
                    <CardDescription>@{user.username}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-sm text-muted-foreground mb-4">
                  {user.bio || "Fitness enthusiast passionate about strength and conditioning."}
                </p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="font-medium">{user.workoutsCount || 0}</div>
                    <div className="text-xs text-muted-foreground">Workouts</div>
                  </div>
                  <div>
                    <div className="font-medium">{user.followersCount || 0}</div>
                    <div className="text-xs text-muted-foreground">Followers</div>
                  </div>
                  <div>
                    <div className="font-medium">{user.followingCount || 0}</div>
                    <div className="text-xs text-muted-foreground">Following</div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0 flex flex-col gap-2">
                <Button 
                  variant={user.isFollowing ? "outline" : "default"} 
                  className={`w-full ${user.isFollowing ? "bg-green-100 hover:bg-red-50 hover:text-red-500 hover:border-red-200 group" : ""}`}
                  onClick={() => handleFollowUser(user.id)}
                >
                  {user.isFollowing ? (
                    <>
                      <span className="group-hover:hidden flex items-center">
                        <svg className="mr-1 h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Following
                      </span>
                      <span className="hidden group-hover:block">Unfollow</span>
                    </>
                  ) : "Follow"}
                </Button>
                <Button 
                  variant="secondary" 
                  className="w-full"
                  asChild
                >
                  <Link href={`/users/${user.id}`}>View Profile</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Utility function for calculating progress percentages
function calculateProgress(current: number, target: number) {
  return Math.min(Math.round((current / target) * 100), 100);
}

// Public Profile View component
function PublicProfileView() {
  const { user } = useAuth(); // Get the authenticated user
  const [, navigate] = useLocation();
  
  // Fetch user data
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['/api/users', user?.id],
    queryFn: () => user ? fetch(`/api/users/${user.id}`).then(res => res.json()) : null,
    enabled: !!user
  });
  
  // Fetch user's workouts
  const { data: userWorkouts = [], isLoading: workoutsLoading } = useQuery({
    queryKey: ['/api/workouts', user?.id],
    queryFn: () => user ? fetch(`/api/workouts?userId=${user.id}`).then(res => res.json()) : [],
    enabled: !!user
  });
  
  // Fetch user's goals
  const { data: userGoals = [], isLoading: goalsLoading } = useQuery({
    queryKey: ['/api/goals', user?.id],
    queryFn: () => user ? fetch(`/api/goals?userId=${user.id}`).then(res => res.json()) : [],
    enabled: !!user
  });

  // Fetch coach profile if user is a coach
  const { data: coachProfile, isLoading: coachLoading } = useQuery({
    queryKey: ['/api/users', user?.id, 'coach-profile'],
    queryFn: () => user ? fetch(`/api/users/${user.id}/coach-profile`).then(res => res.json()) : null,
    // Only attempt to fetch if user exists and is a coach
    enabled: !!user && !!userData?.isCoach,
  });
  
  // Calculate stats
  const stats = {
    totalWorkouts: userWorkouts.length,
    totalGoals: userGoals.length,
    completedGoals: userGoals.filter((g: any) => g.completed).length,
    followers: 0, // Start with zero followers 
    following: 0, // Start with zero following
  };
  
  if (userLoading) {
    return (
      <div className="space-y-6">
        <div className="h-64 bg-muted animate-pulse rounded-lg"></div>
      </div>
    );
  }
  
  if (!userData) {
    return (
      <div className="space-y-6">
        <div className="p-8 text-center">
          <h3 className="text-lg font-medium">Could not load profile</h3>
          <p className="text-muted-foreground">Please try again later</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {/* Profile header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={userData.profilePicture || ""} />
                <AvatarFallback className="text-2xl">{getInitials(userData.name || "User")}</AvatarFallback>
              </Avatar>
              {userData.isCoach && (
                <Badge className="absolute -top-2 -right-2 bg-primary text-white">Coach</Badge>
              )}
            </div>
            
            <div className="space-y-2 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{userData.name}</h2>
                  <p className="text-muted-foreground">@{userData.username}</p>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" asChild>
                    <Link href="/profile">Edit Profile</Link>
                  </Button>
                  <Button variant="outline">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-1"
                    >
                      <path d="M18 21a8 8 0 0 0-16 0" />
                      <circle cx="10" cy="8" r="5" />
                      <path d="M22 21a8 8 0 0 0-8-8" />
                    </svg>
                    Share Profile
                  </Button>
                </div>
              </div>
              
              <p>{userData.bio || "No bio provided yet."}</p>
              
              <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
                <div className="text-center px-4">
                  <div className="font-semibold text-xl">{stats.totalWorkouts}</div>
                  <div className="text-xs text-muted-foreground">Workouts</div>
                </div>
                <div className="text-center px-4">
                  <div className="font-semibold text-xl">{stats.completedGoals} / {stats.totalGoals}</div>
                  <div className="text-xs text-muted-foreground">Goals</div>
                </div>
                <div className="text-center px-4">
                  <div className="font-semibold text-xl">{stats.followers}</div>
                  <div className="text-xs text-muted-foreground">Followers</div>
                </div>
                <div className="text-center px-4">
                  <div className="font-semibold text-xl">{stats.following}</div>
                  <div className="text-xs text-muted-foreground">Following</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Coach information if applicable */}
      {userData.isCoach && coachProfile && (
        <Card>
          <CardHeader>
            <CardTitle>Coach Profile</CardTitle>
            <CardDescription>Coaching information and services</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{coachProfile.title}</h3>
              <p className="text-muted-foreground">{coachProfile.biography}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium">Experience</h4>
                <p>{coachProfile.experience}</p>
              </div>
              <div>
                <h4 className="font-medium">Specialties</h4>
                <p>{coachProfile.specialties}</p>
              </div>
            </div>
            
            {coachProfile.isAvailableForHire && (
              <div className="bg-green-50 text-green-800 p-4 rounded-lg flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2"
                >
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                <span>Available for coaching</span>
                <div className="ml-auto font-semibold">${coachProfile.hourlyRate}/hour</div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href={`/marketplace?coach=${user?.id}`}>View Workout Plans</Link>
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {/* Recent workouts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Workouts</CardTitle>
          <CardDescription>Latest training sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {workoutsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded"></div>
              ))}
            </div>
          ) : userWorkouts.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No workouts tracked yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {userWorkouts.slice(0, 5).map((workout: any) => (
                <div key={workout.id} className="flex justify-between items-center border-b pb-4">
                  <div>
                    <h3 className="font-medium">{workout.name}</h3>
                    <p className="text-sm text-muted-foreground">{formatDate(workout.date)}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{workout.duration} min</div>
                    <Badge variant="outline">{workout.category || "Workout"}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate(`/users/${user?.id}`)}
          >
            View All Workouts
          </Button>
        </CardFooter>
      </Card>
      
      {/* Goals */}
      <Card>
        <CardHeader>
          <CardTitle>Fitness Goals</CardTitle>
          <CardDescription>Progress tracking</CardDescription>
        </CardHeader>
        <CardContent>
          {goalsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded"></div>
              ))}
            </div>
          ) : userGoals.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No goals set yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {userGoals.slice(0, 3).map((goal: any) => (
                <div key={goal.id} className="space-y-2">
                  <div className="flex justify-between">
                    <div className="font-medium">{goal.title}</div>
                    <div className="text-sm">
                      {goal.completed ? (
                        <Badge variant="outline" className="bg-green-100 text-green-800">Completed</Badge>
                      ) : (
                        <span className="text-muted-foreground">
                          {goal.targetDate ? `Due ${formatDate(goal.targetDate)}` : "In Progress"}
                        </span>
                      )}
                    </div>
                  </div>
                  <Progress 
                    value={calculateProgress(goal.currentValue || 0, goal.targetValue || 100)} 
                    className={`h-2 ${goal.completed ? "bg-green-100" : ""}`}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{goal.currentValue || 0} / {goal.targetValue || 100}</span>
                    <span>{calculateProgress(goal.currentValue || 0, goal.targetValue || 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="outline" asChild className="w-full">
            <Link href="/goals">View All Goals</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// Main Social component
export default function Social() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, params] = useLocation();
  const searchParams = new URLSearchParams(params);
  const tabFromUrl = searchParams.get('tab');
  const threadId = searchParams.get('thread');
  
  // Set initial activeTab based on URL or default to 'feed'
  const [activeTab, setActiveTab] = useState<string>(tabFromUrl || 'feed');
  
  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Update URL with new tab and preserve thread ID if present
    const newParams = new URLSearchParams();
    newParams.set('tab', value);
    if (value === 'messages' && threadId) {
      newParams.set('thread', threadId);
    }
    
    // Update URL without triggering navigation
    const newSearch = newParams.toString();
    const newPath = location.includes('?') 
      ? location.split('?')[0] + '?' + newSearch 
      : location + '?' + newSearch;
    
    window.history.pushState({}, '', newPath);
  };
  
  return (
    <main className="container py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <h1 className="text-3xl font-bold mb-8 text-center sm:text-left">Social</h1>
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
          <div className="flex justify-center sm:justify-start">
            <TabsList className="mb-8 grid grid-cols-4 w-full max-w-3xl">
              <TabsTrigger value="feed">Activity Feed</TabsTrigger>
              <TabsTrigger value="discover">Discover People</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="profile">My Public Profile</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="feed">
            <ActivityFeed />
          </TabsContent>
          
          <TabsContent value="discover">
            <PeopleDiscover />
          </TabsContent>
          
          <TabsContent value="messages">
            <Messages />
          </TabsContent>
          
          <TabsContent value="profile">
            <PublicProfileView />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
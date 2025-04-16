import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryClient } from "../lib/queryClient";
import { Link } from "wouter";
import { useFollow } from "@/context/follow-context";
import { useAuth } from "@/hooks/use-auth";
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
interface WorkoutWithExtraStats extends Workout {
  totalExercises?: number;
  volume?: number;
}

// Comment type
interface WorkoutComment {
  id: number;
  userId: number;
  username: string;
  text: string;
  createdAt: Date;
}

// Demo data (in a real app, this would come from the API)
const demoUsers = [
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
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutWithDetails | null>(null);
  const [newComment, setNewComment] = useState<string>("");
  
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
    }
  });

  // Query public goals
  const { data: publicGoals = [], isLoading: goalsLoading } = useQuery({
    queryKey: ['/api/goals/public'],
    queryFn: () => fetch('/api/goals/public').then(res => res.json()),
  });

  // Comment query - store comments in state for immediate updates
  const [commentsState, setCommentsState] = useState<WorkoutComment[]>([]);
  
  // Initialize default comments for the selected workout
  useEffect(() => {
    if (selectedWorkout) {
      // In a real implementation, this would fetch from a real endpoint
      // Here we'll mock the comments data
      const mockComments: WorkoutComment[] = [
        {
          id: 1,
          userId: 2,
          username: "JessicaFitPro",
          text: "Great workout! What was the most challenging exercise?",
          createdAt: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
        }
      ];
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
        // Initialize each workout with 0 or a random number between 5-15 likes for demo
        counts[workout.id] = Math.floor(Math.random() * 10) + 5;
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <h2 className="text-xl font-semibold">Activity Feed</h2>
          
          {workoutsLoading ? (
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
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
            <div className="space-y-6">
              {communityWorkouts.map((workout: WorkoutWithExtraStats) => (
                <Card key={workout.id}>
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
                          <div className="font-medium">
                            {user && workout.userId === user.id 
                              ? "You" 
                              : demoUsers.find(u => u.id === workout.userId)?.name || "User " + workout.userId}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(workout.date)} at {formatTime(workout.date)}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">{workout.category || "Workout"}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="mb-2">
                      <h3 className="text-lg font-medium">{workout.name}</h3>
                      <p className="text-muted-foreground">
                        {workout.notes || "Completed a workout"}
                      </p>
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
                  <CardFooter className="pt-0 pb-4 flex justify-between">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className={`${likedWorkouts.includes(workout.id) ? "text-primary font-medium" : "text-muted-foreground"}`}
                      onClick={() => handleLikeWorkout(workout.id)}
                      disabled={likeWorkoutMutation.isPending || unlikeWorkoutMutation.isPending}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill={likedWorkouts.includes(workout.id) ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-1"
                      >
                        <path d="M7 10v12" />
                        <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
                      </svg>
                      {likedWorkouts.includes(workout.id) ? "Liked" : "Like"} ({likeCounts[workout.id] || 0})
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-muted-foreground"
                      onClick={() => {
                        setSelectedWorkout(workout as WorkoutWithDetails);
                        // Also load comments based on selected workout
                        refetchComments();
                      }}
                    >
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
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      Comment
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-muted-foreground"
                    >
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
                        <path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
                        <path d="m13 13 6 6" />
                      </svg>
                      Share
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
          
          <h2 className="text-xl font-semibold mt-8">Community Goals</h2>
          
          {goalsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(2)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-4">
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 w-3/4 bg-gray-200 rounded mb-3"></div>
                    <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : publicGoals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <p className="text-center text-muted-foreground">
                  No public goals available. Create a public goal to share with the community.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {publicGoals.slice(0, 4).map((goal: Goal) => (
                <Card key={goal.id}>
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <Badge>{goal.category}</Badge>
                      <div className="text-sm text-muted-foreground">
                        By {user && goal.userId === user.id ? 'You' : demoUsers.find(u => u.id === goal.userId)?.name || 'User ' + goal.userId}
                      </div>
                    </div>
                    <CardTitle className="mt-2">{goal.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {goal.description || "No description provided"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>
                          {goal.currentValue} / {goal.targetValue}
                        </span>
                      </div>
                      <Progress
                        value={calculateProgress(goal.currentValue, goal.targetValue)}
                        className="h-2"
                      />
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Started: {goal.startDate ? formatDate(goal.startDate) : 'N/A'}</span>
                      <span>Target: {goal.targetDate ? formatDate(goal.targetDate) : 'N/A'}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-4 bg-muted/20">
                    <Button 
                      variant="ghost" 
                      className="w-full text-primary"
                    >
                      Follow Progress
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Suggested Users</CardTitle>
              <CardDescription>
                People you might want to follow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {demoUsers.slice(0, 4).map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={user.profilePicture} />
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">@{user.username}</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Follow
                  </Button>
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <Button variant="ghost" size="sm" className="w-full">
                See More
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Weekly Leaderboard</CardTitle>
              <CardDescription>
                Top performers this week
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { id: 1, name: "You", username: "LoganStrength", score: 5240, rank: 1 },
                ...demoUsers.slice(0, 3).map((user, index) => ({
                  id: user.id,
                  name: user.name,
                  username: user.username,
                  score: 5240 - ((index + 1) * 340),
                  rank: index + 2
                }))
              ].map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      user.rank === 1 
                        ? "bg-yellow-400 text-yellow-800" 
                        : user.rank === 2 
                          ? "bg-gray-300 text-gray-800" 
                          : user.rank === 3 
                            ? "bg-amber-700 text-amber-100" 
                            : "bg-gray-100 text-gray-800"
                    } font-medium text-sm`}>
                      {user.rank}
                    </div>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">@{user.username}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{user.score}</div>
                    <div className="text-xs text-muted-foreground">points</div>
                  </div>
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="w-full">
                View Full Leaderboard
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Current Challenge</CardTitle>
              <CardDescription>
                Weekly Squat Challenge
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="mb-2">Complete 100 squats this week and earn a badge!</p>
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span>65 / 100 squats</span>
                </div>
                <Progress value={65} className="h-2" />
              </div>
              <div className="grid grid-cols-2 gap-2 text-center text-sm">
                <div className="border rounded p-2">
                  <div className="font-medium">23</div>
                  <div className="text-xs text-muted-foreground">Participants</div>
                </div>
                <div className="border rounded p-2">
                  <div className="font-medium">3 days</div>
                  <div className="text-xs text-muted-foreground">Remaining</div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button size="sm" className="w-full">
                Log Squats
              </Button>
            </CardFooter>
          </Card>
        </div>
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
                <Avatar>
                  <AvatarImage src={""} />
                  <AvatarFallback>
                    {user && selectedWorkout.userId === user.id ? "ME" : "U" + selectedWorkout.userId}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <DialogTitle className="text-xl">
                    {user && selectedWorkout.userId === user.id 
                      ? "Your workout" 
                      : (demoUsers.find(u => u.id === selectedWorkout.userId)?.name || "User") + "'s workout"}
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
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {user && comment.userId === user.id ? "ME" : getInitials(comment.username)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-muted p-3 rounded-md text-sm flex-1 relative group">
                          <div className="font-medium mb-1">
                            {user && comment.userId === user.id ? "You" : comment.username}
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
  
  // Query users 
  const { isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users/discover'],
    queryFn: () => {
      // In a real app, this would be a real endpoint
      // Add isFollowing flag to some users for demonstration
      const enhancedUsers = demoUsers.map((user, index) => ({
        ...user,
        // Make Jessica (id:2) and Alex (id:5) already followed
        isFollowing: user.id === 2 || user.id === 5
      }));
      return Promise.resolve(enhancedUsers);
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
  // Use the follow context instead of local state
  const { followedUsers, followUser, unfollowUser, isFollowing } = useFollow();
  
  // Initialize users with isFollowing data from the context
  useEffect(() => {
    if (users.length > 0) {
      // Create a shallow copy with updated isFollowing flags but don't trigger 
      // an infinite update loop by comparing with current state
      const updatedUsers = users.map(user => ({
        ...user,
        isFollowing: isFollowing(user.id)
      }));
      
      // Only update state if there's an actual change
      const hasChanges = updatedUsers.some((user, idx) => 
        user.isFollowing !== users[idx].isFollowing
      );
      
      if (hasChanges) {
        setUsers(updatedUsers);
      }
    }
  }, [followedUsers, users, isFollowing]);
  
  const followUserMutation = useMutation({
    mutationFn: (userId: number) => {
      // In a real app, this would be a real endpoint
      const currentlyFollowing = isFollowing(userId);
      return Promise.resolve({ 
        success: true, 
        userId, 
        isFollowing: !currentlyFollowing // Toggle the following state
      });
    },
    onSuccess: (response) => {
      // Get user name for toast message
      const user = users.find(u => u.id === response.userId);
      const userName = user?.name || "User";
      
      // Update follow context based on the action
      if (isFollowing(response.userId)) {
        // Unfollow
        unfollowUser(response.userId, userName);
      } else {
        // Follow
        followUser(response.userId, userName);
      }
      
      // Update the UI by updating the users array with the new isFollowing state
      setUsers(prev => 
        prev.map(user => 
          user.id === response.userId 
            ? { ...user, isFollowing: !user.isFollowing }
            : user
        )
      );
    },
  });

  const handleFollowUser = (userId: number) => {
    followUserMutation.mutate(userId);
  };
  
  // Filter users based on search query
  const filteredUsers = users.filter((user: UserProfile) => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
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
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user.profilePicture} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{user.name}</CardTitle>
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
                    <div className="font-medium">{user.workoutsCount || 42}</div>
                    <div className="text-xs text-muted-foreground">Workouts</div>
                  </div>
                  <div>
                    <div className="font-medium">{user.followersCount || 158}</div>
                    <div className="text-xs text-muted-foreground">Followers</div>
                  </div>
                  <div>
                    <div className="font-medium">{user.followingCount || 93}</div>
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
    followers: 158, // Mock data
    following: 93,  // Mock data
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
          <Button variant="outline" asChild className="w-full">
            <Link href="/workouts">View All Workouts</Link>
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
  return (
    <main className="container py-6">
      <h1 className="text-3xl font-bold mb-8">Social</h1>
      
      <Tabs defaultValue="feed" className="mb-6">
        <TabsList className="mb-6">
          <TabsTrigger value="feed">Activity Feed</TabsTrigger>
          <TabsTrigger value="discover">Discover People</TabsTrigger>
          <TabsTrigger value="profile">My Public Profile</TabsTrigger>
        </TabsList>
        
        <TabsContent value="feed">
          <ActivityFeed />
        </TabsContent>
        
        <TabsContent value="discover">
          <PeopleDiscover />
        </TabsContent>
        
        <TabsContent value="profile">
          <PublicProfileView />
        </TabsContent>
      </Tabs>
    </main>
  );
}
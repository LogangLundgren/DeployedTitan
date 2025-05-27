import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { format } from "date-fns";
import { useFollow } from "@/context/follow-context";
import { useLikes } from "@/context/likes-context";
import { useComments } from "@/context/comments-context";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Heart, MessageCircle } from "lucide-react";
// import type { Workout } from "@shared/schema"; - Avoiding conflict with local Workout type

// Like button component with persistent state
const LikeButton = ({ workout }: { workout: WorkoutWithExtraStats }) => {
  const { hasLiked, toggleLike, getLikesCount } = useLikes();
  const liked = hasLiked(workout.id);
  const likesCount = getLikesCount(workout.id);

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className={`text-muted-foreground ${liked ? 'text-red-500 hover:text-red-600' : ''}`}
      onClick={() => toggleLike(workout.id)}
    >
      <Heart className={`mr-1 h-4 w-4 ${liked ? 'fill-current' : ''}`} />
      {likesCount > 0 && <span className="ml-1">{likesCount}</span>}
    </Button>
  );
};

// Comment button component with persistent state
const CommentButton = ({ workout }: { workout: WorkoutWithExtraStats }) => {
  const { getCommentsCount, loadCommentsForWorkout } = useComments();
  const commentsCount = getCommentsCount(workout.id);
  
  // Load comments data when component mounts
  useEffect(() => {
    loadCommentsForWorkout(workout.id);
  }, [workout.id, loadCommentsForWorkout]);

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="text-muted-foreground"
      asChild
    >
      <Link to={`/workouts/${workout.id}`}>
        <MessageCircle className="mr-1 h-4 w-4" />
        {commentsCount > 0 && <span className="ml-1">{commentsCount}</span>}
      </Link>
    </Button>
  );
};

// Basic workout type for the social feed
interface Workout {
  id: number;
  name: string;
  date: Date;
  userId: number;
  category: string | null;
  duration: number | null;
  notes: string | null;
  isPublic: boolean | null;
}

// Extended workout type with additional stats
interface WorkoutWithExtraStats extends Workout {
  totalExercises: number;
  totalSets?: number;
  volume: number;
}

// User profile type
interface UserProfile {
  id: number;
  username: string;
  name: string;
  profilePicture: string;
  bio?: string;
  workoutsCount?: number;
  followersCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
  isCoach?: boolean;
}

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

export default function UserProfile() {
  const { userId } = useParams();
  const { toast } = useToast();
  const parsedUserId = parseInt(userId || "0");
  
  // Query user profile with real data
  const { data: userProfile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: [`/api/users/${parsedUserId}/profile`],
    queryFn: async () => {
      try {
        // Fetch the user profile data from the API
        const response = await fetch(`/api/users/${parsedUserId}/profile`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch user profile");
        }
        
        const userData = await response.json();
        
        if (!userData) {
          throw new Error("User not found");
        }
        
        // Get statistics for this user
        const statsResponse = await fetch(`/api/users/${parsedUserId}/stats`);
        const stats = await statsResponse.json();
        
        // Return formatted user profile with stats
        return {
          id: userData.id,
          username: userData.username,
          name: userData.name || userData.username,
          profilePicture: userData.profilePicture || "",
          bio: userData.bio || "Fitness enthusiast passionate about strength training and healthy living.",
          isCoach: !!userData.isCoach,
          // These statistics now come from the API
          workoutsCount: stats.workoutsCount || 0,
          followersCount: stats.followersCount || 0,
          followingCount: stats.followingCount || 0,
          isFollowing: stats.isFollowing || false
        };
      } catch (error) {
        console.error("Error fetching user profile:", error);
        throw error;
      }
    },
    enabled: !!parsedUserId,
  });
  
  // State for workout pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allWorkouts, setAllWorkouts] = useState<WorkoutWithExtraStats[]>([]);
  const ITEMS_PER_PAGE = 5;
  
  // Query first page of user workouts
  const { data: userWorkouts = [], isLoading: workoutsLoading } = useQuery<WorkoutWithExtraStats[]>({
    queryKey: [`/api/workouts`, parsedUserId, page],
    queryFn: async () => {
      try {
        // Use the proper endpoint with the user ID
        const response = await fetch(`/api/users/${parsedUserId}/workouts?page=${page}&limit=${ITEMS_PER_PAGE}`).then(res => res.json());
        
        // Process workout data with real statistics if available
        const workoutsWithStats = response.map((workout: any) => {
          // If the workout already has these stats, use them, otherwise set defaults
          return {
            ...workout,
            totalExercises: workout.totalExercises || 0,
            volume: workout.volume || 0
          };
        }) as WorkoutWithExtraStats[];
        
        // Sort by date, newest first
        const sortedWorkouts = workoutsWithStats.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        
        // Update all workouts state
        setAllWorkouts(prev => {
          if (page === 1) {
            return sortedWorkouts;
          } else {
            // Combine with previous workouts
            return [...prev, ...sortedWorkouts];
          }
        });
        
        // Check if there might be more workouts
        setHasMore(workoutsWithStats.length >= ITEMS_PER_PAGE);
        
        return sortedWorkouts;
      } catch (error) {
        console.error("Error fetching user workouts:", error);
        return [];
      }
    },
    enabled: !!parsedUserId,
  });
  
  // Function to load more workouts
  const loadMoreWorkouts = async () => {
    if (loadingMore || !hasMore) return;
    
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      
      // Fetch next page of workouts
      const response = await fetch(`/api/users/${parsedUserId}/workouts?page=${nextPage}&limit=${ITEMS_PER_PAGE}`);
      const newWorkouts = await response.json();
      
      // Process and sort the new workouts
      const workoutsWithStats = newWorkouts.map((workout: any) => {
        return {
          ...workout,
          totalExercises: workout.totalExercises || 0,
          volume: workout.volume || 0
        };
      }) as WorkoutWithExtraStats[];
      
      const sortedWorkouts = workoutsWithStats.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      // Update states
      setAllWorkouts(prev => [...prev, ...sortedWorkouts]);
      setPage(nextPage);
      setHasMore(sortedWorkouts.length >= ITEMS_PER_PAGE);
      
    } catch (error) {
      console.error("Error loading more workouts:", error);
      toast({
        title: "Error",
        description: "Failed to load more workouts",
        variant: "destructive"
      });
    } finally {
      setLoadingMore(false);
    }
  };
  
  // Query coach's workout plans if they are a coach
  const { data: coachPlans = [], isLoading: plansLoading } = useQuery({
    queryKey: [`/api/coaches/${parsedUserId}/plans`],
    queryFn: async () => {
      if (!userProfile?.isCoach) return [];
      
      try {
        const response = await fetch(`/api/workout-plans?coachUserId=${parsedUserId}&publishedOnly=true`);
        if (!response.ok) return [];
        return response.json();
      } catch (error) {
        console.error("Error fetching coach plans:", error);
        return [];
      }
    },
    enabled: !!userProfile?.isCoach,
  });

  // Query public goals for this specific user
  const { data: userGoals = [], isLoading: goalsLoading } = useQuery({
    queryKey: [`/api/users/${parsedUserId}/goals/public`],
    queryFn: async () => {
      try {
        // Fetch only public goals for this specific user
        const response = await fetch(`/api/users/${parsedUserId}/goals/public`).then(res => res.json());
        return response;
      } catch (error) {
        console.error("Error fetching public goals:", error);
        return [];
      }
    },
    enabled: !!parsedUserId
  });
  
  // Using the follow context to maintain consistent follow state
  const { isFollowing, toggleFollow, getFollowerCount } = useFollow();
  
  // Track if this particular user is being followed
  const [userIsFollowed, setUserIsFollowed] = useState<boolean>(false);
  
  // Initialize follow state when userProfile data is loaded
  useEffect(() => {
    if (userProfile) {
      // First check if the API told us whether we're following this user
      if (typeof userProfile.isFollowing === 'boolean') {
        setUserIsFollowed(userProfile.isFollowing);
      } else {
        // Fallback to context if API doesn't provide this info
        const isCurrentlyFollowed = isFollowing[parsedUserId] || false;
        setUserIsFollowed(isCurrentlyFollowed);
      }
    }
  }, [userProfile, parsedUserId, isFollowing]);
  
  const handleFollowUser = async () => {
    if (!userProfile) return;
    
    try {
      // Update UI immediately for better user experience
      const newFollowState = !userIsFollowed;
      setUserIsFollowed(newFollowState);
      
      // Update follower count locally for immediate feedback
      if (userProfile.followersCount !== undefined) {
        userProfile.followersCount = newFollowState 
          ? userProfile.followersCount + 1 
          : Math.max(0, userProfile.followersCount - 1);
      }
      
      // Use the context's toggleFollow method which handles API call
      toggleFollow(parsedUserId);
      
      // Refresh user stats to ensure counts are accurate
      try {
        const statsResponse = await fetch(`/api/users/${parsedUserId}/stats`);
        const stats = await statsResponse.json();
        
        // Update with accurate counts from server
        if (userProfile) {
          userProfile.followersCount = stats.followersCount || userProfile.followersCount;
          userProfile.followingCount = stats.followingCount || userProfile.followingCount;
          userProfile.workoutsCount = stats.workoutsCount || userProfile.workoutsCount;
        }
      } catch (error) {
        console.error("Failed to refresh stats:", error);
      }
    } catch (error) {
      // If the operation fails, reset the UI to the previous state
      setUserIsFollowed(!userIsFollowed);
      
      // If possible, get accurate state from server
      try {
        const statsResponse = await fetch(`/api/users/${parsedUserId}/stats`);
        const stats = await statsResponse.json();
        setUserIsFollowed(stats.isFollowing || false);
        
        if (userProfile) {
          userProfile.followersCount = stats.followersCount || userProfile.followersCount;
        }
      } catch (e) {
        console.error("Failed to refresh stats after error:", e);
      }
    }
  };
  
  if (profileLoading) {
    return (
      <main className="container py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-gray-200 rounded"></div>
          <div className="flex items-center space-x-4">
            <div className="rounded-full bg-gray-200 h-20 w-20"></div>
            <div className="space-y-2">
              <div className="h-5 w-40 bg-gray-200 rounded"></div>
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </main>
    );
  }
  
  if (!userProfile) {
    return (
      <main className="container py-6">
        <h1 className="text-3xl font-bold mb-8">User Not Found</h1>
        <p>The user you're looking for doesn't exist or has been removed.</p>
        <Button asChild className="mt-6">
          <Link href="/social">Back to Social</Link>
        </Button>
      </main>
    );
  }
  
  return (
    <main className="container py-6">
      <div className="mb-6">
        <Link href="/social" className="text-primary hover:underline flex items-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Social
        </Link>
        <h1 className="text-3xl font-bold">{userProfile.name}</h1>
        <p className="text-muted-foreground">@{userProfile.username}</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4 mb-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="text-center">
              <Avatar className="h-24 w-24 mx-auto">
                <AvatarImage src={userProfile.profilePicture} />
                <AvatarFallback className="text-lg">{getInitials(userProfile.name)}</AvatarFallback>
              </Avatar>
              <CardTitle className="mt-2">{userProfile.name}</CardTitle>
              <CardDescription>@{userProfile.username}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-center text-muted-foreground">
                {userProfile.bio}
              </p>
              
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="font-medium">{userProfile.workoutsCount}</div>
                  <div className="text-xs text-muted-foreground">Workouts</div>
                </div>
                <div>
                  <div className="font-medium">{userProfile.followersCount}</div>
                  <div className="text-xs text-muted-foreground">Followers</div>
                </div>
                <div>
                  <div className="font-medium">{userProfile.followingCount}</div>
                  <div className="text-xs text-muted-foreground">Following</div>
                </div>
              </div>
              
              {userProfile.isCoach && (
                <Badge className="w-full justify-center">Certified Coach</Badge>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                className={`w-full ${userIsFollowed ? "bg-green-100 hover:bg-red-50 hover:text-red-500 hover:border-red-200 group" : ""}`}
                variant={userIsFollowed ? "outline" : "default"}
                onClick={handleFollowUser}
              >
                {userIsFollowed ? (
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
            </CardFooter>
          </Card>
        </div>
        
        <div className="md:col-span-2 lg:col-span-3">
          <Tabs defaultValue="activity">
            <TabsList className="mb-6">
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="goals">Goals</TabsTrigger>
              {userProfile.isCoach && (
                <TabsTrigger value="programs">Programs</TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="activity">
              <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
              
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
              ) : userWorkouts.length === 0 ? (
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
                        <rect width="18" height="18" x="3" y="3" rx="2" />
                        <path d="M9 13h6" />
                        <path d="M12 10v6" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium mb-2">No Workouts Yet</h3>
                    <p className="text-center text-muted-foreground">
                      {userProfile.name} hasn't shared any workouts.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {allWorkouts.map((workout: WorkoutWithExtraStats) => (
                    <Card key={workout.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Avatar>
                              <AvatarImage src={userProfile.profilePicture} />
                              <AvatarFallback>
                                {getInitials(userProfile.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {userProfile.name}
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
                        <LikeButton workout={workout} />
                        <CommentButton workout={workout} />
                      </CardFooter>
                    </Card>
                  ))}
                  
                  {hasMore && (
                    <div className="mt-8 flex justify-center">
                      <Button
                        onClick={loadMoreWorkouts}
                        disabled={loadingMore}
                        variant="outline"
                        className="w-full md:w-auto"
                      >
                        {loadingMore ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          "Load More Workouts"
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="goals">
              <h2 className="text-xl font-semibold mb-4">Public Goals</h2>
              
              {goalsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader className="h-32 bg-gray-100"></CardHeader>
                      <CardContent className="h-24 py-4">
                        <div className="h-4 bg-gray-100 mb-2 rounded"></div>
                        <div className="h-4 bg-gray-100 w-3/4 rounded"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : userGoals.length === 0 ? (
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
                        <path d="M7.5 4.27h9c.85 0 1.5.65 1.5 1.5v5.73" />
                        <path d="m3 15 5.5 5.5a8 8 0 0 0 5.5 2h6V2H8.5c-2 0-4.5 2-4.5 4.5v.73" />
                        <path d="m15 12 2 2 4-4" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium mb-2">No Public Goals</h3>
                    <p className="text-center text-muted-foreground">
                      {userProfile.name} hasn't shared any public goals yet.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userGoals.map((goal: any) => (
                    <Card key={goal.id}>
                      <CardHeader className="pb-4">
                        <Badge variant={goal.category ? "default" : "outline"}>
                          {goal.category || "General"}
                        </Badge>
                        <CardTitle className="mt-2">{goal.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="pb-4">
                        {goal.description && (
                          <p className="text-sm text-muted-foreground mb-4">{goal.description}</p>
                        )}
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Current</span>
                              <span>{goal.currentValue}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Target</span>
                              <span>{goal.targetValue}</span>
                            </div>
                          </div>
                          {goal.targetDate && (
                            <div className="text-sm text-muted-foreground text-right">
                              Target date: {formatDate(goal.targetDate)}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            {userProfile.isCoach && (
              <TabsContent value="programs">
                <h2 className="text-xl font-semibold mb-4">Available Programs</h2>
                
                {plansLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardHeader className="h-32 bg-gray-100"></CardHeader>
                        <CardContent className="h-32 py-4">
                          <div className="h-4 bg-gray-100 mb-2 rounded"></div>
                          <div className="h-4 bg-gray-100 w-3/4 rounded mb-2"></div>
                          <div className="h-4 bg-gray-100 w-1/2 rounded"></div>
                        </CardContent>
                        <CardFooter className="h-16 bg-gray-50"></CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : coachPlans.length === 0 ? (
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
                          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                          <line x1="3" x2="21" y1="9" y2="9" />
                          <line x1="9" x2="9" y1="21" y2="9" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium mb-2">No Programs Available</h3>
                      <p className="text-center text-muted-foreground">
                        {userProfile.name} hasn't published any programs yet.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {coachPlans.map((plan: any) => (
                      <Card key={plan.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-4">
                          <div className="flex justify-between items-start">
                            <Badge variant="outline">{plan.category || "Program"}</Badge>
                            {plan.isPublished && (
                              <Badge className="bg-green-500 text-white">Published</Badge>
                            )}
                          </div>
                          <CardTitle className="text-lg mt-2">{plan.title}</CardTitle>
                          <CardDescription className="text-sm line-clamp-3">
                            {plan.description || "A comprehensive workout program designed to help you reach your fitness goals."}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-4">
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Duration:</span>
                              <span className="font-medium">{plan.durationWeeks} weeks</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Difficulty:</span>
                              <span className="font-medium">{plan.difficultyLevel || "Intermediate"}</span>
                            </div>
                            {plan.goals && (
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Goals:</span>
                                <span className="font-medium text-right">{plan.goals}</span>
                              </div>
                            )}
                            <div className="pt-2">
                              <div className="text-2xl font-bold text-primary">
                                {plan.price === 0 ? "Free" : `$${plan.price.toFixed(2)}`}
                              </div>
                              <div className="text-xs text-muted-foreground">One-time purchase</div>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="pt-0">
                          <Link href={`/workout-plans/${plan.id}`} className="w-full">
                            <Button className="w-full">
                              View Program
                            </Button>
                          </Link>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </main>
  );
}
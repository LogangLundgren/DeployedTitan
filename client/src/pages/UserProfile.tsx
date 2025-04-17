import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { format } from "date-fns";
import { useFollow } from "@/context/follow-context";
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
import type { Workout } from "@shared/schema";

// Extended workout type with stats for the social feed
interface WorkoutWithExtraStats extends Workout {
  totalExercises?: number;
  volume?: number;
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
  
  // Query user profile
  const { data: userProfile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: [`/api/users/${parsedUserId}`],
    queryFn: async () => {
      // This would fetch from a real API in a production app
      // For demo, use hardcoded data
      const demoUsers = [
        { id: 1, username: "you", name: "Your Name", profilePicture: "", isCoach: false },
        { id: 2, username: "JessicaFitPro", name: "Jessica Chen", profilePicture: "", isCoach: true },
        { id: 3, username: "StrengthCoach", name: "Mike Johnson", profilePicture: "", isCoach: true },
        { id: 4, username: "RunnerGirl", name: "Sarah Williams", profilePicture: "", isCoach: false },
        { id: 5, username: "IronPumper", name: "Alex Rodriguez", profilePicture: "", isCoach: false },
      ];
      
      const user = demoUsers.find(u => u.id === parsedUserId);
      
      if (!user) {
        throw new Error("User not found");
      }
      
      return {
        ...user,
        // Use the values from the API response if they exist, or provide default values if not
        bio: user.bio || "Fitness enthusiast passionate about strength training and healthy living.",
        // These statistics now come from the API instead of being hardcoded
        workoutsCount: user.workoutsCount || 0,
        followersCount: user.followersCount || 0,
        followingCount: user.followingCount || 0,
        isFollowing: user.isFollowing || false
      };
    },
    enabled: !!parsedUserId,
  });
  
  // Query user workouts
  const { data: userWorkouts = [], isLoading: workoutsLoading } = useQuery<WorkoutWithExtraStats[]>({
    queryKey: [`/api/workouts`, parsedUserId],
    queryFn: async () => {
      try {
        // Use the proper endpoint with the user ID
        const response = await fetch(`/api/users/${parsedUserId}/workouts`).then(res => res.json());
        
        // Process workout data with real statistics if available
        const workoutsWithStats = response.map((workout: Workout) => {
          // If the workout already has these stats, use them, otherwise set defaults
          return {
            ...workout,
            totalExercises: workout.totalExercises || 0,
            volume: workout.volume || 0
          };
        }) as WorkoutWithExtraStats[];
        
        // Sort by date, newest first
        return workoutsWithStats.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      } catch (error) {
        console.error("Error fetching user workouts:", error);
        return [];
      }
    },
    enabled: !!parsedUserId,
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
  const { isFollowing, followUser, unfollowUser } = useFollow();
  
  // Track if this particular user is being followed
  const [userIsFollowed, setUserIsFollowed] = useState<boolean>(false);
  
  // Initialize follow state when userProfile data is loaded
  useEffect(() => {
    if (userProfile) {
      const isCurrentlyFollowed = isFollowing(parsedUserId);
      setUserIsFollowed(isCurrentlyFollowed);
    }
  }, [userProfile, parsedUserId, isFollowing]);
  
  const handleFollowUser = () => {
    if (!userProfile) return;
    
    // Toggle the follow state using the context
    if (userIsFollowed) {
      unfollowUser(parsedUserId, userProfile.name);
      setUserIsFollowed(false);
    } else {
      followUser(parsedUserId, userProfile.name);
      setUserIsFollowed(true);
    }
    
    // Toast notifications now handled by the follow context
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
                  {userWorkouts.map((workout: WorkoutWithExtraStats) => (
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
                      <CardFooter className="pt-0 pb-4">
                        <Button variant="ghost" size="sm" className="text-muted-foreground">
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
                            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                          </svg>
                          Like
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
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
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </main>
  );
}
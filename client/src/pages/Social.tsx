import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "../lib/queryClient";
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
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import type { User, Workout, WorkoutWithDetails, Goal } from "@shared/schema";

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
  isFollowing?: boolean;
}

// Comments interface
interface WorkoutComment {
  id: number;
  userId: number;
  username: string;
  text: string;
  createdAt: Date;
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

// Component for activity feed
function ActivityFeed() {
  const userId = 1; // Hardcoded user ID for demo
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutWithDetails | null>(null);
  
  // Query recent workouts from the community
  const { data: communityWorkouts = [], isLoading: workoutsLoading } = useQuery({
    queryKey: ['/api/workouts/community'],
    queryFn: () => 
      // In a real implementation, this would fetch from a real endpoint
      // Here we'll use the user's workouts as demo data
      fetch(`/api/workouts?userId=1`).then(res => res.json()),
  });

  // Query public goals
  const { data: publicGoals = [], isLoading: goalsLoading } = useQuery({
    queryKey: ['/api/goals/public'],
    queryFn: () => fetch('/api/goals/public').then(res => res.json()),
  });

  // Like workout mutation
  const likeWorkoutMutation = useMutation({
    mutationFn: (workoutId: number) => 
      // In a real app, this would be a real endpoint
      Promise.resolve({ success: true }),
    onSuccess: () => {
      toast({
        title: "Workout liked",
        description: "Your appreciation has been shared with the user.",
      });
    },
  });

  const handleLikeWorkout = (workoutId: number) => {
    likeWorkoutMutation.mutate(workoutId);
  };

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
              {communityWorkouts.map((workout: Workout) => (
                <Card key={workout.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarImage src={""} />
                          <AvatarFallback>
                            {workout.userId === userId ? "ME" : "U" + workout.userId}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {workout.userId === userId 
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
                          {"?"}
                        </div>
                        <div className="text-xs text-muted-foreground">Exercises</div>
                      </div>
                      <div>
                        <div className="text-xl font-semibold">
                          {"?"}
                        </div>
                        <div className="text-xs text-muted-foreground">Volume</div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 pb-4 flex justify-between">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-muted-foreground"
                      onClick={() => handleLikeWorkout(workout.id)}
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
                        <path d="M7 10v12" />
                        <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
                      </svg>
                      Like
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-muted-foreground"
                      onClick={() => setSelectedWorkout(workout as WorkoutWithDetails)}
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
                        By {goal.userId === userId ? 'You' : demoUsers.find(u => u.id === goal.userId)?.name || 'User ' + goal.userId}
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
                    {selectedWorkout.userId === userId ? "ME" : "U" + selectedWorkout.userId}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <DialogTitle className="text-xl">
                    {selectedWorkout.userId === userId 
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
                    {selectedWorkout.totalExercises || "?"}
                  </div>
                  <div className="text-xs text-muted-foreground">Exercises</div>
                </div>
                <div className="p-3 bg-muted/20 rounded-md">
                  <div className="text-xl font-semibold">
                    {selectedWorkout.volume ? `${selectedWorkout.volume} lbs` : "?"}
                  </div>
                  <div className="text-xs text-muted-foreground">Volume</div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-3">Comments</h4>
                <div className="space-y-3 max-h-[200px] overflow-y-auto mb-4">
                  {/* This would be populated with real comments in a full implementation */}
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{getInitials(demoUsers[0].name)}</AvatarFallback>
                    </Avatar>
                    <div className="bg-muted p-3 rounded-md text-sm flex-1">
                      <div className="font-medium mb-1">{demoUsers[0].name}</div>
                      <p>Great workout! What was the most challenging exercise?</p>
                      <div className="text-xs text-muted-foreground mt-1">
                        Just now
                      </div>
                    </div>
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
function PeopleDiscover() {
  // Query users 
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users/discover'],
    queryFn: () => 
      // In a real app, this would be a real endpoint
      Promise.resolve(demoUsers),
  });

  // Follow user mutation
  const followUserMutation = useMutation({
    mutationFn: (userId: number) => 
      // In a real app, this would be a real endpoint
      Promise.resolve({ success: true }),
    onSuccess: () => {
      toast({
        title: "User followed",
        description: "You are now following this user.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users/discover'] });
    },
  });

  const handleFollowUser = (userId: number) => {
    followUserMutation.mutate(userId);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">People to Follow</h2>
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
      ) : users.length === 0 ? (
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
              We couldn't find any users to suggest at this time.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user: UserProfile) => (
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
              <CardFooter className="pt-0">
                <Button 
                  variant={user.isFollowing ? "outline" : "default"} 
                  className="w-full"
                  onClick={() => handleFollowUser(user.id)}
                >
                  {user.isFollowing ? "Following" : "Follow"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
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
        </TabsList>
        
        <TabsContent value="feed">
          <ActivityFeed />
        </TabsContent>
        
        <TabsContent value="discover">
          <PeopleDiscover />
        </TabsContent>
      </Tabs>
    </main>
  );
}
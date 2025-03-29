import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
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
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Edit, 
  User as UserIcon, 
  FileText, 
  Dumbbell, 
  Calendar, 
  CheckCircle, 
  Trophy,
  BarChart 
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function Profile() {
  // In a real app, this would use the authenticated user's ID from context/state
  const userId = 1;
  
  // State for profile view/edit mode
  const [isEditing, setIsEditing] = useState(false);
  
  // Fetch user data
  const { data: user, isLoading } = useQuery<Omit<User, 'password'>>({
    queryKey: ['/api/users', userId],
    queryFn: async () => {
      try {
        return await apiRequest(`/api/users/${userId}`);
      } catch (error) {
        console.error('Error fetching user:', error);
        throw error;
      }
    }
  });
  
  // Fetch workout stats
  const { data: workouts } = useQuery({
    queryKey: ['/api/workouts', userId],
    queryFn: async () => {
      try {
        return await apiRequest(`/api/workouts?userId=${userId}`);
      } catch (error) {
        console.error('Error fetching workouts:', error);
        return [];
      }
    }
  });
  
  // Fetch template stats
  const { data: templates } = useQuery({
    queryKey: ['/api/templates', userId],
    queryFn: async () => {
      try {
        return await apiRequest(`/api/templates?userId=${userId}`);
      } catch (error) {
        console.error('Error fetching templates:', error);
        return [];
      }
    }
  });
  
  // Calculate statistics
  const stats = {
    totalWorkouts: workouts?.length || 0,
    totalTemplates: templates?.length || 0,
    // In a real app these would be calculated properly from actual data
    totalVolume: workouts?.reduce((sum: number, workout: any) => sum + (workout.volume || 0), 0) || 0,
    longestStreak: 5,
    favoriteExercise: "Bench Press",
    averageWorkoutDuration: 45
  };
  
  if (isLoading) {
    return (
      <div className="flex-grow container mx-auto px-4 py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="flex-grow container mx-auto px-4 py-6">
        <div className="text-center py-12">
          <div className="text-4xl font-bold text-gray-400 mb-4">
            <UserIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            User Not Found
          </div>
          <p className="text-gray-500">The requested user profile could not be loaded.</p>
        </div>
      </div>
    );
  }
  
  return (
    <main className="flex-grow container mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Profile</h2>
        <p className="text-gray-500">Manage your profile and view your fitness statistics</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-xl">Profile Details</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsEditing(!isEditing)}
                className="h-8 px-2"
              >
                <Edit className="h-4 w-4 mr-1" />
                {isEditing ? "Cancel" : "Edit"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-col items-center mb-6">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src="" alt={user.name || user.username} />
                <AvatarFallback className="text-lg bg-primary/10 text-primary">
                  {(user.name || user.username || "U").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <h3 className="text-xl font-semibold">{user.name || user.username}</h3>
              {user.name && <p className="text-gray-500">@{user.username}</p>}
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p>{user.email || "Not provided"}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Member Since</p>
                <p>March 25, 2025</p>
              </div>
            </div>
            
            {isEditing && (
              <div className="mt-6">
                <Button className="w-full">Save Changes</Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Statistics and Activity Tabs */}
        <Card className="lg:col-span-2">
          <Tabs defaultValue="statistics">
            <CardHeader className="pb-0">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl">Fitness Dashboard</CardTitle>
                <TabsList>
                  <TabsTrigger value="statistics">Statistics</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                  <TabsTrigger value="achievements">Achievements</TabsTrigger>
                </TabsList>
              </div>
              <CardDescription>
                Track your fitness progress and achievements
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-6">
              <TabsContent value="statistics" className="mt-0">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Calendar className="w-5 h-5 text-primary mr-2" />
                      <h4 className="text-sm font-medium text-gray-500">Total Workouts</h4>
                    </div>
                    <p className="text-2xl font-bold">{stats.totalWorkouts}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <FileText className="w-5 h-5 text-primary mr-2" />
                      <h4 className="text-sm font-medium text-gray-500">Templates</h4>
                    </div>
                    <p className="text-2xl font-bold">{stats.totalTemplates}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Dumbbell className="w-5 h-5 text-primary mr-2" />
                      <h4 className="text-sm font-medium text-gray-500">Total Volume</h4>
                    </div>
                    <p className="text-2xl font-bold">{stats.totalVolume.toLocaleString()} lbs</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="w-5 h-5 text-primary mr-2" />
                      <h4 className="text-sm font-medium text-gray-500">Longest Streak</h4>
                    </div>
                    <p className="text-2xl font-bold">{stats.longestStreak} days</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Trophy className="w-5 h-5 text-primary mr-2" />
                      <h4 className="text-sm font-medium text-gray-500">Favorite Exercise</h4>
                    </div>
                    <p className="text-2xl font-bold">{stats.favoriteExercise}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <BarChart className="w-5 h-5 text-primary mr-2" />
                      <h4 className="text-sm font-medium text-gray-500">Avg. Duration</h4>
                    </div>
                    <p className="text-2xl font-bold">{stats.averageWorkoutDuration} min</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-4">Workout Distribution</h3>
                  <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg">
                    <p className="text-gray-400">Charts coming soon</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="activity" className="mt-0">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-4">Recent Activity</h3>
                    {workouts && workouts.length > 0 ? (
                      <div className="space-y-4">
                        {workouts.slice(0, 5).map((workout: any, index: number) => (
                          <div key={index} className="flex items-start gap-4">
                            <div className="bg-primary/10 text-primary rounded-full p-2">
                              <Dumbbell className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium">{workout.name}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(workout.date).toLocaleDateString()} · {workout.exercises.length} exercises
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-gray-50 rounded-lg">
                        <p className="text-gray-400">No recent activity</p>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-4">Your Streak</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-500">Current Streak</span>
                        <span className="text-sm font-medium">3 days</span>
                      </div>
                      <div className="grid grid-cols-7 gap-2">
                        {[...Array(7)].map((_, i) => (
                          <div 
                            key={i} 
                            className={`h-8 rounded-md flex items-center justify-center ${
                              i < 3 ? 'bg-primary/90 text-white' : 'bg-gray-200 text-gray-400'
                            }`}
                          >
                            {i < 3 && <CheckCircle className="h-4 w-4" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="achievements" className="mt-0">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-4">Earned Achievements</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[
                        { title: "First Workout", icon: <CheckCircle className="h-5 w-5" />, date: "Mar 25, 2025" },
                        { title: "Consistent", icon: <Calendar className="h-5 w-5" />, date: "Mar 28, 2025" },
                        { title: "1000lb Club", icon: <Trophy className="h-5 w-5" />, date: "Coming soon" }
                      ].map((achievement, index) => (
                        <div key={index} className={`p-4 rounded-lg ${achievement.date === "Coming soon" ? "bg-gray-100" : "bg-primary/10"}`}>
                          <div className={`flex items-center mb-2 ${achievement.date === "Coming soon" ? "text-gray-400" : "text-primary"}`}>
                            {achievement.icon}
                            <h4 className="text-sm font-medium ml-2">{achievement.title}</h4>
                          </div>
                          <p className={`text-xs ${achievement.date === "Coming soon" ? "text-gray-400" : "text-gray-500"}`}>
                            {achievement.date}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-4">Upcoming Achievements</h3>
                    <div className="space-y-3">
                      {[
                        { title: "Volume King", description: "Reach 100,000 lbs total volume", progress: 45 },
                        { title: "Consistency Master", description: "Workout 10 days in a row", progress: 30 },
                        { title: "Exercise Explorer", description: "Try 20 different exercises", progress: 60 }
                      ].map((achievement, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between items-center mb-1">
                            <h4 className="font-medium">{achievement.title}</h4>
                            <span className="text-sm text-gray-500">{achievement.progress}%</span>
                          </div>
                          <p className="text-sm text-gray-500 mb-2">{achievement.description}</p>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full" 
                              style={{ width: `${achievement.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
      
      {/* Account Settings Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-xl">Account Settings</CardTitle>
          <CardDescription>
            Manage your account preferences and settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-4">Preferences</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-500">Units</h4>
                  <div className="flex space-x-2">
                    <Button variant="outline" className="bg-primary/5 text-primary" size="sm">Imperial (lbs)</Button>
                    <Button variant="outline" size="sm">Metric (kg)</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-500">Theme</h4>
                  <div className="flex space-x-2">
                    <Button variant="outline" className="bg-primary/5 text-primary" size="sm">Light</Button>
                    <Button variant="outline" size="sm">Dark</Button>
                    <Button variant="outline" size="sm">System</Button>
                  </div>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-medium mb-4">Account Actions</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" size="sm">Export Data</Button>
                <Button variant="outline" size="sm">Change Password</Button>
                <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                  Delete Account
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
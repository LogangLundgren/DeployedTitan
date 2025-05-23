import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Calendar, 
  TrendingUp, 
  Target,
  Activity,
  MessageSquare,
  ArrowLeft,
  CheckCircle,
  Clock,
  BarChart3,
  Dumbbell,
  Timer,
  Trophy
} from "lucide-react";
import { Link } from "wouter";
import { format, startOfMonth, endOfMonth, subMonths, eachWeekOfInterval, startOfWeek, endOfWeek } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function ClientManagement() {
  const { user } = useAuth();
  const params = useParams();
  const [location, setLocation] = useLocation();
  const clientId = params.id;

  // Function to start conversation with client
  const startConversationWithClient = (clientId: number, clientName: string) => {
    sessionStorage.setItem('startConversationWithUser', clientId.toString());
    sessionStorage.setItem('startConversationWithUserName', clientName);
    setLocation('/messages');
  };

  // Fetch client details from users endpoint
  const { data: client, isLoading: isLoadingClient } = useQuery({
    queryKey: ["/api/users", clientId],
    queryFn: () => fetch(`/api/users?id=${clientId}`).then(res => res.json()),
    enabled: !!user?.isCoach && !!clientId,
  });

  // Fetch client's workout history (this comes from their actual workouts)
  const { data: clientWorkouts = [], isLoading: isLoadingWorkouts } = useQuery({
    queryKey: ["/api/workouts", "client", clientId],
    queryFn: () => {
      console.log(`Fetching workouts for client ID: ${clientId}`);
      return fetch(`/api/workouts?userId=${clientId}&_t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      }).then(res => res.json());
    },
    enabled: !!user?.isCoach && !!clientId,
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache results
  });

  // Fetch client's analytics data (same as what they see on their analytics page)
  const { data: clientAnalytics, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ["/api/analytics", "client", clientId],
    queryFn: () => {
      console.log(`Fetching analytics for client ID: ${clientId}`);
      return fetch(`/api/analytics?userId=${clientId}`).then(res => res.json());
    },
    enabled: !!user?.isCoach && !!clientId,
  });

  // Process workout data for charts
  const processWorkoutData = () => {
    if (!clientWorkouts || clientWorkouts.length === 0) return [];
    
    const workoutsByDate = clientWorkouts.reduce((acc: any, workout: any) => {
      const date = format(new Date(workout.date), 'MMM dd');
      if (!acc[date]) {
        acc[date] = { date, workouts: 0, totalVolume: 0, totalSets: 0 };
      }
      acc[date].workouts += 1;
      acc[date].totalVolume += workout.totalVolume || 0;
      acc[date].totalSets += workout.totalSets || 0;
      return acc;
    }, {});

    return Object.values(workoutsByDate).slice(-14); // Last 14 days
  };

  const chartData = processWorkoutData();

  if (!user?.isCoach) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="mt-2">This page is only available for coaches.</p>
        </div>
      </div>
    );
  }

  const isLoading = isLoadingClient || isLoadingWorkouts || isLoadingAnalytics;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/coach-dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Client Dashboard</h1>
          <p className="text-muted-foreground">
            {client?.name || client?.username}'s workout history and performance analytics
          </p>
        </div>
      </div>

      {/* Client Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">
                {(client?.name || client?.username)?.substring(0, 2).toUpperCase() || 'CL'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-xl">{client?.name || client?.username}</CardTitle>
              <CardDescription className="flex items-center gap-4 mt-1">
                <span>Member since {format(new Date(client?.createdAt || Date.now()), 'MMMM yyyy')}</span>
                <Badge variant="outline" className="text-green-600">Active</Badge>
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => startConversationWithClient(parseInt(clientId || '0'), client?.name || client?.username || 'Client')}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Message Client
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="analytics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
          <TabsTrigger value="history">Workout History</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2">Loading client analytics...</p>
            </div>
          ) : (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Workouts</CardTitle>
                    <Dumbbell className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{clientWorkouts.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Completed sessions
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {clientWorkouts.reduce((total: number, workout: any) => total + (workout.totalVolume || 0), 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total weight lifted
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Session Time</CardTitle>
                    <Timer className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.round(clientWorkouts.reduce((total: number, workout: any) => total + (workout.duration || 45), 0) / clientWorkouts.length || 0)} min
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Per workout
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">This Month</CardTitle>
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {clientWorkouts.filter((workout: any) => {
                        const workoutDate = new Date(workout.date);
                        const now = new Date();
                        return workoutDate.getMonth() === now.getMonth() && workoutDate.getFullYear() === now.getFullYear();
                      }).length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Workouts completed
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Workout Volume Chart */}
              {chartData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Workout Volume Trend</CardTitle>
                    <CardDescription>Daily workout volume over the last 14 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="totalVolume" stroke="#8884d8" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Workout Frequency Chart */}
              {chartData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Workout Frequency</CardTitle>
                    <CardDescription>Number of workouts per day</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="workouts" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Complete Workout History</CardTitle>
              <CardDescription>All workout sessions with detailed metrics</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                  <p className="mt-2">Loading workout history...</p>
                </div>
              ) : clientWorkouts.length > 0 ? (
                <div className="space-y-4">
                  {clientWorkouts.map((workout: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <Activity className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium">{workout.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(workout.date), 'EEEE, MMMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">{workout.totalVolume?.toLocaleString() || 0} lbs</p>
                          <p className="text-xs text-muted-foreground">{workout.totalSets || 0} sets</p>
                        </div>
                        <Badge variant="outline">
                          {workout.duration || 45} min
                        </Badge>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/workout/${workout.id}`}>View Details</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4" />
                  <p>No workout history found</p>
                  <p className="text-sm">This client hasn't logged any workouts yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest workout sessions</CardDescription>
              </CardHeader>
              <CardContent>
                {clientWorkouts.slice(0, 5).length > 0 ? (
                  <div className="space-y-4">
                    {clientWorkouts.slice(0, 5).map((workout: any, index: number) => (
                      <div key={index} className="flex items-center gap-3">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{workout.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(workout.date), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">{workout.totalVolume || 0} lbs</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Total Workouts:</span>
                  <span className="font-medium">{clientWorkouts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">This Week:</span>
                  <span className="font-medium">
                    {clientWorkouts.filter((workout: any) => {
                      const workoutDate = new Date(workout.date);
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return workoutDate >= weekAgo;
                    }).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Avg Volume/Workout:</span>
                  <span className="font-medium">
                    {clientWorkouts.length > 0 
                      ? Math.round(clientWorkouts.reduce((total: number, workout: any) => total + (workout.totalVolume || 0), 0) / clientWorkouts.length)
                      : 0
                    } lbs
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Last Workout:</span>
                  <span className="font-medium">
                    {clientWorkouts.length > 0 
                      ? format(new Date(clientWorkouts[0].date), 'MMM d')
                      : 'None'
                    }
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
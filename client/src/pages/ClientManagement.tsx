import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
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
  BarChart3
} from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

export default function ClientManagement() {
  const { user } = useAuth();
  const params = useParams();
  const clientId = params.id;

  // Fetch client details
  const { data: client, isLoading: isLoadingClient } = useQuery({
    queryKey: ["/api/coach/clients", clientId],
    enabled: !!user?.isCoach && !!clientId,
  });

  // Fetch client's purchased plans
  const { data: clientPlans = [], isLoading: isLoadingPlans } = useQuery({
    queryKey: ["/api/coach/client-plans", clientId],
    enabled: !!user?.isCoach && !!clientId,
  });

  // Fetch client's workout history
  const { data: workoutHistory = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ["/api/coach/client-workouts", clientId],
    enabled: !!user?.isCoach && !!clientId,
  });

  // Fetch client progress metrics
  const { data: progressMetrics } = useQuery({
    queryKey: ["/api/coach/client-progress", clientId],
    enabled: !!user?.isCoach && !!clientId,
  });

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
          <h1 className="text-3xl font-bold">Client Management</h1>
          <p className="text-muted-foreground">
            Manage {client?.name || 'client'} progress and workout plans
          </p>
        </div>
      </div>

      {/* Client Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">
                {client?.name?.substring(0, 2).toUpperCase() || 'CL'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-xl">{client?.name || 'Client'}</CardTitle>
              <CardDescription className="flex items-center gap-4 mt-1">
                <span>Member since {format(new Date(client?.createdAt || Date.now()), 'MMMM yyyy')}</span>
                <Badge variant="outline" className="text-green-600">Active</Badge>
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                Message Client
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="plans">Workout Plans</TabsTrigger>
          <TabsTrigger value="progress">Progress Tracking</TabsTrigger>
          <TabsTrigger value="history">Workout History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Workouts</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{workoutHistory.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Completed sessions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clientPlans.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Purchased plans
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{progressMetrics?.completionRate || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  This month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workoutHistory.slice(0, 5).map((workout: any, index: number) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{workout.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Completed {format(new Date(workout.date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clientPlans.map((plan: any, index: number) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{plan.title}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{plan.progress || 0}%</span>
                    </div>
                    <Progress value={plan.progress || 0} className="h-2" />
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary">
                        Purchased {format(new Date(plan.purchaseDate || Date.now()), 'MMM yyyy')}
                      </Badge>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/workout-plans/${plan.id}`}>View Plan</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Progress Metrics</CardTitle>
              <CardDescription>Track your client's fitness journey</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Weekly Consistency</span>
                  <span>{progressMetrics?.weeklyConsistency || 0}%</span>
                </div>
                <Progress value={progressMetrics?.weeklyConsistency || 0} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Goal Achievement</span>
                  <span>{progressMetrics?.goalAchievement || 0}%</span>
                </div>
                <Progress value={progressMetrics?.goalAchievement || 0} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Plan Adherence</span>
                  <span>{progressMetrics?.planAdherence || 0}%</span>
                </div>
                <Progress value={progressMetrics?.planAdherence || 0} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workout History</CardTitle>
              <CardDescription>Complete workout session history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workoutHistory.map((workout: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
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
                      <Badge variant="outline">
                        {workout.duration || '45'} min
                      </Badge>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/workout/${workout.id}`}>View Details</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
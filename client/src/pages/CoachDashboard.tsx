import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  MessageSquare,
  Star,
  Target,
  Activity,
  BarChart3,
  Clock,
  Award,
  PieChart,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { Link } from "wouter";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";

export default function CoachDashboard() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState("week");

  // Fetch coach analytics data
  const { data: analytics, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ["/api/coach/analytics", dateRange],
    enabled: !!user?.isCoach,
  });

  // Fetch client list
  const { data: clients = [], isLoading: isLoadingClients } = useQuery({
    queryKey: ["/api/coach/clients"],
    enabled: !!user?.isCoach,
  });

  // Fetch recent activity
  const { data: recentActivity = [], isLoading: isLoadingActivity } = useQuery({
    queryKey: ["/api/coach/recent-activity"],
    enabled: !!user?.isCoach,
  });

  // Use real analytics data from backend with proper fallbacks
  const analyticsData = {
    totalClients: analytics?.totalClients || (Array.isArray(clients) ? clients.length : 0),
    activeClients: analytics?.activeClients || 0,
    monthlyRevenue: analytics?.monthlyRevenue || 0,
    revenueGrowth: analytics?.revenueGrowth || 0,
    averageRating: analytics?.averageRating || 0,
    totalRatings: analytics?.totalRatings || 0,
    completedWorkouts: analytics?.completedWorkouts || 0,
    workoutGrowth: analytics?.workoutGrowth || 0,
    messagesSent: analytics?.messagesSent || 0,
    plansSold: analytics?.plansSold || 0,
    clientRetention: analytics?.clientRetention || 0
  };

  if (!user?.isCoach) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="mt-2">This dashboard is only available for coaches.</p>
          <Button asChild className="mt-4">
            <Link href="/become-coach">Become a Coach</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Coach Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user.name || user.username}! Here's your coaching overview.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setDateRange("week")} 
                  className={dateRange === "week" ? "bg-primary text-primary-foreground" : ""}>
            This Week
          </Button>
          <Button variant="outline" size="sm" onClick={() => setDateRange("month")}
                  className={dateRange === "month" ? "bg-primary text-primary-foreground" : ""}>
            This Month
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.activeClients} active this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analyticsData.monthlyRevenue}</div>
            <p className="text-xs text-green-600 flex items-center">
              <ArrowUp className="h-3 w-3 mr-1" />
              +{analyticsData.revenueGrowth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Client Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.averageRating}/5</div>
            <p className="text-xs text-muted-foreground">
              Based on {analyticsData.totalRatings} reviews
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workouts Completed</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.completedWorkouts}</div>
            <p className="text-xs text-green-600 flex items-center">
              <ArrowUp className="h-3 w-3 mr-1" />
              +{analyticsData.workoutGrowth}% this month
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="clients">Client Management</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { type: "workout", user: "Sarah M.", action: "completed Push Day workout", time: "2 hours ago" },
                  { type: "message", user: "Mike R.", action: "sent you a message", time: "4 hours ago" },
                  { type: "purchase", user: "Emma L.", action: "purchased your Strength Program", time: "1 day ago" },
                  { type: "review", user: "John D.", action: "left a 5-star review", time: "2 days ago" },
                ].map((activity, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === "workout" ? "bg-green-500" :
                      activity.type === "message" ? "bg-blue-500" :
                      activity.type === "purchase" ? "bg-yellow-500" :
                      "bg-purple-500"
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user}</span> {activity.action}
                      </p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Manage your coaching business efficiently</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full">
                  <Link href="/messages">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    View Messages
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/my-plans">
                    <Target className="h-4 w-4 mr-2" />
                    Manage Workout Plans
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/marketplace">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Marketplace
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Client Management</CardTitle>
              <CardDescription>Track your client progress and engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.isArray(clients) && clients.length > 0 ? clients.slice(0, 6).map((client: any, index: number) => (
                  <div key={client.id || index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {(client.name || client.username).substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{client.name || client.username}</p>
                        <p className="text-sm text-muted-foreground">
                          Member since {format(new Date(client.createdAt || Date.now()), 'MMM yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="text-green-600">Active</Badge>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/messages?user=${client.id}`}>Message</Link>
                      </Button>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-medium text-lg mb-2">No clients yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start building your client base by creating and publishing workout plans
                    </p>
                    <Button asChild>
                      <Link href="/create-plan">Create Your First Plan</Link>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Client Engagement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Workout Completion Rate</span>
                    <span>87%</span>
                  </div>
                  <Progress value={87} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Client Retention Rate</span>
                    <span>{analyticsData.clientRetention}%</span>
                  </div>
                  <Progress value={analyticsData.clientRetention} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Message Response Rate</span>
                    <span>94%</span>
                  </div>
                  <Progress value={94} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Plans Sold This Month</span>
                  <Badge>{analyticsData.plansSold}</Badge>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm">Messages Sent</span>
                  <Badge variant="outline">{analyticsData.messagesSent}</Badge>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm">Average Session Duration</span>
                  <Badge variant="outline">47 min</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold">${analyticsData.monthlyRevenue}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Month</p>
                  <p className="text-lg">${Math.round(analyticsData.monthlyRevenue / 1.125)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Growth</p>
                  <p className="text-lg text-green-600">+{analyticsData.revenueGrowth}%</p>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Workout Plans</span>
                    <div className="flex items-center gap-2">
                      <Progress value={75} className="w-20 h-2" />
                      <span className="text-sm">$1,800</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Personal Training</span>
                    <div className="flex items-center gap-2">
                      <Progress value={20} className="w-20 h-2" />
                      <span className="text-sm">$480</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Consultations</span>
                    <div className="flex items-center gap-2">
                      <Progress value={5} className="w-20 h-2" />
                      <span className="text-sm">$120</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
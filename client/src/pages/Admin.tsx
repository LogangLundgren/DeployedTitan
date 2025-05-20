import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { Trash2, UserX, Bug, Lightbulb, MousePointer, MessageSquare, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

// Feedback type definition matching what's in the server
interface FeedbackItem {
  id: number;
  type: 'bug' | 'feature' | 'ux' | 'other';
  content: string;
  userId: number | null;
  username: string | null;
  path: string;
  userAgent: string;
  timestamp: string;
}

// Component to display feedback list
function FeedbackList() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Fetch feedback from API
  const { data: feedbackItems = [], isLoading, error, refetch } = useQuery({
    queryKey: ['/api/feedback'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/feedback');
      if (!res.ok) {
        throw new Error('Failed to fetch feedback');
      }
      return await res.json() as FeedbackItem[];
    },
    refetchInterval: 3000, // Auto-refresh every 3 seconds
    refetchOnWindowFocus: true // Refresh when window gets focus
  });
  
  // Delete feedback mutation
  const deleteFeedbackMutation = useMutation({
    mutationFn: async (feedbackId: number) => {
      const res = await apiRequest('DELETE', `/api/feedback/${feedbackId}`);
      if (!res.ok) {
        throw new Error('Failed to delete feedback');
      }
      return feedbackId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/feedback'] });
      toast({
        title: "Feedback Deleted",
        description: "The feedback has been successfully deleted."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete feedback: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  });
  
  // Handle feedback deletion with confirmation
  const handleDeleteFeedback = (feedbackId: number) => {
    if (confirm('Are you sure you want to delete this feedback?')) {
      deleteFeedbackMutation.mutate(feedbackId);
    }
  };

  // Function to render icon based on feedback type
  const getFeedbackIcon = (type: string) => {
    switch (type) {
      case 'bug':
        return <Bug className="h-4 w-4" />;
      case 'feature':
        return <Lightbulb className="h-4 w-4" />;
      case 'ux':
        return <MousePointer className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  // Function to get badge color based on feedback type
  const getFeedbackBadgeVariant = (type: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (type) {
      case 'bug':
        return 'destructive';
      case 'feature':
        return 'secondary';
      case 'ux':
        return 'outline';
      default:
        return 'default';
    }
  };

  // Display loading state
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Display error state
  if (error) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 text-red-800 rounded-md">
        Error loading feedback: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  // Display empty state
  if (feedbackItems.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
        <p>No feedback submissions yet.</p>
      </div>
    );
  }

  // Display feedback list
  return (
    <div className="space-y-4">
      {feedbackItems.map((item) => (
        <div key={item.id} className="border rounded-lg p-4 hover:bg-muted/20 transition-colors">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <Badge variant={getFeedbackBadgeVariant(item.type)} className="flex items-center gap-1">
                {getFeedbackIcon(item.type)}
                {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
              </Badge>
              {item.username && (
                <span className="text-sm text-muted-foreground">
                  from <span className="font-medium">{item.username}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground mr-2">
                {format(new Date(item.timestamp), "MMM d, yyyy 'at' h:mm a")}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleDeleteFeedback(item.id)}
                disabled={deleteFeedbackMutation.isPending}
                className="text-destructive hover:text-destructive/90 hover:bg-destructive/10 h-8 w-8 p-0"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete</span>
              </Button>
            </div>
          </div>
          <p className="mt-2 whitespace-pre-wrap">{item.content}</p>
          <div className="mt-3 text-xs text-muted-foreground">
            <span>Page: {item.path}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Admin() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("users");
  
  // Check if user is authorized
  useEffect(() => {
    if (!user || user.username !== "Logan Main") {
      setLocation("/");
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive"
      });
    }
  }, [user, setLocation, toast]);

  // Fetch all users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return await res.json();
    },
    enabled: !!user && user.username === "Logan Main" // Only fetch if user is admin
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${userId}`);
      if (!res.ok) throw new Error("Failed to delete user");
      return userId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User Deleted",
        description: "User has been successfully deleted."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete user: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Cleanup users mutation
  const cleanupUsersMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/admin/cleanup-users");
      if (!res.ok) throw new Error("Failed to cleanup users");
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Users Cleaned Up",
        description: `Successfully removed ${data.count} inactive users.`
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to cleanup users: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Handle user deletion with confirmation
  const handleDeleteUser = (userId: number, username: string) => {
    if (confirm(`Are you sure you want to delete user ${username}?`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  // Handle user cleanup with confirmation
  const handleCleanupUsers = () => {
    if (confirm(`Are you sure you want to cleanup inactive users?`)) {
      cleanupUsersMutation.mutate();
    }
  };

  if (!user || user.username !== "Logan Main") {
    return <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
      <p className="mt-2">You don't have permission to access this page.</p>
    </div>; // Return an element instead of null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <Tabs 
        value={activeTab} 
        onValueChange={(value) => {
          setActiveTab(value);
          // Refresh feedback data when switching to feedback tab
          if (value === "feedback") {
            queryClient.invalidateQueries({ queryKey: ['/api/feedback'] });
          }
        }}
      >
        <TabsList className="mb-6">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user accounts and permissions.
              </CardDescription>
              <div className="mt-4">
                <Button 
                  variant="destructive" 
                  onClick={handleCleanupUsers}
                  disabled={cleanupUsersMutation.isPending}
                >
                  <UserX className="h-4 w-4 mr-2" />
                  {cleanupUsersMutation.isPending ? "Cleaning up..." : "Cleanup Inactive Users"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="px-4 py-2 text-left">ID</th>
                        <th className="px-4 py-2 text-left">Username</th>
                        <th className="px-4 py-2 text-left">Email</th>
                        <th className="px-4 py-2 text-left">Coach</th>
                        <th className="px-4 py-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user: any) => (
                        <tr key={user.id} className="border-b border-muted hover:bg-muted/20">
                          <td className="px-4 py-3">{user.id}</td>
                          <td className="px-4 py-3">{user.username}</td>
                          <td className="px-4 py-3">{user.email || "N/A"}</td>
                          <td className="px-4 py-3">
                            {user.isCoach ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Yes
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                No
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteUser(user.id, user.username)}
                              disabled={deleteUserMutation.isPending}
                              className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="feedback">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>User Feedback</CardTitle>
                <CardDescription>
                  View feedback submitted by users.
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/feedback'] })}
                className="ml-auto"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              <FeedbackList />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Dashboard</CardTitle>
              <CardDescription>
                View application usage analytics and statistics.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Analytics data will be available here once integrated with an analytics service.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
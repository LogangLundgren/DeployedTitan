import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { Trash2, UserX, CheckCircle, MessageSquare, Bug, Lightbulb, Settings, FileQuestion } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

// Type for feedback data
interface FeedbackItem {
  id: number;
  type: string;
  content: string;
  userId: number | null;
  username: string | null;
  path: string;
  userAgent: string;
  timestamp: string;
  isResolved: boolean;
}

// Feedback section component
function FeedbackSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch feedback
  const { data: feedbackItems = [], isLoading } = useQuery({
    queryKey: ["/api/feedback"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/feedback");
      if (!res.ok) throw new Error("Failed to fetch feedback");
      return await res.json();
    }
  });
  
  // Mark feedback as resolved mutation
  const resolveFeedbackMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/feedback/${id}/resolve`);
      if (!res.ok) throw new Error("Failed to resolve feedback");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feedback"] });
      toast({
        title: "Feedback Resolved",
        description: "The feedback has been marked as resolved."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to resolve feedback: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  // Get icon for feedback type
  const getFeedbackTypeIcon = (type: string) => {
    switch (type) {
      case 'bug':
        return <Bug className="h-5 w-5 text-red-500" />;
      case 'feature':
        return <Lightbulb className="h-5 w-5 text-amber-500" />;
      case 'ux':
        return <Settings className="h-5 w-5 text-blue-500" />;
      default:
        return <FileQuestion className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Format feedback type for display
  const formatFeedbackType = (type: string) => {
    switch (type) {
      case 'bug':
        return 'Bug Report';
      case 'feature':
        return 'Feature Request';
      case 'ux':
        return 'UX Feedback';
      default:
        return 'Other';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (feedbackItems.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
        <h3 className="mt-4 text-lg font-medium">No feedback yet</h3>
        <p className="mt-2 text-muted-foreground">
          Feedback submitted by users will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {feedbackItems.map((item: FeedbackItem) => (
        <div 
          key={item.id} 
          className={`border rounded-lg p-4 ${item.isResolved ? 'bg-muted/30' : 'bg-card'}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {getFeedbackTypeIcon(item.type)}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{formatFeedbackType(item.type)}</h3>
                  {item.isResolved && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Resolved
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {item.username ? `From: ${item.username}` : 'Anonymous'} • 
                  {' '}{formatDistanceToNow(new Date(item.timestamp))} ago • 
                  {' '}Page: {item.path}
                </p>
              </div>
            </div>
            
            {!item.isResolved && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => resolveFeedbackMutation.mutate(item.id)}
                disabled={resolveFeedbackMutation.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Mark Resolved
              </Button>
            )}
          </div>
          
          <div className="mt-3 p-3 bg-muted/30 rounded-md whitespace-pre-wrap">
            {item.content}
          </div>
          
          <div className="mt-2 text-xs text-muted-foreground">
            User Agent: {item.userAgent.length > 100 ? `${item.userAgent.substring(0, 100)}...` : item.userAgent}
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
      
      <Tabs defaultValue="users">
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
            <CardHeader>
              <CardTitle>User Feedback</CardTitle>
              <CardDescription>
                View and manage feedback submitted by users.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FeedbackSection />
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
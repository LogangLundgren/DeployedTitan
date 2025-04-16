import { useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

type User = {
  id: number;
  username: string;
};

type CleanupResult = {
  message: string;
  results: {
    total: number;
    success: number;
    failed: number;
    details: {
      id: number;
      username: string;
      status: 'success' | 'failed';
    }[];
  };
};

export default function AdminCleanup() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [results, setResults] = useState<CleanupResult | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const { toast } = useToast();

  // Check if user is admin (Logan Main, ID 9)
  if (!user || user.id !== 9) {
    return <Redirect to="/" />;
  }

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await apiRequest('GET', '/api/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive"
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const runCleanup = async () => {
    if (!confirm("WARNING: This will delete ALL users except Logan Main (ID: 9). This action cannot be undone. Continue?")) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await apiRequest('DELETE', '/api/admin/cleanup-users');
      const data = await response.json();
      setResults(data);
      toast({
        title: "Success",
        description: `Cleanup completed. ${data.results.success} users deleted.`,
      });
    } catch (error) {
      console.error('Error running user cleanup:', error);
      toast({
        title: "Error",
        description: "Failed to run user cleanup",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-10 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard - User Cleanup</h1>
      
      <Alert className="mb-8">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>
          This page contains dangerous admin actions that will permanently delete data. 
          Only proceed if you are absolutely sure.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Fetch Users</CardTitle>
            <CardDescription>View all users in the database</CardDescription>
          </CardHeader>
          <CardContent>
            {users.length > 0 ? (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {users.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                    <span>{user.username} (ID: {user.id})</span>
                    {user.id === 9 && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">ADMIN</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No users fetched yet</p>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={fetchUsers} 
              disabled={loadingUsers}
              variant="outline"
              className="w-full"
            >
              {loadingUsers && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Fetch Users
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Cleanup</CardTitle>
            <CardDescription className="text-red-500 font-medium">
              Delete all users except Logan Main (ID: 9)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results ? (
              <div className="space-y-4">
                <Alert variant={results.results.failed > 0 ? "destructive" : "default"}>
                  {results.results.failed > 0 ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>Cleanup Results</AlertTitle>
                  <AlertDescription>
                    {results.message}
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 border rounded bg-gray-50">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-xl font-bold">{results.results.total}</p>
                  </div>
                  <div className="p-2 border rounded bg-green-50">
                    <p className="text-sm text-muted-foreground">Success</p>
                    <p className="text-xl font-bold text-green-600">{results.results.success}</p>
                  </div>
                  <div className="p-2 border rounded bg-red-50">
                    <p className="text-sm text-muted-foreground">Failed</p>
                    <p className="text-xl font-bold text-red-600">{results.results.failed}</p>
                  </div>
                </div>
                
                {results.results.details.length > 0 && (
                  <div className="max-h-[200px] overflow-y-auto border rounded p-2">
                    <p className="text-sm font-medium mb-2">Details:</p>
                    {results.results.details.map((detail, index) => (
                      <div key={index} className="text-sm flex items-center space-x-2">
                        {detail.status === 'success' ? (
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-3 w-3 text-red-600" />
                        )}
                        <span>{detail.username} (ID: {detail.id}): {detail.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-muted-foreground">
                <AlertTriangle className="h-10 w-10 mx-auto mb-2" />
                <p>This action will permanently delete all users except Logan Main (ID: 9)</p>
                <p className="text-sm mt-2">All related data for deleted users will also be removed</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              onClick={runCleanup}
              disabled={loading}
              variant="destructive"
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Run User Cleanup
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
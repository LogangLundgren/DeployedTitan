import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { UserX, ArrowLeft, AlertTriangle, CheckCircle2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function AdminCleanup() {
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [cleanupComplete, setCleanupComplete] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Only allow admin (Logan Main) access
  const isAdmin = user?.id === 9; // Logan Main (ID: 9)

  // Mutation to clean up inactive users
  const cleanupMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", "/api/admin/cleanup-users");
    },
    onSuccess: () => {
      toast({
        title: "Cleanup Successful",
        description: "All inactive user accounts have been removed.",
      });
      setCleanupComplete(true);
      setIsAlertDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to clean up users: ${error.message}`,
        variant: "destructive"
      });
      setIsAlertDialogOpen(false);
    }
  });

  // Handle cleanup confirmation
  const handleCleanup = () => {
    setIsAlertDialogOpen(true);
  };

  // Confirm and execute cleanup
  const confirmCleanup = () => {
    cleanupMutation.mutate();
  };

  if (!isAdmin) {
    return (
      <main className="container py-16">
        <div className="flex flex-col items-center justify-center text-center">
          <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
          <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">You don't have permission to access this admin area.</p>
          <Button asChild>
            <Link href="/">Return to Dashboard</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">User Cleanup Tool</h1>
        <Button asChild variant="outline">
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin
          </Link>
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Bulk User Cleanup</CardTitle>
          <CardDescription>
            Remove all inactive user accounts except for protected users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cleanupComplete ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="rounded-full bg-green-100 p-6 mb-4">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
              <h3 className="text-xl font-medium mb-2">Cleanup Complete</h3>
              <p className="text-muted-foreground max-w-md mb-6">
                All inactive user accounts have been successfully deleted from the system.
                Only the protected accounts and active users remain.
              </p>
              <div className="flex space-x-4">
                <Button asChild variant="outline">
                  <Link href="/admin">
                    Return to Admin Dashboard
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-lg border p-6 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 mr-3" />
                  <div>
                    <h4 className="font-medium text-amber-800 dark:text-amber-300">Warning: Destructive Action</h4>
                    <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                      This action will permanently delete all inactive user accounts and their associated data.
                      Protected users (including Logan Main) will not be affected. This cannot be undone.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2">What will be deleted:</h3>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>All inactive user accounts</li>
                  <li>All profile data associated with those accounts</li>
                  <li>All workouts, templates, and comments created by those accounts</li>
                  <li>All social connections (follows) from/to those accounts</li>
                </ul>
              </div>

              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2">What will be preserved:</h3>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>Protected user accounts (e.g., Logan Main)</li>
                  <li>System-essential data</li>
                  <li>Any data marked as public and shared with the community</li>
                </ul>
              </div>

              <div className="flex justify-end">
                <Button 
                  variant="destructive" 
                  onClick={handleCleanup}
                  disabled={cleanupMutation.isPending}
                  className="flex items-center"
                >
                  {cleanupMutation.isPending ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-background border-t-transparent rounded-full" /> 
                      Processing...
                    </>
                  ) : (
                    <>
                      <UserX className="mr-2 h-4 w-4" /> 
                      Clean Up Inactive Users
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-6">
          <p className="text-sm text-muted-foreground">
            Admin: {user?.username || "Unknown"} (ID: {user?.id || "?"})
          </p>
        </CardFooter>
      </Card>

      {/* Alert Dialog for confirmation */}
      <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                This action cannot be undone. This will permanently delete ALL inactive user
                accounts and ALL of their associated data from the database.
              </p>
              <p className="font-medium">
                Only protected accounts (like Logan Main) will be preserved.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmCleanup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={cleanupMutation.isPending}
            >
              {cleanupMutation.isPending ? (
                <>
                  <AlertTriangle className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <UserX className="mr-2 h-4 w-4" />
                  Yes, Delete Inactive Users
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
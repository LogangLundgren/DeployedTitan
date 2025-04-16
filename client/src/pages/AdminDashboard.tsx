import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, Shield, Trash2, UserX, UserCheck, AlertTriangle } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

// Type for user suggestions
interface UserSuggestion {
  id: number;
  userId: number;
  username: string;
  email: string;
  content: string;
  category: string;
  status: "new" | "reviewing" | "implemented" | "declined";
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<string>("suggestions");
  const [adminNotes, setAdminNotes] = useState<string>("");
  const [selectedSuggestion, setSelectedSuggestion] = useState<UserSuggestion | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Only allow admin (Logan Main) access
  const isAdmin = user?.id === 9; // Logan Main (ID: 9)

  // Fetch user suggestions
  const { data: suggestions = [], isLoading: suggestionsLoading } = useQuery<UserSuggestion[]>({
    queryKey: ['/api/user-suggestions'],
    enabled: isAdmin,
    retry: false
  });

  // Mutation to update suggestion status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number, status: string, notes?: string }) => {
      return await apiRequest("PATCH", `/api/user-suggestions/${id}`, { 
        status, 
        adminNotes: notes 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-suggestions'] });
      toast({
        title: "Status updated",
        description: "The suggestion status has been updated successfully.",
      });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update status: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Handle status update
  const handleStatusUpdate = (suggestion: UserSuggestion, newStatus: string) => {
    if (newStatus === "implemented" || newStatus === "declined") {
      // Show dialog for notes when implementing or declining
      setSelectedSuggestion(suggestion);
      setAdminNotes(suggestion.adminNotes || "");
      setIsDialogOpen(true);
    } else {
      // Directly update for other statuses
      updateStatusMutation.mutate({ 
        id: suggestion.id, 
        status: newStatus
      });
    }
  };

  // Handle notes submission
  const handleNotesSubmit = () => {
    if (selectedSuggestion) {
      updateStatusMutation.mutate({
        id: selectedSuggestion.id,
        status: isDialogOpen ? (selectedSuggestion.status === "implemented" ? "implemented" : "declined") : selectedSuggestion.status,
        notes: adminNotes
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "new":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "reviewing":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "implemented":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "declined":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  return (
    <main className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button asChild variant="ghost">
          <Link href="/">Back to App</Link>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="suggestions">User Suggestions</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Suggestions & Feedback</CardTitle>
              <CardDescription>
                Review and manage feedback submitted by users through the suggestion box
              </CardDescription>
            </CardHeader>
            <CardContent>
              {suggestionsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : suggestions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="inline-block rounded-full bg-primary/10 p-6 mb-4">
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
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4" />
                      <path d="M12 8h.01" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium mb-2">No Suggestions Yet</h3>
                  <p className="text-muted-foreground">
                    Users haven't submitted any suggestions or feedback yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {suggestions.map((suggestion) => (
                    <Card key={suggestion.id} className="shadow-sm">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-md font-medium">
                              {suggestion.username} ({suggestion.email})
                            </CardTitle>
                            <CardDescription>
                              {format(new Date(suggestion.createdAt), "PPP 'at' p")}
                            </CardDescription>
                          </div>
                          <div className="flex space-x-2">
                            <Badge variant="outline">{suggestion.category}</Badge>
                            <Badge className={getStatusColor(suggestion.status)}>
                              {suggestion.status.charAt(0).toUpperCase() + suggestion.status.slice(1)}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-foreground">{suggestion.content}</p>
                      </CardContent>
                      <CardFooter className="flex justify-end pt-0">
                        <div className="flex space-x-2">
                          {suggestion.status === "new" && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleStatusUpdate(suggestion, "reviewing")}
                              disabled={updateStatusMutation.isPending}
                            >
                              Mark as Reviewing
                            </Button>
                          )}
                          {(suggestion.status === "new" || suggestion.status === "reviewing") && (
                            <>
                              <Button 
                                variant="default" 
                                size="sm"
                                onClick={() => handleStatusUpdate(suggestion, "implemented")}
                                disabled={updateStatusMutation.isPending}
                              >
                                Mark as Implemented
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleStatusUpdate(suggestion, "declined")}
                                disabled={updateStatusMutation.isPending}
                              >
                                Decline
                              </Button>
                            </>
                          )}
                          {suggestion.status === "implemented" && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.open(`mailto:${suggestion.email}`, '_blank')}
                            >
                              Contact User
                            </Button>
                          )}
                          {suggestion.adminNotes && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedSuggestion(suggestion);
                                setAdminNotes(suggestion.adminNotes || "");
                                setIsDialogOpen(true);
                              }}
                            >
                              View Notes
                            </Button>
                          )}
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {suggestions.length} suggestions
              </div>
              <Button variant="outline" size="sm">
                Export All
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                This section is under development. Check back soon!
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-16">
              <div className="text-center">
                <div className="rounded-full bg-primary/10 p-6 mb-4 inline-block">
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
                    <path d="M11 12H3" />
                    <path d="M16 6H3" />
                    <path d="M16 18H3" />
                    <path d="M18 9v6" />
                    <path d="M21 12h-6" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
                <p className="text-muted-foreground max-w-md">
                  We're working on this feature. You'll be able to manage users, assign roles,
                  and configure permissions here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Dashboard</CardTitle>
              <CardDescription>
                This section is under development. Check back soon!
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-16">
              <div className="text-center">
                <div className="rounded-full bg-primary/10 p-6 mb-4 inline-block">
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
                    <path d="M3 3v18h18" />
                    <path d="M18 17V9" />
                    <path d="M13 17V5" />
                    <path d="M8 17v-3" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
                <p className="text-muted-foreground max-w-md">
                  We're working on this feature. You'll be able to view
                  platform analytics, user growth, and engagement metrics here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog for admin notes */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedSuggestion?.status === "implemented" 
                ? "Implementation Notes" 
                : "Decline Reason"}
            </DialogTitle>
            <DialogDescription>
              {selectedSuggestion?.status === "implemented"
                ? "Add notes about how this suggestion was implemented."
                : "Please provide a reason for declining this suggestion."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="suggestion">Suggestion</Label>
              <p className="text-sm text-muted-foreground border rounded p-2 bg-muted/30">
                {selectedSuggestion?.content}
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Admin Notes</Label>
              <Textarea
                id="notes"
                placeholder="Enter your notes here..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleNotesSubmit} 
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? "Saving..." : "Save Notes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
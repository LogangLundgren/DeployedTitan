import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { 
  Calendar, 
  Clock, 
  ChevronRight, 
  Star, 
  FileText,
  ShoppingBag,
  Filter,
  CalendarCheck,
  PlusCircle,
  Dumbbell,
  LayoutGrid,
  Edit,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface User {
  id: number;
  name: string | null;
  username: string;
  email: string | null;
  isCoach: boolean | null;
  coachRegistrationDate: string | null;
}

interface WorkoutPlan {
  id: number;
  title: string;
  description: string;
  durationWeeks: number;
  difficultyLevel: string;
  category: string;
  price: number;
  rating: number | null;
  coachId: number;
  isPublished?: boolean;
  isFeatured?: boolean;
  sales?: number;
  ratingsCount?: number;
  equipment?: string | null;
  featuredImageUrl?: string | null;
}

interface CoachingService {
  id: number;
  title: string;
  description: string;
  serviceType: string;
  durationType: string;
  price: number;
}

interface Purchase {
  id: number;
  userId: number;
  planId: number | null;
  serviceId: number | null;
  transactionId: string;
  amount: number;
  status: string;
  purchaseDate: Date;
  planDetails?: WorkoutPlan;
  serviceDetails?: CoachingService;
}

export default function MyPlans() {
  const [location, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [planToDelete, setPlanToDelete] = useState<WorkoutPlan | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const { toast } = useToast();
  const userId = 1; // Assume user 1 is logged in - in a real app, would come from auth context
  
  // Fetch user info to check if they're a coach
  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ['/api/users', userId],
    queryFn: () => fetch(`/api/users/${userId}`).then(res => res.json())
  });

  // Fetch coach's workout plans if user is a coach
  const { 
    data: coachPlans = [], 
    isLoading: isCoachPlansLoading 
  } = useQuery({
    queryKey: ['/api/workout-plans', 'coach', userId],
    queryFn: () => fetch(`/api/workout-plans?coachId=${userId}&publishedOnly=false`).then(res => res.json()),
    enabled: !!user?.isCoach
  });
  
  // Fetch user's purchases
  const { 
    data: purchases = [], 
    isLoading: isPurchasesLoading,
    error
  } = useQuery({
    queryKey: ['/api/purchases', userId],
    queryFn: () => fetch(`/api/purchases?userId=${userId}`).then(res => res.json())
  });
  
  // Delete workout plan mutation
  const deletePlanMutation = useMutation({
    mutationFn: async (planId: number) => {
      return await apiRequest(`/api/workout-plans/${planId}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workout-plans', 'coach', userId] });
      toast({
        title: "Plan deleted",
        description: "The workout plan has been deleted successfully."
      });
      setConfirmDialogOpen(false);
      setPlanToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete plan: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive"
      });
    }
  });
  
  // Publish/unpublish workout plan mutation
  const publishPlanMutation = useMutation({
    mutationFn: async ({ planId, isPublished }: { planId: number, isPublished: boolean }) => {
      return await apiRequest(`/api/workout-plans/${planId}`, {
        method: "PUT",
        body: JSON.stringify({ isPublished })
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/workout-plans', 'coach', userId] });
      toast({
        title: data.isPublished ? "Plan published" : "Plan unpublished",
        description: data.isPublished 
          ? "Your workout plan is now live in the marketplace!" 
          : "Your workout plan has been removed from the marketplace.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update publication status. Please try again later.",
        variant: "destructive",
      });
    }
  });

  // Star rating display component
  const StarRating = ({ rating }: { rating: number | null }) => {
    if (rating === null) return <span>No ratings yet</span>;
    
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < Math.floor(rating) 
                ? "text-yellow-400 fill-yellow-400" 
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  // Filtered purchases
  const filteredPurchases = purchases.filter((purchase: Purchase) => {
    // Filter by status if status filter is active
    if (statusFilter && purchase.status !== statusFilter) {
      return false;
    }
    
    // Filter by search query if there is one
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      
      if (purchase.planDetails) {
        return (
          purchase.planDetails.title.toLowerCase().includes(query) ||
          purchase.planDetails.description.toLowerCase().includes(query) ||
          purchase.planDetails.category.toLowerCase().includes(query)
        );
      }
      
      if (purchase.serviceDetails) {
        return (
          purchase.serviceDetails.title.toLowerCase().includes(query) ||
          purchase.serviceDetails.description.toLowerCase().includes(query) ||
          purchase.serviceDetails.serviceType.toLowerCase().includes(query)
        );
      }
      
      return false;
    }
    
    return true;
  });

  // Separate purchases by type
  const planPurchases = filteredPurchases.filter((p: Purchase) => p.planId !== null);
  const servicePurchases = filteredPurchases.filter((p: Purchase) => p.serviceId !== null);

  const isLoading = isUserLoading || isPurchasesLoading || (user?.isCoach && isCoachPlansLoading);

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {user?.isCoach ? "My Plans & Purchases" : "My Purchases"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {user?.isCoach 
              ? "Manage your created workout plans and view your purchases" 
              : "View and manage your purchased workout plans and coaching services"
            }
          </p>
        </div>
        <div className="flex gap-3">
          {user?.isCoach && (
            <Button variant="default" onClick={() => setLocation('/create-plan')}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Plan
            </Button>
          )}
          <Button variant={user?.isCoach ? "outline" : "default"} onClick={() => setLocation('/marketplace')}>
            <ShoppingBag className="mr-2 h-4 w-4" />
            Browse Marketplace
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-grow">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          <Select
            value={statusFilter || "all"}
            onValueChange={(value) => setStatusFilter(value === "all" ? null : value)}
          >
            <SelectTrigger className="pl-10">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="relative flex-grow">
          <ChevronRight className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="Search purchases..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue={user?.isCoach ? "coach-plans" : "plans"}>
        <TabsList className="mb-6">
          {user?.isCoach && (
            <TabsTrigger value="coach-plans">
              <Dumbbell className="mr-2 h-4 w-4" />
              My Coach Plans
            </TabsTrigger>
          )}
          <TabsTrigger value="plans">
            <FileText className="mr-2 h-4 w-4" />
            Purchased Plans
          </TabsTrigger>
          <TabsTrigger value="services">
            <CalendarCheck className="mr-2 h-4 w-4" />
            Coaching Services
          </TabsTrigger>
        </TabsList>
        {/* Coach Plans Tab Content */}
        {user?.isCoach && (
          <TabsContent value="coach-plans">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-2">Loading your coach plans...</p>
              </div>
            ) : coachPlans.length > 0 ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Your Workout Plans ({coachPlans.length})</h3>
                  <Button variant="outline" size="sm" onClick={() => setLocation('/create-plan')}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create New Plan
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {coachPlans.map((plan: WorkoutPlan) => (
                    <Card key={plan.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <Badge 
                            className={`${plan.isPublished ? 'bg-green-500' : 'bg-amber-500'}`}
                          >
                            {plan.isPublished ? 'Published' : 'Draft'}
                          </Badge>
                          {plan.isFeatured && (
                            <Badge variant="outline" className="bg-primary/10 text-primary">
                              Featured
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg mt-2">{plan.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {plan.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="flex flex-wrap gap-1 mb-3">
                          <Badge variant="outline" className="bg-slate-100">
                            {plan.difficultyLevel}
                          </Badge>
                          <Badge variant="outline" className="bg-slate-100">
                            {plan.category}
                          </Badge>
                          <Badge variant="outline" className="bg-slate-100">
                            {plan.durationWeeks} weeks
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                          <div>
                            <p className="text-gray-500">Price</p>
                            <p className="font-medium">${plan.price}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Sales</p>
                            <p className="font-medium">{plan.sales || 0}</p>
                          </div>
                        </div>
                        <StarRating rating={plan.rating} />
                      </CardContent>
                      <Separator />
                      <CardFooter className="pt-4 pb-4 flex flex-col gap-3">
                        <div className="flex w-full justify-between items-center">
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setLocation(`/edit-plan/${plan.id}`)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button 
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                              onClick={() => {
                                setPlanToDelete(plan);
                                setConfirmDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                          <Button 
                            variant="default" 
                            size="sm" 
                            onClick={() => setLocation(`/workout-plan/${plan.id}`)}
                          >
                            View Details
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                        </div>
                        <div className="w-full">
                          <Button 
                            variant={plan.isPublished ? "outline" : "default"}
                            size="sm"
                            className={`w-full ${plan.isPublished ? 'border-red-500 text-red-500 hover:bg-red-50' : 'bg-green-500 hover:bg-green-600'}`}
                            onClick={() => publishPlanMutation.mutate({ 
                              planId: plan.id, 
                              isPublished: !plan.isPublished 
                            })}
                            disabled={publishPlanMutation.isPending}
                          >
                            {publishPlanMutation.isPending ? (
                              <>
                                <div className="h-4 w-4 mr-1 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                {plan.isPublished ? 'Unpublishing...' : 'Publishing...'}
                              </>
                            ) : (
                              <>
                                {plan.isPublished ? (
                                  <>
                                    <AlertTriangle className="h-4 w-4 mr-1" />
                                    Unpublish Plan
                                  </>
                                ) : (
                                  <>
                                    <ChevronRight className="h-4 w-4 mr-1" />
                                    Publish to Marketplace
                                  </>
                                )}
                              </>
                            )}
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 border rounded-lg">
                <Dumbbell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-medium mb-2">No Workout Plans</h3>
                <p className="text-gray-500 mb-6">
                  You haven't created any workout plans yet.
                </p>
                <Button onClick={() => setLocation('/create-plan')}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Your First Plan
                </Button>
              </div>
            )}
          </TabsContent>
        )}
        
        <TabsContent value="plans">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2">Loading your workout plans...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              Error loading your purchases. Please try again.
            </div>
          ) : planPurchases.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {planPurchases.map((purchase: Purchase) => (
                <Card key={purchase.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <Badge 
                      className={`w-fit mb-2 ${
                        purchase.status === 'completed' 
                          ? 'bg-green-500' 
                          : purchase.status === 'pending' 
                            ? 'bg-yellow-500' 
                            : 'bg-red-500'
                      }`}
                    >
                      {purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)}
                    </Badge>
                    <CardTitle className="text-lg">
                      {purchase.planDetails?.title || "Workout Plan"}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {purchase.planDetails?.description || "No description available"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow pb-2">
                    <div className="flex flex-wrap gap-1 mb-3">
                      <Badge variant="outline" className="bg-slate-100">
                        {purchase.planDetails?.difficultyLevel || "Unknown difficulty"}
                      </Badge>
                      <Badge variant="outline" className="bg-slate-100">
                        {purchase.planDetails?.category || "Uncategorized"}
                      </Badge>
                      <Badge variant="outline" className="bg-slate-100">
                        {purchase.planDetails?.durationWeeks || "?"} weeks
                      </Badge>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <Calendar className="mr-1 h-4 w-4" />
                      Purchased on {new Date(purchase.purchaseDate).toLocaleDateString()}
                    </div>
                    {purchase.planDetails?.rating !== null && (
                      <StarRating rating={purchase.planDetails?.rating} />
                    )}
                  </CardContent>
                  <Separator />
                  <CardFooter className="pt-4 pb-4 flex justify-between items-center">
                    <div className="font-medium">${purchase.amount.toFixed(2)}</div>
                    <Button 
                      size="sm"
                      onClick={() => setLocation(`/purchased-plans/${purchase.planId}`)}
                    >
                      View Plan
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg">
              <ShoppingBag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-medium mb-2">No Workout Plans</h3>
              <p className="text-gray-500 mb-6">
                You haven't purchased any workout plans yet.
              </p>
              <Button onClick={() => setLocation('/marketplace')}>
                Browse Marketplace
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="services">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2">Loading your coaching services...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              Error loading your purchases. Please try again.
            </div>
          ) : servicePurchases.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {servicePurchases.map((purchase: Purchase) => (
                <Card key={purchase.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <Badge 
                      className={`w-fit mb-2 ${
                        purchase.status === 'completed' 
                          ? 'bg-green-500' 
                          : purchase.status === 'pending' 
                            ? 'bg-yellow-500' 
                            : 'bg-red-500'
                      }`}
                    >
                      {purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)}
                    </Badge>
                    <CardTitle className="text-lg">
                      {purchase.serviceDetails?.title || "Coaching Service"}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {purchase.serviceDetails?.description || "No description available"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow pb-2">
                    <div className="flex flex-wrap gap-1 mb-3">
                      <Badge variant="outline" className="bg-slate-100">
                        {purchase.serviceDetails?.serviceType || "Unknown type"}
                      </Badge>
                      <Badge variant="outline" className="bg-slate-100">
                        {purchase.serviceDetails?.durationType || "Unspecified duration"}
                      </Badge>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <Calendar className="mr-1 h-4 w-4" />
                      Purchased on {new Date(purchase.purchaseDate).toLocaleDateString()}
                    </div>
                  </CardContent>
                  <Separator />
                  <CardFooter className="pt-4 pb-4 flex justify-between items-center">
                    <div className="font-medium">${purchase.amount.toFixed(2)}</div>
                    <Button 
                      size="sm"
                      onClick={() => setLocation(`/coaching-services/${purchase.serviceId}`)}
                    >
                      View Service
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg">
              <CalendarCheck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-medium mb-2">No Coaching Services</h3>
              <p className="text-gray-500 mb-6">
                You haven't purchased any coaching services yet.
              </p>
              <Button onClick={() => setLocation('/marketplace')}>
                Browse Marketplace
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog for Deleting Plans */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workout Plan</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p>
                  Are you sure you want to delete&nbsp;
                  <span className="font-medium">{planToDelete?.title}</span>?
                </p>
                <div className="flex items-center text-amber-600 bg-amber-50 dark:bg-amber-950/20 rounded-md p-3">
                  <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                  <p className="text-sm">
                    This action cannot be undone. This will permanently delete the workout plan
                    and all associated data.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deletePlanMutation.isPending}
              onClick={() => setPlanToDelete(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (planToDelete) {
                  deletePlanMutation.mutate(planToDelete.id);
                }
              }}
              disabled={deletePlanMutation.isPending}
              className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
            >
              {deletePlanMutation.isPending ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-t-transparent border-white" />
                  Deleting...
                </>
              ) : (
                "Delete Plan"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
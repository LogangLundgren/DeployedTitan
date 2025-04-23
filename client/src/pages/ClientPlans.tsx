import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, UserPlus, Edit, Dumbbell } from "lucide-react";
import { Link } from "wouter";
import { Helmet } from "react-helmet";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Client {
  id: number;
  username: string;
  name: string | null;
}

interface ClientPlan {
  id: number;
  title: string;
  description: string;
  isForked: boolean;
  createdAt: string;
  client: Client | null;
  parentPlanId: number | null;
}

export default function ClientPlans() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Fetch client plans
  const {
    data: clientPlans,
    isLoading: isLoadingPlans,
    error,
    refetch
  } = useQuery<ClientPlan[]>({
    queryKey: ["/api/coach/client-plans"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (error) {
    toast({
      title: "Error",
      description: "Failed to load client plans. Please try again.",
      variant: "destructive",
    });
  }

  const navigateToEditPlan = (planId: number) => {
    // Navigate to edit plan page
    window.location.href = `/workout-plans/${planId}/edit`;
  };

  return (
    <div className="container py-8">
      <Helmet>
        <title>Client Workout Plans | Titan Fitness</title>
      </Helmet>
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Client Workout Plans</h1>
          <p className="text-muted-foreground mt-2">
            Manage customized workout plans for your clients
          </p>
        </div>
        <Link href="/my-coach-plans">
          <Button variant="outline" className="flex gap-2">
            <Dumbbell size={16} />
            My Coach Plans
          </Button>
        </Link>
      </div>
      
      {isLoadingPlans ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : clientPlans?.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/30">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Client Plans Yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            You haven't created any customized plans for clients yet. Create a plan and then fork it for a specific client.
          </p>
          <Link href="/create-plan">
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Create New Plan
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clientPlans?.map((plan) => (
            <Card key={plan.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{plan.title}</CardTitle>
                  <Badge variant={plan.isForked ? "default" : "outline"}>
                    {plan.isForked ? "Forked" : "Original"}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">
                  {plan.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      Client: {plan.client?.name || plan.client?.username || "Not assigned"}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Created {format(new Date(plan.createdAt), "MMM d, yyyy")}
                  </div>
                  {plan.parentPlanId && (
                    <div className="text-xs text-muted-foreground">
                      Forked from Plan #{plan.parentPlanId}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-3 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateToEditPlan(plan.id)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Plan
                </Button>
                <Link href={`/workout-plans/${plan.id}`}>
                  <Button size="sm">View Details</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
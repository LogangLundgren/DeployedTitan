import { useEffect, useState } from 'react';
import { useLocation, useSearch } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { ArrowLeft, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PlanCheckout() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const planId = params.get('planId');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if planId is present
    if (!planId) {
      toast({
        title: "Error",
        description: "Missing plan information",
        variant: "destructive",
      });
      setLocation('/marketplace');
      return;
    }

    // Check if user is authenticated
    if (!authLoading && !user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to purchase a workout plan",
        variant: "destructive",
      });
      // Redirect back to the marketplace
      setLocation('/marketplace');
      return;
    }

    // Only initialize checkout if we have a user and planId
    const initiateCheckout = async () => {
      // Don't continue if still loading auth or no user
      if (authLoading || !user) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        console.log("Initializing checkout with planId:", planId);
        
        // Make the request directly with fetch to ensure cookies are sent
        const response = await fetch("/api/init-plan-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId: Number(planId) }),
          credentials: "include"
        });
        
        console.log("Checkout API response status:", response.status);
        const data = await response.json();
        console.log("Checkout API response:", data);
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to initialize checkout');
        }
        
        // Check if this is a free plan which bypasses Stripe
        if (data.freeplan === true) {
          console.log("Free plan detected, skipping Stripe checkout");
          // Redirect directly to payment success page with the plan ID
          setLocation(`/payment-success?planId=${planId}`);
          return;
        }
        
        console.log("Checkout initialized, redirecting with client secret");
        
        // Redirect to the checkout page with the client secret for paid plans
        setLocation(`/checkout?planId=${planId}&clientSecret=${data.clientSecret}`);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred';
        console.error('Error initializing checkout:', errorMsg);
        setError(errorMsg);
        toast({
          title: 'Checkout Failed',
          description: errorMsg,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user && !authLoading) {
      initiateCheckout();
    }
  }, [planId, user, authLoading, setLocation, toast]);

  return (
    <div className="container max-w-md mx-auto py-16 px-4">
      <Button 
        variant="outline" 
        className="mb-6"
        onClick={() => window.history.back()}
        disabled={isLoading}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-center">Initializing Checkout</CardTitle>
          <CardDescription className="text-center">
            Please wait while we prepare your checkout...
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p>Setting up secure payment...</p>
            </div>
          ) : error ? (
            <div className="text-center space-y-4 py-4">
              <div className="text-red-500 mb-4">{error}</div>
              <Button onClick={() => window.history.back()}>
                Return to previous page
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p>Redirecting to checkout...</p>
            </div>
          )}

          <div className="flex items-center justify-center text-xs text-gray-500 mt-6">
            <ShieldCheck className="h-4 w-4 mr-1" />
            Secure payment powered by Stripe
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
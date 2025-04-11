import { useEffect, useState } from 'react';
import { useLocation, useSearch } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
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
      setLocation('/auth');
      return;
    }

    // Initialize checkout
    const initiateCheckout = async () => {
      if (authLoading || !user) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await apiRequest('POST', '/api/init-plan-checkout', { planId });
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to initialize checkout');
        }
        
        // Redirect to the checkout page with the client secret
        setLocation(`/checkout?planId=${planId}&clientSecret=${data.clientSecret}`);
      } catch (err: any) {
        console.error('Error initializing checkout:', err);
        setError(err.message || 'An unexpected error occurred');
        toast({
          title: 'Checkout Failed',
          description: err.message || 'An unexpected error occurred',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    initiateCheckout();
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
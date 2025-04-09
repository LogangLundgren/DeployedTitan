import { useEffect, useState } from 'react';
import { useLocation, useSearch } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { CheckCircle, FileText, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface WorkoutPlan {
  id: number;
  title: string;
  description: string;
  price: number;
}

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const paymentIntent = params.get('payment_intent');
  const planId = params.get('planId');
  const [isProcessing, setIsProcessing] = useState(true);
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const confirmPayment = async () => {
      if (!paymentIntent || !planId) {
        setError('Missing payment information');
        setIsProcessing(false);
        return;
      }

      try {
        // Fetch plan data
        const planResponse = await fetch(`/api/workout-plans/${planId}`);
        if (!planResponse.ok) {
          throw new Error('Failed to fetch plan details');
        }
        const planData = await planResponse.json();
        setPlan(planData);

        // Confirm the payment in our database
        const confirmResponse = await fetch('/api/confirm-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentIntentId: paymentIntent,
            userId: 1, // In a real app, would come from auth context
            planId: parseInt(planId),
          })
        });

        if (!confirmResponse.ok) {
          const errorData = await confirmResponse.json();
          throw new Error(errorData.message || 'Failed to record purchase');
        }

        setIsProcessing(false);
        toast({
          title: 'Payment Successful!',
          description: 'Your workout plan purchase has been completed.',
        });
      } catch (err: any) {
        console.error('Payment confirmation error:', err);
        setError(err.message || 'An error occurred confirming your payment');
        setIsProcessing(false);
        toast({
          title: 'Error Confirming Payment',
          description: 'There was a problem recording your purchase. Please contact support.',
          variant: 'destructive',
        });
      }
    };

    confirmPayment();
  }, [paymentIntent, planId, toast]);

  if (isProcessing) {
    return (
      <div className="container mx-auto py-16 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4">Processing your payment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-16 max-w-md">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-xl text-red-600">Payment Error</CardTitle>
            <CardDescription>
              There was an issue with your payment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">{error}</p>
            <p className="text-sm text-gray-500">
              If you believe your card was charged but the purchase didn't go through,
              please contact support with your payment reference: {paymentIntent}
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => setLocation('/marketplace')}
              className="w-full"
            >
              Return to Marketplace
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-16 px-4 max-w-md">
      <Card className="border-green-200">
        <CardHeader className="pb-4">
          <div className="mx-auto bg-green-100 p-4 rounded-full mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-center">Payment Successful!</CardTitle>
          <CardDescription className="text-center">
            Your purchase has been completed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {plan && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-bold mb-1">{plan.title}</h3>
              <p className="text-sm text-gray-600 mb-2">{plan.description.substring(0, 100)}...</p>
              <div className="font-semibold">${plan.price.toFixed(2)}</div>
            </div>
          )}
            
          <div className="text-sm text-gray-600">
            <p className="mb-2">
              Your purchase has been confirmed and the workout plan is now available in your account.
            </p>
            <p>
              You can access it anytime from your "My Plans" section.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button 
            onClick={() => setLocation('/my-plans')}
            className="w-full"
          >
            <FileText className="mr-2 h-4 w-4" />
            View My Plans
          </Button>
          <Button 
            variant="outline"
            onClick={() => setLocation('/marketplace')}
            className="w-full"
          >
            Continue Shopping
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
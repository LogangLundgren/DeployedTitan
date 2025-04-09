import { useEffect, useState } from 'react';
import { useLocation, useRoute, useSearch } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Elements, 
  PaymentElement, 
  useStripe, 
  useElements 
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { 
  ArrowLeft, 
  ShieldCheck, 
  CreditCard, 
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Load stripe outside of component to prevent recreating it on renders
let stripePromise: ReturnType<typeof loadStripe> | null = null;

// Initialize Stripe
const getStripe = async () => {
  if (!stripePromise) {
    const response = await fetch('/api/checkout-config');
    const { publishableKey } = await response.json();
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};

// Payment form component
const CheckoutForm = ({ planId }: { planId: string }) => {
  const [, setLocation] = useLocation();
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't loaded yet
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    // Confirm payment with Stripe.js
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success?planId=${planId}`,
      },
      redirect: 'if_required',
    });

    if (error) {
      setErrorMessage(error.message || 'An unexpected error occurred.');
      setIsLoading(false);
      toast({
        title: 'Payment Failed',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
      return;
    }

    if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Payment succeeded, record purchase in our database
      try {
        const confirmResponse = await fetch('/api/confirm-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            userId: 1, // In a real app, would come from auth context
            planId,
          })
        });

        if (!confirmResponse.ok) {
          throw new Error('Failed to record purchase');
        }

        toast({
          title: 'Payment Successful!',
          description: 'Your purchase has been completed successfully.',
        });

        // Redirect to My Plans page
        setLocation('/my-plans');
      } catch (err) {
        console.error('Confirm payment error:', err);
        setErrorMessage('Payment processed but failed to record purchase. Please contact support.');
        toast({
          title: 'Error Recording Purchase',
          description: 'Payment processed but failed to record purchase. Please contact support.',
          variant: 'destructive',
        });
      }
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <PaymentElement />
      </div>

      {errorMessage && (
        <div className="text-red-500 text-sm mb-4">
          {errorMessage}
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || isLoading}
        className="w-full"
      >
        {isLoading ? (
          <>
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
            Processing...
          </>
        ) : "Pay Now"}
      </Button>

      <div className="flex items-center justify-center text-xs text-gray-500 mt-4">
        <ShieldCheck className="h-4 w-4 mr-1" />
        Secure payment powered by Stripe
      </div>
    </form>
  );
};

export default function Checkout() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const clientSecret = params.get('clientSecret');
  const planId = params.get('planId');
  const [stripeLoaded, setStripeLoaded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadStripeJs = async () => {
      try {
        await getStripe();
        setStripeLoaded(true);
      } catch (error) {
        console.error('Failed to load Stripe:', error);
        toast({
          title: 'Error',
          description: 'Failed to initialize payment processor. Please try again.',
          variant: 'destructive',
        });
      }
    };

    loadStripeJs();
  }, [toast]);

  // If missing parameters, redirect to home
  if (!clientSecret || !planId) {
    return (
      <div className="container mx-auto py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Invalid Checkout Session</h2>
        <p className="mb-8">Missing required payment information.</p>
        <Button onClick={() => setLocation('/')}>
          Return to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <Button 
        variant="outline" 
        className="mb-6"
        onClick={() => window.history.back()}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <h1 className="text-3xl font-bold mb-8 text-center">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Payment Form */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                Payment Details
              </CardTitle>
              <CardDescription>
                Complete your purchase securely
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stripeLoaded && clientSecret ? (
                <Elements 
                  stripe={stripePromise} 
                  options={{ clientSecret, appearance: { theme: 'stripe' } }}
                >
                  <CheckoutForm planId={planId} />
                </Elements>
              ) : (
                <div className="py-8 text-center">
                  <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                  <p className="mt-4">Loading payment form...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Workout Plan</span>
                <FetchPlanPrice planId={planId} />
              </div>

              <div className="flex items-start gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4 mt-0.5" />
                <span>Lifetime access to this workout plan</span>
              </div>
            </CardContent>
            <Separator />
            <CardFooter className="pt-4">
              <div className="w-full flex justify-between font-bold">
                <span>Total</span>
                <FetchPlanPrice planId={planId} />
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper component to fetch and display plan price
function FetchPlanPrice({ planId }: { planId: string }) {
  const [price, setPrice] = useState<number | null>(null);

  useEffect(() => {
    const fetchPlanData = async () => {
      try {
        const response = await fetch(`/api/workout-plans/${planId}`);
        if (response.ok) {
          const data = await response.json();
          setPrice(data.price);
        }
      } catch (error) {
        console.error('Error fetching plan data:', error);
      }
    };

    fetchPlanData();
  }, [planId]);

  if (price === null) {
    return <span className="opacity-50">Loading...</span>;
  }

  return <span>${price.toFixed(2)}</span>;
}
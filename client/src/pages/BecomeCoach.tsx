import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../hooks/use-auth';

// UI components
import { ArrowLeft, ShieldCheck, CreditCard, BadgeCheck, ReceiptText, Users, PieChart, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

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
const CoachRegistrationForm = () => {
  const [, navigate] = useLocation();
  const stripe = useStripe();
  const elements = useElements();
  const { user, loginMutation } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements || !user) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    // Confirm payment with Stripe.js
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/profile`,
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
      // Payment succeeded, record coach registration
      try {
        const confirmResponse = await fetch('/api/confirm-coach-registration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            userId: user.id,
          })
        });

        if (!confirmResponse.ok) {
          throw new Error('Failed to register as coach');
        }

        const data = await confirmResponse.json();

        // Refresh user data to include coach status
        if (user.username && user.password) {
          await loginMutation.mutateAsync({ 
            username: user.username, 
            password: user.password 
          });
        }

        toast({
          title: 'Registration Successful!',
          description: 'You are now registered as a coach!',
        });

        // Redirect to create coach profile
        navigate('/coach-profile');
      } catch (err) {
        console.error('Coach registration error:', err);
        setErrorMessage('Payment processed but failed to complete registration. Please contact support.');
        toast({
          title: 'Error Completing Registration',
          description: 'Payment processed but failed to complete registration. Please contact support.',
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
        ) : "Pay $4.99"}
      </Button>

      <div className="flex items-center justify-center text-xs text-muted-foreground mt-4">
        <ShieldCheck className="h-4 w-4 mr-1" />
        Secure payment powered by Stripe
      </div>
    </form>
  );
};

export default function BecomeCoach() {
  const [, navigate] = useLocation();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripeLoaded, setStripeLoaded] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const { user, loginMutation } = useAuth();
  const { toast } = useToast();

  // Function to directly register as coach without payment (for testing)
  const registerAsFreeCoach = async () => {
    if (!user) return;
    
    setIsRegistering(true);
    try {
      // Call the API to update user coach status directly
      const response = await fetch("/api/register-as-coach-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id })
      });
      
      if (!response.ok) {
        throw new Error("Failed to register as coach");
      }
      
      // Refresh user data
      if (user.username && user.password) {
        await loginMutation.mutateAsync({ 
          username: user.username, 
          password: user.password 
        });
      }
      
      toast({
        title: "Registration Successful!",
        description: "You are now registered as a coach!",
      });
      
      // Redirect to profile page
      navigate('/profile');
    } catch (error) {
      console.error("Coach registration error:", error);
      toast({
        title: "Error Registering as Coach",
        description: "Failed to complete registration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  useEffect(() => {
    // Check if user is already a coach
    if (user && user.isCoach) {
      toast({
        title: 'Already Registered',
        description: 'You are already registered as a coach',
      });
      navigate('/profile');
      return;
    }

    // Load Stripe and create payment intent
    const loadStripeAndCreateIntent = async () => {
      try {
        // Initialize Stripe
        await getStripe();
        setStripeLoaded(true);

        // Create a payment intent for coach registration
        if (user) {
          const response = await fetch('/api/create-coach-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id })
          });

          if (!response.ok) {
            throw new Error('Failed to create payment intent');
          }

          const data = await response.json();
          setClientSecret(data.clientSecret);
        }
      } catch (error) {
        console.error('Error initializing payment:', error);
        toast({
          title: 'Error',
          description: 'Failed to initialize payment process. Please try again.',
          variant: 'destructive',
        });
      }
    };

    if (user) {
      loadStripeAndCreateIntent();
    }
  }, [user, toast, navigate]);

  // Redirect to login if user is not logged in
  if (!user) {
    return (
      <div className="container mx-auto py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Login Required</h2>
        <p className="mb-8">You need to be logged in to register as a coach.</p>
        <Button onClick={() => navigate('/auth')}>
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Button 
        variant="outline" 
        className="mb-6"
        onClick={() => window.history.back()}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <h1 className="text-3xl font-bold mb-2 text-center">Become a Coach</h1>
      <p className="text-center text-muted-foreground mb-8">Unlock coaching features and start creating your own workout plans</p>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Payment Form */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                Registration Payment
              </CardTitle>
              <CardDescription>
                One-time registration fee for coach features
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Testing-only free registration button */}
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h3 className="text-amber-800 font-medium mb-2">Testing Mode</h3>
                <p className="text-amber-700 text-sm mb-4">
                  For development purposes only. This will be removed before launch.
                </p>
                <Button 
                  onClick={registerAsFreeCoach}
                  disabled={isRegistering}
                  variant="outline"
                  className="w-full bg-white border-amber-300 hover:bg-amber-100"
                >
                  {isRegistering ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-amber-700 border-t-transparent"></div>
                      Processing...
                    </>
                  ) : "Register as Coach (Free Testing)"}
                </Button>
              </div>
              
              <div className="relative py-4 text-center mb-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200"></span>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-4 text-sm text-gray-500">OR</span>
                </div>
              </div>
              
              {/* Normal Stripe payment form */}
              {stripeLoaded && clientSecret ? (
                <Elements 
                  stripe={stripePromise} 
                  options={{ clientSecret, appearance: { theme: 'stripe' } }}
                >
                  <CoachRegistrationForm />
                </Elements>
              ) : (
                <div className="py-4 text-center">
                  <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                  <p className="mt-2">Loading payment form...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Benefits */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Coach Benefits</CardTitle>
              <CardDescription>What you'll get as a coach</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <BadgeCheck className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Create Workout Plans</p>
                  <p className="text-sm text-muted-foreground">Design professional training plans for your clients</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <ReceiptText className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Sell Your Plans</p>
                  <p className="text-sm text-muted-foreground">Set your own prices and earn passive income</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Users className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Coach Profile</p>
                  <p className="text-sm text-muted-foreground">Showcase your experience and expertise</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <PieChart className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Client Analytics</p>
                  <p className="text-sm text-muted-foreground">Track progress and results for your clients</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <BookOpen className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Template Library</p>
                  <p className="text-sm text-muted-foreground">Create and manage your workout templates</p>
                </div>
              </div>
            </CardContent>
            <Separator />
            <CardFooter className="pt-4 flex-col">
              <div className="w-full flex justify-between font-bold">
                <span>Registration Fee</span>
                <span>$4.99</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                One-time payment, lifetime access to coach features
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
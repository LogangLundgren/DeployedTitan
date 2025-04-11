import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import OnboardingLayout from '@/components/onboarding/OnboardingLayout';
import ProfileSetup from '@/components/onboarding/ProfileSetup';
import TemplateCreation from '@/components/onboarding/TemplateCreation';
import MarketplaceIntro from '@/components/onboarding/MarketplaceIntro';
import SocialConnection from '@/components/onboarding/SocialConnection';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Onboarding() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<string>('profile_setup');
  const [isSkipping, setIsSkipping] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    if (!user) {
      navigate('/auth');
      return;
    }

    // Check if onboarding is already completed
    if (user.onboardingCompleted) {
      navigate('/');
      return;
    }

    // Initialize current step from user data
    if (user.onboardingStep) {
      setCurrentStep(user.onboardingStep);
    }
  }, [user, navigate]);

  const handleNext = () => {
    // Move to the next step based on current step
    switch (currentStep) {
      case 'profile_setup':
        setCurrentStep('template_creation');
        break;
      case 'template_creation':
        setCurrentStep('marketplace_intro');
        break;
      case 'marketplace_intro':
        setCurrentStep('social_connection');
        break;
      case 'social_connection':
        setCurrentStep('completed');
        break;
      case 'completed':
        navigateToApp();
        break;
      default:
        navigateToApp();
    }
  };

  const handlePrevious = () => {
    // Move to the previous step based on current step
    switch (currentStep) {
      case 'template_creation':
        setCurrentStep('profile_setup');
        break;
      case 'marketplace_intro':
        setCurrentStep('template_creation');
        break;
      case 'social_connection':
        setCurrentStep('marketplace_intro');
        break;
      default:
        // Do nothing for profile_setup as it's the first step
        break;
    }
  };

  const handleSkip = async () => {
    setIsSkipping(true);
    try {
      // Complete the onboarding right away
      await apiRequest('POST', '/api/user/complete-onboarding');
      
      // Invalidate the user query to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
      toast({
        title: 'Welcome to Titan Fitness!',
        description: 'You can always access the features from the dashboard.',
      });
      
      navigateToApp();
    } catch (error) {
      console.error('Error skipping onboarding:', error);
      toast({
        title: 'Error',
        description: 'Failed to skip onboarding. Please try again.',
        variant: 'destructive',
      });
      setIsSkipping(false);
    }
  };

  const navigateToApp = () => {
    navigate('/');
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p>Checking authentication status...</p>
      </div>
    );
  }

  return (
    <OnboardingLayout
      currentStep={currentStep as any}
      onNext={handleNext}
      onPrevious={handlePrevious}
      onSkip={handleSkip}
      isNextDisabled={isSkipping}
      isPreviousDisabled={currentStep === 'profile_setup' || isSkipping}
      isLastStep={currentStep === 'social_connection'}
    >
      {isSkipping ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h2 className="text-xl font-semibold mb-2">Preparing your dashboard</h2>
          <p className="text-muted-foreground">Skipping onboarding and setting up your account...</p>
        </div>
      ) : (
        <>
          {currentStep === 'profile_setup' && (
            <ProfileSetup onComplete={handleNext} />
          )}
          
          {currentStep === 'template_creation' && (
            <TemplateCreation onComplete={handleNext} />
          )}
          
          {currentStep === 'marketplace_intro' && (
            <MarketplaceIntro onComplete={handleNext} />
          )}
          
          {currentStep === 'social_connection' && (
            <SocialConnection onComplete={handleNext} />
          )}
          
          {currentStep === 'completed' && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="bg-primary/10 text-primary rounded-full p-6 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold mb-2">All Set!</h2>
              <p className="text-xl text-muted-foreground mb-8">
                You're ready to start your fitness journey with Titan Fitness
              </p>
              <Button size="lg" onClick={navigateToApp}>
                Go to Dashboard
              </Button>
            </div>
          )}
        </>
      )}
    </OnboardingLayout>
  );
}
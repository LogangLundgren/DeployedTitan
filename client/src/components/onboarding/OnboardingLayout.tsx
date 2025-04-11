import React, { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface OnboardingLayoutProps {
  children: ReactNode;
  currentStep: 'profile_setup' | 'template_creation' | 'marketplace_intro' | 'social_connection' | 'completed';
  onNext?: () => void;
  onPrevious?: () => void;
  onSkip?: () => void;
  isNextDisabled?: boolean;
  isPreviousDisabled?: boolean;
  isLastStep?: boolean;
}

export default function OnboardingLayout({
  children,
  currentStep,
  onNext,
  onPrevious,
  onSkip,
  isNextDisabled = false,
  isPreviousDisabled = false,
  isLastStep = false,
}: OnboardingLayoutProps) {
  const { user } = useAuth();
  
  // Configure the steps
  const steps = [
    { id: 'profile_setup', title: 'Profile Setup' },
    { id: 'template_creation', title: 'Create Workout Template' },
    { id: 'marketplace_intro', title: 'Explore Marketplace' },
    { id: 'social_connection', title: 'Connect with Others' },
    { id: 'completed', title: 'Complete' }
  ];
  
  // Find the current step index
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  
  // Handle completing all onboarding steps
  const handleCompleteOnboarding = async () => {
    try {
      await apiRequest('POST', '/api/user/complete-onboarding');
      // Invalidate user data to refresh the onboarding status
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      if (onNext) onNext();
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with progress indicator */}
      <header className="bg-background border-b px-4 py-3">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Welcome to Titan Fitness</h1>
            {onSkip && (
              <Button variant="ghost" onClick={onSkip}>
                Skip Onboarding
              </Button>
            )}
          </div>
          
          {/* Progress steps */}
          <div className="flex justify-between mb-4 relative">
            {/* Progress bar background */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-muted -translate-y-1/2 z-0" />
            
            {/* Progress bar fill */}
            <div 
              className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 z-0 transition-all" 
              style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
            />
            
            {/* Step indicators */}
            {steps.map((step, index) => (
              <div 
                key={step.id} 
                className={`relative flex flex-col items-center z-10 ${index < currentStepIndex ? 'text-primary' : index === currentStepIndex ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 
                    ${index < currentStepIndex 
                      ? 'bg-primary text-primary-foreground' 
                      : index === currentStepIndex 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground border border-muted'}`}
                >
                  {index < currentStepIndex ? '✓' : index + 1}
                </div>
                <span className="text-xs text-center font-medium">{step.title}</span>
              </div>
            ))}
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 p-6 container mx-auto">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>
      
      {/* Footer with navigation buttons */}
      <footer className="bg-background border-t px-4 py-3">
        <div className="container mx-auto flex justify-between">
          <Button 
            variant="outline" 
            onClick={onPrevious} 
            disabled={isPreviousDisabled || currentStepIndex === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          
          <Button 
            onClick={isLastStep ? handleCompleteOnboarding : onNext} 
            disabled={isNextDisabled}
          >
            {isLastStep ? 'Complete Setup' : 'Next'}
            {!isLastStep && <ChevronRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </footer>
    </div>
  );
}
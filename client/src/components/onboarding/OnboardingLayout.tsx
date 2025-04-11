import { useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface OnboardingLayoutProps {
  children: ReactNode;
  title: string;
  description: string;
  currentStep: string;
  onNext: () => void;
  onBack?: () => void;
  canProgress: boolean;
  isLastStep?: boolean;
}

export default function OnboardingLayout({
  children,
  title,
  description,
  currentStep,
  onNext,
  onBack,
  canProgress,
  isLastStep = false,
}: OnboardingLayoutProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // If user already completed onboarding, redirect to dashboard
    if (user?.onboardingCompleted) {
      setLocation("/");
    }
  }, [user, setLocation]);

  // Map frontend step names to backend step values
  const mapStepToBackend = (step: string): string => {
    switch (step) {
      case 'profile':
        return 'profile_setup';
      case 'template':
        return 'template_creation';
      case 'marketplace':
        return 'marketplace_intro';
      case 'social':
        return 'social_connection';
      default:
        return 'not_started';
    }
  };

  const handleNext = async () => {
    setIsSubmitting(true);
    try {
      const backendStep = mapStepToBackend(currentStep);
      
      // Update the onboarding step in the backend
      await apiRequest("POST", "/api/user/update-onboarding-step", { step: backendStep });
      
      // If this is the last step, mark onboarding as completed
      if (isLastStep) {
        await apiRequest("POST", "/api/user/complete-onboarding", {});
        setLocation("/");
      } else {
        // Move to the next step
        onNext();
      }
    } catch (error) {
      console.error("Error updating onboarding step:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {children}
        </CardContent>
        <CardFooter className="flex justify-between border-t p-4">
          {onBack ? (
            <Button
              variant="outline"
              onClick={onBack}
              disabled={isSubmitting}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          ) : (
            <div></div>
          )}
          <Button
            onClick={handleNext}
            disabled={!canProgress || isSubmitting}
            className="ml-auto"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : isLastStep ? (
              <span className="flex items-center">
                Complete <CheckCircle2 className="ml-2 h-4 w-4" />
              </span>
            ) : (
              <span className="flex items-center">
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </span>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
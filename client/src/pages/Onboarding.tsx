import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import ProfileSetup from "@/components/onboarding/ProfileSetup";
import TemplateCreation from "@/components/onboarding/TemplateCreation";
import MarketplaceIntro from "@/components/onboarding/MarketplaceIntro";
import SocialConnection from "@/components/onboarding/SocialConnection";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Define our onboarding steps
const STEPS = {
  PROFILE: "profile",
  TEMPLATE: "template",
  MARKETPLACE: "marketplace",
  SOCIAL: "social",
};

export default function Onboarding() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(STEPS.PROFILE);
  const [profileData, setProfileData] = useState<any>(null);
  
  useEffect(() => {
    // If user already completed onboarding, redirect to dashboard
    if (user?.onboardingCompleted) {
      setLocation("/");
      return;
    }
    
    // Set the current step based on the user's onboarding progress
    if (user?.onboardingStep) {
      // Map the onboarding step from DB to the frontend steps
      switch(user.onboardingStep) {
        case 'profile_setup':
          setCurrentStep(STEPS.PROFILE);
          break;
        case 'template_creation':
          setCurrentStep(STEPS.TEMPLATE);
          break;
        case 'marketplace_intro':
          setCurrentStep(STEPS.MARKETPLACE);
          break;
        case 'social_connection':
          setCurrentStep(STEPS.SOCIAL);
          break;
      }
    }
  }, [user, setLocation]);

  const nextStep = () => {
    switch (currentStep) {
      case STEPS.PROFILE:
        setCurrentStep(STEPS.TEMPLATE);
        break;
      case STEPS.TEMPLATE:
        setCurrentStep(STEPS.MARKETPLACE);
        break;
      case STEPS.MARKETPLACE:
        setCurrentStep(STEPS.SOCIAL);
        break;
      default:
        break;
    }
  };

  const prevStep = () => {
    switch (currentStep) {
      case STEPS.TEMPLATE:
        setCurrentStep(STEPS.PROFILE);
        break;
      case STEPS.MARKETPLACE:
        setCurrentStep(STEPS.TEMPLATE);
        break;
      case STEPS.SOCIAL:
        setCurrentStep(STEPS.MARKETPLACE);
        break;
      default:
        break;
    }
  };

  // Map frontend step names to backend step values
  const mapStepToBackend = (step: string): string => {
    switch (step) {
      case STEPS.PROFILE:
        return 'profile_setup';
      case STEPS.TEMPLATE:
        return 'template_creation';
      case STEPS.MARKETPLACE:
        return 'marketplace_intro';
      case STEPS.SOCIAL:
        return 'social_connection';
      default:
        return 'not_started';
    }
  };

  const skipStep = async () => {
    // Handle skipping the current step
    try {
      const backendStep = mapStepToBackend(currentStep);
      
      // Still mark the step as completed in the backend
      await apiRequest("POST", "/api/user/update-onboarding-step", { step: backendStep });
      nextStep();
    } catch (error) {
      console.error("Error skipping step:", error);
      toast({
        title: "Error",
        description: "Failed to skip this step. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleProfileComplete = (data: any) => {
    setProfileData(data);
    nextStep();
  };

  // Render the current step
  const renderStep = () => {
    switch (currentStep) {
      case STEPS.PROFILE:
        return (
          <OnboardingLayout
            title="Setup Your Profile"
            description="Tell us about yourself so we can personalize your experience."
            currentStep={STEPS.PROFILE}
            onNext={nextStep}
            canProgress={!!profileData}
            isLastStep={false}
          >
            <ProfileSetup onComplete={handleProfileComplete} />
          </OnboardingLayout>
        );
      
      case STEPS.TEMPLATE:
        return (
          <OnboardingLayout
            title="Create Your First Workout Template"
            description="Start building your first workout template. You can customize it later."
            currentStep={STEPS.TEMPLATE}
            onNext={nextStep}
            onBack={prevStep}
            canProgress={true}
            isLastStep={false}
          >
            <TemplateCreation onComplete={nextStep} />
          </OnboardingLayout>
        );
      
      case STEPS.MARKETPLACE:
        return (
          <OnboardingLayout
            title="Explore the Marketplace"
            description="Discover workout plans and coaches to help you reach your fitness goals."
            currentStep={STEPS.MARKETPLACE}
            onNext={nextStep}
            onBack={prevStep}
            canProgress={true}
            isLastStep={false}
          >
            <MarketplaceIntro onComplete={nextStep} />
          </OnboardingLayout>
        );
      
      case STEPS.SOCIAL:
        return (
          <OnboardingLayout
            title="Connect with Others"
            description="Follow other users to stay motivated and share your fitness journey."
            currentStep={STEPS.SOCIAL}
            onNext={nextStep}
            onBack={prevStep}
            canProgress={true}
            isLastStep={true}
          >
            <SocialConnection onComplete={nextStep} />
          </OnboardingLayout>
        );
      
      default:
        return null;
    }
  };

  return renderStep();
}
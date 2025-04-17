import { createContext, ReactNode, useContext, useState, useEffect } from "react";

type OnboardingStep = "dashboard" | "workouts" | "social" | "marketplace" | "myplans" | "profile" | "finished";

interface OnboardingContextType {
  currentStep: OnboardingStep | null;
  setCurrentStep: (step: OnboardingStep | null) => void;
  nextStep: () => void;
  showOnboarding: boolean;
  startOnboarding: () => void;
  skipOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

const stepOrder: OnboardingStep[] = [
  "dashboard", 
  "workouts", 
  "social", 
  "marketplace", 
  "myplans", 
  "profile", 
  "finished"
];

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep | null>(null);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  // Check localStorage to see if this is a first time user
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem("titan-fitness-onboarding-completed");
    if (!hasCompletedOnboarding) {
      // Don't automatically start onboarding - let the user start it manually
      // or show a welcome screen elsewhere in the app
    }
  }, []);

  // Move to the next step in the onboarding process
  const nextStep = () => {
    if (currentStep === null) {
      setCurrentStep("dashboard");
      return;
    }
    
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex === stepOrder.length - 1 || currentIndex === -1) {
      // We've reached the end or something went wrong
      setCurrentStep(null);
      setShowOnboarding(false);
      localStorage.setItem("titan-fitness-onboarding-completed", "true");
    } else {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };
  
  // Start the onboarding process
  const startOnboarding = () => {
    setShowOnboarding(true);
    setCurrentStep("dashboard");
  };
  
  // Skip the rest of the onboarding
  const skipOnboarding = () => {
    setCurrentStep(null);
    setShowOnboarding(false);
    localStorage.setItem("titan-fitness-onboarding-completed", "true");
  };

  return (
    <OnboardingContext.Provider
      value={{
        currentStep,
        setCurrentStep,
        nextStep,
        showOnboarding,
        startOnboarding,
        skipOnboarding
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}
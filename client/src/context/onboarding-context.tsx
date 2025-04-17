import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useLocation } from "wouter";

type OnboardingStep = "dashboard" | "workouts" | "social" | "marketplace" | "myplans" | "profile" | "finished";

interface OnboardingContextType {
  currentStep: OnboardingStep | null;
  setCurrentStep: (step: OnboardingStep | null) => void;
  nextStep: () => void;
  showOnboarding: boolean;
  startOnboarding: () => void;
  skipOnboarding: () => void;
  getPathForStep: (step: OnboardingStep) => string;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

// Define the order of steps and their corresponding paths
const stepConfig: Record<OnboardingStep, { path: string, title: string }> = {
  dashboard: { path: "/", title: "Dashboard" },
  workouts: { path: "/workouts", title: "Workouts" },
  social: { path: "/social", title: "Social" },
  marketplace: { path: "/marketplace", title: "Marketplace" },
  myplans: { path: "/my-plans", title: "My Plans" },
  profile: { path: "/profile", title: "Profile" },
  finished: { path: "/", title: "Completed" }
};

const stepOrder: OnboardingStep[] = [
  "dashboard", 
  "workouts", 
  "social", 
  "marketplace", 
  "myplans", 
  "profile", 
  "finished"
];

// Delay between steps to allow for smooth transitions
const NAVIGATION_DELAY = 500;

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep | null>(null);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [location, setLocation] = useLocation();
  const [isNavigating, setIsNavigating] = useState<boolean>(false);

  // Get the path for a specific step
  const getPathForStep = (step: OnboardingStep): string => {
    return stepConfig[step].path;
  };

  // Check if a first-time user has logged in
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem("titan-fitness-onboarding-completed");
    const isFirstLogin = sessionStorage.getItem("first-login");
    
    if (!hasCompletedOnboarding && isFirstLogin) {
      // Automatically show the welcome screen for first-time users
      setShowOnboarding(true);
    }
  }, []);

  // Handle navigation between steps
  useEffect(() => {
    if (currentStep && currentStep !== "finished" && !isNavigating) {
      const path = getPathForStep(currentStep);
      
      // Only navigate if we're not already on this path
      if (location !== path) {
        setIsNavigating(true);
        
        // Add a small delay to allow for animations
        setTimeout(() => {
          setLocation(path);
          setIsNavigating(false);
        }, NAVIGATION_DELAY);
      }
    }
  }, [currentStep, location, setLocation, isNavigating]);

  // Move to the next step in the onboarding process
  const nextStep = () => {
    if (isNavigating) return;
    
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
      setLocation("/");
    } else {
      // Set navigating state to prevent multiple clicks
      setIsNavigating(true);
      
      // Slight delay before showing next step
      setTimeout(() => {
        setCurrentStep(stepOrder[currentIndex + 1]);
      }, NAVIGATION_DELAY / 2);
    }
  };
  
  // Start the onboarding process
  const startOnboarding = () => {
    setShowOnboarding(true);
    setCurrentStep("dashboard");
    // Remove first login flag to avoid reshowing the welcome screen
    sessionStorage.removeItem("first-login");
  };
  
  // Skip the rest of the onboarding
  const skipOnboarding = () => {
    setCurrentStep(null);
    setShowOnboarding(false);
    localStorage.setItem("titan-fitness-onboarding-completed", "true");
    // Remove first login flag
    sessionStorage.removeItem("first-login");
  };

  return (
    <OnboardingContext.Provider
      value={{
        currentStep,
        setCurrentStep,
        nextStep,
        showOnboarding,
        startOnboarding,
        skipOnboarding,
        getPathForStep
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
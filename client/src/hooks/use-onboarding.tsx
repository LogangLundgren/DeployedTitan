import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useAuth } from "./use-auth";

type OnboardingStep = {
  id: string;
  title: string;
  content: string;
  target: string; // CSS selector for the element to highlight
  position: 'top' | 'bottom' | 'left' | 'right';
  page?: string; // Optional: specific page this step belongs to
  action?: () => void; // Optional: action to perform when step is shown
};

type OnboardingContextType = {
  isActive: boolean;
  currentStep: number;
  steps: OnboardingStep[];
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  isStepVisible: (stepId: string) => boolean;
  getCurrentStepForElement: (selector: string) => OnboardingStep | null;
};

const OnboardingContext = createContext<OnboardingContextType | null>(null);

// Define the onboarding steps
const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Titan Fitness!',
    content: 'Let\'s take a quick tour to help you get started with tracking your fitness journey.',
    target: 'header.app-header',
    position: 'bottom'
  },
  {
    id: 'navigation',
    title: 'Navigation Menu',
    content: 'Use this navigation to access different areas of the app. Start with Dashboard to see your overview.',
    target: '[data-tour="navigation"]',
    position: 'right'
  },
  {
    id: 'dashboard',
    title: 'Your Dashboard',
    content: 'This is your fitness command center. View your recent workouts, progress, and quick stats here.',
    target: '[data-tour="dashboard"]',
    position: 'bottom',
    page: '/dashboard'
  },
  {
    id: 'workout-log',
    title: 'Log Your Workouts',
    content: 'Click here to record your workouts. Track exercises, sets, reps, and weights to monitor your progress.',
    target: '[data-tour="workout-log"]',
    position: 'bottom',
    page: '/dashboard'
  },
  {
    id: 'marketplace',
    title: 'Explore Marketplace',
    content: 'Discover workout plans from certified coaches and find programs that match your fitness goals.',
    target: '[data-tour="marketplace"]',
    position: 'right'
  },
  {
    id: 'search',
    title: 'Search & Filter',
    content: 'Use the search bar to find specific workout plans or coaches that interest you.',
    target: '[data-tour="search"]',
    position: 'bottom',
    page: '/marketplace'
  },
  {
    id: 'profile',
    title: 'Your Profile',
    content: 'Customize your profile, set your fitness goals, and track your achievements here.',
    target: '[data-tour="profile"]',
    position: 'left'
  },
  {
    id: 'messages',
    title: 'Messages',
    content: 'Connect with coaches and other users. Get personalized advice and stay motivated.',
    target: '[data-tour="messages"]',
    position: 'right'
  }
];

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  // Check if user has completed onboarding
  useEffect(() => {
    if (user) {
      const completed = localStorage.getItem(`onboarding_completed_${user.id}`);
      setHasCompletedOnboarding(!!completed);
    }
  }, [user]);

  // Auto-start onboarding for new users
  useEffect(() => {
    if (user && !hasCompletedOnboarding && !isActive) {
      // Delay to ensure page is fully loaded
      const timer = setTimeout(() => {
        setIsActive(true);
        setCurrentStep(0);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [user, hasCompletedOnboarding, isActive]);

  const startTour = () => {
    console.log("startTour called, setting isActive to true");
    setIsActive(true);
    setCurrentStep(0);
  };

  const nextStep = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTour = () => {
    setIsActive(false);
    if (user) {
      localStorage.setItem(`onboarding_completed_${user.id}`, 'true');
      setHasCompletedOnboarding(true);
    }
  };

  const completeTour = () => {
    setIsActive(false);
    if (user) {
      localStorage.setItem(`onboarding_completed_${user.id}`, 'true');
      setHasCompletedOnboarding(true);
    }
  };

  const isStepVisible = (stepId: string): boolean => {
    if (!isActive) return false;
    const step = ONBOARDING_STEPS.find(s => s.id === stepId);
    return step ? ONBOARDING_STEPS.indexOf(step) === currentStep : false;
  };

  const getCurrentStepForElement = (selector: string): OnboardingStep | null => {
    if (!isActive || currentStep >= ONBOARDING_STEPS.length) return null;
    const step = ONBOARDING_STEPS[currentStep];
    return step.target === selector ? step : null;
  };

  return (
    <OnboardingContext.Provider
      value={{
        isActive,
        currentStep,
        steps: ONBOARDING_STEPS,
        startTour,
        nextStep,
        prevStep,
        skipTour,
        completeTour,
        isStepVisible,
        getCurrentStepForElement,
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
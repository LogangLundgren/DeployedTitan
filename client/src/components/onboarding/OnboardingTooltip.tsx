import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/context/onboarding-context";
import { 
  LayoutDashboard, 
  Dumbbell, 
  Users, 
  ShoppingBag, 
  ClipboardList, 
  User 
} from "lucide-react";

interface StepContent {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export function OnboardingTooltip() {
  const { currentStep, nextStep, skipOnboarding } = useOnboarding();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (currentStep) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [currentStep]);

  const stepContent: Record<string, StepContent> = {
    dashboard: {
      title: "Dashboard",
      description: "Your personalized fitness hub showing your progress, recent workouts, and goals at a glance.",
      icon: <LayoutDashboard className="h-8 w-8 text-primary" />
    },
    workouts: {
      title: "Workouts",
      description: "Log your workouts, create new templates, and track your exercise progress over time.",
      icon: <Dumbbell className="h-8 w-8 text-primary" />
    },
    social: {
      title: "Social",
      description: "Connect with the fitness community, share your achievements, and follow other users' journeys.",
      icon: <Users className="h-8 w-8 text-primary" />
    },
    marketplace: {
      title: "Marketplace",
      description: "Discover and purchase workout plans created by professional coaches.",
      icon: <ShoppingBag className="h-8 w-8 text-primary" />
    },
    myplans: {
      title: "My Plans",
      description: "Access your purchased workout plans and coaching services in one place.",
      icon: <ClipboardList className="h-8 w-8 text-primary" />
    },
    profile: {
      title: "Profile",
      description: "Customize your profile, update your preferences, and manage your account settings.",
      icon: <User className="h-8 w-8 text-primary" />
    },
    finished: {
      title: "You're All Set!",
      description: "Enjoy your fitness journey with Titan Fitness. Start by exploring the dashboard or logging your first workout.",
      icon: <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary text-lg font-bold">✓</div>
    }
  };

  if (!currentStep) return null;

  const content = stepContent[currentStep];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-4 mb-2">
            {content.icon}
            <DialogTitle className="text-xl">{content.title}</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            {content.description}
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex sm:justify-between mt-4">
          <Button variant="outline" onClick={skipOnboarding}>
            Skip Tour
          </Button>
          <Button onClick={nextStep}>
            {currentStep === "finished" ? "Finish" : "Next"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
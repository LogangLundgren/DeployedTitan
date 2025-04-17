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
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";

export function WelcomeScreen() {
  const { startOnboarding, skipOnboarding } = useOnboarding();
  const { user } = useAuth();
  const [showWelcome, setShowWelcome] = useState(false);
  
  useEffect(() => {
    // Check if user is logged in and the welcome screen hasn't been shown before
    if (user && !localStorage.getItem("titan-fitness-onboarding-completed")) {
      // Set a session flag to indicate this is a new session
      if (!sessionStorage.getItem("session-started")) {
        sessionStorage.setItem("session-started", "true");
        setShowWelcome(true);
      }
    }
  }, [user]);
  
  // If not showing welcome or no user, don't render anything
  if (!showWelcome || !user) return null;

  const handleCloseDialog = () => {
    setShowWelcome(false);
  };

  return (
    <Dialog 
      open={showWelcome} 
      onOpenChange={(open) => {
        if (!open) {
          handleCloseDialog();
          skipOnboarding();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome to Titan Fitness!</DialogTitle>
          <DialogDescription className="text-base pt-2">
            We're excited to have you join our fitness community. Would you like a quick tour of the app to get started?
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col space-y-4 my-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary text-lg font-bold">1</div>
            <span>Explore features designed to elevate your fitness journey</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary text-lg font-bold">2</div>
            <span>Learn how to log workouts and track your progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary text-lg font-bold">3</div>
            <span>Connect with the fitness community</span>
          </div>
        </div>
        
        <DialogFooter className="flex sm:justify-between">
          <Button variant="outline" onClick={() => {
            handleCloseDialog();
            skipOnboarding();
          }}>
            Skip Tour
          </Button>
          <Button onClick={() => {
            handleCloseDialog();
            startOnboarding();
          }}>
            Take the Tour
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
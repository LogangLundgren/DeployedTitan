import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, ArrowLeft, ArrowRight, SkipForward } from "lucide-react";
import { useOnboarding } from "@/hooks/use-onboarding";

type TooltipPosition = {
  top: number;
  left: number;
  arrowPosition: 'top' | 'bottom' | 'left' | 'right';
};

export function OnboardingTooltip() {
  const { 
    isActive, 
    currentStep, 
    steps, 
    nextStep, 
    prevStep, 
    skipTour, 
    completeTour 
  } = useOnboarding();
  
  const [position, setPosition] = useState<TooltipPosition>({ top: 0, left: 0, arrowPosition: 'top' });
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const currentStepData = steps[currentStep];

  useEffect(() => {
    if (!isActive || !currentStepData) {
      setIsVisible(false);
      return;
    }

    const updatePosition = () => {
      const targetElement = document.querySelector(currentStepData.target);
      
      if (!targetElement || !tooltipRef.current) {
        setIsVisible(false);
        return;
      }

      const targetRect = targetElement.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      let top = 0;
      let left = 0;
      let arrowPosition: 'top' | 'bottom' | 'left' | 'right' = currentStepData.position;

      const offset = 20; // Space between tooltip and target
      const arrowSize = 12;

      switch (currentStepData.position) {
        case 'top':
          top = targetRect.top - tooltipRect.height - offset;
          left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
          arrowPosition = 'bottom';
          break;
        case 'bottom':
          top = targetRect.bottom + offset;
          left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
          arrowPosition = 'top';
          break;
        case 'left':
          top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
          left = targetRect.left - tooltipRect.width - offset;
          arrowPosition = 'right';
          break;
        case 'right':
          top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
          left = targetRect.right + offset;
          arrowPosition = 'left';
          break;
      }

      // Keep tooltip within viewport bounds
      if (left < 0) {
        left = 10;
      } else if (left + tooltipRect.width > windowWidth) {
        left = windowWidth - tooltipRect.width - 10;
      }

      if (top < 0) {
        top = 10;
        arrowPosition = 'top';
      } else if (top + tooltipRect.height > windowHeight) {
        top = windowHeight - tooltipRect.height - 10;
        arrowPosition = 'bottom';
      }

      setPosition({ top, left, arrowPosition });
      setIsVisible(true);

      // Add highlight to target element
      targetElement.classList.add('onboarding-highlight');
      
      // Scroll element into view if needed
      targetElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'center'
      });
    };

    // Delay to ensure DOM is ready
    const timer = setTimeout(updatePosition, 100);
    
    // Update position on window resize
    window.addEventListener('resize', updatePosition);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePosition);
      
      // Remove highlight from all elements
      document.querySelectorAll('.onboarding-highlight').forEach(el => {
        el.classList.remove('onboarding-highlight');
      });
    };
  }, [isActive, currentStep, currentStepData]);

  if (!isActive || !currentStepData || !isVisible) {
    return null;
  }

  const getArrowClasses = () => {
    const baseClasses = "absolute w-0 h-0 border-solid";
    
    switch (position.arrowPosition) {
      case 'top':
        return `${baseClasses} border-l-[12px] border-r-[12px] border-b-[12px] border-l-transparent border-r-transparent border-b-white -top-3 left-1/2 transform -translate-x-1/2`;
      case 'bottom':
        return `${baseClasses} border-l-[12px] border-r-[12px] border-t-[12px] border-l-transparent border-r-transparent border-t-white -bottom-3 left-1/2 transform -translate-x-1/2`;
      case 'left':
        return `${baseClasses} border-t-[12px] border-b-[12px] border-r-[12px] border-t-transparent border-b-transparent border-r-white -left-3 top-1/2 transform -translate-y-1/2`;
      case 'right':
        return `${baseClasses} border-t-[12px] border-b-[12px] border-l-[12px] border-t-transparent border-b-transparent border-l-white -right-3 top-1/2 transform -translate-y-1/2`;
      default:
        return '';
    }
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30 z-[9998] pointer-events-none" />
      
      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-[9999] w-80 max-w-sm"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
      >
        <Card className="shadow-lg border-2 border-primary/20 bg-white">
          <div className={getArrowClasses()} />
          
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">
                {currentStepData.title}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={skipTour}
                className="h-6 w-6 p-0 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <p className="text-sm text-gray-600 mb-4">
              {currentStepData.content}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                Step {currentStep + 1} of {steps.length}
              </div>
              
              <div className="flex items-center gap-2">
                {currentStep > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevStep}
                    className="h-8 px-3"
                  >
                    <ArrowLeft className="h-3 w-3 mr-1" />
                    Back
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={skipTour}
                  className="h-8 px-3"
                >
                  <SkipForward className="h-3 w-3 mr-1" />
                  Skip
                </Button>
                
                <Button
                  size="sm"
                  onClick={nextStep}
                  className="h-8 px-3"
                >
                  {currentStep === steps.length - 1 ? (
                    'Finish'
                  ) : (
                    <>
                      Next
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
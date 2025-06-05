import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RotateCcw, X } from "lucide-react";
import { useLocation } from "wouter";

interface StoredWorkoutData {
  workoutId?: number;
  workoutName: string;
  workoutDate: string;
  workoutNotes: string;
  exercises: any[];
  lastUpdated: number;
}

interface WorkoutRecoveryBannerProps {
  workoutData: StoredWorkoutData;
  onRestore: () => void;
  onDismiss: () => void;
}

export function WorkoutRecoveryBanner({ workoutData, onRestore, onDismiss }: WorkoutRecoveryBannerProps) {
  const [, setLocation] = useLocation();

  const handleRestore = () => {
    // Navigate to workout logger if not already there
    setLocation('/workout-logger');
    onRestore();
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m ago`;
    } else {
      return 'just now';
    }
  };

  return (
    <Alert className="border-orange-200 bg-orange-50 text-orange-800 mb-4">
      <RotateCcw className="h-4 w-4" />
      <AlertDescription className="flex justify-between items-center">
        <div className="flex-1">
          <div className="font-medium">Unsaved workout found</div>
          <div className="text-sm text-orange-600">
            "{workoutData.workoutName}" with {workoutData.exercises.length} exercises
            • Last saved {formatTime(workoutData.lastUpdated)}
          </div>
        </div>
        <div className="flex gap-2 ml-4">
          <Button onClick={handleRestore} size="sm" variant="outline" className="border-orange-300 hover:bg-orange-100">
            <RotateCcw className="h-3 w-3 mr-1" />
            Restore
          </Button>
          <Button onClick={onDismiss} size="sm" variant="ghost" className="hover:bg-orange-100">
            <X className="h-3 w-3" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
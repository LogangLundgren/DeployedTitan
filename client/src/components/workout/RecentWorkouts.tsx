import { useState } from "react";
import { format } from "date-fns";
import { WorkoutWithDetails } from "@shared/schema";
import { Link, useLocation } from "wouter";
import { Trash, MoreHorizontal, Calendar, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWorkoutDelete } from "@/hooks/use-workout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface RecentWorkoutsProps {
  workouts: WorkoutWithDetails[];
  isLoading: boolean;
  onDelete?: () => void;
}

export default function RecentWorkouts({ workouts, isLoading, onDelete }: RecentWorkoutsProps) {
  const [workoutToDelete, setWorkoutToDelete] = useState<WorkoutWithDetails | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { deleteWorkout, isDeleting } = useWorkoutDelete();
  
  const handleDeleteWorkout = async () => {
    if (!workoutToDelete) return;
    
    const success = await deleteWorkout(workoutToDelete);
    
    if (success && onDelete) {
      // Call the onDelete callback to refresh the workout list
      onDelete();
    }
    
    // Always close the dialog and reset state
    setWorkoutToDelete(null);
    setIsDeleteDialogOpen(false);
  };
  if (isLoading) {
    return (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="h-5 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="flex justify-between">
                <div className="w-1/3">
                  <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                  <div className="h-5 bg-gray-200 rounded w-10"></div>
                </div>
                <div className="w-1/3">
                  <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                  <div className="h-5 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="w-1/3">
                  <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                  <div className="h-5 bg-gray-200 rounded w-8"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (workouts.length === 0) {
    return (
      <div>
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="48" 
            height="48" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="mx-auto mb-4 text-gray-300"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <p className="text-gray-500 mb-4">You haven't logged any workouts yet.</p>
          <Link href="/workouts">
            <button className="inline-flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Log Your First Workout
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workouts.map((workout) => {
          // Safely format the date by handling both string and Date formats
          let dateDisplay;
          try {
            dateDisplay = format(new Date(workout.date), "MMMM d, yyyy");
          } catch (error) {
            dateDisplay = String(workout.date);
          }
          
          return (
            <div key={workout.id}>
              <div className="group bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <div 
                    className="cursor-pointer" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation(`/workouts/${workout.id}`);
                    }}
                  >
                    <h4 className="font-semibold text-gray-800 group-hover:text-primary transition-colors">{workout.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <p className="text-sm text-gray-500">
                        {dateDisplay}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`
                      px-2 py-1 rounded-full text-xs font-medium
                      ${workout.category === 'Strength' ? 'bg-orange-500/10 text-orange-600' : 
                        workout.category === 'Hypertrophy' ? 'bg-green-500/10 text-green-600' : 
                        workout.category === 'HIIT' ? 'bg-yellow-500/10 text-yellow-600' : 
                        'bg-primary/10 text-primary'}
                    `}>
                      {workout.category || 'Workout'}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 border border-gray-200 bg-white hover:bg-gray-50"
                        >
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[160px]">
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocation(`/workouts/${workout.id}`);
                          }}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600 focus:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            setWorkoutToDelete(workout);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mt-2 bg-gray-50 p-3 rounded-md">
                  <div className="flex flex-col items-center text-center p-2">
                    <div className="flex items-center justify-center bg-white w-10 h-10 rounded-full shadow-sm mb-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                    </div>
                    <p className="text-xs text-gray-500 mb-1">Duration</p>
                    <p className="font-medium text-sm">{workout.duration || '—'} min</p>
                  </div>
                  <div className="flex flex-col items-center text-center p-2">
                    <div className="flex items-center justify-center bg-white w-10 h-10 rounded-full shadow-sm mb-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                        <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                        <line x1="6" y1="1" x2="6" y2="4"></line>
                        <line x1="10" y1="1" x2="10" y2="4"></line>
                        <line x1="14" y1="1" x2="14" y2="4"></line>
                      </svg>
                    </div>
                    <p className="text-xs text-gray-500 mb-1">Volume</p>
                    <p className="font-medium text-sm">
                      {workout.volume > 0 
                        ? workout.volume > 1000 
                          ? `${(workout.volume / 1000).toFixed(1)}k lbs` 
                          : `${workout.volume} lbs` 
                        : '—'}
                    </p>
                  </div>
                  <div className="flex flex-col items-center text-center p-2">
                    <div className="flex items-center justify-center bg-white w-10 h-10 rounded-full shadow-sm mb-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                      </svg>
                    </div>
                    <p className="text-xs text-gray-500 mb-1">Exercises</p>
                    <p className="font-medium text-sm">{workout.totalExercises || '—'}</p>
                  </div>
                </div>
                
                <div className="mt-4 text-xs text-right">
                  <span className="text-primary group-hover:underline">View details →</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Workout</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{workoutToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteWorkout}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Deleting...
                </>
              ) : (
                <>Delete</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

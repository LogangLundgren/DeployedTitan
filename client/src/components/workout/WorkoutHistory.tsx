import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { WorkoutWithDetails } from "@shared/schema";
import { format } from "date-fns";
import { Search, Calendar, Filter, ChevronRight, Edit, Trash, Dumbbell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useWorkoutDelete } from "@/hooks/use-workout";

interface WorkoutHistoryProps {
  userId: number;
  onViewWorkout?: (workout: WorkoutWithDetails) => void;
}

export default function WorkoutHistory({ userId, onViewWorkout }: WorkoutHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [workoutToDelete, setWorkoutToDelete] = useState<WorkoutWithDetails | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const { deleteWorkout, isDeleting } = useWorkoutDelete();
  
  const { 
    data: workouts, 
    isLoading, 
    isError, 
    refetch 
  } = useQuery<WorkoutWithDetails[]>({
    queryKey: ['/api/workouts', userId],
    queryFn: async () => {
      const res = await fetch(`/api/workouts?userId=${userId}`);
      if (!res.ok) throw new Error('Failed to fetch workouts');
      return res.json();
    }
  });
  
  const { data: categories } = useQuery<string[]>({
    queryKey: ['/api/workouts/categories', userId],
    queryFn: async () => {
      try {
        // This is a computed list from workouts since there's no dedicated categories endpoint
        if (workouts) {
          const categories = Array.from(new Set(
            workouts
              .map(w => w.category)
              .filter(Boolean) as string[]
          ));
          return categories;
        }
        return [];
      } catch (error) {
        console.error('Error processing categories:', error);
        return [];
      }
    },
    enabled: !!workouts
  });
  
  async function handleDeleteWorkout() {
    if (!workoutToDelete) return;
    
    const success = await deleteWorkout(workoutToDelete);
    if (success) {
      refetch(); // Refresh the workout list in this component
    }
    
    // Always close the dialog and reset state
    setWorkoutToDelete(null);
    setIsDeleteDialogOpen(false);
  }
  
  // Filter workouts by search term and category
  const filteredWorkouts = workouts?.filter(workout => {
    const matchesSearch = searchTerm === "" || 
      workout.name.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesCategory = !categoryFilter || categoryFilter === "all" || 
      workout.category === categoryFilter;
      
    return matchesSearch && matchesCategory;
  }) || [];
  
  // Sort workouts by date (newest first)
  const sortedWorkouts = [...filteredWorkouts].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  
  // Group workouts by month and year
  const groupedWorkouts = sortedWorkouts.reduce<Record<string, WorkoutWithDetails[]>>((groups, workout) => {
    const date = new Date(workout.date);
    const monthYear = format(date, 'MMMM yyyy');
    
    if (!groups[monthYear]) {
      groups[monthYear] = [];
    }
    
    groups[monthYear].push(workout);
    return groups;
  }, {});
  
  if (isError) {
    return (
      <div className="p-6 text-center">
        <h3 className="text-lg font-medium text-red-500 mb-2">Error Loading Workouts</h3>
        <p className="text-gray-500 mb-4">There was a problem fetching your workout history.</p>
        <Button onClick={() => refetch()} variant="outline">Try Again</Button>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-[250px]" />
          <Skeleton className="h-10 w-[120px]" />
        </div>
        {[1, 2, 3].map(i => (
          <Card key={i} className="mb-4">
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-[180px] mb-2" />
              <Skeleton className="h-4 w-[120px]" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  if (filteredWorkouts.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center mb-6 gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search workouts..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {categories && categories.length > 0 && (
            <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="All categories" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Categories</SelectLabel>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        </div>
        
        <div className="flex items-center justify-center p-12 min-h-[300px]">
          <div className="text-center max-w-md">
            <Dumbbell className="mx-auto mb-4 text-gray-300 h-12 w-12" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No workouts found</h3>
            {searchTerm || categoryFilter !== "all" ? (
              <p className="text-gray-500 mb-4">
                No workouts match your search criteria. Try adjusting your filters.
              </p>
            ) : (
              <p className="text-gray-500 mb-4">
                You haven't logged any workouts yet. Start tracking your progress by logging your first workout.
              </p>
            )}
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setCategoryFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="flex items-center mb-6 gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search workouts..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {categories && categories.length > 0 && (
          <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value)}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <SelectValue placeholder="All categories" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Categories</SelectLabel>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        )}
      </div>
      
      <div className="space-y-8">
        {Object.entries(groupedWorkouts).map(([monthYear, monthWorkouts]) => (
          <div key={monthYear} className="space-y-4">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-primary" />
              <h3 className="text-lg font-medium">{monthYear}</h3>
            </div>
            
            <div className="space-y-4">
              {monthWorkouts.map(workout => {
                const workoutDate = new Date(workout.date);
                
                return (
                  <Card key={workout.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{workout.name}</CardTitle>
                          <CardDescription>
                            {format(workoutDate, 'EEEE, MMMM d, yyyy')}
                          </CardDescription>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8 border border-gray-200 bg-white hover:bg-gray-50"
                            >
                              <span className="sr-only">Open menu</span>
                              <svg width="20" height="20" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                              </svg>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[160px]">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onViewWorkout?.(workout)}>
                              <Edit className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => {
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
                      
                      {workout.category && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {workout.category}
                        </Badge>
                      )}
                    </CardHeader>
                    
                    <CardContent className="pb-0">
                      <div className="space-y-2">
                        {workout.exercises.map(exercise => (
                          <div key={exercise.id} className="flex items-center justify-between p-3 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{exercise.exerciseDetails.name}</div>
                              <div className="text-xs text-gray-500">
                                {exercise.sets.length} sets · {exercise.exerciseDetails.category}
                              </div>
                            </div>
                            <div className="text-sm text-gray-600">
                              {exercise.sets.map((set, i) => (
                                <span key={set.id}>
                                  {i > 0 && ' | '}
                                  {set.weight ? `${set.weight}kg` : '-'}
                                  {' × '}
                                  {set.reps || '-'}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                    
                    <CardFooter className="flex justify-between p-4 text-sm">
                      <div className="flex items-center gap-4">
                        <div className="text-gray-500">
                          <span className="font-medium">{workout.totalExercises}</span> exercises
                        </div>
                        <div className="text-gray-500">
                          <span className="font-medium">{workout.totalSets}</span> sets
                        </div>
                        <div className="text-gray-500">
                          <span className="font-medium">{workout.volume}</span> kg total
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="gap-1 h-8"
                        onClick={() => onViewWorkout?.(workout)}
                      >
                        Details
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      
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
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteWorkout}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
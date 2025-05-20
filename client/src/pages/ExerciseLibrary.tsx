import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import CustomExerciseModal from '@/components/workout/CustomExerciseModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/use-auth';
import { Dumbbell, Plus, Trash2, Search, AlertTriangle, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Exercise } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

export default function ExerciseLibrary() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Fetch all exercises
  const { data: exercisesResponse, isLoading: isLoadingExercises } = useQuery({
    queryKey: ['/api/exercises'],
    queryFn: async () => {
      const response = await fetch('/api/exercises', {
        credentials: 'include'
      });
      return await response.json();
    },
    enabled: !!user
  });
  
  // Ensure exercises is always an array even if API returns invalid data
  const exercises = Array.isArray(exercisesResponse) ? exercisesResponse : [];
  
  // Fetch user's hidden exercises
  const { data: hiddenExercisesData } = useQuery({
    queryKey: ['/api/exercises/hidden'],
    queryFn: async () => {
      const response = await fetch('/api/exercises/hidden', {
        credentials: 'include'
      });
      return await response.json();
    },
    enabled: !!user
  });
  
  const hiddenExerciseIds = hiddenExercisesData?.hiddenExerciseIds || [];

  // We no longer need to separate standard and custom exercises as we're showing them all together

  // Get unique categories for filtering
  const categories = [...new Set(exercises.map(exercise => exercise.category))].sort();

  // Mutation for deleting custom exercises
  const deleteExerciseMutation = useMutation({
    mutationFn: async (exerciseId: number) => {
      const res = await apiRequest("DELETE", `/api/exercises/${exerciseId}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete exercise");
      }
      return exerciseId;
    },
    onSuccess: () => {
      toast({
        title: "Exercise deleted",
        description: "The exercise has been removed from your library.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/exercises'] });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete exercise: ${error.message}`,
        variant: "destructive",
      });
      setIsDeleteDialogOpen(false);
    },
  });
  
  // Mutation for hiding global exercises from user's library
  const hideExerciseMutation = useMutation({
    mutationFn: async (exerciseId: number) => {
      const res = await apiRequest("POST", `/api/exercises/${exerciseId}/hide`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to hide exercise");
      }
      return exerciseId;
    },
    onSuccess: () => {
      toast({
        title: "Exercise hidden",
        description: "The exercise has been hidden from your library.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/exercises'] });
      queryClient.invalidateQueries({ queryKey: ['/api/exercises/hidden'] });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to hide exercise: ${error.message}`,
        variant: "destructive",
      });
      setIsDeleteDialogOpen(false);
    },
  });

  const handleDeleteClick = (exercise: Exercise) => {
    setExerciseToDelete(exercise);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (exerciseToDelete) {
      // If it's a custom exercise, delete it
      // If it's a global exercise, hide it from the user's library
      if (exerciseToDelete.userId !== null) {
        deleteExerciseMutation.mutate(exerciseToDelete.id);
      } else {
        hideExerciseMutation.mutate(exerciseToDelete.id);
      }
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFilterCategory('all');
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Exercise Library</h1>
          <p className="text-muted-foreground mt-1">
            Browse standard exercises and manage your custom exercises
          </p>
        </div>
        <CustomExerciseModal 
          onExerciseCreated={() => {
            toast({
              title: "Exercise created",
              description: "Your custom exercise has been added to your library.",
            });
            queryClient.invalidateQueries({ queryKey: ['/api/exercises'] });
          }} 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchQuery('')}
              >
                <X size={16} />
              </Button>
            )}
          </div>
        </div>
        <div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {(searchQuery || filterCategory !== 'all') && (
        <div className="flex items-center mb-4 gap-2">
          <p className="text-sm text-muted-foreground">
            {searchQuery && <Badge variant="outline" className="mr-2">{`Search: ${searchQuery}`}</Badge>}
            {filterCategory !== 'all' && <Badge variant="outline">{`Category: ${filterCategory}`}</Badge>}
          </p>
          <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7">
            Clear Filters
          </Button>
        </div>
      )}

      <div className="mt-4">
        {isLoadingExercises ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin mr-2">
              <Dumbbell size={24} />
            </div>
            <span>Loading exercises...</span>
          </div>
        ) : exercises.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exercises
              // Filter out hidden exercises
              .filter(exercise => !hiddenExerciseIds.includes(exercise.id))
              // Apply search and category filters
              .filter(exercise => 
                (searchQuery === '' || 
                  exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  exercise.category.toLowerCase().includes(searchQuery.toLowerCase())
                ) &&
                (filterCategory === 'all' || exercise.category === filterCategory)
              )
              .map((exercise) => (
                <Card key={exercise.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{exercise.name}</CardTitle>
                        <CardDescription>
                          {exercise.category}
                          {exercise.subcategory && ` • ${exercise.subcategory}`}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(exercise)}
                        className="h-8 w-8 text-destructive"
                        title={exercise.userId !== null ? "Delete exercise" : "Hide exercise"}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      {exercise.userId !== null 
                        ? "Custom exercise" 
                        : "Global exercise"}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        ) : (
          <div className="text-center py-16 border border-dashed rounded-lg">
            <Dumbbell className="mx-auto h-12 w-12 mb-4 text-muted-foreground" />
            <h3 className="font-medium text-lg mb-2">No exercises found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || filterCategory !== 'all' 
                ? "Try adjusting your search filters" 
                : "Your exercise library is empty"}
            </p>
            {(searchQuery || filterCategory !== 'all') ? (
              <Button variant="outline" onClick={resetFilters}>
                Clear Filters
              </Button>
            ) : (
              <CustomExerciseModal 
                buttonVariant="default"
                onExerciseCreated={() => {
                  toast({
                    title: "Exercise created",
                    description: "Your custom exercise has been added to your library.",
                  });
                  queryClient.invalidateQueries({ queryKey: ['/api/exercises'] });
                }} 
              />
            )}
          </div>
        )}
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {exerciseToDelete?.userId !== null ? "Delete Exercise" : "Hide Exercise"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {exerciseToDelete?.userId !== null ? (
                <>
                  Are you sure you want to delete &quot;{exerciseToDelete?.name}&quot;? 
                  This will permanently remove it from your exercise library.
                </>
              ) : (
                <>
                  Are you sure you want to hide &quot;{exerciseToDelete?.name}&quot;? 
                  This will remove it from your personal exercise library, but it will remain 
                  in the global library for other users.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteExerciseMutation.isPending || hideExerciseMutation.isPending}
            >
              {deleteExerciseMutation.isPending || hideExerciseMutation.isPending ? 
                "Processing..." : 
                exerciseToDelete?.userId !== null ? "Delete Exercise" : "Hide Exercise"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
import { useState } from "react";
import { Exercise } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dumbbell, Trash2, AlertTriangle, ListFilter } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ManageExercisesModalProps {
  exercises: Exercise[];
  onExerciseDeleted?: () => void;
}

export default function ManageExercisesModal({ exercises, onExerciseDeleted }: ManageExercisesModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Filter exercises to only show custom exercises belonging to the current user
  const customExercises = exercises.filter(exercise => 
    (exercise.isCustom || exercise.userId === user?.id) && 
    (exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     exercise.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Mutation for deleting a custom exercise
  const deleteExerciseMutation = useMutation({
    mutationFn: async (exerciseId: number) => {
      const res = await apiRequest("DELETE", `/api/exercises/custom/${exerciseId}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete exercise");
      }
      return exerciseId;
    },
    onSuccess: () => {
      toast({
        title: "Exercise deleted",
        description: "The custom exercise has been removed from your library.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
      setIsDeleteDialogOpen(false);
      
      if (onExerciseDeleted) {
        onExerciseDeleted();
      }
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

  const handleDeleteClick = (exercise: Exercise) => {
    setExerciseToDelete(exercise);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (exerciseToDelete) {
      deleteExerciseMutation.mutate(exerciseToDelete.id);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="secondary" size="sm" className="flex items-center gap-2">
            <ListFilter className="h-4 w-4" />
            Manage Exercises
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Custom Exercises</DialogTitle>
            <DialogDescription>
              View and delete custom exercises from your personal exercise library.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Input
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-4"
            />
            
            <div className="max-h-[300px] overflow-y-auto">
              {customExercises.length > 0 ? (
                <div className="space-y-2">
                  {customExercises.map((exercise) => (
                    <div
                      key={exercise.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-md"
                    >
                      <div>
                        <div className="font-medium">{exercise.name}</div>
                        <div className="text-sm text-muted-foreground">{exercise.category}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(exercise)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery
                    ? "No custom exercises match your search"
                    : "You haven't created any custom exercises yet"}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Exercise
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{exerciseToDelete?.name}&quot;? 
              This will permanently remove it from your exercise library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteExerciseMutation.isPending}
            >
              {deleteExerciseMutation.isPending ? "Deleting..." : "Delete Exercise"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
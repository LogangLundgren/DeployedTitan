import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { ArrowLeft, Trash2, Plus, Edit, Loader2, GripVertical, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

// Exercise form schema
const exerciseFormSchema = z.object({
  exerciseId: z.number(),
  templateId: z.number(),
  order: z.number().int().min(0),
  defaultSets: z.number().int().min(1).optional().nullable(),
  defaultReps: z.number().int().min(1).optional().nullable(),
  defaultWeight: z.number().min(0).optional().nullable(),
  notes: z.string().optional().nullable()
});

type ExerciseFormValues = z.infer<typeof exerciseFormSchema>;

// Define types
interface Exercise {
  id: number;
  name: string;
  category: string;
  subcategory: string | null;
}

interface TemplateExercise {
  id: number;
  templateId: number;
  exerciseId: number;
  order: number;
  defaultSets: number | null;
  defaultReps: number | null;
  defaultWeight: number | null;
  notes: string | null;
  exerciseDetails: Exercise;
}

interface Template {
  id: number;
  name: string;
  description: string | null;
  userId: number;
  category: string | null;
  createdAt: string;
}

interface TemplateWithExercises extends Template {
  exercises: TemplateExercise[];
}

// Temporary user ID until we implement authentication
const DEMO_USER_ID = 1;

export default function TemplateDetail() {
  const { id } = useParams<{ id: string }>();
  const templateId = parseInt(id);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddExerciseDialogOpen, setIsAddExerciseDialogOpen] = useState(false);
  const [isEditExerciseDialogOpen, setIsEditExerciseDialogOpen] = useState(false);
  const [isDeleteExerciseDialogOpen, setIsDeleteExerciseDialogOpen] = useState(false);
  const [isDeleteTemplateDialogOpen, setIsDeleteTemplateDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<TemplateExercise | null>(null);
  const [exercises, setExercises] = useState<TemplateExercise[]>([]);
  const [reordering, setReordering] = useState(false);

  // Fetch template details
  const { data: template, isLoading: isLoadingTemplate } = useQuery({
    queryKey: ['/api/templates', templateId],
    queryFn: async () => {
      return await apiRequest<TemplateWithExercises>(`/api/templates/${templateId}`);
    },
    enabled: !isNaN(templateId)
  });

  // Fetch all available exercises
  const { data: allExercises, isLoading: isLoadingExercises } = useQuery({
    queryKey: ['/api/exercises'],
    queryFn: async () => {
      return await apiRequest<Exercise[]>('/api/exercises');
    }
  });

  // Set exercises state when template data is loaded
  useEffect(() => {
    if (template?.exercises) {
      setExercises(template.exercises);
    }
  }, [template]);

  // Add exercise mutation
  const addExerciseMutation = useMutation({
    mutationFn: async (values: ExerciseFormValues) => {
      return await apiRequest<TemplateExercise>('/api/template-exercises', {
        method: 'POST',
        body: JSON.stringify(values),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },
    onSuccess: () => {
      toast({
        title: 'Exercise added',
        description: 'The exercise has been added to your template.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/templates', templateId] });
      setIsAddExerciseDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to add exercise: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Update exercise mutation
  const updateExerciseMutation = useMutation({
    mutationFn: async ({ id, values }: { id: number; values: Partial<TemplateExercise> }) => {
      return await apiRequest<TemplateExercise>(`/api/template-exercises/${id}`, {
        method: 'PUT',
        body: JSON.stringify(values),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },
    onSuccess: () => {
      toast({
        title: 'Exercise updated',
        description: 'The exercise has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/templates', templateId] });
      setIsEditExerciseDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update exercise: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Delete exercise mutation
  const deleteExerciseMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/template-exercises/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: 'Exercise removed',
        description: 'The exercise has been removed from the template.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/templates', templateId] });
      setIsDeleteExerciseDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to remove exercise: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async () => {
      setIsDeleting(true);
      return await apiRequest(`/api/templates/${templateId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: 'Template deleted',
        description: 'The workout template has been deleted successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      // Navigate back to templates page
      window.location.href = '/workouts?tab=templates';
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete template: ${error.message}`,
        variant: 'destructive',
      });
      setIsDeleting(false);
    },
    onSettled: () => {
      setIsDeleteTemplateDialogOpen(false);
      setIsDeleting(false);
    }
  });

  // Batch update exercises for reordering
  const updateExercisesOrder = async () => {
    try {
      // Update each exercise with new order
      await Promise.all(
        exercises.map((exercise, index) => 
          updateExerciseMutation.mutateAsync({ 
            id: exercise.id, 
            values: { order: index } 
          })
        )
      );
      
      toast({
        title: 'Order updated',
        description: 'Exercise order has been saved successfully.',
      });
      
      setReordering(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update exercise order.',
        variant: 'destructive',
      });
    }
  };

  // Form for adding a new exercise
  const addExerciseForm = useForm<ExerciseFormValues>({
    resolver: zodResolver(exerciseFormSchema),
    defaultValues: {
      exerciseId: 0,
      templateId: templateId,
      order: template?.exercises?.length || 0,
      defaultSets: 3,
      defaultReps: 10,
      defaultWeight: null,
      notes: null
    }
  });

  // Form for editing an existing exercise
  const editExerciseForm = useForm<ExerciseFormValues>({
    resolver: zodResolver(exerciseFormSchema),
    defaultValues: {
      exerciseId: 0,
      templateId: templateId,
      order: 0,
      defaultSets: null,
      defaultReps: null,
      defaultWeight: null,
      notes: null
    }
  });

  // Reset edit form when selected exercise changes
  useEffect(() => {
    if (selectedExercise) {
      editExerciseForm.reset({
        exerciseId: selectedExercise.exerciseId,
        templateId: selectedExercise.templateId,
        order: selectedExercise.order,
        defaultSets: selectedExercise.defaultSets,
        defaultReps: selectedExercise.defaultReps,
        defaultWeight: selectedExercise.defaultWeight,
        notes: selectedExercise.notes
      });
    }
  }, [selectedExercise, editExerciseForm]);

  // Handle adding a new exercise
  const onAddExercise = (values: ExerciseFormValues) => {
    addExerciseMutation.mutate(values);
  };

  // Handle editing an exercise
  const onEditExercise = (values: ExerciseFormValues) => {
    if (selectedExercise) {
      console.log('Editing exercise with values:', values);
      
      // Always include these fields in the update data, even if null
      const updateData: Partial<TemplateExercise> = {
        defaultSets: values.defaultSets,
        defaultReps: values.defaultReps,
        defaultWeight: values.defaultWeight,
        notes: values.notes
      };
      
      console.log('Update data:', updateData);
      
      updateExerciseMutation.mutate({ 
        id: selectedExercise.id, 
        values: updateData
      });
    }
  };

  // Handle deleting an exercise
  const onDeleteExercise = () => {
    if (selectedExercise) {
      deleteExerciseMutation.mutate(selectedExercise.id);
    }
  };

  // Move exercise up in order
  const moveExerciseUp = (index: number) => {
    if (index === 0) return;
    const newExercises = [...exercises];
    [newExercises[index - 1], newExercises[index]] = [newExercises[index], newExercises[index - 1]];
    setExercises(newExercises);
  };

  // Move exercise down in order
  const moveExerciseDown = (index: number) => {
    if (index === exercises.length - 1) return;
    const newExercises = [...exercises];
    [newExercises[index], newExercises[index + 1]] = [newExercises[index + 1], newExercises[index]];
    setExercises(newExercises);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between mb-4">
        <Link href="/workouts?tab=templates">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Templates
          </Button>
        </Link>
        <Button 
          variant="destructive" 
          onClick={() => setIsDeleteTemplateDialogOpen(true)}
          disabled={isDeleting}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Template
        </Button>
      </div>

      {isLoadingTemplate ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading template...</span>
        </div>
      ) : template ? (
        <>
          <div className="mb-6">
            <h1 className="text-3xl font-bold">{template.name}</h1>
            {template.description && (
              <p className="text-muted-foreground mt-1">{template.description}</p>
            )}
            <div className="flex mt-2">
              {template.category && (
                <Badge variant="secondary" className="mr-2">
                  {template.category}
                </Badge>
              )}
              <Badge variant="outline">
                {template.exercises.length} exercise{template.exercises.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Exercises</h2>
            <div className="flex gap-2">
              {reordering ? (
                <>
                  <Button onClick={updateExercisesOrder} disabled={updateExerciseMutation.isPending}>
                    {updateExerciseMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Order
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setExercises(template.exercises);
                    setReordering(false);
                  }}>
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Dialog open={isAddExerciseDialogOpen} onOpenChange={setIsAddExerciseDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Exercise
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Exercise to Template</DialogTitle>
                        <DialogDescription>
                          Select an exercise and set default values for sets and reps.
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...addExerciseForm}>
                        <form onSubmit={addExerciseForm.handleSubmit(onAddExercise)} className="space-y-4">
                          <FormField
                            control={addExerciseForm.control}
                            name="exerciseId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Exercise</FormLabel>
                                <Select 
                                  onValueChange={(value) => field.onChange(parseInt(value))} 
                                  defaultValue={field.value.toString()}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select an exercise" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {allExercises?.map((exercise) => (
                                      <SelectItem 
                                        key={exercise.id} 
                                        value={exercise.id.toString()}
                                      >
                                        {exercise.name} - {exercise.category}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="grid grid-cols-3 gap-4">
                            <FormField
                              control={addExerciseForm.control}
                              name="defaultSets"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Default Sets</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      {...field}
                                      value={field.value === null ? '' : field.value}
                                      onChange={(e) => {
                                        const value = e.target.value === '' ? null : parseInt(e.target.value);
                                        field.onChange(value);
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={addExerciseForm.control}
                              name="defaultReps"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Default Reps</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      {...field}
                                      value={field.value === null ? '' : field.value}
                                      onChange={(e) => {
                                        const value = e.target.value === '' ? null : parseInt(e.target.value);
                                        field.onChange(value);
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={addExerciseForm.control}
                              name="defaultWeight"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Default Weight</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      {...field}
                                      value={field.value === null ? '' : field.value}
                                      onChange={(e) => {
                                        const value = e.target.value === '' ? null : parseFloat(e.target.value);
                                        field.onChange(value);
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={addExerciseForm.control}
                            name="notes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Notes</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    {...field} 
                                    value={field.value || ''}
                                    placeholder="Optional notes for this exercise..."
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <DialogFooter>
                            <Button 
                              type="submit" 
                              disabled={addExerciseMutation.isPending}
                            >
                              {addExerciseMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Add Exercise
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                  {exercises.length > 1 && (
                    <Button variant="outline" onClick={() => setReordering(true)}>
                      <GripVertical className="mr-2 h-4 w-4" />
                      Reorder
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {exercises.length > 0 ? (
            <div className="space-y-4">
              {exercises.map((exercise, index) => (
                <Card key={exercise.id}>
                  <CardHeader className="py-4 px-5">
                    <div className="flex justify-between items-center">
                      <CardTitle className="flex items-center">
                        {reordering && (
                          <div className="flex flex-col mr-3">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => moveExerciseUp(index)}
                              disabled={index === 0}
                              className="h-6 w-6"
                            >
                              <span>↑</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => moveExerciseDown(index)}
                              disabled={index === exercises.length - 1}
                              className="h-6 w-6"
                            >
                              <span>↓</span>
                            </Button>
                          </div>
                        )}
                        {reordering && <span className="mr-2">{index + 1}.</span>}
                        {exercise.exerciseDetails.name}
                      </CardTitle>
                      {!reordering && (
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                              setSelectedExercise(exercise);
                              setIsEditExerciseDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                              setSelectedExercise(exercise);
                              setIsDeleteExerciseDialogOpen(true);
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4 px-5">
                    <div className="flex flex-wrap gap-3">
                      <Badge variant="outline">
                        {exercise.exerciseDetails.category}
                      </Badge>
                      {exercise.exerciseDetails.subcategory && (
                        <Badge variant="outline">
                          {exercise.exerciseDetails.subcategory}
                        </Badge>
                      )}
                    </div>
                    <Separator className="my-3" />
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Default Sets</p>
                        <p>{exercise.defaultSets || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="font-medium">Default Reps</p>
                        <p>{exercise.defaultReps || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="font-medium">Default Weight</p>
                        <p>{exercise.defaultWeight ? `${exercise.defaultWeight} kg` : 'Not set'}</p>
                      </div>
                    </div>
                    {exercise.notes && (
                      <div className="mt-3">
                        <p className="font-medium text-sm">Notes</p>
                        <p className="text-sm text-muted-foreground">{exercise.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="bg-muted rounded-lg p-8 text-center">
              <h3 className="text-xl font-medium mb-2">No Exercises Added</h3>
              <p className="text-muted-foreground mb-6">
                This template doesn't have any exercises yet. Add some exercises to get started.
              </p>
              <Button onClick={() => setIsAddExerciseDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Exercise
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="bg-muted rounded-lg p-8 text-center">
          <h3 className="text-xl font-medium mb-2">Template Not Found</h3>
          <p className="text-muted-foreground mb-6">
            The template you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Link href="/workouts?tab=templates">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Templates
            </Button>
          </Link>
        </div>
      )}

      {/* Edit Exercise Dialog */}
      <Dialog open={isEditExerciseDialogOpen} onOpenChange={setIsEditExerciseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Exercise</DialogTitle>
            <DialogDescription>
              Update default values for this exercise.
            </DialogDescription>
          </DialogHeader>
          <Form {...editExerciseForm}>
            <form onSubmit={editExerciseForm.handleSubmit(onEditExercise)} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={editExerciseForm.control}
                  name="defaultSets"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Sets</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          value={field.value === null ? '' : field.value}
                          onChange={(e) => {
                            const value = e.target.value === '' ? null : parseInt(e.target.value);
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editExerciseForm.control}
                  name="defaultReps"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Reps</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          value={field.value === null ? '' : field.value}
                          onChange={(e) => {
                            const value = e.target.value === '' ? null : parseInt(e.target.value);
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editExerciseForm.control}
                  name="defaultWeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Weight</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          value={field.value === null ? '' : field.value}
                          onChange={(e) => {
                            const value = e.target.value === '' ? null : parseFloat(e.target.value);
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editExerciseForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        value={field.value || ''}
                        placeholder="Optional notes for this exercise..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={updateExerciseMutation.isPending}
                >
                  {updateExerciseMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Exercise Confirmation Dialog */}
      <Dialog open={isDeleteExerciseDialogOpen} onOpenChange={setIsDeleteExerciseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Exercise</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this exercise from the template? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-4 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteExerciseDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={onDeleteExercise}
              disabled={deleteExerciseMutation.isPending}
            >
              {deleteExerciseMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
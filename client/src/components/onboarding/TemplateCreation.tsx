import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const templateSchema = z.object({
  name: z.string().min(2, 'Template name must be at least 2 characters'),
  description: z.string().optional(),
  category: z.string().optional(),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

interface Exercise {
  id: number;
  name: string;
  category: string;
  subcategory: string | null;
  userId: number | null;
  isCustom: boolean;
}

interface TemplateExercise {
  exerciseId: number;
  exercise: Exercise;
  order: number;
  defaultSets: number;
  defaultReps: number;
  defaultWeight: number | null;
  notes: string | null;
}

interface TemplateCreationProps {
  onComplete: () => void;
}

export default function TemplateCreation({ onComplete }: TemplateCreationProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<TemplateExercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load all exercises
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const response = await fetch('/api/exercises');
        const data = await response.json();
        setExercises(data);
      } catch (error) {
        console.error('Error fetching exercises:', error);
        toast({
          title: 'Error',
          description: 'Failed to load exercises. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchExercises();
  }, [toast]);

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: 'My First Workout',
      description: '',
      category: 'strength',
    },
  });

  const handleAddExercise = (exerciseId: number) => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;

    const newOrder = selectedExercises.length;
    
    setSelectedExercises([
      ...selectedExercises,
      {
        exerciseId,
        exercise,
        order: newOrder,
        defaultSets: 3,
        defaultReps: 10,
        defaultWeight: null,
        notes: null,
      }
    ]);
  };

  const handleRemoveExercise = (index: number) => {
    const updated = [...selectedExercises];
    updated.splice(index, 1);
    
    // Update order for remaining exercises
    const reordered = updated.map((ex, idx) => ({
      ...ex,
      order: idx,
    }));
    
    setSelectedExercises(reordered);
  };

  const handleExerciseChange = (index: number, field: string, value: any) => {
    const updated = [...selectedExercises];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setSelectedExercises(updated);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(selectedExercises);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update order values
    const reordered = items.map((item, index) => ({
      ...item,
      order: index,
    }));
    
    setSelectedExercises(reordered);
  };

  const onSubmit = async (data: TemplateFormValues) => {
    if (selectedExercises.length === 0) {
      toast({
        title: 'No exercises added',
        description: 'Please add at least one exercise to your template',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Create the template
      const templateResponse = await apiRequest('POST', '/api/templates', {
        ...data,
        userId: user?.id,
      });
      
      const templateData = await templateResponse.json();
      const templateId = templateData.id;
      
      // Add exercises to the template
      const exercisesData = selectedExercises.map(ex => ({
        templateId,
        exerciseId: ex.exerciseId,
        order: ex.order,
        defaultSets: ex.defaultSets,
        defaultReps: ex.defaultReps,
        defaultWeight: ex.defaultWeight,
        notes: ex.notes,
      }));
      
      await apiRequest('POST', `/api/templates/${templateId}/exercises`, exercisesData);
      
      // Update the onboarding step
      await apiRequest('POST', '/api/user/update-onboarding-step', { 
        step: 'marketplace_intro' 
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      
      toast({
        title: 'Template created!',
        description: 'Your workout template has been saved successfully.',
        variant: 'default',
      });
      
      onComplete();
    } catch (error: any) {
      console.error('Error creating template:', error);
      toast({
        title: 'Error creating template',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    { value: 'strength', label: 'Strength' },
    { value: 'hypertrophy', label: 'Hypertrophy' },
    { value: 'cardio', label: 'Cardio' },
    { value: 'endurance', label: 'Endurance' },
    { value: 'full_body', label: 'Full Body' },
    { value: 'upper_body', label: 'Upper Body' },
    { value: 'lower_body', label: 'Lower Body' },
    { value: 'push', label: 'Push' },
    { value: 'pull', label: 'Pull' },
    { value: 'legs', label: 'Legs' },
  ];

  // Group exercises by category for easier selection
  const exercisesByCategory = exercises.reduce((acc, exercise) => {
    if (!acc[exercise.category]) {
      acc[exercise.category] = [];
    }
    acc[exercise.category].push(exercise);
    return acc;
  }, {} as Record<string, Exercise[]>);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-80">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Create Your First Workout Template</CardTitle>
        <CardDescription>
          Design a workout template that you can use to track your progress
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Push Day Workout" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Categorize your workout for easier organization
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your workout template"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Exercise Selection */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Add Exercises</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Select exercises to add to your template. You'll be able to adjust sets, reps, and weights.
                </p>

                <div className="border rounded-md p-4 space-y-4">
                  <Select 
                    onValueChange={(value) => handleAddExercise(parseInt(value))}
                    value=""
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an exercise to add" />
                    </SelectTrigger>
                    <SelectContent className="max-h-80">
                      {Object.entries(exercisesByCategory).map(([category, exs]) => (
                        <div key={category} className="mb-2">
                          <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </div>
                          {exs.map((exercise) => (
                            <SelectItem key={exercise.id} value={exercise.id.toString()}>
                              {exercise.name}
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Selected Exercises List */}
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Selected Exercises:</h4>
                    
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <Droppable droppableId="exercises">
                        {(provided) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="space-y-2"
                          >
                            {selectedExercises.length === 0 ? (
                              <div className="text-center py-4 border border-dashed rounded-md">
                                <p className="text-muted-foreground">No exercises added yet</p>
                              </div>
                            ) : (
                              selectedExercises.map((ex, index) => (
                                <Draggable key={index} draggableId={`exercise-${index}`} index={index}>
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className="border rounded-md p-3 bg-card"
                                    >
                                      <div className="flex justify-between items-center mb-2">
                                        <div className="font-medium">{ex.exercise.name}</div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleRemoveExercise(index)}
                                        >
                                          <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                      </div>
                                      
                                      <div className="grid grid-cols-3 gap-2">
                                        <div>
                                          <label className="text-xs">Sets</label>
                                          <Input
                                            type="number"
                                            min={1}
                                            value={ex.defaultSets}
                                            onChange={(e) => handleExerciseChange(index, 'defaultSets', parseInt(e.target.value))}
                                            className="h-8"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-xs">Reps</label>
                                          <Input
                                            type="number"
                                            min={1}
                                            value={ex.defaultReps}
                                            onChange={(e) => handleExerciseChange(index, 'defaultReps', parseInt(e.target.value))}
                                            className="h-8"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-xs">Weight</label>
                                          <Input
                                            type="number"
                                            min={0}
                                            step={2.5}
                                            value={ex.defaultWeight || ''}
                                            onChange={(e) => handleExerciseChange(index, 'defaultWeight', e.target.value ? parseFloat(e.target.value) : null)}
                                            placeholder="Optional"
                                            className="h-8"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))
                            )}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </div>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Template...
                </>
              ) : (
                'Create Template'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Loader2 } from 'lucide-react';

// Form validation schema
const exerciseFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required')
});

// Form typed values
type ExerciseFormValues = z.infer<typeof exerciseFormSchema>;

// Exercise categories matching the body parts in our system
const exerciseCategories = [
  'Arms',
  'Back',
  'Chest',
  'Core',
  'Full Body',
  'Legs',
  'Shoulders',
  'Triceps'
];

interface CustomExerciseModalProps {
  onExerciseCreated?: () => void;
  buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | null | undefined;
}

export default function CustomExerciseModal({ 
  onExerciseCreated,
  buttonVariant = "outline" 
}: CustomExerciseModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  // Form for creating a custom exercise
  const form = useForm<ExerciseFormValues>({
    resolver: zodResolver(exerciseFormSchema),
    defaultValues: {
      name: '',
      category: ''
    }
  });

  // Mutation to create custom exercise
  const createExerciseMutation = useMutation({
    mutationFn: async (values: ExerciseFormValues) => {
      const res = await fetch('/api/exercises/custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          userId: user?.id
        }),
        credentials: 'include'
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create custom exercise');
      }
      
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate exercises query to refresh list
      queryClient.invalidateQueries({ queryKey: ['/api/exercises'] });
      
      // Show success message
      toast({
        title: 'Custom exercise created',
        description: 'Your custom exercise has been added to your library.',
      });
      
      // Close modal and reset form
      setOpen(false);
      form.reset();
      
      // Call callback if provided
      if (onExerciseCreated) {
        onExerciseCreated();
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create exercise',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Handler for form submission
  const onSubmit = (values: ExerciseFormValues) => {
    createExerciseMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={buttonVariant}>
          <Plus className="mr-2 h-4 w-4" />
          Custom Exercise
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Custom Exercise</DialogTitle>
          <DialogDescription>
            Add a custom exercise to your personal exercise library.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exercise Name</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g., Barbell Hip Thrust" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter a descriptive name for your exercise.
                  </FormDescription>
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {exerciseCategories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The primary muscle group this exercise targets.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={createExerciseMutation.isPending}
              >
                {createExerciseMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Exercise
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
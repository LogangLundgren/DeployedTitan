import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { CheckCircle2, Trash2, Plus, Dumbbell, Loader2, Edit, MoreVertical, Copy } from 'lucide-react';
import CustomExerciseModal from '@/components/workout/CustomExerciseModal';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useAuth } from '@/hooks/use-auth';

// Form validation schema
const templateFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.string().optional(),
});

// Form typed values
type TemplateFormValues = z.infer<typeof templateFormSchema>;

// Exercise interface
interface Exercise {
  id: number;
  name: string;
  category: string;
  subcategory: string | null;
}

// Template exercise interface for exercises in a template
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

// Basic template interface
interface Template {
  id: number;
  name: string;
  description: string | null;
  userId: number;
  category: string | null;
  createdAt: string;
}

// Extended template with exercises
interface TemplateWithExercises extends Template {
  exercises: TemplateExercise[];
}

// Interface for a workout with details
interface WorkoutWithDetails {
  id: number;
  userId: number;
  date: string;
  notes: string | null;
  exercises: any[]; // Simplified for this example
  totalSets: number;
  totalExercises: number;
  volume: number;
}

// Helper function to format dates
function formatDate(dateString: string) {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

export default function Templates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [location] = useLocation();
  const isStandalonePage = location === '/templates';
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  // Query to get templates
  const { data: templates, isLoading: isLoadingTemplates } = useQuery<Template[]>({
    queryKey: ['/api/templates'],
    queryFn: async () => {
      const response = await fetch(`/api/templates`, {
        credentials: 'include'
      });
      return await response.json();
    },
    enabled: !!user
  });

  // Mutation to create template
  const createTemplateMutation = useMutation({
    mutationFn: async (values: TemplateFormValues) => { 
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
        credentials: 'include'
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      setIsCreateDialogOpen(false);
      toast({
        title: 'Template created',
        description: 'Your workout template has been created successfully.',
      });
      createForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create template',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Mutation to update template
  const updateTemplateMutation = useMutation({
    mutationFn: async (values: TemplateFormValues & { id: number }) => {
      const { id, ...rest } = values;
      const res = await fetch(`/api/templates/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rest),
        credentials: 'include'
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      setIsEditDialogOpen(false);
      toast({
        title: 'Template updated',
        description: 'Your workout template has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update template',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Mutation to delete template
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/templates/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      setIsDeleteDialogOpen(false);
      toast({
        title: 'Template deleted',
        description: 'Your workout template has been deleted successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete template',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Mutation to create a workout from a template
  const createWorkoutFromTemplateMutation = useMutation({
    mutationFn: async (templateId: number) => {
      const res = await fetch(`/api/templates/${templateId}/create-workout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPublic: false }),
        credentials: 'include'
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }
      return await res.json();
    },
    onSuccess: (workout: WorkoutWithDetails) => {
      queryClient.invalidateQueries({ queryKey: ['/api/workouts'] });
      toast({
        title: 'Workout started',
        description: 'Your workout has been created from the template.',
      });
      // Navigate to the workout logger page with the new workout
      window.location.href = `/workout-logger/${workout.id}`;
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create workout',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Form for creating a new template
  const createForm = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: '',
      description: '',
      category: 'Strength'
    }
  });

  // Form for editing an existing template
  const editForm = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: '',
      description: '',
      category: ''
    }
  });

  // Set values in edit form when a template is selected
  useEffect(() => {
    if (selectedTemplate) {
      editForm.reset({
        name: selectedTemplate.name,
        description: selectedTemplate.description || '',
        category: selectedTemplate.category || ''
      });
    }
  }, [selectedTemplate, editForm]);

  // Handler for form submission to create a template
  const onCreateSubmit = (values: TemplateFormValues) => {
    createTemplateMutation.mutate(values);
  };

  // Handler for form submission to edit a template
  const onEditSubmit = (values: TemplateFormValues) => {
    if (selectedTemplate) {
      updateTemplateMutation.mutate({
        ...values,
        id: selectedTemplate.id
      });
    }
  };

  // Handler for deleting a template
  const onDelete = () => {
    if (selectedTemplate) {
      deleteTemplateMutation.mutate(selectedTemplate.id);
    }
  };

  // Handler for creating a workout from template
  const onCreateWorkout = (templateId: number) => {
    createWorkoutFromTemplateMutation.mutate(templateId);
  };

  return (
    <div className={isStandalonePage ? "container mx-auto py-6" : ""}>
      {isStandalonePage && (
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Workout Templates</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage reusable workout templates
            </p>
          </div>
          <div className="flex gap-2">
            <CustomExerciseModal onExerciseCreated={() => {
              toast({
                title: "Exercise created",
                description: "Your custom exercise has been added to your library.",
              });
            }} />
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Template
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Workout Template</DialogTitle>
                  <DialogDescription>
                    Create a new workout template to reuse in future workouts.
                  </DialogDescription>
                </DialogHeader>
                <Form {...createForm}>
                  <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                    <FormField
                      control={createForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Push Day" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Brief description of this template..." 
                              {...field} 
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value || ''}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Strength">Strength</SelectItem>
                              <SelectItem value="Hypertrophy">Hypertrophy</SelectItem>
                              <SelectItem value="Endurance">Endurance</SelectItem>
                              <SelectItem value="HIIT">HIIT</SelectItem>
                              <SelectItem value="Recovery">Recovery</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        disabled={createTemplateMutation.isPending}
                      >
                        {createTemplateMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Create Template
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}

      {!isStandalonePage && (
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="hidden" id="createTemplateButton">New Template</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Workout Template</DialogTitle>
              <DialogDescription>
                Create a new workout template to reuse in future workouts.
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Push Day" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Brief description of this template..." 
                          {...field} 
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value || ''}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Strength">Strength</SelectItem>
                          <SelectItem value="Hypertrophy">Hypertrophy</SelectItem>
                          <SelectItem value="Endurance">Endurance</SelectItem>
                          <SelectItem value="HIIT">HIIT</SelectItem>
                          <SelectItem value="Recovery">Recovery</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={createTemplateMutation.isPending}
                  >
                    {createTemplateMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Template
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}

      {isLoadingTemplates ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading templates...</span>
        </div>
      ) : templates && templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl font-semibold mb-1">{template.name}</CardTitle>
                    <CardDescription>
                      Created on {formatDate(template.createdAt)}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => {
                        setSelectedTemplate(template);
                        setIsEditDialogOpen(true);
                      }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit template
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onCreateWorkout(template.id)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Create workout
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
                          setSelectedTemplate(template);
                          setIsDeleteDialogOpen(true);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete template
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {template.category && (
                  <Badge variant="secondary" className="mt-2">
                    {template.category}
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                {template.description && (
                  <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
                )}
                <Link href={`/templates/${template.id}`}>
                  <Button variant="outline" className="w-full">
                    <Dumbbell className="mr-2 h-4 w-4" />
                    Edit Details & Exercises
                  </Button>
                </Link>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="secondary" 
                  className="w-full" 
                  onClick={() => onCreateWorkout(template.id)}
                  disabled={createWorkoutFromTemplateMutation.isPending}
                >
                  {createWorkoutFromTemplateMutation.isPending && 
                    createWorkoutFromTemplateMutation.variables === template.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Start Workout
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-muted rounded-lg p-8 text-center">
          <Dumbbell className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <h3 className="text-xl font-medium mb-2">No Templates Yet</h3>
          <p className="text-muted-foreground mb-6">
            You haven't created any workout templates yet. Templates help you quickly start 
            workouts with your favorite exercises.
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Template
          </Button>
        </div>
      )}

      {/* Edit template dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>
              Make changes to your workout template.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Strength">Strength</SelectItem>
                        <SelectItem value="Hypertrophy">Hypertrophy</SelectItem>
                        <SelectItem value="Endurance">Endurance</SelectItem>
                        <SelectItem value="HIIT">HIIT</SelectItem>
                        <SelectItem value="Recovery">Recovery</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={updateTemplateMutation.isPending}
                >
                  {updateTemplateMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-4 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={onDelete}
              disabled={deleteTemplateMutation.isPending}
            >
              {deleteTemplateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
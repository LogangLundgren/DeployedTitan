import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { CheckCircle2, Trash2, Plus, Dumbbell, Loader2, Edit, MoreVertical, Copy } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

// Template create/edit form schema
const templateFormSchema = z.object({
  name: z.string().min(1, { message: 'Template name is required' }),
  description: z.string().optional(),
  category: z.string().optional(),
  userId: z.number()
});

type TemplateFormValues = z.infer<typeof templateFormSchema>;

// Define Template and TemplateWithExercises types
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

interface WorkoutWithDetails {
  id: number;
  userId: number;
  date: string;
  notes: string | null;
  exercises: any[];
  totalSets: number;
  totalExercises: number;
  volume: number;
}

// Temporary user ID until we implement authentication
const DEMO_USER_ID = 1;

export default function Templates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  
  // Fetch all templates for current user
  const { data: templates, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['/api/templates', DEMO_USER_ID],
    queryFn: async () => {
      return await apiRequest<Template[]>(`/api/templates?userId=${DEMO_USER_ID}`);
    }
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (values: TemplateFormValues) => { 
      console.log('API request with values:', JSON.stringify(values));
      return await apiRequest<Template>('/api/templates', {
        method: 'POST',
        body: JSON.stringify(values),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },
    onSuccess: () => {
      toast({
        title: 'Template created',
        description: 'Your workout template has been created successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/templates', DEMO_USER_ID] });
      setIsCreateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to create template: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: number; values: Partial<Template> }) => {
      return await apiRequest(`/api/templates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(values),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },
    onSuccess: () => {
      toast({
        title: 'Template updated',
        description: 'Your workout template has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/templates', DEMO_USER_ID] });
      setIsEditDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to update template: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/templates/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: 'Template deleted',
        description: 'Your workout template has been deleted successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/templates', DEMO_USER_ID] });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to delete template: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Create workout from template mutation
  const createWorkoutFromTemplateMutation = useMutation({
    mutationFn: async (templateId: number) => {
      const response = await apiRequest(`/api/templates/${templateId}/create-workout`, {
        method: 'POST',
        body: JSON.stringify({ userId: DEMO_USER_ID }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response as WorkoutWithDetails;
    },
    onSuccess: (data) => {
      toast({
        title: 'Workout created',
        description: 'A new workout has been created from the template.',
      });
      // Navigate to the workout page
      window.location.href = `/workout/${data.id}`;
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to create workout: ${error.message}`,
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
      category: 'Strength',
      userId: DEMO_USER_ID
    }
  });

  // Form for editing an existing template
  const editForm = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
      userId: DEMO_USER_ID
    }
  });

  // Reset edit form when selected template changes
  useEffect(() => {
    if (selectedTemplate) {
      editForm.reset({
        name: selectedTemplate.name,
        description: selectedTemplate.description || '',
        category: selectedTemplate.category || '',
        userId: selectedTemplate.userId
      });
    }
  }, [selectedTemplate, editForm]);

  // Function to format date string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Handler for create template form submission
  const onCreateSubmit = (values: TemplateFormValues) => {
    console.log('Creating template with values:', values);
    createTemplateMutation.mutate(values);
  };

  // Handler for edit template form submission
  const onEditSubmit = (values: TemplateFormValues) => {
    if (selectedTemplate) {
      updateTemplateMutation.mutate({ 
        id: selectedTemplate.id, 
        values: {
          name: values.name,
          description: values.description,
          category: values.category
        } 
      });
    }
  };

  // Handler for template deletion
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
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Workout Templates</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage reusable workout templates
          </p>
        </div>
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
                    View Details & Edit Exercises
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

      {/* Edit Template Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>
              Update your workout template details.
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
                      defaultValue={field.value || ''}
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

      {/* Delete Confirmation Dialog */}
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
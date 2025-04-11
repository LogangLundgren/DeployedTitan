import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AlertCircle,
  ChevronRight, 
  PlusCircle,
  ListChecks,
  CalendarRange,
  Dumbbell,
  Banknote,
  BarChart3,
  Image
} from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Template {
  id: number;
  userId: number;
  name: string;
  description: string | null;
  category: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CoachProfile {
  id: number;
  userId: number;
  title: string;
  experience: string;
  specialties: string;
  biography: string;
  hourlyRate: number | null;
  rating: number | null;
  ratingsCount: number | null;
  isVerified: boolean | null;
  isAvailableForHire: boolean | null;
  createdAt: Date;
  updatedAt: Date;
}

// Form schema
const formSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().min(20, { message: "Description must be at least 20 characters" }),
  price: z.coerce.number().min(0, { message: "Price cannot be negative" }),
  durationWeeks: z.coerce.number().min(1, { message: "Duration must be at least 1 week" }).max(52, { message: "Duration cannot exceed 52 weeks" }),
  difficultyLevel: z.string().min(1, { message: "Please select a difficulty level" }),
  category: z.string().min(1, { message: "Please select a category" }),
  featuredImageUrl: z.string().optional(),
  goals: z.array(z.string()).min(1, { message: "Please add at least one goal" }),
  equipment: z.array(z.string()).min(1, { message: "Please add at least one equipment item" })
});

export default function CreatePlan() {
  const [location, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTemplates, setSelectedTemplates] = useState<number[]>([]);
  const [addGoalDialogOpen, setAddGoalDialogOpen] = useState(false);
  const [addEquipmentDialogOpen, setAddEquipmentDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState("");
  const [newEquipment, setNewEquipment] = useState("");
  const [selectedTab, setSelectedTab] = useState("details");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = 1; // Assuming user 1 is logged in - in a real app, would come from auth context

  // Fetch coach profile
  const { 
    data: coachProfile, 
    isLoading: coachProfileLoading,
    error: coachProfileError
  } = useQuery({
    queryKey: ['/api/users', userId, 'coach-profile'],
    queryFn: () => fetch(`/api/users/${userId}/coach-profile`).then(res => res.json()),
  });

  // Fetch templates
  const { 
    data: templates = [], 
    isLoading: templatesLoading
  } = useQuery({
    queryKey: ['/api/templates', { userId }],
    queryFn: () => fetch(`/api/templates?userId=${userId}`).then(res => res.json()),
  });

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      durationWeeks: 4,
      difficultyLevel: "",
      category: "",
      featuredImageUrl: "",
      goals: [],
      equipment: []
    },
  });

  const goals = form.watch("goals");
  const equipment = form.watch("equipment");

  // Handle adding a new goal
  const handleAddGoal = () => {
    if (newGoal.trim() === "") return;
    
    const updatedGoals = [...goals, newGoal.trim()];
    form.setValue("goals", updatedGoals);
    setNewGoal("");
    setAddGoalDialogOpen(false);
  };

  // Handle adding a new equipment item
  const handleAddEquipment = () => {
    if (newEquipment.trim() === "") return;
    
    const updatedEquipment = [...equipment, newEquipment.trim()];
    form.setValue("equipment", updatedEquipment);
    setNewEquipment("");
    setAddEquipmentDialogOpen(false);
  };

  // Handle removing a goal
  const removeGoal = (index: number) => {
    const updatedGoals = [...goals];
    updatedGoals.splice(index, 1);
    form.setValue("goals", updatedGoals);
  };

  // Handle removing an equipment item
  const removeEquipment = (index: number) => {
    const updatedEquipment = [...equipment];
    updatedEquipment.splice(index, 1);
    form.setValue("equipment", updatedEquipment);
  };

  // Toggle template selection
  const toggleTemplateSelection = (templateId: number) => {
    if (selectedTemplates.includes(templateId)) {
      setSelectedTemplates(selectedTemplates.filter(id => id !== templateId));
    } else {
      setSelectedTemplates([...selectedTemplates, templateId]);
    }
  };

  // Create plan mutation
  const createPlanMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        // First create the workout plan using fetch directly for better error handling
        const planResponse = await fetch('/api/workout-plans', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data.plan)
        });
        
        if (!planResponse.ok) {
          let errorMessage = `Failed to create workout plan (${planResponse.status})`;
          try {
            const errorData = await planResponse.json();
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            console.error('Could not parse error response:', e);
          }
          throw new Error(errorMessage);
        }
        
        let planData;
        try {
          planData = await planResponse.json();
        } catch (e) {
          console.error('Error parsing plan response:', e);
          throw new Error('Invalid response from server when creating plan');
        }
        
        if (!planData || !planData.id) {
          throw new Error('Server returned invalid plan data');
        }
        
        // Now add the templates to the plan
        const templateErrors = [];
        if (data.templateIds && Array.isArray(data.templateIds) && data.templateIds.length > 0) {
          // Create plan templates with order/week/day
          for (let i = 0; i < data.templateIds.length; i++) {
            try {
              const templateId = data.templateIds[i];
              const weekNumber = Math.floor(i / 7) + 1;
              const dayNumber = (i % 7) + 1;
              
              // Use fetch directly for better error handling
              const response = await fetch('/api/plan-templates', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  planId: planData.id,
                  templateId,
                  weekNumber,
                  dayNumber,
                  order: i + 1,
                  notes: null
                })
              });
              
              if (!response.ok) {
                let errorMessage = `Server error (${response.status})`;
                try {
                  const errorText = await response.text();
                  console.error(`Error adding template ${templateId}:`, errorText);
                  
                  if (errorText && errorText.startsWith('{')) {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorMessage;
                  }
                } catch (e) {
                  console.error('Error parsing template error:', e);
                }
                templateErrors.push(`Template ${templateId}: ${errorMessage}`);
              }
            } catch (error) {
              console.error(`Error adding template at index ${i}:`, error);
              templateErrors.push(`Error adding template at index ${i}: ${error instanceof Error ? error.message : String(error)}`);
            }
          }
        }
        
        if (templateErrors.length > 0) {
          console.warn('Some templates were not added:', templateErrors);
        }
        
        return planData;
      } catch (error) {
        console.error('Error in plan creation:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workout-plans'] });
      toast({
        title: "Workout Plan Created!",
        description: "Your workout plan has been successfully created and is now available in the marketplace.",
        variant: "default",
      });
      setLocation('/marketplace');
    },
    onError: (error) => {
      console.error('Error creating workout plan:', error);
      toast({
        title: "Error Creating Plan",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (selectedTemplates.length === 0) {
      toast({
        title: "No Templates Selected",
        description: "Please select at least one template to include in your workout plan.",
        variant: "destructive",
      });
      setSelectedTab("templates");
      return;
    }

    // Check if coach profile exists before submitting
    if (!coachProfile || !coachProfile.id) {
      toast({
        title: "Coach Profile Required",
        description: "You need a valid coach profile before you can create workout plans.",
        variant: "destructive",
      });
      setLocation('/become-coach');
      return;
    }

    setIsSubmitting(true);
    
    const planData = {
      coachId: coachProfile.id,
      title: values.title,
      description: values.description,
      price: values.price,
      durationWeeks: values.durationWeeks,
      difficultyLevel: values.difficultyLevel,
      category: values.category,
      featuredImageUrl: values.featuredImageUrl || null,
      goals: values.goals,
      equipment: values.equipment,
      isFeatured: false,
      isSoldOut: false,
      isPublished: false // Start as draft
    };

    createPlanMutation.mutate({
      plan: planData,
      templateIds: selectedTemplates
    });
  };

  // Redirect if not a coach
  useEffect(() => {
    if (coachProfileError) {
      toast({
        title: "Coach Profile Required",
        description: "You need to create a coach profile before you can create workout plans.",
        variant: "destructive",
      });
      setLocation('/become-coach');
    }
  }, [coachProfileError, toast, setLocation]);

  if (coachProfileLoading) {
    return (
      <div className="container mx-auto py-16 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Create Workout Plan</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Design and publish a workout plan to the marketplace
          </p>
        </div>

        <Tabs 
          defaultValue="details" 
          value={selectedTab} 
          onValueChange={setSelectedTab}
          className="mb-6"
        >
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="details">Plan Details</TabsTrigger>
            <TabsTrigger value="templates">Select Templates</TabsTrigger>
          </TabsList>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6">
              <TabsContent value="details">
                <Card>
                  <CardHeader>
                    <CardTitle>Workout Plan Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Plan Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 6-Week Strength Training Program" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Strength">Strength</SelectItem>
                                <SelectItem value="Hypertrophy">Hypertrophy</SelectItem>
                                <SelectItem value="Powerlifting">Powerlifting</SelectItem>
                                <SelectItem value="Functional">Functional</SelectItem>
                                <SelectItem value="Endurance">Endurance</SelectItem>
                                <SelectItem value="Bodyweight">Bodyweight</SelectItem>
                                <SelectItem value="HIIT">HIIT</SelectItem>
                                <SelectItem value="CrossFit">CrossFit</SelectItem>
                                <SelectItem value="Yoga">Yoga</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              The primary focus of your workout plan
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="difficultyLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Difficulty Level</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a difficulty level" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Beginner">Beginner</SelectItem>
                                <SelectItem value="Intermediate">Intermediate</SelectItem>
                                <SelectItem value="Advanced">Advanced</SelectItem>
                                <SelectItem value="Elite">Elite</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              The skill level required for this plan
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
                              placeholder="Describe your workout plan, its benefits, and who it's for..." 
                              className="min-h-[120px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price ($)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Banknote className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                                <Input 
                                  type="number" 
                                  min="0"
                                  step="0.01"
                                  className="pl-9" 
                                  placeholder="e.g. 29.99" 
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Set to 0 for a free plan
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="durationWeeks"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration (Weeks)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <CalendarRange className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                                <Input 
                                  type="number" 
                                  min="1"
                                  max="52"
                                  className="pl-9" 
                                  placeholder="e.g. 4" 
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              How many weeks the plan runs for
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="featuredImageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Featured Image URL (optional)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Image className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                              <Input 
                                className="pl-9" 
                                placeholder="https://example.com/image.jpg" 
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            An image that represents your workout plan
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <FormLabel>Plan Goals</FormLabel>
                        <Button 
                          type="button" 
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => setAddGoalDialogOpen(true)}
                        >
                          <PlusCircle className="h-4 w-4 mr-1" />
                          Add Goal
                        </Button>
                      </div>
                      {goals.length > 0 ? (
                        <ul className="space-y-2 mb-2">
                          {goals.map((goal, index) => (
                            <li key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                              <span>{goal}</span>
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm"
                                className="h-6 text-gray-500 hover:text-red-500"
                                onClick={() => removeGoal(index)}
                              >
                                Remove
                              </Button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="bg-gray-50 p-4 rounded border border-gray-200 mb-2">
                          <div className="flex items-center text-gray-500">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            <span>No goals added yet. Add at least one goal for your plan.</span>
                          </div>
                        </div>
                      )}
                      <FormMessage>
                        {form.formState.errors.goals?.message}
                      </FormMessage>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <FormLabel>Required Equipment</FormLabel>
                        <Button 
                          type="button" 
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => setAddEquipmentDialogOpen(true)}
                        >
                          <PlusCircle className="h-4 w-4 mr-1" />
                          Add Equipment
                        </Button>
                      </div>
                      {equipment.length > 0 ? (
                        <ul className="space-y-2 mb-2">
                          {equipment.map((item, index) => (
                            <li key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                              <span>{item}</span>
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm"
                                className="h-6 text-gray-500 hover:text-red-500"
                                onClick={() => removeEquipment(index)}
                              >
                                Remove
                              </Button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="bg-gray-50 p-4 rounded border border-gray-200 mb-2">
                          <div className="flex items-center text-gray-500">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            <span>No equipment added yet. Add at least one piece of equipment.</span>
                          </div>
                        </div>
                      )}
                      <FormMessage>
                        {form.formState.errors.equipment?.message}
                      </FormMessage>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setLocation('/marketplace')}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="button" 
                      onClick={() => setSelectedTab("templates")}
                    >
                      Continue to Templates
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="templates">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Select Workout Templates</span>
                      <Button 
                        type="button" 
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation('/workouts?tab=templates')}
                      >
                        <PlusCircle className="h-4 w-4 mr-1" />
                        Create New Template
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {templatesLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                        <p className="mt-2">Loading templates...</p>
                      </div>
                    ) : templates.length === 0 ? (
                      <div className="bg-gray-50 p-6 text-center rounded border border-gray-200">
                        <Dumbbell className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                        <h3 className="text-lg font-medium mb-1">No Templates Found</h3>
                        <p className="text-gray-500 mb-4">
                          You need to create workout templates before you can create a plan.
                        </p>
                        <Button 
                          type="button"
                          onClick={() => setLocation('/workouts?tab=templates')}
                        >
                          Create Your First Template
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="mb-4">
                          <p className="text-sm text-gray-500">
                            Select the templates you want to include in your plan. These will be organized by week and day.
                          </p>
                        </div>
                        
                        <div className="overflow-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-12">Select</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {templates.map((template: Template) => (
                                <TableRow key={template.id}>
                                  <TableCell>
                                    <input 
                                      type="checkbox" 
                                      className="h-4 w-4" 
                                      checked={selectedTemplates.includes(template.id)}
                                      onChange={() => toggleTemplateSelection(template.id)} 
                                    />
                                  </TableCell>
                                  <TableCell className="font-medium">{template.name}</TableCell>
                                  <TableCell>{template.category || "Uncategorized"}</TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setLocation(`/templates/${template.id}`)}
                                    >
                                      View
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded">
                          <div className="flex items-start">
                            <ListChecks className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
                            <div className="text-sm text-blue-700">
                              <p className="font-medium mb-1">Selected Templates: {selectedTemplates.length}</p>
                              <p className="mb-1">Templates will be organized in order, with up to 7 workouts per week.</p>
                              <p>Recommended: Select at least {form.watch("durationWeeks")} templates for a {form.watch("durationWeeks")}-week plan.</p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setSelectedTab("details")}
                    >
                      Back to Details
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting || createPlanMutation.isPending || templates.length === 0 || selectedTemplates.length === 0}
                      className="gap-2"
                    >
                      {isSubmitting || createPlanMutation.isPending ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                          Creating Plan...
                        </>
                      ) : (
                        <>
                          Create Workout Plan
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </form>
          </Form>
        </Tabs>
        
        {/* Add Goal Dialog */}
        <Dialog open={addGoalDialogOpen} onOpenChange={setAddGoalDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a Goal</DialogTitle>
              <DialogDescription>
                Enter a goal that users can achieve with your workout plan.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input 
                placeholder="e.g. Increase bench press by 10%" 
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddGoal()}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddGoalDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddGoal}>Add Goal</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Add Equipment Dialog */}
        <Dialog open={addEquipmentDialogOpen} onOpenChange={setAddEquipmentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Equipment</DialogTitle>
              <DialogDescription>
                Enter an equipment item required for your workout plan.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input 
                placeholder="e.g. Barbell, Dumbbell, Kettlebell" 
                value={newEquipment}
                onChange={(e) => setNewEquipment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddEquipment()}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddEquipmentDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddEquipment}>Add Equipment</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
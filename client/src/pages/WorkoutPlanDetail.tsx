import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { 
  Calendar, 
  Clock, 
  Dumbbell, 
  ChevronLeft, 
  Star, 
  CheckCircle, 
  Award, 
  ShoppingCart,
  Trash,
  Plus,
  Edit,
  Eye,
  GitFork,
  Users
} from 'lucide-react';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import PlanForkModal from '@/components/workout/PlanForkModal';

// Form schema for editing workout plan details
const editPlanSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number().min(0, "Price must be 0 or greater"),
  durationWeeks: z.number().min(1, "Duration must be at least 1 week"),
  difficultyLevel: z.enum(["Beginner", "Intermediate", "Advanced"]),
  category: z.string().min(1, "Category is required"),
  goals: z.string(),
  equipment: z.string(),
});
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  bio: string | null;
  location: string | null;
  fitnessLevel: string | null;
  experienceYears: number | null;
  goals: string | null;
  certifications: string | null;
  socialMedia: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
  } | null;
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
  user?: User;
}

interface Exercise {
  id: number;
  name: string;
  category: string;
  description: string | null;
  muscleGroup: string;
  equipment: string | null;
  instructions: string | null;
  videoUrl: string | null;
  imageUrl: string | null;
}

interface TemplateExercise {
  id: number;
  templateId: number;
  exerciseId: number;
  sets: number;
  reps: string;
  restSeconds: number | null;
  notes: string | null;
  order: number;
  exerciseDetails: Exercise;
}

interface Template {
  id: number;
  userId: number;
  name: string;
  description: string | null;
  category: string | null;
  exercises: TemplateExercise[];
}

interface PlanTemplate {
  id: number;
  planId: number;
  templateId: number;
  weekNumber: number;
  dayNumber: number;
  order: number;
  notes: string | null;
  template: Template;
}

interface Review {
  id: number;
  userId: number;
  rating: number;
  review: string | null;
  createdAt: Date;
  updatedAt: Date;
  coachId: number | null;
  planId: number | null;
  user?: User;
}

interface WorkoutPlan {
  id: number;
  coachId: number;
  title: string;
  description: string;
  price: number;
  durationWeeks: number;
  difficultyLevel: string;
  category: string;
  featuredImageUrl: string | null;
  goals: string[] | [];
  equipment: string[] | [];
  sales: number | null;
  rating: number | null;
  ratingsCount: number | null;
  isFeatured: boolean | null;
  isSoldOut: boolean | null;
  isPublished: boolean | null;
  createdAt: Date;
  updatedAt: Date;
  coach?: CoachProfile;
  templates?: PlanTemplate[];
}

export default function WorkoutPlanDetail() {
  const params = useParams<{ id: string }>();
  const [location, setLocation] = useLocation();
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [addTemplateDialogOpen, setAddTemplateDialogOpen] = useState(false);
  const [forkModalOpen, setForkModalOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const planId = parseInt(params.id);
  const { user } = useAuth();

  // Initialize form for editing plan details
  const form = useForm<z.infer<typeof editPlanSchema>>({
    resolver: zodResolver(editPlanSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      durationWeeks: 1,
      difficultyLevel: "Beginner",
      category: "",
      goals: "",
      equipment: "",
    },
  });

  const { 
    data: plan, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['/api/workout-plans', planId],
    queryFn: async () => {
      const res = await fetch(`/api/workout-plans/${planId}`);
      if (!res.ok) {
        throw new Error('Workout plan not found');
      }
      return res.json();
    },
    enabled: !isNaN(planId)
  });

  // Redirect to marketplace if plan not found
  useEffect(() => {
    if (error && error.message === 'Workout plan not found') {
      toast({
        title: "Plan Not Found",
        description: "This workout plan no longer exists. Redirecting to marketplace.",
        variant: "destructive",
      });
      setTimeout(() => setLocation('/marketplace'), 2000);
    }
  }, [error, setLocation, toast]);

  const { 
    data: reviews = [], 
    isLoading: reviewsLoading
  } = useQuery({
    queryKey: ['/api/reviews', { planId }],
    queryFn: () => fetch(`/api/reviews?planId=${planId}`).then(res => res.json()),
    enabled: !isNaN(planId)
  });

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  const handlePurchase = async () => {
    // Close the purchase dialog if it's open
    setPurchaseDialogOpen(false);
    
    // If this is a free plan, handle it directly without redirecting to checkout
    if (plan.price === 0) {
      setIsProcessingPayment(true);
      
      try {
        // Make the API request directly to record the free plan purchase
        const response = await fetch("/api/init-plan-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId: Number(plan.id) }),
          credentials: "include"
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to process free plan purchase');
        }
        
        // For free plans, redirect to the success page without going through checkout
        // Add ?freeplan=true to distinguish it from regular stripe payments
        setLocation(`/payment-success?planId=${plan.id}&freeplan=true`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
        console.error('Error processing free plan:', errorMsg);
        toast({
          title: 'Purchase Failed',
          description: errorMsg,
          variant: 'destructive',
        });
      } finally {
        setIsProcessingPayment(false);
      }
    } else {
      // For paid plans, redirect to the checkout page
      setIsProcessingPayment(false);
      setLocation(`/plan-checkout?planId=${plan.id}`);
    }
  };
  
  const handleDeletePlan = async () => {
    if (!plan || !plan.id) return;
    
    try {
      setIsDeleting(true);
      
      const response = await apiRequest(`/api/workout-plans/${plan.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete workout plan');
      }
      
      toast({
        title: "Success",
        description: `"${plan.title}" has been deleted.`,
      });
      
      // Invalidate any queries for workout plans
      queryClient.invalidateQueries({ queryKey: ['/api/workout-plans'] });
      queryClient.invalidateQueries({ queryKey: ['/api/my-plans'] });
      
      // Redirect to marketplace
      setLocation('/marketplace');
    } catch (error) {
      console.error('Error deleting workout plan:', error);
      toast({
        title: "Error",
        description: "Failed to delete workout plan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handlePublishPlan = async () => {
    if (!plan || !plan.id) return;
    
    try {
      console.log('FINAL FIX - Publish button clicked for plan:', plan.id);
      setIsPublishing(true);
      
      // CRITICAL FIX: Just make a direct PUT call to update isPublished on the plan
      const publishData = { isPublished: true };
      console.log('FINAL FIX - Request data:', JSON.stringify(publishData));
      
      const planId = plan.id;
      console.log(`FINAL FIX - Making request to /api/workout-plans/${planId}`);
      
      // Use PUT method instead of trying with the publish endpoint
      const response = await fetch(`/api/workout-plans/${planId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(publishData)
      });
      
      console.log('Publish request complete, status:', response.status);
      
      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
          console.error('Publishing error response:', errorText);
        } catch (e) {
          console.error('Failed to get error text:', e);
        }
        throw new Error(`Failed to publish workout plan: ${response.status} ${errorText}`);
      }
      
      // Check the response from a successful request
      try {
        const responseData = await response.json();
        console.log('Publish success response:', responseData);
      } catch (e) {
        console.error('Failed to parse success response:', e);
      }
      
      toast({
        title: "Success",
        description: `"${plan.title}" has been published and is now available in the marketplace.`,
      });
      
      // Invalidate any queries for workout plans
      queryClient.invalidateQueries({ queryKey: ['/api/workout-plans'] });
      queryClient.invalidateQueries({ queryKey: ['/api/my-plans'] });
      queryClient.invalidateQueries({ queryKey: ['/api/workout-plans', planId] });
    } catch (error) {
      console.error('Error publishing workout plan:', error);
      toast({
        title: "Error",
        description: "Failed to publish workout plan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // Handle plan editing
  const handleEditPlan = async (values: z.infer<typeof editPlanSchema>) => {
    if (!plan || !plan.id) return;
    
    try {
      setIsUpdating(true);
      
      // Convert string fields back to arrays for goals and equipment
      const updateData = {
        ...values,
        goals: values.goals ? values.goals.split(',').map(g => g.trim()).filter(g => g) : [],
        equipment: values.equipment ? values.equipment.split(',').map(e => e.trim()).filter(e => e) : [],
      };
      
      const response = await fetch(`/api/workout-plans/${plan.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update workout plan');
      }
      
      toast({
        title: "Success",
        description: `"${values.title}" has been updated successfully.`,
      });
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/workout-plans', planId] });
      queryClient.invalidateQueries({ queryKey: ['/api/workout-plans'] });
      queryClient.invalidateQueries({ queryKey: ['/api/my-plans'] });
      
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating workout plan:', error);
      toast({
        title: "Error",
        description: "Failed to update workout plan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Open edit dialog and populate form with current plan data
  const openEditDialog = () => {
    if (plan) {
      form.reset({
        title: plan.title,
        description: plan.description,
        price: plan.price,
        durationWeeks: plan.durationWeeks,
        difficultyLevel: plan.difficultyLevel as "Beginner" | "Intermediate" | "Advanced",
        category: plan.category,
        goals: plan.goals ? plan.goals.join(', ') : '',
        equipment: plan.equipment ? plan.equipment.join(', ') : '',
      });
      setEditDialogOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-16 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4">Loading workout plan...</p>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="container mx-auto py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Error Loading Workout Plan</h2>
        <p className="mb-8">There was a problem loading this workout plan.</p>
        <Button onClick={() => setLocation('/marketplace')}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Marketplace
        </Button>
      </div>
    );
  }

  // Debugging plan template data structure
  console.log('Plan templates:', plan.templates);
  
  // Group templates by week with improved template handling
  const templatesByWeek: Record<number, PlanTemplate[]> = {};
  if (plan.templates && Array.isArray(plan.templates)) {
    plan.templates.forEach((template) => {
      // Ensure we have the weekNumber
      const weekNumber = template.weekNumber || 1;
      
      if (!templatesByWeek[weekNumber]) {
        templatesByWeek[weekNumber] = [];
      }
      
      // Track each template even if its structure isn't exactly what we expect
      // This lets us debug what data we're actually receiving
      templatesByWeek[weekNumber].push(template);
    });
  }
  
  // Debug the grouped templates
  console.log('Templates by week:', templatesByWeek);

  // Star rating display component
  const StarRating = ({ rating }: { rating: number | null }) => {
    if (rating === null) return <span>No ratings yet</span>;
    
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < Math.floor(rating) 
                ? "text-yellow-400 fill-yellow-400" 
                : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-2 text-sm">({rating?.toFixed(1) || '0.0'})</span>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <Button 
        variant="outline" 
        className="mb-6"
        onClick={() => setLocation('/marketplace')}
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back to Marketplace
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            {plan.isFeatured && (
              <Badge className="mb-2 bg-amber-500">Featured</Badge>
            )}
            <h1 className="text-3xl font-bold tracking-tight mb-2">{plan.title}</h1>
            
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="flex items-center">
                <StarRating rating={plan.rating} />
                {plan.ratingsCount && (
                  <span className="ml-1 text-sm text-gray-500">
                    ({plan.ratingsCount} reviews)
                  </span>
                )}
              </div>

              <Badge variant="outline" className="bg-slate-100">
                {plan.difficultyLevel}
              </Badge>

              <Badge variant="outline" className="bg-slate-100">
                {plan.category}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
              <div className="flex items-center">
                <Calendar className="mr-1 h-4 w-4" />
                {plan.durationWeeks} weeks
              </div>
              {plan.sales && (
                <div className="flex items-center">
                  <ShoppingCart className="mr-1 h-4 w-4" />
                  {plan.sales} sold
                </div>
              )}
            </div>

            <p className="text-gray-700 mb-6 whitespace-pre-line">
              {plan.description}
            </p>

            {/* Goals and Equipment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                    Goals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.goals && plan.goals.length > 0 ? (
                      plan.goals.map((goal, index) => (
                        <li key={index} className="flex items-center">
                          <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                          {goal}
                        </li>
                      ))
                    ) : (
                      <li>No specific goals listed</li>
                    )}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Dumbbell className="mr-2 h-5 w-5 text-gray-700" />
                    Equipment Needed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.equipment && plan.equipment.length > 0 ? (
                      plan.equipment.map((item, index) => (
                        <li key={index} className="flex items-center">
                          <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                          {item}
                        </li>
                      ))
                    ) : (
                      <li>No specific equipment listed</li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          <Tabs defaultValue="program">
            <TabsList className="mb-6">
              <TabsTrigger value="program">Program Overview</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
            
            <TabsContent value="program">
              <h2 className="text-2xl font-bold mb-4">Program Schedule</h2>
              <div className="space-y-6">
                {Object.keys(templatesByWeek).length > 0 ? (
                  Object.entries(templatesByWeek).map(([weekNum, templates]) => (
                    <Accordion key={weekNum} type="single" collapsible className="mb-4">
                      <AccordionItem value={`week-${weekNum}`}>
                        <AccordionTrigger>
                          <div className="flex items-center">
                            <span className="font-semibold">Week {weekNum}</span>
                            <Badge variant="outline" className="ml-4">
                              {templates.length} workouts
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 pt-2">
                            {templates
                              .sort((a, b) => a.dayNumber - b.dayNumber)
                              .map((planTemplate) => (
                                <Card key={planTemplate.id}>
                                  <CardHeader className="pb-2">
                                    <CardTitle className="text-lg">
                                      Day {planTemplate.dayNumber}: {planTemplate.template?.name || 'Workout'}
                                    </CardTitle>
                                    <CardDescription>
                                      {planTemplate.template?.category || 'General'}
                                    </CardDescription>
                                  </CardHeader>
                                  <CardContent>
                                    {planTemplate.template?.exercises && Array.isArray(planTemplate.template.exercises) ? (
                                      <div className="space-y-3">
                                        {planTemplate.template.exercises.map((exercise) => (
                                          <div key={exercise.id} className="flex items-start">
                                            <div className="font-medium min-w-[240px]">
                                              {exercise.exerciseDetails?.name || 'Exercise'}
                                            </div>
                                            <div className="text-gray-600">
                                              {exercise.sets} sets × {exercise.reps}
                                              {exercise.notes && (
                                                <div className="text-sm text-gray-500 mt-1">
                                                  {exercise.notes}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="py-2 text-sm text-gray-500">
                                        No detailed exercise information available for this template.
                                      </div>
                                    )}
                                    {planTemplate.notes && (
                                      <>
                                        <Separator className="my-4" />
                                        <div className="text-sm">
                                          <span className="font-medium">Notes: </span>
                                          {planTemplate.notes}
                                        </div>
                                      </>
                                    )}
                                  </CardContent>
                                </Card>
                              ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  ))
                ) : (
                  <p className="text-gray-500 italic">
                    No detailed program information available
                  </p>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="reviews">
              <h2 className="text-2xl font-bold mb-4">Customer Reviews</h2>
              
              {reviewsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                  <p className="mt-2">Loading reviews...</p>
                </div>
              ) : reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review: Review) => (
                    <div key={review.id} className="border rounded-lg p-4">
                      <div className="flex justify-between mb-2">
                        <div className="font-medium">
                          {review.user?.name || "Anonymous"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="mb-2">
                        <StarRating rating={review.rating} />
                      </div>
                      {review.review && (
                        <p className="text-gray-700">{review.review}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border rounded-lg">
                  <p className="text-gray-500">No reviews yet</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bold">${plan?.price?.toFixed(2) || '0.00'}</CardTitle>
                {plan.isSoldOut ? (
                  <Badge variant="destructive">Sold Out</Badge>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Plan status */}
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">Status:</div>
                  {plan.isPublished ? (
                    <Badge className="bg-green-500 text-white">Published</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-100 text-amber-800">Draft</Badge>
                  )}
                </div>
                
                {/* Check if current user is the plan owner */}
                {user && plan.coach && plan.coach.userId === user.id ? (
                  /* Coach owner actions */
                  <>
                    {!plan.isPublished ? (
                      <Button 
                        className="w-full" 
                        variant="default"
                        onClick={handlePublishPlan}
                        disabled={isPublishing}
                      >
                        <CheckCircle className="mr-2 h-5 w-5" />
                        {isPublishing ? 'Publishing...' : 'Publish Plan'}
                      </Button>
                    ) : (
                      <div className="text-center text-sm text-gray-500 mb-4">
                        This plan is published and visible in the marketplace
                      </div>
                    )}
                    
                    <Button 
                      className="w-full mb-2" 
                      variant="outline"
                      onClick={openEditDialog}
                    >
                      <Edit className="mr-2 h-5 w-5" />
                      Edit Plan Details
                    </Button>
                    
                    {user.isCoach && plan && (
                      <>
                        <Button 
                          className="w-full mb-2" 
                          variant="outline"
                          onClick={() => setForkModalOpen(true)}
                        >
                          <GitFork className="mr-2 h-5 w-5" />
                          Fork for Client
                        </Button>
                        
                        <PlanForkModal
                          planId={planId}
                          planTitle={plan.title}
                          open={forkModalOpen}
                          setOpen={setForkModalOpen}
                          afterFork={(forkedPlanId) => {
                            toast({
                              title: "Success",
                              description: "Plan forked successfully for client",
                            });
                            queryClient.invalidateQueries({ queryKey: ['/api/coach/client-plans'] });
                          }}
                        />
                      </>
                    )}
                    
                    <Button 
                      className="w-full" 
                      variant="destructive"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      <Trash className="mr-2 h-5 w-5" />
                      Delete Plan
                    </Button>
                  </>
                ) : (
                  /* Customer/Viewer actions */
                  <Button 
                    className="w-full text-base py-6" 
                    size="lg"
                    disabled={plan.isSoldOut || isProcessingPayment}
                    onClick={() => {
                      // If this is a free plan, handle it directly
                      if (plan.price === 0) {
                        handlePurchase();
                      } else {
                        // For paid plans, show the confirmation dialog first
                        setPurchaseDialogOpen(true);
                      }
                    }}
                  >
                    {isProcessingPayment ? (
                      <>
                        <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        {plan.price === 0 ? "Get Free Plan" : "Purchase Plan"}
                      </>
                    )}
                  </Button>
                )}



                <div className="text-sm text-gray-500 text-center">
                  One-time purchase, lifetime access
                </div>

                <div className="space-y-2 pt-4">
                  <div className="flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                    <span>Full {plan.durationWeeks}-week program</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                    <span>Detailed workout instructions</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                    <span>Progress tracking</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                    <span>Use plans as templates for workouts</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Coach Info */}
            {plan.coach && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">About the Coach</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center text-center mb-4">
                    <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center mb-2">
                      {plan.coach.user?.name?.charAt(0) || "C"}
                    </div>
                    <h3 className="font-bold text-lg">
                      {plan.coach.user?.name || "Coach"}
                      {plan.coach.isVerified && (
                        <Award className="inline-block ml-1 h-4 w-4 text-blue-500" />
                      )}
                    </h3>
                    <p className="text-sm text-gray-500">{plan.coach.title}</p>
                    
                    {plan.coach.rating && (
                      <div className="mt-2">
                        <StarRating rating={plan.coach.rating} />
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-4 line-clamp-4">
                    {plan.coach.biography}
                  </p>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setLocation(`/coaches/${plan.coach.id}`)}
                  >
                    View Coach Profile
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Purchase Confirmation Dialog */}
      <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Purchase</DialogTitle>
            <DialogDescription>
              You're about to purchase the following workout plan:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">{plan.title}</span>
              <span className="font-bold">${plan?.price?.toFixed(2) || '0.00'}</span>
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center font-bold">
              <span>Total</span>
              <span>${plan?.price?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPurchaseDialogOpen(false)} disabled={isProcessingPayment}>
              Cancel
            </Button>
            <Button onClick={handlePurchase} disabled={isProcessingPayment}>
              {isProcessingPayment ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                  Processing...
                </>
              ) : "Complete Purchase"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Workout Plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this workout plan? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex flex-col gap-2 p-4 border rounded-md bg-gray-50">
              <span className="font-medium text-lg">{plan.title}</span>
              <span className="text-sm text-gray-500">{plan.durationWeeks} weeks • {plan.category}</span>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePlan} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                  Deleting...
                </>
              ) : "Delete Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Plan Details Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Plan Details</DialogTitle>
            <DialogDescription>
              Update your workout plan information and settings.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditPlan)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter plan title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          step="0.01"
                          placeholder="0.00" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
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
                        placeholder="Describe your workout plan..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="durationWeeks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (weeks)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          placeholder="4" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select difficulty" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Beginner">Beginner</SelectItem>
                          <SelectItem value="Intermediate">Intermediate</SelectItem>
                          <SelectItem value="Advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
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
                      <FormControl>
                        <Input placeholder="e.g., Strength, Cardio" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="goals"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Goals</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Muscle gain, Weight loss, Strength (comma-separated)"
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="equipment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Equipment Required</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Dumbbells, Barbell, Resistance bands (comma-separated)"
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditDialogOpen(false)}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                      Updating...
                    </>
                  ) : "Update Plan"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Template Dialog */}
      <Dialog open={addTemplateDialogOpen} onOpenChange={setAddTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Workout Template</DialogTitle>
            <DialogDescription>
              Select a workout template to add to this program.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-gray-500 mb-4">
              Coming soon: You'll be able to add your workout templates to this plan.
              For now, please manage templates from the Templates page.
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddTemplateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setLocation('/templates')}>
              Go to Templates
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* We're using the Dialog from PlanForkModal directly with "Fork for Client" button */}
    </div>
  );
}
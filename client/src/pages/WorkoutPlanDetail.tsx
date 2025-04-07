import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Clock, 
  Dumbbell, 
  ChevronLeft, 
  Star, 
  CheckCircle, 
  Award, 
  ShoppingCart 
} from 'lucide-react';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  createdAt: Date;
  updatedAt: Date;
  coach?: CoachProfile;
  templates?: PlanTemplate[];
}

export default function WorkoutPlanDetail() {
  const params = useParams<{ id: string }>();
  const [location, setLocation] = useLocation();
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const { toast } = useToast();
  const planId = parseInt(params.id);

  const { 
    data: plan, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['/api/workout-plans', planId],
    queryFn: () => fetch(`/api/workout-plans/${planId}`).then(res => res.json()),
    enabled: !isNaN(planId)
  });

  const { 
    data: reviews = [], 
    isLoading: reviewsLoading
  } = useQuery({
    queryKey: ['/api/reviews', { planId }],
    queryFn: () => fetch(`/api/reviews?planId=${planId}`).then(res => res.json()),
    enabled: !isNaN(planId)
  });

  const handlePurchase = async () => {
    try {
      // In a real app, this would integrate with Stripe
      // For now, we'll just create a purchase record
      await apiRequest('POST', '/api/purchases', {
        userId: 1, // Assuming user 1 is logged in
        planId,
        serviceId: null,
        transactionId: `plan-${Date.now()}`,
        amount: plan.price,
        status: 'completed',
        purchaseDate: new Date()
      });

      toast({
        title: "Purchase Successful!",
        description: "The workout plan has been added to your account.",
        variant: "default",
      });

      setPurchaseDialogOpen(false);
      
      // Redirect to user's plans
      // setLocation('/my-plans');
    } catch (error) {
      console.error('Purchase error:', error);
      toast({
        title: "Purchase Failed",
        description: "There was an issue processing your purchase. Please try again.",
        variant: "destructive",
      });
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

  // Group templates by week
  const templatesByWeek: Record<number, PlanTemplate[]> = {};
  if (plan.templates) {
    plan.templates.forEach((template) => {
      if (!templatesByWeek[template.weekNumber]) {
        templatesByWeek[template.weekNumber] = [];
      }
      templatesByWeek[template.weekNumber].push(template);
    });
  }

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
        <span className="ml-2 text-sm">({rating.toFixed(1)})</span>
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
                                      Day {planTemplate.dayNumber}: {planTemplate.template.name}
                                    </CardTitle>
                                    <CardDescription>
                                      {planTemplate.template.category}
                                    </CardDescription>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="space-y-3">
                                      {planTemplate.template.exercises.map((exercise) => (
                                        <div key={exercise.id} className="flex items-start">
                                          <div className="font-medium min-w-[240px]">
                                            {exercise.exerciseDetails.name}
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
                <CardTitle className="text-2xl font-bold">${plan.price.toFixed(2)}</CardTitle>
                {plan.isSoldOut ? (
                  <Badge variant="destructive">Sold Out</Badge>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full text-base py-6" 
                  size="lg"
                  disabled={plan.isSoldOut}
                  onClick={() => setPurchaseDialogOpen(true)}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Purchase Plan
                </Button>

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
              <span className="font-bold">${plan.price.toFixed(2)}</span>
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center font-bold">
              <span>Total</span>
              <span>${plan.price.toFixed(2)}</span>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPurchaseDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePurchase}>
              Complete Purchase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
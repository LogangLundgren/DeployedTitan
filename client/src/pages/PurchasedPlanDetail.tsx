import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Clock, 
  Dumbbell, 
  ChevronLeft, 
  Star, 
  CheckCircle, 
  Award, 
  ClipboardList,
  PlayCircle,
  CalendarDays,
  Target,
  ListChecks
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
}

interface Coach {
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

interface TemplateExercise {
  id: number;
  templateId: number;
  exerciseId: number;
  setCount: number;
  repCount: number;
  restSeconds: number | null;
  order: number;
  notes: string | null;
  exercise: {
    id: number;
    name: string;
    category: string;
    description: string | null;
    videoUrl: string | null;
    muscleGroup: string | null;
  };
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
  coach?: Coach;
  planTemplates?: PlanTemplate[];
}

export default function PurchasedPlanDetail() {
  const { id } = useParams<{ id: string }>();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeWeek, setActiveWeek] = useState(1);
  
  // Fetch workout plan details and templates
  const { data: plan, isLoading, error } = useQuery<WorkoutPlan>({
    queryKey: ['/api/workout-plans', parseInt(id)],
    queryFn: async () => {
      const response = await fetch(`/api/workout-plans/${id}?includePlanTemplates=true`);
      
      if (!response.ok) {
        throw new Error("Failed to load workout plan");
      }
      
      return response.json();
    }
  });

  // Organize templates by week and day
  const templatesByWeek: Record<number, PlanTemplate[]> = {};
  const weekNumbers: number[] = [];
  
  if (plan?.planTemplates) {
    for (let i = 1; i <= plan.durationWeeks; i++) {
      templatesByWeek[i] = [];
      weekNumbers.push(i);
    }
    
    plan.planTemplates.forEach(template => {
      if (!templatesByWeek[template.weekNumber]) {
        templatesByWeek[template.weekNumber] = [];
      }
      templatesByWeek[template.weekNumber].push(template);
    });
  }

  // Group templates by day for the active week
  const templatesByDay: Record<number, PlanTemplate[]> = {};
  
  if (templatesByWeek[activeWeek]) {
    templatesByWeek[activeWeek].forEach(template => {
      if (!templatesByDay[template.dayNumber]) {
        templatesByDay[template.dayNumber] = [];
      }
      templatesByDay[template.dayNumber].push(template);
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
        <p className="text-red-500">Error loading workout plan. Please try again.</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => setLocation('/my-plans')}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to My Plans
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <Button 
        variant="outline" 
        className="mb-6"
        onClick={() => setLocation('/my-plans')}
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back to My Plans
      </Button>

      <div className="grid grid-cols-1 gap-8">
        {/* Main Content */}
        <div>
          <div className="mb-6">
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
            </div>

            <p className="text-gray-700 mb-6 whitespace-pre-line">
              {plan.description}
            </p>

            {/* Goals and Equipment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Target className="mr-2 h-5 w-5 text-green-500" />
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
                      <li className="text-gray-500">No specific goals listed</li>
                    )}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Dumbbell className="mr-2 h-5 w-5 text-blue-500" />
                    Required Equipment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.equipment && plan.equipment.length > 0 ? (
                      plan.equipment.map((item, index) => (
                        <li key={index} className="flex items-center">
                          <CheckCircle className="mr-2 h-4 w-4 text-blue-500" />
                          {item}
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-500">No specific equipment listed</li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Workout Schedule */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Workout Schedule</h2>
              
              {/* Week tabs */}
              <Tabs 
                value={activeWeek.toString()} 
                onValueChange={val => setActiveWeek(parseInt(val))}
                className="mb-6"
              >
                <TabsList className="mb-4 flex flex-wrap h-auto">
                  {weekNumbers.map(week => (
                    <TabsTrigger 
                      key={week} 
                      value={week.toString()}
                      className="flex-1"
                    >
                      Week {week}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {weekNumbers.map(week => (
                  <TabsContent key={week} value={week.toString()}>
                    <h3 className="text-xl font-bold mb-4">Week {week}</h3>
                    
                    {Object.keys(templatesByDay).length > 0 ? (
                      <div className="space-y-4">
                        {Array.from({ length: 7 }).map((_, index) => {
                          const dayNumber = index + 1;
                          const dayTemplates = templatesByDay[dayNumber] || [];
                          
                          return (
                            <Card key={dayNumber}>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-lg">
                                  Day {dayNumber}
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                {dayTemplates.length > 0 ? (
                                  <div className="space-y-4">
                                    {dayTemplates.map(planTemplate => (
                                      <div 
                                        key={planTemplate.id} 
                                        className="border p-4 rounded-lg hover:border-primary transition-colors"
                                      >
                                        <div className="flex justify-between items-center mb-2">
                                          <h4 className="font-bold">
                                            {planTemplate.template.name}
                                          </h4>
                                          <Badge variant="outline">
                                            {planTemplate.template.exercises.length} exercises
                                          </Badge>
                                        </div>
                                        
                                        {planTemplate.template.description && (
                                          <p className="text-sm text-gray-600 mb-3">
                                            {planTemplate.template.description}
                                          </p>
                                        )}
                                        
                                        <Accordion type="single" collapsible className="w-full">
                                          <AccordionItem value="exercises">
                                            <AccordionTrigger className="text-sm font-medium">
                                              View Exercises
                                            </AccordionTrigger>
                                            <AccordionContent>
                                              <div className="space-y-3 pt-2">
                                                {planTemplate.template.exercises
                                                  .sort((a, b) => a.order - b.order)
                                                  .map(exercise => (
                                                    <div key={exercise.id} className="border-b pb-3">
                                                      <div className="flex justify-between">
                                                        <div>
                                                          <h5 className="font-medium">
                                                            {exercise.exercise.name}
                                                          </h5>
                                                          <div className="text-sm text-gray-500">
                                                            {exercise.setCount} sets × {exercise.repCount} reps
                                                            {exercise.restSeconds && (
                                                              <span> • {exercise.restSeconds}s rest</span>
                                                            )}
                                                          </div>
                                                        </div>
                                                        <Badge variant="outline" className="h-fit">
                                                          {exercise.exercise.category}
                                                        </Badge>
                                                      </div>
                                                      
                                                      {exercise.notes && (
                                                        <div className="mt-2 text-sm text-gray-600">
                                                          <span className="font-medium">Notes:</span> {exercise.notes}
                                                        </div>
                                                      )}
                                                    </div>
                                                  ))}
                                              </div>
                                            </AccordionContent>
                                          </AccordionItem>
                                        </Accordion>
                                        
                                        {planTemplate.notes && (
                                          <div className="mt-3 text-sm">
                                            <span className="font-medium">Coach's notes:</span> {planTemplate.notes}
                                          </div>
                                        )}
                                        
                                        <div className="mt-4">
                                          <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => {
                                              // Navigate to template detail or start a workout
                                              setLocation(`/templates/${planTemplate.template.id}`);
                                            }}
                                          >
                                            <ListChecks className="mr-2 h-4 w-4" />
                                            View Template
                                          </Button>
                                          <Button 
                                            size="sm"
                                            className="ml-2"
                                            onClick={() => {
                                              toast({
                                                title: "Starting new workout",
                                                description: `Based on ${planTemplate.template.name}`,
                                              });
                                              // Would navigate to workout logger with template
                                              setLocation(`/workouts?templateId=${planTemplate.template.id}`);
                                            }}
                                          >
                                            <PlayCircle className="mr-2 h-4 w-4" />
                                            Start Workout
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-6 text-gray-500">
                                    <ClipboardList className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                                    <p>Rest day - No workouts scheduled</p>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 border rounded-lg">
                        <CalendarDays className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-xl font-medium mb-2">No Workouts Found</h3>
                        <p className="text-gray-500 mb-6">
                          There are no workouts scheduled for this week.
                        </p>
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </div>

            {/* Coach Info */}
            {plan.coach && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="text-lg">About the Coach</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center mb-4">
                    <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                      {plan.coach.user?.name?.charAt(0) || "C"}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg flex items-center">
                        {plan.coach.user?.name || "Coach"}
                        {plan.coach.isVerified && (
                          <Award className="ml-1 h-4 w-4 text-blue-500" />
                        )}
                      </h3>
                      <p className="text-sm text-gray-500">{plan.coach.title}</p>
                      
                      {plan.coach.rating && (
                        <div className="mt-1">
                          <StarRating rating={plan.coach.rating} />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-4">
                    {plan.coach.biography}
                  </p>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => setLocation(`/coaches/${plan.coach!.id}`)}
                  >
                    View Coach Profile
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
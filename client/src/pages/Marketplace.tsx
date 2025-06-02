import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, Star, Filter, ChevronRight, TrendingUp, Award, Users, Eye } from 'lucide-react';
import { queryClient } from '@/lib/queryClient';

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
  goals: string;
  equipment: string;
  sales: number | null;
  rating: number | null;
  ratingsCount: number | null;
  isFeatured: boolean | null;
  isSoldOut: boolean | null;
  isPublished: boolean | null;
  createdAt: Date;
  updatedAt: Date;
  coach?: CoachProfile;
}

interface CoachingService {
  id: number;
  coachId: number;
  title: string;
  description: string;
  price: number;
  durationType: string;
  serviceType: string;
  isAvailable: boolean | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function Marketplace() {
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("plans");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch current user for checking if user is a coach
  const { 
    data: currentUser
  } = useQuery({
    queryKey: ['/api/user'],
    queryFn: () => fetch('/api/user').then(res => res.json()),
  });
  
  // Fetch coach profile to get coach ID if the user is a coach
  const { 
    data: coachProfile 
  } = useQuery({
    queryKey: ['/api/users', currentUser?.id, 'coach-profile'],
    queryFn: () => fetch(`/api/users/${currentUser?.id}/coach-profile`).then(res => res.json()),
    enabled: !!currentUser?.id,
  });

  // Determine if we're searching
  const isSearching = searchQuery.trim().length > 0;
  
  // Fetch workout plans (either all or search results)
  const { 
    data: workoutPlans = [], 
    isLoading: plansLoading,
    error: plansError
  } = useQuery({
    queryKey: ['/api/workout-plans', { 
      publishedOnly: true, 
      query: isSearching ? searchQuery : undefined,
      category: selectedCategory 
    }],
    queryFn: () => {
      let url = `/api/workout-plans?publishedOnly=true`;
      if (isSearching) {
        url += `&query=${encodeURIComponent(searchQuery)}`;
      }
      if (selectedCategory) {
        url += `&category=${encodeURIComponent(selectedCategory)}`;
      }
      return fetch(url).then(res => {
        if (!res.ok) {
          throw new Error("Failed to fetch plans");
        }
        return res.json();
      });
    },
    enabled: activeTab === "plans"
  });

  // Fetch coaches (either featured or search results)
  const { 
    data: coaches = [], 
    isLoading: coachesLoading,
    error: coachesError
  } = useQuery({
    queryKey: ['/api/coaches', { 
      featured: !isSearching, 
      query: isSearching ? searchQuery : undefined,
      category: selectedCategory 
    }],
    queryFn: () => {
      let url = `/api/coaches`;
      if (isSearching) {
        url += `?query=${encodeURIComponent(searchQuery)}`;
        if (selectedCategory) {
          url += `&category=${encodeURIComponent(selectedCategory)}`;
        }
      } else {
        url += `?featured=true&limit=6`;
      }
      return fetch(url).then(res => res.json());
    },
    enabled: activeTab === "coaches"
  });

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    setSelectedCategory(null);
  };

  // Categories for filtering
  const categories = [
    "Strength", "Hypertrophy", "Powerlifting", "Functional", 
    "Endurance", "Bodyweight", "HIIT", "CrossFit", "Yoga"
  ];

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
        <span className="ml-2 text-sm text-gray-600">({rating.toFixed(1)})</span>
      </div>
    );
  };

  // Render workout plan card
  const WorkoutPlanCard = ({ plan }: { plan: WorkoutPlan }) => {
    // Check if the current user is the coach who created this plan
    const isOwner = coachProfile && coachProfile.id === plan.coachId;
    
    return (
      <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap gap-2 mb-2">
            {plan.isFeatured && (
              <Badge className="bg-amber-500">Featured</Badge>
            )}
            {isOwner && !plan.isPublished && (
              <Badge variant="outline" className="border-orange-500 text-orange-500">Draft</Badge>
            )}
            {isOwner && plan.isPublished && (
              <Badge variant="outline" className="border-green-500 text-green-500">Published</Badge>
            )}
            {plan.price === 0 && (
              <Badge variant="outline" className="border-blue-500 text-blue-500">Free</Badge>
            )}
          </div>
          <CardTitle className="text-lg">{plan.title}</CardTitle>
          <CardDescription className="line-clamp-2">
            {plan.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow pb-2">
          <div className="flex flex-wrap gap-1 mb-3">
            <Badge variant="outline" className="bg-slate-100">
              {plan.difficultyLevel}
            </Badge>
            <Badge variant="outline" className="bg-slate-100">
              {plan.category}
            </Badge>
            <Badge variant="outline" className="bg-slate-100">
              {plan.durationWeeks} weeks
            </Badge>
          </div>
          
          {/* Client suitability indicators - new for coach focus */}
          <div className="mt-2 mb-3">
            <p className="text-sm font-medium text-gray-700">Ideal for clients:</p>
            <div className="flex flex-wrap gap-1 mt-1">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {plan.difficultyLevel} Level
              </Badge>
              {plan.goals && JSON.parse(plan.goals).map((goal: string, index: number) => (
                <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {goal}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <StarRating rating={plan.rating} />
            {plan.sales && (
              <div className="flex items-center text-sm text-gray-600">
                <Users className="h-4 w-4 mr-1" />
                {plan.sales} clients
              </div>
            )}
          </div>
        </CardContent>
        <Separator />
        <CardFooter className="pt-4 pb-4 flex flex-col gap-2">
          <div className="flex justify-between items-center w-full">
            <div className="font-bold text-lg">${plan.price.toFixed(2)}</div>
            
            {/* Simplified buttons for all users */}
            <div className="flex gap-2">
              <Button 
                size="sm"
                variant="outline" 
                onClick={() => setLocation(`/workout-plans/${plan.id}`)}
              >
                See Details
                <Eye className="h-4 w-4 ml-1" />
              </Button>
              <Button 
                size="sm"
                onClick={async () => {
                  // For free plans, purchase directly without checkout page
                  if (plan.price === 0) {
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
                      
                      // Redirect directly to success page with freeplan flag
                      setLocation(`/payment-success?planId=${plan.id}&freeplan=true`);
                    } catch (error) {
                      console.error('Error processing free plan:', error);
                    }
                  } else {
                    // For paid plans, redirect to checkout
                    setLocation(`/checkout?planId=${plan.id}`);
                  }
                }}
              >
                {plan.price === 0 ? "Get Free Plan" : "Purchase Plan"}
              </Button>
            </div>
          </div>
          
          {/* Contact coach button for all users */}
          <Button 
            size="sm" 
            variant="secondary"
            className="w-full"
            onClick={async () => {
              try {
                // First check if we have the coach's user ID directly
                if (plan.coach?.userId) {
                  // Import the contactCoach function only when needed
                  const { contactCoach } = await import('@/lib/messaging');
                  await contactCoach(plan.coach.userId, setLocation);
                  
                  toast({
                    title: "Success",
                    description: "You can now message the coach in your conversations",
                  });
                  return;
                }
                
                // If we don't have user ID in the coach object, fetch the coach profile
                const coachProfileResponse = await fetch(`/api/coaches/${plan.coachId}`);
                
                if (!coachProfileResponse.ok) {
                  throw new Error("Could not fetch coach profile");
                }
                
                const coachData = await coachProfileResponse.json();
                
                if (!coachData || !coachData.userId) {
                  throw new Error("Coach profile doesn't contain user ID");
                }
                
                // Now use the fetched user ID
                const { contactCoach } = await import('@/lib/messaging');
                await contactCoach(coachData.userId, setLocation);
                
                toast({
                  title: "Success",
                  description: "You can now message the coach in your conversations",
                });
              } catch (error) {
                console.error("Error contacting coach:", error);
                toast({
                  title: "Error",
                  description: "Failed to open conversation with coach",
                  variant: "destructive"
                });
              }
            }}
          >
            Contact Coach
          </Button>
        </CardFooter>
      </Card>
    );
  };

  // Render coach card
  const CoachCard = ({ coach }: { coach: CoachProfile }) => (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        {coach.isVerified && (
          <Badge className="w-fit mb-2 bg-blue-500">Verified</Badge>
        )}
        <CardTitle className="text-lg">
          {coach.user?.name || "Coach"}
        </CardTitle>
        <CardDescription className="font-medium">{coach.title}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow pb-2">
        <div className="flex flex-wrap gap-1 mb-3">
          <Badge variant="outline" className="bg-slate-100">
            {coach.specialties}
          </Badge>
          <Badge variant="outline" className="bg-slate-100">
            {coach.experience}
          </Badge>
        </div>
        <StarRating rating={coach.rating} />
        <div className="line-clamp-3 mt-2 text-sm text-gray-600">
          {coach.biography}
        </div>
      </CardContent>
      <Separator />
      <CardFooter className="pt-4 pb-4 flex flex-col gap-2">
        <div className="flex justify-between items-center w-full">
          <div className="font-medium">
            {coach.hourlyRate ? `$${coach.hourlyRate.toFixed(2)}/hr` : "Contact for rates"}
          </div>
          <Button 
            size="sm" 
            onClick={() => setLocation(`/users/${coach.userId}`)}
          >
            View Profile
            <Eye className="h-4 w-4 ml-1" />
          </Button>
        </div>
        <Button 
          size="sm" 
          variant="secondary"
          className="w-full"
          onClick={() => setLocation(`/users/${coach.userId}`)}
        >
          Contact Coach
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coaching Marketplace</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Find quality workout plans for your clients or connect with expert coaches
          </p>
        </div>
      </div>

      <Tabs 
        defaultValue="plans" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="mb-8"
      >
        <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto mb-6">
          <TabsTrigger value="plans">Workout Plans</TabsTrigger>
          <TabsTrigger value="coaches">Coaches</TabsTrigger>
        </TabsList>

        {/* Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <Input
              placeholder={`Search ${activeTab === "plans" ? "workout plans" : "coaches"}...`}
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {isSearching && (
            <Button onClick={clearSearch} variant="outline" className="md:w-auto w-full">
              Clear Search
            </Button>
          )}
        </div>

        <TabsContent value="plans">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center">
              <Award className="mr-2 h-6 w-6 text-amber-500" />
              {isSearching ? `Search Results for "${searchQuery}"` : "Available Workout Plans"}
            </h2>
            {isSearching && (
              <Button 
                variant="link" 
                onClick={clearSearch}
              >
                View all
              </Button>
            )}
          </div>

          {plansLoading ? (
            <div className="text-center py-8">Loading workout plans...</div>
          ) : plansError ? (
            <div className="text-center py-8 text-red-500">
              Error loading workout plans. Please try again.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workoutPlans.length > 0 ? (
                workoutPlans.map((plan: WorkoutPlan) => (
                  <WorkoutPlanCard key={plan.id} plan={plan} />
                ))
              ) : (
                <div className="col-span-3 text-center py-8">
                  {isSearching ? `No workout plans found for "${searchQuery}"` : "No workout plans found. Check back later!"}
                </div>
              )}
            </div>
          )}


        </TabsContent>

        <TabsContent value="coaches">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center">
              <Award className="mr-2 h-6 w-6 text-amber-500" />
              {isSearching ? `Search Results for "${searchQuery}"` : "Featured Coaches"}
            </h2>
            {isSearching && (
              <Button 
                variant="link" 
                onClick={clearSearch}
              >
                View all
              </Button>
            )}
          </div>

          {coachesLoading ? (
            <div className="text-center py-8">Loading coaches...</div>
          ) : coachesError ? (
            <div className="text-center py-8 text-red-500">
              Error loading coaches. Please try again.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coaches.length > 0 ? (
                coaches.map((coach: CoachProfile) => (
                  <CoachCard key={coach.id} coach={coach} />
                ))
              ) : (
                <div className="col-span-3 text-center py-8">
                  {isSearching ? `No coaches found for "${searchQuery}"` : "No coaches found. Check back later!"}
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Become a Coach CTA */}
      <div className="mt-16 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold mb-2">Are you a fitness professional?</h2>
        <p className="mb-6 max-w-xl mx-auto">
          Join our marketplace to offer your coaching services and workout plans to thousands of fitness enthusiasts!
        </p>
        <Button variant="secondary" size="lg" onClick={() => setLocation("/become-coach")}>
          Become a Coach
        </Button>
      </div>
    </div>
  );
}
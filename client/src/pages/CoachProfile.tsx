import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  ChevronLeft, 
  Star, 
  Award, 
  Calendar, 
  Mail, 
  MapPin, 
  ExternalLink, 
  MessageCircle,
  Phone,
  Clock,
  Users,
  ShoppingCart
} from 'lucide-react';
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
  createdAt: Date;
  updatedAt: Date;
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

export default function CoachProfile() {
  const params = useParams<{ id: string }>();
  const [location, setLocation] = useLocation();
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const { toast } = useToast();
  const coachId = parseInt(params.id);

  const { 
    data: coach, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['/api/coaches', coachId],
    queryFn: () => fetch(`/api/coaches/${coachId}`).then(res => res.json()),
    enabled: !isNaN(coachId)
  });

  const { 
    data: plans = [], 
    isLoading: plansLoading
  } = useQuery({
    queryKey: ['/api/workout-plans', { coachId }],
    queryFn: () => fetch(`/api/workout-plans?coachId=${coachId}`).then(res => res.json()),
    enabled: !isNaN(coachId)
  });

  const { 
    data: services = [], 
    isLoading: servicesLoading
  } = useQuery({
    queryKey: ['/api/coaching-services', { coachId }],
    queryFn: () => fetch(`/api/coaching-services?coachId=${coachId}`).then(res => res.json()),
    enabled: !isNaN(coachId)
  });

  const { 
    data: reviews = [], 
    isLoading: reviewsLoading
  } = useQuery({
    queryKey: ['/api/reviews', { coachId }],
    queryFn: () => fetch(`/api/reviews?coachId=${coachId}`).then(res => res.json()),
    enabled: !isNaN(coachId)
  });

  const handleContactCoach = async () => {
    // In a real app, this would send a message to the coach
    toast({
      title: "Message Sent",
      description: "Your message has been sent to the coach. They will respond to you shortly.",
      variant: "default",
    });
    setContactDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-16 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4">Loading coach profile...</p>
      </div>
    );
  }

  if (error || !coach) {
    return (
      <div className="container mx-auto py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Error Loading Coach Profile</h2>
        <p className="mb-8">There was a problem loading this coach profile.</p>
        <Button onClick={() => setLocation('/marketplace')}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Marketplace
        </Button>
      </div>
    );
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

  // Format certifications
  const formattedCertifications = coach.user?.certifications 
    ? coach.user.certifications.split(',').map(cert => cert.trim())
    : [];
  
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
          <div className="mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-4">
              <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold">
                {coach.user?.name?.charAt(0) || "C"}
              </div>
              <div>
                <div className="flex items-center">
                  <h1 className="text-3xl font-bold tracking-tight mr-2">
                    {coach.user?.name || "Coach"}
                  </h1>
                  {coach.isVerified && (
                    <Badge className="bg-blue-500">
                      <Award className="mr-1 h-4 w-4" />
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="text-xl text-gray-500">{coach.title}</p>
                <div className="flex items-center mt-1">
                  <StarRating rating={coach.rating} />
                  {coach.ratingsCount && (
                    <span className="ml-1 text-sm text-gray-500">
                      ({coach.ratingsCount} reviews)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mb-6">
              {coach.user?.location && (
                <div className="flex items-center text-gray-600">
                  <MapPin className="mr-1 h-4 w-4" />
                  {coach.user.location}
                </div>
              )}
              {coach.user?.experienceYears && (
                <div className="flex items-center text-gray-600">
                  <Calendar className="mr-1 h-4 w-4" />
                  {coach.user.experienceYears} years experience
                </div>
              )}
              {coach.hourlyRate && (
                <div className="flex items-center text-gray-600">
                  <Clock className="mr-1 h-4 w-4" />
                  ${coach.hourlyRate.toFixed(2)}/hour
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {coach.specialties.split(',').map((specialty, index) => (
                <Badge key={index} variant="outline" className="bg-slate-100">
                  {specialty.trim()}
                </Badge>
              ))}
            </div>

            <p className="text-gray-700 mb-6 whitespace-pre-line">
              {coach.biography}
            </p>
          </div>

          <Tabs defaultValue="programs">
            <TabsList className="mb-6">
              <TabsTrigger value="programs">Workout Programs</TabsTrigger>
              <TabsTrigger value="services">Coaching Services</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
            </TabsList>
            
            <TabsContent value="programs">
              <h2 className="text-2xl font-bold mb-4">Workout Programs</h2>
              
              {plansLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                  <p className="mt-2">Loading workout programs...</p>
                </div>
              ) : plans.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {plans.map((plan: WorkoutPlan) => (
                    <Card key={plan.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        {plan.isFeatured && (
                          <Badge className="w-fit mb-2 bg-amber-500">Featured</Badge>
                        )}
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
                        <StarRating rating={plan.rating} />
                        {plan.sales && (
                          <div className="flex items-center mt-2 text-sm text-gray-600">
                            <Users className="h-4 w-4 mr-1" />
                            {plan.sales} sold
                          </div>
                        )}
                      </CardContent>
                      <Separator />
                      <CardFooter className="pt-4 pb-4 flex justify-between items-center">
                        <div className="font-bold text-lg">${plan.price.toFixed(2)}</div>
                        <Button 
                          size="sm"
                          onClick={() => setLocation(`/workout-plans/${plan.id}`)}
                        >
                          View Details
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border rounded-lg">
                  <p className="text-gray-500">No workout programs available</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="services">
              <h2 className="text-2xl font-bold mb-4">Coaching Services</h2>
              
              {servicesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                  <p className="mt-2">Loading coaching services...</p>
                </div>
              ) : services.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {services.map((service: CoachingService) => (
                    <Card key={service.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-lg">{service.title}</CardTitle>
                        <CardDescription>
                          {service.serviceType} - {service.durationType}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 mb-4">{service.description}</p>
                      </CardContent>
                      <Separator />
                      <CardFooter className="pt-4 pb-4 flex justify-between items-center">
                        <div className="font-bold text-lg">${service.price.toFixed(2)}</div>
                        <Button>Book Now</Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border rounded-lg">
                  <p className="text-gray-500">No coaching services available</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="reviews">
              <h2 className="text-2xl font-bold mb-4">Client Reviews</h2>
              
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
            
            <TabsContent value="about">
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold mb-4">About {coach.user?.name || "Coach"}</h2>
                  <p className="text-gray-700 whitespace-pre-line">
                    {coach.biography}
                  </p>
                </div>
                
                {formattedCertifications.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold mb-3">Certifications</h3>
                    <ul className="space-y-2">
                      {formattedCertifications.map((cert, index) => (
                        <li key={index} className="flex items-center">
                          <Award className="mr-2 h-4 w-4 text-amber-500" />
                          {cert}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {coach.user?.socialMedia && Object.values(coach.user.socialMedia).some(val => val) && (
                  <div>
                    <h3 className="text-xl font-bold mb-3">Connect</h3>
                    <div className="flex gap-4">
                      {coach.user.socialMedia.instagram && (
                        <a 
                          href={`https://instagram.com/${coach.user.socialMedia.instagram}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-600 hover:underline"
                        >
                          <ExternalLink className="mr-1 h-4 w-4" />
                          Instagram
                        </a>
                      )}
                      {coach.user.socialMedia.twitter && (
                        <a 
                          href={`https://twitter.com/${coach.user.socialMedia.twitter}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-600 hover:underline"
                        >
                          <ExternalLink className="mr-1 h-4 w-4" />
                          Twitter
                        </a>
                      )}
                      {coach.user.socialMedia.facebook && (
                        <a 
                          href={`https://facebook.com/${coach.user.socialMedia.facebook}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-600 hover:underline"
                        >
                          <ExternalLink className="mr-1 h-4 w-4" />
                          Facebook
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact {coach.user?.name || "Coach"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full" 
                  onClick={() => setContactDialogOpen(true)}
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Send Message
                </Button>
                
                {coach.isAvailableForHire ? (
                  <Badge className="w-full justify-center py-1.5" variant="outline">
                    Available for Coaching
                  </Badge>
                ) : (
                  <Badge className="w-full justify-center py-1.5" variant="secondary">
                    Currently Unavailable
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Featured Workout Plan */}
            {plans && plans.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Featured Program</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="font-bold">{plans[0].title}</div>
                  <div className="text-sm text-gray-500 line-clamp-2">{plans[0].description}</div>
                  <div className="flex items-center mt-1">
                    <StarRating rating={plans[0].rating} />
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Badge variant="outline" className="bg-slate-100">
                      {plans[0].difficultyLevel}
                    </Badge>
                    <Badge variant="outline" className="bg-slate-100">
                      {plans[0].durationWeeks} weeks
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                  <div className="font-bold">${plans[0].price.toFixed(2)}</div>
                  <Button 
                    size="sm"
                    onClick={() => setLocation(`/workout-plans/${plans[0].id}`)}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    View Plan
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Contact Dialog */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact {coach.user?.name || "Coach"}</DialogTitle>
            <DialogDescription>
              Send a message to {coach.user?.name || "this coach"} to discuss your fitness goals and how they can help you.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <textarea 
              className="w-full min-h-[150px] p-3 border rounded-md"
              placeholder="Enter your message..."
            />
            
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center">
                <Mail className="mr-2 h-4 w-4 text-gray-500" />
                <span>Response will be sent to your registered email</span>
              </div>
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-gray-500" />
                <span>Typical response time: 24-48 hours</span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setContactDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleContactCoach}>
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
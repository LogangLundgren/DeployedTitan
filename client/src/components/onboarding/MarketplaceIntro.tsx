import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Dumbbell, Users, Search, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';

interface WorkoutPlan {
  id: number;
  title: string;
  description: string;
  price: number;
  difficultyLevel: string;
  category: string;
  featuredImageUrl: string | null;
  coachId: number;
  coachName?: string;
}

interface MarketplaceIntroProps {
  onComplete: () => void;
}

export default function MarketplaceIntro({ onComplete }: MarketplaceIntroProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [featuredPlans, setFeaturedPlans] = useState<WorkoutPlan[]>([]);

  useEffect(() => {
    const fetchFeaturedPlans = async () => {
      try {
        const response = await fetch('/api/workout-plans?featured=true&limit=3');
        const data = await response.json();
        setFeaturedPlans(data);
      } catch (error) {
        console.error('Error fetching workout plans:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedPlans();
  }, []);

  const handleContinue = async () => {
    try {
      // Update the onboarding step
      await apiRequest('POST', '/api/user/update-onboarding-step', { 
        step: 'social_connection' 
      });
      
      // Invalidate user data
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
      onComplete();
    } catch (error) {
      console.error('Error updating onboarding step:', error);
      toast({
        title: 'Error',
        description: 'Failed to update your progress. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const features = [
    {
      icon: <Dumbbell className="h-10 w-10 text-primary" />,
      title: 'Pro Workout Plans',
      description: 'Access workout plans created by certified fitness professionals'
    },
    {
      icon: <Users className="h-10 w-10 text-primary" />,
      title: 'Find Coaches',
      description: 'Connect with coaches who can help you reach your fitness goals'
    },
    {
      icon: <Search className="h-10 w-10 text-primary" />,
      title: 'Discover Content',
      description: 'Find content tailored to your specific fitness level and goals'
    },
    {
      icon: <ShoppingCart className="h-10 w-10 text-primary" />,
      title: 'Purchase Programs',
      description: 'Get premium workout plans and coaching services'
    }
  ];

  return (
    <div className="space-y-8">
      <Card className="w-full overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/50 to-primary/10">
          <CardTitle className="text-2xl">Discover the Marketplace</CardTitle>
          <CardDescription className="text-foreground/80">
            Find workout plans, connect with coaches, and take your fitness to the next level
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-medium mb-4">What You'll Find</h3>
              <div className="space-y-4">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start space-x-3"
                  >
                    <div className="mt-0.5 p-2 bg-primary/10 rounded-lg">
                      {feature.icon}
                    </div>
                    <div>
                      <h4 className="font-medium">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-4">Featured Plans</h3>
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : featuredPlans.length > 0 ? (
                <div className="space-y-4">
                  {featuredPlans.map((plan) => (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
                    >
                      <div className="flex justify-between">
                        <div>
                          <h4 className="font-medium">{plan.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {plan.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-lg">${plan.price.toFixed(2)}</span>
                          <p className="text-xs text-muted-foreground">{plan.difficultyLevel}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground mb-2" />
                  <h4 className="font-medium">No featured plans yet</h4>
                  <p className="text-sm text-muted-foreground">
                    Check back soon for featured workout plans
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-8 pt-4 border-t">
            <Button 
              onClick={handleContinue}
              className="w-full"
            >
              Explore More in the Marketplace
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
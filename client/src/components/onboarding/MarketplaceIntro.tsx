import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, 
  Dumbbell, 
  Star, 
  Clock, 
  BookOpen,
  Calendar,
  Users,
  Award
} from "lucide-react";

interface MarketplaceIntroProps {
  onComplete: () => void;
}

export default function MarketplaceIntro({ onComplete }: MarketplaceIntroProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Discover Workout Plans and Coaches</h3>
        <p className="text-sm text-muted-foreground">
          Browse our marketplace to find professionally designed workout plans or
          connect with expert coaches to reach your fitness goals.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="overflow-hidden border-2 border-primary/20 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between mb-1">
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20 px-2 py-0 text-xs">
                Featured
              </Badge>
              <div className="flex items-center text-amber-500">
                <Star className="h-3.5 w-3.5 fill-current" />
                <Star className="h-3.5 w-3.5 fill-current" />
                <Star className="h-3.5 w-3.5 fill-current" />
                <Star className="h-3.5 w-3.5 fill-current" />
                <Star className="h-3.5 w-3.5 fill-current stroke-amber-500/50" />
                <span className="ml-1 text-xs text-muted-foreground">(42)</span>
              </div>
            </div>
            <CardTitle className="text-base">12-Week Strength Fundamentals</CardTitle>
            <CardDescription className="flex items-center text-xs">
              <Users className="h-3.5 w-3.5 mr-1" />
              <span>412 users</span>
              <span className="mx-1">•</span>
              <Clock className="h-3.5 w-3.5 mr-1" />
              <span>12 weeks</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="flex items-center text-sm gap-2">
                <Dumbbell className="h-4 w-4 text-primary" />
                <span className="truncate">Full body strength progression</span>
              </div>
              <div className="flex items-center text-sm gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="truncate">4 workouts per week</span>
              </div>
              <div className="flex items-center text-sm gap-2">
                <ShoppingCart className="h-4 w-4 text-primary" />
                <span className="truncate">$39.99</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-2 border-primary/20 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between mb-1">
              <Badge variant="outline" className="bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border-orange-200 px-2 py-0 text-xs">
                Coach
              </Badge>
              <div className="flex items-center text-amber-500">
                <Star className="h-3.5 w-3.5 fill-current" />
                <Star className="h-3.5 w-3.5 fill-current" />
                <Star className="h-3.5 w-3.5 fill-current" />
                <Star className="h-3.5 w-3.5 fill-current" />
                <Star className="h-3.5 w-3.5 fill-current" />
                <span className="ml-1 text-xs text-muted-foreground">(87)</span>
              </div>
            </div>
            <CardTitle className="text-base">Sarah Thompson</CardTitle>
            <CardDescription className="flex items-center text-xs">
              <Award className="h-3.5 w-3.5 mr-1" />
              <span>Certified Personal Trainer</span>
              <span className="mx-1">•</span>
              <Users className="h-3.5 w-3.5 mr-1" />
              <span>500+ clients</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="flex items-center text-sm gap-2">
                <BookOpen className="h-4 w-4 text-orange-500" />
                <span className="truncate">Specializes in weight loss & strength</span>
              </div>
              <div className="flex items-center text-sm gap-2">
                <Calendar className="h-4 w-4 text-orange-500" />
                <span className="truncate">Personalized 1:1 coaching</span>
              </div>
              <div className="flex items-center text-sm gap-2">
                <ShoppingCart className="h-4 w-4 text-orange-500" />
                <span className="truncate">$79.99/month</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2 mt-6">
        <h4 className="text-sm font-medium">Get started with the marketplace</h4>
        <p className="text-sm text-muted-foreground">
          Browse plans that match your goals, or find a coach who can help you achieve them.
          You'll be able to explore all of these options after completing the onboarding process.
        </p>
      </div>
    </div>
  );
}
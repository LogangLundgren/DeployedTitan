import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, UserPlus, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  username: string;
  name: string | null;
  email: string | null;
  location: string | null;
  bio: string | null;
  isCoach: boolean | null;
}

interface SocialConnectionProps {
  onComplete: () => void;
}

export default function SocialConnection({ onComplete }: SocialConnectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followedUsers, setFollowedUsers] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchSuggestedUsers = async () => {
      try {
        setIsLoading(true);
        // Fetch suggested users (including the owner user and some coaches)
        const response = await fetch("/api/user-suggestions");
        if (!response.ok) {
          throw new Error("Failed to fetch suggested users");
        }
        
        const data = await response.json();
        
        // Add the owner first in the list
        const owner = data.find((u: User) => u.id === 1);
        
        // Get remaining users but limit to 4 more suggestions
        const suggestions = data
          .filter((u: User) => u.id !== 1 && u.id !== user?.id)
          .slice(0, 4);
        
        // Combine the owner with other suggestions
        const combinedSuggestions = owner ? [owner, ...suggestions] : suggestions;
        
        setSuggestedUsers(combinedSuggestions);
      } catch (error) {
        console.error("Error fetching suggested users:", error);
        toast({
          title: "Error",
          description: "Failed to load suggested users. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestedUsers();
  }, [user?.id, toast]);

  const handleFollow = async (userId: number) => {
    try {
      // Optimistically update UI
      setFollowedUsers(prev => new Set(prev).add(userId));
      
      // Make API call to follow the user
      const response = await apiRequest("POST", "/api/follows", { followingId: userId });
      
      if (!response.ok) {
        // If request fails, revert the UI change
        setFollowedUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
        throw new Error("Failed to follow user");
      }
      
      toast({
        title: "Success",
        description: "You are now following this user!",
      });
    } catch (error) {
      console.error("Error following user:", error);
      toast({
        title: "Error",
        description: "Failed to follow user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderUserCard = (user: User, showInteractionHint = false) => (
    <Card key={user.id} className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={`https://avatar.vercel.sh/${user.username}`} />
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">
                {user.name || user.username}
                {user.id === 1 && (
                  <Badge className="ml-2 bg-primary/20 text-primary hover:bg-primary/30">
                    Owner
                  </Badge>
                )}
                {user.isCoach && (
                  <Badge className="ml-2 bg-orange-500/20 text-orange-700 hover:bg-orange-500/30 border-orange-200">
                    Coach
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs">@{user.username}</CardDescription>
            </div>
          </div>
          {!followedUsers.has(user.id) ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-1 h-8"
              onClick={() => handleFollow(user.id)}
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Follow</span>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 h-8 text-green-600 pointer-events-none"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Following</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-3">
        {user.bio ? (
          <p className="text-sm text-muted-foreground line-clamp-2">{user.bio}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">No bio provided</p>
        )}
        {showInteractionHint && (
          <p className="text-xs text-primary mt-2">
            <strong>Tip:</strong> Follow the owner to stay updated with platform news and tips!
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Connect with Other Users</h3>
        <p className="text-sm text-muted-foreground">
          Follow other users to see their workout progress, templates, and achievements.
          Building a network will help you stay motivated and discover new workout ideas.
        </p>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <>
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-9 w-20" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0 pb-3">
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            {suggestedUsers.length > 0 ? (
              <div className="space-y-3">
                {suggestedUsers.map((user, index) => 
                  renderUserCard(user, user.id === 1)
                )}
              </div>
            ) : (
              <p className="text-center py-6 text-muted-foreground">
                No suggested users available at the moment.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
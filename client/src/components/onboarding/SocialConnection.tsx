import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, UserPlus, Users, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';

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
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [ownerId, setOwnerId] = useState<number | null>(null);
  const [following, setFollowing] = useState<number[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Load suggested users and following status
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get suggested users (including the owner)
        const usersResponse = await fetch('/api/users/suggested');
        const usersData = await usersResponse.json();
        setUsers(usersData);
        
        // Find the owner (user with ID 1)
        const owner = usersData.find((u: User) => u.id === 1);
        if (owner) {
          setOwnerId(owner.id);
        }
        
        // Get curated suggestions (excluding the owner and current user)
        const suggestions = usersData.filter((u: User) => 
          u.id !== user?.id && u.id !== 1 && u.isCoach
        ).slice(0, 3);
        setSuggestedUsers(suggestions);
        
        // Get current following list
        const followingResponse = await fetch(`/api/users/${user?.id}/following`);
        const followingData = await followingResponse.json();
        setFollowing(followingData.map((f: any) => f.followingId));
      } catch (error) {
        console.error('Error fetching social data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(`/api/users/search?query=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setSuggestedUsers(data.filter((u: User) => u.id !== user?.id).slice(0, 5));
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: 'Search failed',
        description: 'Unable to search for users. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleFollow = async (userId: number) => {
    try {
      await apiRequest('POST', `/api/users/${user?.id}/follow`, { followingId: userId });
      
      setFollowing(prev => [...prev, userId]);
      
      toast({
        title: 'Success!',
        description: 'You are now following this user.',
      });
    } catch (error) {
      console.error('Error following user:', error);
      toast({
        title: 'Action failed',
        description: 'Unable to follow this user. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleUnfollow = async (userId: number) => {
    try {
      await apiRequest('DELETE', `/api/users/${user?.id}/unfollow/${userId}`);
      
      setFollowing(prev => prev.filter(id => id !== userId));
      
      toast({
        title: 'Unfollowed',
        description: 'You are no longer following this user.',
      });
    } catch (error) {
      console.error('Error unfollowing user:', error);
      toast({
        title: 'Action failed',
        description: 'Unable to unfollow this user. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleContinue = async () => {
    try {
      // Update the onboarding step
      await apiRequest('POST', '/api/user/update-onboarding-step', { 
        step: 'completed' 
      });
      
      // Mark onboarding as completed
      await apiRequest('POST', '/api/user/complete-onboarding');
      
      // Invalidate user data
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
      onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete onboarding. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Check if the user is following the owner
  const isFollowingOwner = ownerId ? following.includes(ownerId) : false;

  const renderUserCard = (user: User, showInteractionHint = false) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between p-4 border rounded-lg mb-3 bg-card"
    >
      <div className="flex items-center space-x-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={`https://avatar.vercel.sh/${user.username || user.id}`} />
          <AvatarFallback>
            {user.name ? user.name.substring(0, 2).toUpperCase() : user.username.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium">
            {user.name || user.username}
            {user.isCoach && <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Coach</span>}
          </div>
          {user.location && <p className="text-xs text-muted-foreground">{user.location}</p>}
        </div>
      </div>
      
      <div>
        {following.includes(user.id) ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleUnfollow(user.id)}
          >
            Following
          </Button>
        ) : (
          <Button
            variant={user.id === ownerId ? "default" : "outline"}
            size="sm"
            onClick={() => handleFollow(user.id)}
            className={user.id === ownerId ? "animate-pulse" : ""}
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Follow
          </Button>
        )}
      </div>
      
      {showInteractionHint && user.id === ownerId && !isFollowingOwner && (
        <div className="absolute -top-8 right-8 bg-primary text-primary-foreground px-3 py-1 rounded-md text-xs">
          👋 Follow the creator of Titan Fitness!
          <div className="absolute -bottom-2 right-10 w-3 h-3 bg-primary rotate-45"></div>
        </div>
      )}
    </motion.div>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-80">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Connect with the Community</CardTitle>
        <CardDescription>
          Follow other fitness enthusiasts to see their workouts and progress
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Owner spotlight if available */}
        {ownerId && users.find(u => u.id === ownerId) && (
          <div className="mb-8 relative">
            <h3 className="text-lg font-medium mb-3">Creator Spotlight</h3>
            {renderUserCard(users.find(u => u.id === ownerId)!, true)}
          </div>
        )}
        
        {/* Search */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Find People</h3>
          <div className="flex space-x-2">
            <Input
              placeholder="Search by name or username"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        {/* Suggested users */}
        <div>
          <h3 className="text-lg font-medium mb-3">
            {searchQuery ? 'Search Results' : 'Suggested Users'} 
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({suggestedUsers.length})
            </span>
          </h3>
          
          {suggestedUsers.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-md">
              <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                {searchQuery ? 'No users found matching your search' : 'No suggested users at the moment'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {suggestedUsers.map(user => renderUserCard(user))}
            </div>
          )}
        </div>
        
        <div className="mt-8 pt-4 border-t">
          <Button 
            onClick={handleContinue}
            className="w-full"
          >
            Complete Onboarding
          </Button>
          <p className="text-center text-sm text-muted-foreground mt-2">
            You can always find and follow more people later
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
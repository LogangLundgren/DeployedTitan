import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

interface FollowContextType {
  followedUsers: number[];
  followUser: (userId: number, userName: string) => void;
  unfollowUser: (userId: number, userName: string) => void;
  isFollowing: (userId: number) => boolean;
  isLoading: boolean;
  error: Error | null;
}

const FollowContext = createContext<FollowContextType | undefined>(undefined);

export function FollowProvider({ children }: { children: ReactNode }) {
  const [followedUsers, setFollowedUsers] = useState<number[]>([]);
  const { toast } = useToast();

  // Fetch the user's followed users from the API
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/users/following'],
    queryFn: async () => {
      const response = await fetch('/api/users/following');
      if (!response.ok) {
        if (response.status === 401) {
          // Not authenticated, don't throw error
          return [];
        }
        throw new Error('Failed to fetch followed users');
      }
      return response.json();
    },
  });
  
  // Update the followedUsers state when the query data changes
  useEffect(() => {
    if (data && Array.isArray(data)) {
      // Extract just the user IDs from the followed users array
      const followedIds = data.map((user: any) => user.id);
      setFollowedUsers(followedIds);
    }
  }, [data]);

  // Follow user mutation
  const followUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to follow user");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate the following list query to refetch
      queryClient.invalidateQueries({ queryKey: ['/api/users/following'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Unfollow user mutation
  const unfollowUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/users/${userId}/unfollow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to unfollow user");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate the following list query to refetch
      queryClient.invalidateQueries({ queryKey: ['/api/users/following'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const followUser = (userId: number, userName: string) => {
    // Optimistically update the UI
    if (!followedUsers.includes(userId)) {
      setFollowedUsers(prev => [...prev, userId]);
    }
    
    // Call the API
    followUserMutation.mutate(userId, {
      onSuccess: () => {
        toast({
          title: `Following ${userName}`,
          description: `You are now following ${userName}. You'll see their workouts in your feed.`,
        });
      },
      onError: () => {
        // Rollback optimistic update on error
        setFollowedUsers(prev => prev.filter(id => id !== userId));
      }
    });
  };

  const unfollowUser = (userId: number, userName: string) => {
    // Optimistically update the UI
    if (followedUsers.includes(userId)) {
      setFollowedUsers(prev => prev.filter(id => id !== userId));
    }
    
    // Call the API
    unfollowUserMutation.mutate(userId, {
      onSuccess: () => {
        toast({
          title: `Unfollowed ${userName}`,
          description: `You are no longer following ${userName}.`,
        });
      },
      onError: () => {
        // Rollback optimistic update on error
        if (!followedUsers.includes(userId)) {
          setFollowedUsers(prev => [...prev, userId]);
        }
      }
    });
  };

  const isFollowing = (userId: number) => {
    return followedUsers.includes(userId);
  };

  return (
    <FollowContext.Provider value={{ 
      followedUsers, 
      followUser, 
      unfollowUser, 
      isFollowing,
      isLoading,
      error: error instanceof Error ? error : null
    }}>
      {children}
    </FollowContext.Provider>
  );
}

export function useFollow() {
  const context = useContext(FollowContext);
  if (context === undefined) {
    throw new Error('useFollow must be used within a FollowProvider');
  }
  return context;
}
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

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
  const { isLoading, error } = useQuery({
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
    onSuccess: (data) => {
      if (Array.isArray(data)) {
        // Extract just the user IDs from the followed users array
        const followedIds = data.map((user) => user.id);
        setFollowedUsers(followedIds);
      }
    },
  });

  const followUser = (userId: number, userName: string) => {
    setFollowedUsers(prev => {
      if (prev.includes(userId)) return prev;
      return [...prev, userId];
    });
    
    toast({
      title: `Following ${userName}`,
      description: `You are now following ${userName}. You'll see their workouts in your feed.`,
    });
  };

  const unfollowUser = (userId: number, userName: string) => {
    setFollowedUsers(prev => prev.filter(id => id !== userId));
    
    toast({
      title: `Unfollowed ${userName}`,
      description: `You are no longer following ${userName}.`,
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
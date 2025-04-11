import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";

interface FollowContextType {
  followedUsers: number[];
  followUser: (userId: number, userName: string) => void;
  unfollowUser: (userId: number, userName: string) => void;
  isFollowing: (userId: number) => boolean;
}

const FollowContext = createContext<FollowContextType | undefined>(undefined);

export function FollowProvider({ children }: { children: ReactNode }) {
  const [followedUsers, setFollowedUsers] = useState<number[]>([]);
  const { toast } = useToast();

  // Initialize with some demo followed users
  useEffect(() => {
    // In a real app, this would be loaded from an API
    setFollowedUsers([2]); // Initially following Jessica
  }, []);

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
    <FollowContext.Provider value={{ followedUsers, followUser, unfollowUser, isFollowing }}>
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
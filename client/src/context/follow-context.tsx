import { 
  createContext, 
  ReactNode, 
  useContext, 
  useState,
  useEffect
} from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface FollowContextType {
  isFollowing: Record<number, boolean>;
  followerCounts: Record<number, number>;
  isLoading: boolean;
  toggleFollow: (userId: number) => Promise<void>;
  checkFollowStatus: (userId: number) => boolean;
  getFollowerCount: (userId: number) => number;
  refreshFollowData: (userId: number) => Promise<void>;
}

const FollowContext = createContext<FollowContextType | null>(null);

export function FollowProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState<Record<number, boolean>>({});
  const [followerCounts, setFollowerCounts] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Load user's follow data on mount
  useEffect(() => {
    if (!user) return;
    
    const loadFollowData = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest("GET", "/api/users/following");
        const followings = await response.json();
        
        // Convert to lookup maps for O(1) access
        const followMap: Record<number, boolean> = {};
        const countMap: Record<number, number> = {};
        
        followings.forEach((follow: any) => {
          if (follow.followedId) {
            followMap[follow.followedId] = true;
            // Initialize count for this user
            if (!countMap[follow.followedId]) {
              countMap[follow.followedId] = 0;
            }
          }
        });
        
        // Get follower counts
        const countsResponse = await apiRequest("GET", "/api/users/follower-counts");
        const counts = await countsResponse.json();
        
        counts.forEach((item: any) => {
          if (item.userId && typeof item.count === 'number') {
            countMap[item.userId] = item.count;
          }
        });
        
        setIsFollowing(followMap);
        setFollowerCounts(countMap);
      } catch (error) {
        console.error("Error loading follow data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadFollowData();
  }, [user]);

  // Toggle follow status for a user
  const toggleFollow = async (userId: number) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to follow users",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const currentlyFollowing = isFollowing[userId] || false;
      
      if (currentlyFollowing) {
        // Unfollow
        await apiRequest("DELETE", `/api/users/${userId}/follow`);
        
        setIsFollowing(prev => ({
          ...prev,
          [userId]: false
        }));
        
        setFollowerCounts(prev => ({
          ...prev,
          [userId]: Math.max(0, (prev[userId] || 0) - 1)
        }));
        
        toast({
          title: "Unfollowed",
          description: "You are no longer following this user",
        });
      } else {
        // Follow
        await apiRequest("POST", `/api/users/${userId}/follow`);
        
        setIsFollowing(prev => ({
          ...prev,
          [userId]: true
        }));
        
        setFollowerCounts(prev => ({
          ...prev,
          [userId]: (prev[userId] || 0) + 1
        }));
        
        toast({
          title: "Following",
          description: "You are now following this user",
        });
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive"
      });
    }
  };

  // Check if the current user is following a specific user
  const checkFollowStatus = (userId: number): boolean => {
    return isFollowing[userId] || false;
  };

  // Get the follower count for a specific user
  const getFollowerCount = (userId: number): number => {
    return followerCounts[userId] || 0;
  };
  
  // Refresh follow data for a specific user (useful after profile changes)
  const refreshFollowData = async (userId: number) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Check if current user is following the specified user
      const statusResponse = await apiRequest("GET", `/api/users/${userId}/follow-status`);
      const status = await statusResponse.json();
      
      // Get follower count for the specified user
      const countResponse = await apiRequest("GET", `/api/users/${userId}/follower-count`);
      const count = await countResponse.json();
      
      setIsFollowing(prev => ({
        ...prev,
        [userId]: status.isFollowing
      }));
      
      setFollowerCounts(prev => ({
        ...prev,
        [userId]: count.count
      }));
    } catch (error) {
      console.error("Error refreshing follow data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FollowContext.Provider
      value={{
        isFollowing,
        followerCounts,
        isLoading,
        toggleFollow,
        checkFollowStatus,
        getFollowerCount,
        refreshFollowData
      }}
    >
      {children}
    </FollowContext.Provider>
  );
}

export function useFollow() {
  const context = useContext(FollowContext);
  if (!context) {
    throw new Error("useFollow must be used within a FollowProvider");
  }
  return context;
}
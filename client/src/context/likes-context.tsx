import { 
  createContext, 
  ReactNode, 
  useContext, 
  useEffect, 
  useState 
} from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

// Interface for LikesContextType
interface LikesContextType {
  likedWorkouts: Record<number, boolean>;
  likesCount: Record<number, number>;
  isLoading: boolean;
  toggleLike: (workoutId: number) => Promise<void>;
  hasLiked: (workoutId: number) => boolean;
  getLikesCount: (workoutId: number) => number;
}

// Create context with a default value
const LikesContext = createContext<LikesContextType | null>(null);

// Provider component
export function LikesProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [likedWorkouts, setLikedWorkouts] = useState<Record<number, boolean>>({});
  const [likesCount, setLikesCount] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Load likes data on mount and when the user changes
  useEffect(() => {
    const loadLikes = async () => {
      if (!user) return; // Only load likes if we have a user
      
      try {
        setIsLoading(true);
        const response = await apiRequest("GET", "/api/likes");
        const data = await response.json();
        
        // Convert array of likes to a map for easy lookup
        const likedMap: Record<number, boolean> = {};
        const countMap: Record<number, number> = {};
        
        // Process likes data
        data.forEach((like: any) => {
          // Map workout ID to liked status
          if (like.workoutId) {
            likedMap[like.workoutId] = true;
          }
          
          // Count likes per workout
          if (like.workoutId) {
            if (!countMap[like.workoutId]) {
              countMap[like.workoutId] = 0;
            }
            countMap[like.workoutId]++;
          }
        });
        
        setLikedWorkouts(likedMap);
        setLikesCount(countMap);
      } catch (error) {
        console.error("Error loading liked workouts:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadLikes();
  }, [user]);

  // Toggle like status for a workout
  const toggleLike = async (workoutId: number) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to like workouts",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Check if already liked
      const isCurrentlyLiked = likedWorkouts[workoutId] || false;
      
      if (isCurrentlyLiked) {
        // Unlike the workout
        await apiRequest("DELETE", `/api/likes/${workoutId}`);
        
        setLikedWorkouts(prev => ({
          ...prev,
          [workoutId]: false
        }));
        
        setLikesCount(prev => ({
          ...prev,
          [workoutId]: Math.max(0, (prev[workoutId] || 0) - 1)
        }));
        
        toast({
          title: "Unliked",
          description: "Workout removed from liked workouts",
        });
      } else {
        // Like the workout
        await apiRequest("POST", "/api/likes", { workoutId });
        
        setLikedWorkouts(prev => ({
          ...prev,
          [workoutId]: true
        }));
        
        setLikesCount(prev => ({
          ...prev,
          [workoutId]: (prev[workoutId] || 0) + 1
        }));
        
        toast({
          title: "Liked",
          description: "Workout added to liked workouts",
        });
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive"
      });
    }
  };

  // Check if the current user has liked a workout
  const hasLiked = (workoutId: number): boolean => {
    return likedWorkouts[workoutId] || false;
  };

  // Get the count of likes for a workout
  const getLikesCount = (workoutId: number): number => {
    return likesCount[workoutId] || 0;
  };

  return (
    <LikesContext.Provider value={{
      likedWorkouts,
      likesCount,
      isLoading,
      toggleLike,
      hasLiked,
      getLikesCount
    }}>
      {children}
    </LikesContext.Provider>
  );
}

// Hook to use likes context
export function useLikes() {
  const context = useContext(LikesContext);
  if (!context) {
    throw new Error("useLikes must be used within a LikesProvider");
  }
  return context;
}
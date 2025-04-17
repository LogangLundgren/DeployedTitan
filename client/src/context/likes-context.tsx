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
  const [isLoading, setIsLoading] = useState(true);

  // Load liked workouts from API
  useEffect(() => {
    if (user) {
      loadLikedWorkouts();
    } else {
      setLikedWorkouts({});
      setLikesCount({});
      setIsLoading(false);
    }
  }, [user]);

  // Load all user's liked workouts on mount
  const loadLikedWorkouts = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest("GET", "/api/likes");
      const data = await response.json();
      
      // Create a map of workoutId -> true
      const likedMap: Record<number, boolean> = {};
      const countsMap: Record<number, number> = {};
      
      // Process user likes
      if (Array.isArray(data.likes)) {
        data.likes.forEach((like: any) => {
          likedMap[like.workoutId] = true;
        });
      }
      
      // Process workout counts
      if (Array.isArray(data.counts)) {
        data.counts.forEach((count: any) => {
          countsMap[count.workoutId] = count.count || 0;
        });
      }
      
      setLikedWorkouts(likedMap);
      setLikesCount(countsMap);
    } catch (error) {
      console.error("Error loading liked workouts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle like status for a workout
  const toggleLike = async (workoutId: number) => {
    try {
      const isCurrentlyLiked = likedWorkouts[workoutId] || false;
      
      // Optimistically update UI
      setLikedWorkouts(prev => ({
        ...prev,
        [workoutId]: !isCurrentlyLiked
      }));
      
      // Update likes count
      setLikesCount(prev => ({
        ...prev,
        [workoutId]: (prev[workoutId] || 0) + (isCurrentlyLiked ? -1 : 1)
      }));
      
      // Send API request to update server
      if (isCurrentlyLiked) {
        await apiRequest("DELETE", `/api/workouts/${workoutId}/like`);
      } else {
        await apiRequest("POST", `/api/workouts/${workoutId}/like`);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      
      // Revert optimistic UI update on error
      const isCurrentlyLiked = likedWorkouts[workoutId] || false;
      setLikedWorkouts(prev => ({
        ...prev,
        [workoutId]: isCurrentlyLiked
      }));
      
      // Revert likes count
      setLikesCount(prev => ({
        ...prev,
        [workoutId]: (prev[workoutId] || 0) + (isCurrentlyLiked ? 1 : -1)
      }));
      
      toast({
        title: "Error updating like",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  // Check if user has liked a workout
  const hasLiked = (workoutId: number): boolean => {
    return !!likedWorkouts[workoutId];
  };

  // Get likes count for a workout
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
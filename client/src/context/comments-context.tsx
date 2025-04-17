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

// Comment interface
interface Comment {
  id: number;
  userId: number;
  workoutId: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  username?: string;
  profilePicture?: string;
}

// Interface for CommentsContextType
interface CommentsContextType {
  comments: Record<number, Comment[]>;
  isLoading: boolean;
  addComment: (workoutId: number, content: string) => Promise<void>;
  deleteComment: (commentId: number, workoutId: number) => Promise<void>;
  getComments: (workoutId: number) => Comment[];
  getCommentsCount: (workoutId: number) => number;
  loadCommentsForWorkout: (workoutId: number) => Promise<void>;
}

// Create context with a default value
const CommentsContext = createContext<CommentsContextType | null>(null);

// Provider component
export function CommentsProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [comments, setComments] = useState<Record<number, Comment[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadedWorkouts, setLoadedWorkouts] = useState<number[]>([]);

  // Load comments for a specific workout
  const loadCommentsForWorkout = async (workoutId: number) => {
    if (loadedWorkouts.includes(workoutId)) {
      // Already loaded, no need to fetch again
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await apiRequest("GET", `/api/workouts/${workoutId}/comments`);
      const data = await response.json();
      
      setComments(prev => ({
        ...prev,
        [workoutId]: data
      }));
      
      setLoadedWorkouts(prev => [...prev, workoutId]);
    } catch (error) {
      console.error(`Error loading comments for workout ${workoutId}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add a comment to a workout
  const addComment = async (workoutId: number, content: string) => {
    try {
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to comment on workouts",
          variant: "destructive"
        });
        return;
      }
      
      // Create the new comment payload
      const commentData = {
        content,
        workoutId
      };
      
      // Send API request
      const response = await apiRequest("POST", `/api/workouts/${workoutId}/comments`, commentData);
      const newComment = await response.json();
      
      // Update comments state
      setComments(prev => {
        const workoutComments = prev[workoutId] || [];
        return {
          ...prev,
          [workoutId]: [newComment, ...workoutComments]
        };
      });
      
      toast({
        title: "Comment added",
        description: "Your comment has been posted",
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Error adding comment",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  // Delete a comment
  const deleteComment = async (commentId: number, workoutId: number) => {
    try {
      // Send API request to delete
      await apiRequest("DELETE", `/api/comments/${commentId}`);
      
      // Update comments state
      setComments(prev => {
        const workoutComments = prev[workoutId] || [];
        return {
          ...prev,
          [workoutId]: workoutComments.filter(comment => comment.id !== commentId)
        };
      });
      
      toast({
        title: "Comment deleted",
        description: "Your comment has been removed",
      });
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast({
        title: "Error deleting comment",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  // Get comments for a workout
  const getComments = (workoutId: number): Comment[] => {
    return comments[workoutId] || [];
  };

  // Get comments count for a workout
  const getCommentsCount = (workoutId: number): number => {
    return (comments[workoutId] || []).length;
  };

  return (
    <CommentsContext.Provider value={{
      comments,
      isLoading,
      addComment,
      deleteComment,
      getComments,
      getCommentsCount,
      loadCommentsForWorkout
    }}>
      {children}
    </CommentsContext.Provider>
  );
}

// Hook to use comments context
export function useComments() {
  const context = useContext(CommentsContext);
  if (!context) {
    throw new Error("useComments must be used within a CommentsProvider");
  }
  return context;
}
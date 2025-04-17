import { 
  createContext, 
  ReactNode, 
  useContext, 
  useState
} from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

// Interface for a comment
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

// Interface for the context type
interface CommentsContextType {
  comments: Record<number, Comment[]>;
  isLoading: boolean;
  addComment: (workoutId: number, content: string) => Promise<void>;
  deleteComment: (commentId: number, workoutId: number) => Promise<void>;
  getComments: (workoutId: number) => Comment[];
  getCommentsCount: (workoutId: number) => number;
  loadCommentsForWorkout: (workoutId: number) => Promise<void>;
}

// Create the context with a default value
const CommentsContext = createContext<CommentsContextType | null>(null);

// Provider component
export function CommentsProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [comments, setComments] = useState<Record<number, Comment[]>>({});
  const [loadingWorkouts, setLoadingWorkouts] = useState<Record<number, boolean>>({});

  // Get loading state
  const isLoading = Object.values(loadingWorkouts).some(loading => loading);

  // Load comments for a specific workout
  const loadCommentsForWorkout = async (workoutId: number) => {
    // Skip if already loaded or loading
    if (comments[workoutId] || loadingWorkouts[workoutId]) return;

    try {
      setLoadingWorkouts(prev => ({
        ...prev,
        [workoutId]: true
      }));

      const response = await apiRequest("GET", `/api/workouts/${workoutId}/comments`);
      const data = await response.json();

      setComments(prev => ({
        ...prev,
        [workoutId]: data
      }));
    } catch (error) {
      console.error(`Error loading comments for workout ${workoutId}:`, error);
    } finally {
      setLoadingWorkouts(prev => ({
        ...prev,
        [workoutId]: false
      }));
    }
  };

  // Add a new comment to a workout
  const addComment = async (workoutId: number, content: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to comment on workouts",
        variant: "destructive"
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: "Empty comment",
        description: "Please enter a comment",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await apiRequest("POST", `/api/workouts/${workoutId}/comments`, { content });
      const newComment = await response.json();

      // Add the username and profile picture to the comment
      newComment.username = user.username;
      newComment.profilePicture = user.profilePicture;

      // Update comments state
      setComments(prev => ({
        ...prev,
        [workoutId]: [...(prev[workoutId] || []), newComment]
      }));

      toast({
        title: "Comment added",
        description: "Your comment has been added"
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive"
      });
    }
  };

  // Delete a comment from a workout
  const deleteComment = async (commentId: number, workoutId: number) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to delete comments",
        variant: "destructive"
      });
      return;
    }

    try {
      await apiRequest("DELETE", `/api/comments/${commentId}`);

      // Update comments state
      setComments(prev => ({
        ...prev,
        [workoutId]: (prev[workoutId] || []).filter(comment => comment.id !== commentId)
      }));

      toast({
        title: "Comment deleted",
        description: "Your comment has been removed"
      });
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive"
      });
    }
  };

  // Get all comments for a workout
  const getComments = (workoutId: number): Comment[] => {
    return comments[workoutId] || [];
  };

  // Get the count of comments for a workout
  const getCommentsCount = (workoutId: number): number => {
    return comments[workoutId]?.length || 0;
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
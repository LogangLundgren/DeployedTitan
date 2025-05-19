import { apiRequest, queryClient } from "./queryClient";
import { useToast } from "@/hooks/use-toast";

/**
 * Start a new conversation with a user and navigate to the messages page
 * @param userId The ID of the user to start a conversation with
 * @param message The initial message to send
 * @param setLocation Function to navigate to a new location
 */
export async function startConversation(
  userId: number, 
  message: string,
  setLocation: (path: string) => void
) {
  try {
    // Make API request to start conversation
    const response = await apiRequest("POST", "/api/messages/start-conversation", {
      userId,
      message,
    });

    if (!response.ok) {
      throw new Error(`Failed to start conversation: ${response.status}`);
    }

    const data = await response.json();
    
    // Invalidate threads query to show the new conversation
    queryClient.invalidateQueries({
      queryKey: ["/api/messages/threads"],
    });
    
    // Navigate to messages page
    setLocation('/messages');
    
    return data.threadId;
  } catch (error) {
    console.error("Error starting conversation:", error);
    throw error;
  }
}

/**
 * Opens or creates a message thread with a coach and redirect to messages page
 * This simpler version just opens the thread without sending an initial message
 */
export async function contactCoach(
  coachUserId: number,
  setLocation: (path: string) => void
) {
  try {
    // Get or create thread without sending a message
    const response = await apiRequest("GET", `/api/messages/thread/${coachUserId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get or create message thread: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Store the active thread ID in session storage
    // This will be used by the Messages component to auto-select the thread
    sessionStorage.setItem('activeThreadId', data.threadId.toString());
    
    // Additionally store the coach user ID for context
    sessionStorage.setItem('activeThreadUserId', coachUserId.toString());
    
    // Invalidate messages queries to refresh data
    queryClient.invalidateQueries({
      queryKey: ["/api/messages/threads"],
    });
    
    // Navigate to messages page
    setLocation('/messages');
    
    return data.threadId;
  } catch (error) {
    console.error("Error contacting coach:", error);
    throw error;
  }
}
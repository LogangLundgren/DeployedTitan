import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, isToday, isYesterday } from "date-fns";
import { User } from "@shared/schema";

// Define the shape of a message thread
interface Thread {
  threadId: number;
  isRead: boolean;
  participants: ThreadParticipant[];
  lastMessage?: {
    id: number;
    content: string;
    senderId: number;
    senderName: string;
    createdAt: string;
  };
  updatedAt: string;
}

interface ThreadParticipant {
  userId: number;
  username: string;
  name: string | null;
}

interface MessageThreadsProps {
  threads: Thread[];
  onSelectThread: (threadId: number, user: User) => void;
  selectedThreadId: number | null;
}

// Format the date for display in the message list
const formatMessageDate = (dateString: string) => {
  const date = new Date(dateString);
  
  if (isToday(date)) {
    return format(date, "h:mm a");
  } else if (isYesterday(date)) {
    return "Yesterday";
  } else {
    return format(date, "MMM d");
  }
};

export default function MessageThreads({ 
  threads, 
  onSelectThread, 
  selectedThreadId 
}: MessageThreadsProps) {
  
  // Get the name of the other participant in a thread
  const getThreadName = (thread: Thread) => {
    const otherParticipant = thread.participants[0];
    return otherParticipant?.name || otherParticipant?.username || "Unknown";
  };
  
  // Get user object from thread participant for passing to parent
  const getThreadUser = (thread: Thread): User => {
    const participant = thread.participants[0];
    return {
      id: participant.userId,
      username: participant.username,
      name: participant.name || null,
      email: '',  // These fields aren't needed for our UI purposes
      password: '',
      isCoach: false,
      bio: null,
      location: null,
      fitnessLevel: null,
      experienceYears: null,
      goals: null,
      certifications: null,
      socialMedia: null,
      coachRegistrationDate: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    };
  };

  return (
    <ScrollArea className="h-[500px]">
      {threads.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            No conversations yet
          </p>
          <p className="text-xs text-muted-foreground">
            Start messaging coaches to begin conversations
          </p>
        </div>
      ) : (
        <div className="divide-y">
          {threads.map((thread) => (
            <button
              key={thread.threadId}
              onClick={() => onSelectThread(thread.threadId, getThreadUser(thread))}
              className={cn(
                "w-full p-4 flex items-start gap-3 hover:bg-muted/30 text-left transition-colors",
                selectedThreadId === thread.threadId && "bg-muted"
              )}
            >
              <Avatar className="mt-1 flex-shrink-0">
                <AvatarFallback>
                  {getThreadName(thread).substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-grow min-w-0">
                <div className="flex justify-between items-baseline">
                  <p className="font-medium truncate">
                    {getThreadName(thread)}
                  </p>
                  {thread.lastMessage && (
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatMessageDate(thread.lastMessage.createdAt)}
                    </span>
                  )}
                </div>
                <p
                  className={cn(
                    "text-sm truncate",
                    !thread.isRead ? "font-medium" : "text-muted-foreground"
                  )}
                >
                  {thread.lastMessage?.content || "No messages yet"}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </ScrollArea>
  );
}
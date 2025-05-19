import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { format, isToday, isYesterday } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Send, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";

// Define the shape of a message
interface Message {
  id: number;
  threadId: number;
  senderId: number;
  content: string;
  createdAt: string;
  senderName: string;
}

interface MessageListProps {
  threadId: number;
  recipientUser: User;
}

// Format the date for display in the message bubble
const formatMessageDate = (dateString: string) => {
  const date = new Date(dateString);
  
  if (isToday(date)) {
    return format(date, "h:mm a");
  } else if (isYesterday(date)) {
    return `Yesterday ${format(date, "h:mm a")}`;
  } else {
    return format(date, "MMM d, h:mm a");
  }
};

export default function MessageList({ threadId, recipientUser }: MessageListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages for the active thread
  const {
    data: messages = [],
    isLoading,
    error,
  } = useQuery<Message[]>({
    queryKey: ["/api/messages/thread", threadId, "messages"],
    queryFn: () =>
      apiRequest("GET", `/api/messages/thread/${threadId}/messages`)
        .then((res) => res.json()),
    refetchInterval: 5000, // Poll every 5 seconds for new messages
  });

  // Mutation to send a message
  const sendMessageMutation = useMutation({
    mutationFn: (data: { threadId: number; content: string }) =>
      apiRequest("POST", `/api/messages/thread/${data.threadId}/send`, data)
        .then((res) => res.json()),
    onSuccess: () => {
      // Clear the input and refetch messages
      setMessage("");
      queryClient.invalidateQueries({
        queryKey: ["/api/messages/thread", threadId, "messages"],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle sending a message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    sendMessageMutation.mutate({
      threadId,
      content: message.trim(),
    });
  };

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px]">
        <p className="text-destructive font-medium">Failed to load messages</p>
        <p className="text-sm text-muted-foreground mt-1">Please try again later</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[500px]">
      {/* Thread Header */}
      <div className="p-4 border-b flex items-center">
        <Avatar className="mr-2">
          <AvatarFallback>
            {recipientUser.username.substring(0, 2).toUpperCase()}
          </AvatarFallback>

        </Avatar>
        <div>
          <h2 className="font-semibold">
            {recipientUser.name || recipientUser.username}
          </h2>
          {recipientUser.isCoach && (
            <p className="text-xs text-muted-foreground">Coach</p>
          )}
        </div>
      </div>

      {/* Message Area */}
      <ScrollArea className="flex-grow p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-muted-foreground">No messages yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Send a message to start the conversation
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  msg.senderId === user?.id ? "justify-end" : "justify-start"
                )}
              >
                <div className="max-w-[70%]">
                  <div
                    className={cn(
                      "rounded-lg p-3",
                      msg.senderId === user?.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </div>
                  <div
                    className={cn(
                      "flex items-center mt-1 text-xs text-muted-foreground",
                      msg.senderId === user?.id && "justify-end"
                    )}
                  >
                    <span>{formatMessageDate(msg.createdAt)}</span>
                    {msg.senderId === user?.id && (
                      <CheckCheck className="w-3 h-3 ml-1" />
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-grow"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!message.trim() || sendMessageMutation.isPending}
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
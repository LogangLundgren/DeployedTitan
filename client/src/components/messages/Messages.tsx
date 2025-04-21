import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { format, isToday, isYesterday } from "date-fns";
import { Loader2, Send, UserCircle, CheckCheck, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { UserSearchDialog } from "@/components/messages/UserSearchDialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: number;
  threadId: number;
  senderId: number;
  content: string;
  createdAt: string;
  senderName: string;
}

interface ThreadParticipant {
  userId: number;
  username: string;
  name: string | null;
}

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

export function Messages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeThread, setActiveThread] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  // Fetch all message threads
  const {
    data: threads = [],
    isLoading: threadsLoading,
    error: threadsError,
  } = useQuery<Thread[]>({
    queryKey: ["/api/messages/threads"],
    enabled: !!user,
  });

  // Fetch messages for the active thread
  const {
    data: messages = [],
    isLoading: messagesLoading,
    error: messagesError,
  } = useQuery<Message[]>({
    queryKey: ["/api/messages/thread", activeThread, "messages"],
    queryFn: () =>
      apiRequest(
        "GET",
        `/api/messages/thread/${activeThread}/messages`
      ).then((res) => res.json()),
    enabled: !!activeThread,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({
      threadId,
      content,
    }: {
      threadId: number;
      content: string;
    }) => {
      return apiRequest("POST", `/api/messages/thread/${threadId}/send`, {
        content,
      }).then((res) => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/messages/thread", activeThread, "messages"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/threads"] });
      setMessage("");
    },
    onError: (error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Scroll to bottom of messages when new messages arrive
  useEffect(() => {
    const messageContainer = document.getElementById("message-container");
    if (messageContainer) {
      messageContainer.scrollTop = messageContainer.scrollHeight;
    }
  }, [messages]);

  // Function to format the date of messages
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

  // Handle sending a message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread || !message.trim()) return;

    sendMessageMutation.mutate({
      threadId: activeThread,
      content: message.trim(),
    });
  };

  // Get the name of the other participant in a thread
  const getThreadName = (thread: Thread) => {
    const otherParticipant = thread.participants[0];
    return otherParticipant?.name || otherParticipant?.username || "Unknown";
  };

  // If loading all threads
  if (threadsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If error loading threads
  if (threadsError) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-lg font-medium text-destructive">Failed to load messages</p>
        <p className="text-sm text-muted-foreground">Please try again later</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(80vh)] border rounded-lg overflow-hidden">
      {/* Thread List */}
      <div className="w-1/3 border-r flex flex-col">
        <div className="p-3 border-b">
          <h2 className="font-semibold">Messages</h2>
        </div>
        
        <div className="p-2">
          <UserSearchDialog 
            onThreadCreated={(threadId) => setActiveThread(threadId)} 
          />
        </div>
        
        <ScrollArea className="flex-grow">
          {threads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
              <UserCircle className="w-12 h-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No conversations yet.
              </p>
              <p className="text-xs text-muted-foreground">
                Use the "New Message" button to start a conversation.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {threads.map((thread) => (
                <button
                  key={thread.threadId}
                  onClick={() => setActiveThread(thread.threadId)}
                  className={cn(
                    "w-full p-3 flex items-start gap-3 hover:bg-muted/30 text-left transition-colors",
                    activeThread === thread.threadId && "bg-muted"
                  )}
                >
                  <Avatar className="mt-1">
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
                        !thread.isRead && thread.lastMessage?.senderId !== user?.id
                          ? "font-medium"
                          : "text-muted-foreground"
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
      </div>

      {/* Message Area */}
      <div className="flex-grow flex flex-col">
        {!activeThread ? (
          <div className="flex flex-col items-center justify-center h-full">
            <UserCircle className="w-16 h-16 text-muted-foreground mb-3" />
            <p className="text-lg font-medium">Select a conversation</p>
            <p className="text-sm text-muted-foreground">
              Choose a thread from the list to view messages
            </p>
          </div>
        ) : (
          <>
            {/* Thread Header */}
            <div className="p-3 border-b flex items-center">
              <Avatar className="mr-2">
                <AvatarFallback>
                  {threads
                    .find((t) => t.threadId === activeThread)
                    ?.participants[0]?.username.substring(0, 2)
                    .toUpperCase() || "??"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold">
                  {threads.find((t) => t.threadId === activeThread)
                    ? getThreadName(
                        threads.find((t) => t.threadId === activeThread)!
                      )
                    : "Loading..."}
                </h2>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea 
              id="message-container" 
              className="flex-grow p-4 space-y-4"
            >
              {messagesLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <p className="text-lg font-medium mb-1">No messages yet</p>
                  <p className="text-sm text-muted-foreground">
                    Send a message to start the conversation
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex max-w-[80%]",
                        msg.senderId === user?.id
                          ? "ml-auto justify-end"
                          : "mr-auto justify-start"
                      )}
                    >
                      {msg.senderId !== user?.id && (
                        <Avatar className="mr-2 mt-1 flex-shrink-0">
                          <AvatarFallback>
                            {msg.senderName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div>
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
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <div className="p-3 border-t">
              <form
                onSubmit={handleSendMessage}
                className="flex items-center gap-2"
              >
                <Input
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-grow"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!message.trim() || sendMessageMutation.isPending}
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
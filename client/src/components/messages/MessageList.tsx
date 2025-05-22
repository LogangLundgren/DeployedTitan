import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { format, isToday, isYesterday } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2, Send, CheckCheck, Paperclip, Image, Video, Calendar, MoreVertical, Clock, Check } from "lucide-react";
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
  messageType?: 'text' | 'image' | 'file' | 'workout_plan';
  attachmentUrl?: string;
  isRead?: boolean;
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

// Coach message templates
const COACH_TEMPLATES = [
  { 
    title: "Welcome Message", 
    content: "Welcome to your fitness journey! I'm excited to work with you and help you achieve your goals. Let's start by discussing your current fitness level and what you'd like to accomplish." 
  },
  { 
    title: "Workout Check-in", 
    content: "How did your workout go today? Any exercises that felt particularly challenging or easy? Your feedback helps me adjust your program for optimal results." 
  },
  { 
    title: "Progress Review", 
    content: "Great work this week! I've reviewed your workout logs and I'm impressed with your consistency. Let's schedule a quick call to discuss your progress and plan for next week." 
  },
  { 
    title: "Motivation Boost", 
    content: "Remember that progress isn't always linear - some days will feel harder than others, and that's completely normal! Stay consistent, trust the process, and celebrate your small wins along the way." 
  },
  { 
    title: "Form Check Request", 
    content: "For your next workout, could you record yourself doing [exercise name]? I'd love to check your form and provide some tips to help you get the most out of the movement safely." 
  },
  { 
    title: "Nutrition Reminder", 
    content: "Don't forget that nutrition plays a huge role in your results! Make sure you're eating enough protein and staying hydrated. Let me know if you'd like some meal planning guidance." 
  }
];

export default function MessageList({ threadId, recipientUser }: MessageListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Handle template selection
  const handleTemplateSelect = (template: { title: string; content: string }) => {
    setMessage(template.content);
    setShowTemplates(false);
    setIsExpanded(true);
    // Focus the textarea after selecting template
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [message]);

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

      {/* Enhanced Message Input */}
      <div className="p-4 border-t">
        {/* Coach Templates Dropdown */}
        {user?.isCoach && (
          <div className="mb-3">
            <DropdownMenu open={showTemplates} onOpenChange={setShowTemplates}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="mb-2">
                  <Calendar className="h-4 w-4 mr-2" />
                  Quick Templates
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80">
                {COACH_TEMPLATES.map((template, index) => (
                  <DropdownMenuItem
                    key={index}
                    onClick={() => handleTemplateSelect(template)}
                    className="cursor-pointer p-3"
                  >
                    <div>
                      <div className="font-medium text-sm">{template.title}</div>
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {template.content}
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        
        <form onSubmit={handleSendMessage} className="space-y-2">
          <div className="flex gap-2">
            {isExpanded ? (
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="min-h-[80px] max-h-[200px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
            ) : (
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-grow"
                onFocus={() => setIsExpanded(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
            )}
            
            <div className="flex gap-1">
              {isExpanded && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIsExpanded(false)}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              )}
              
              <Button 
                type="submit" 
                size="icon" 
                disabled={!message.trim() || sendMessageMutation.isPending}
                className="shrink-0"
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          {isExpanded && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Press Shift+Enter for new line, Enter to send</span>
              <span>{message.length}/1000</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
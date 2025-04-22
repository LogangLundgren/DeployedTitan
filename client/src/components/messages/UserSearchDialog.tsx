import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useDebounce } from "@/hooks/use-debounce";
import { Loader2, Search, MessageSquarePlus, User as UserIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

interface User {
  id: number;
  username: string;
  name: string | null;
}

interface UserSearchDialogProps {
  onThreadCreated: (threadId: number) => void;
}

const messageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
});

export function UserSearchDialog({ onThreadCreated }: UserSearchDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const debouncedQuery = useDebounce(searchQuery, 300);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof messageSchema>>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      message: "",
    },
  });

  // Search for users
  const {
    data: users = [],
    isLoading,
    error
  } = useQuery<User[]>({
    queryKey: ["/api/users/search", debouncedQuery],
    queryFn: async () => {
      try {
        if (!debouncedQuery || debouncedQuery.length < 2) {
          return [];
        }
        
        console.log(`Searching for users with query: ${debouncedQuery}`);
        const res = await apiRequest("GET", `/api/users/search?q=${encodeURIComponent(debouncedQuery)}`);
        
        if (!res.ok) {
          console.error(`Search request failed with status: ${res.status}`);
          return [];
        }
        
        const data = await res.json();
        
        // Ensure we have a valid array of user objects
        if (Array.isArray(data)) {
          console.log(`Found ${data.length} users matching query`);
          return data.filter(user => 
            user && 
            typeof user === 'object' && 
            'id' in user && 
            'username' in user
          );
        } else {
          console.error("Invalid response format:", data);
          return [];
        }
      } catch (err) {
        console.error("Error searching users:", err);
        return [];
      }
    },
    enabled: debouncedQuery.length > 1,
    refetchOnWindowFocus: false,
  });

  // Start conversation mutation
  const startConversationMutation = useMutation({
    mutationFn: async ({ userId, message }: { userId: number; message: string }) => {
      return apiRequest("POST", "/api/messages/start-conversation", {
        userId,
        message,
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      toast({
        title: "Message sent",
        description: "Your conversation has started",
      });
      onThreadCreated(data.threadId);
      setOpen(false);
      setSelectedUser(null);
      setSearchQuery("");
      form.reset();
      
      // Invalidate threads query to show the new conversation
      queryClient.invalidateQueries({
        queryKey: ["/api/messages/threads"],
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof messageSchema>) => {
    if (!selectedUser) return;
    
    startConversationMutation.mutate({
      userId: selectedUser.id,
      message: data.message,
    });
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
  };

  const handleBackToSearch = () => {
    setSelectedUser(null);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full" size="sm">
          <MessageSquarePlus className="w-4 h-4 mr-2" />
          New Message
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {selectedUser ? "Send Message" : "Find People"}
          </DialogTitle>
        </DialogHeader>

        {!selectedUser ? (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by username or name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <div className="border rounded-md divide-y max-h-[300px] overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : users.length === 0 ? (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  {debouncedQuery.length > 1
                    ? "No users found"
                    : "Start typing to search for users"}
                </div>
              ) : (
                users.map((user) => (
                  <button
                    key={user.id}
                    className="w-full p-3 flex items-center gap-3 hover:bg-muted/50 text-left transition-colors"
                    onClick={() => handleSelectUser(user)}
                  >
                    <Avatar>
                      <AvatarFallback>
                        {(user.name || user.username).substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.name || user.username}</p>
                      {user.name && (
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-md">
              <Avatar>
                <AvatarFallback>
                  {(selectedUser.name || selectedUser.username).substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{selectedUser.name || selectedUser.username}</p>
                {selectedUser.name && (
                  <p className="text-sm text-muted-foreground">@{selectedUser.username}</p>
                )}
              </div>
            </div>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Type your message here..."
                          {...field}
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBackToSearch}
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit"
                    disabled={startConversationMutation.isPending}
                  >
                    {startConversationMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Message"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
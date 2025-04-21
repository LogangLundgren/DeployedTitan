import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, UserCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { useDebounce } from "@/hooks/use-debounce";

interface User {
  id: number;
  username: string;
  name: string | null;
}

interface UserSearchDialogProps {
  onThreadCreated: (threadId: number) => void;
}

export function UserSearchDialog({ onThreadCreated }: UserSearchDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [message, setMessage] = useState("");
  const { toast } = useToast();
  
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Search for users query
  const {
    data: users = [],
    isLoading: searchLoading,
  } = useQuery<User[]>({
    queryKey: ["/api/users/search", debouncedQuery],
    queryFn: () => 
      apiRequest("GET", `/api/users/search?q=${encodeURIComponent(debouncedQuery)}`)
        .then((res) => res.json()),
    enabled: debouncedQuery.length >= 2 && open && !selectedUser,
  });

  // Start conversation mutation
  const startConversationMutation = useMutation({
    mutationFn: async ({ userId, message }: { userId: number; message: string }) => {
      return apiRequest("POST", "/api/messages/start-conversation", {
        userId, 
        message,
      }).then((res) => res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/threads"] });
      toast({
        title: "Message sent",
        description: "Your conversation has started",
      });
      setMessage("");
      setSearchQuery("");
      setSelectedUser(null);
      setOpen(false);
      onThreadCreated(data.threadId);
    },
    onError: (error) => {
      toast({
        title: "Failed to start conversation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!selectedUser || !message.trim()) return;
    
    startConversationMutation.mutate({
      userId: selectedUser.id,
      message: message.trim(),
    });
  };

  const resetDialog = () => {
    setSearchQuery("");
    setSelectedUser(null);
    setMessage("");
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) {
        resetDialog();
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full mb-2">
          <Search className="mr-2 h-4 w-4" />
          New Message
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {selectedUser ? `Message ${selectedUser.name || selectedUser.username}` : "New Message"}
          </DialogTitle>
          <DialogDescription>
            {selectedUser 
              ? "Send a message to start a conversation"
              : "Search for a user to start a conversation"}
          </DialogDescription>
        </DialogHeader>
        
        {!selectedUser ? (
          // User search interface
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search for a user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-grow"
              />
              {searchLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            </div>
            
            <ScrollArea className="h-[200px] rounded-md border">
              {debouncedQuery.length < 2 ? (
                <div className="flex flex-col items-center justify-center h-full p-4">
                  <Search className="w-10 h-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground text-center">
                    Enter at least 2 characters to search
                  </p>
                </div>
              ) : users.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-4">
                  <UserCircle className="w-10 h-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground text-center">
                    No users found matching "{debouncedQuery}"
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {users.map((user) => (
                    <button
                      key={user.id}
                      className="w-full p-3 flex items-center gap-3 hover:bg-muted/30 text-left transition-colors"
                      onClick={() => setSelectedUser(user)}
                    >
                      <Avatar>
                        <AvatarFallback>
                          {(user.name || user.username).substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.name || user.username}</p>
                        {user.name && <p className="text-sm text-muted-foreground">@{user.username}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        ) : (
          // Message composition interface for selected user
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-3 mb-4">
              <Avatar>
                <AvatarFallback>
                  {(selectedUser.name || selectedUser.username).substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{selectedUser.name || selectedUser.username}</p>
                {selectedUser.name && <p className="text-sm text-muted-foreground">@{selectedUser.username}</p>}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-auto"
                onClick={() => setSelectedUser(null)}
              >
                Change
              </Button>
            </div>
            
            <div className="grid gap-2">
              <Textarea
                placeholder="Type your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
          </div>
        )}
        
        <DialogFooter>
          {selectedUser && (
            <Button 
              onClick={handleSendMessage}
              disabled={!message.trim() || startConversationMutation.isPending}
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
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
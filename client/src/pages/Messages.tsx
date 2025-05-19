import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import MessageThreads from "@/components/messages/MessageThreads";
import MessageList from "@/components/messages/MessageList";
import { useQuery } from "@tanstack/react-query";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { User } from "@shared/schema";

export default function Messages() {
  const { user } = useAuth();
  const [selectedThread, setSelectedThread] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { data: threads, isLoading: isLoadingThreads } = useQuery({
    queryKey: ["/api/messages/threads"],
    enabled: !!user,
  });

  // Function to handle thread selection
  const handleSelectThread = (threadId: number, threadUser: User) => {
    setSelectedThread(threadId);
    setSelectedUser(threadUser);
  };

  if (isLoadingThreads) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">Messages</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        <div className="md:col-span-1 border rounded-lg shadow-sm bg-card">
          <div className="p-4 font-medium text-lg border-b">
            Conversations
          </div>
          <MessageThreads 
            threads={threads || []} 
            onSelectThread={handleSelectThread}
            selectedThreadId={selectedThread}
          />
        </div>
        
        <div className="md:col-span-2 border rounded-lg shadow-sm bg-card">
          {selectedThread && selectedUser ? (
            <MessageList 
              threadId={selectedThread} 
              recipientUser={selectedUser}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] text-center p-4 text-muted-foreground">
              <p className="mb-2">Select a conversation to view messages</p>
              <p className="text-sm">Or start a new conversation from the Coaches tab</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
import { Messages as MessagesComponent } from "@/components/messages/Messages";
import { useAuth } from "@/hooks/use-auth";

export default function Messages() {
  const { user } = useAuth();
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Messages</h1>
        </div>
        
        {/* Messages component with improved styling for dedicated page */}
        <div className="bg-white rounded-lg shadow-sm border">
          <MessagesComponent />
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  username: string;
  name?: string;
}

interface PlanForkModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId: number;
  onSuccess: () => void;
}

export function PlanForkModal({
  isOpen,
  onClose,
  planId,
  onSuccess
}: PlanForkModalProps) {
  const [clients, setClients] = useState<User[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Fetch clients (we'll use users who have purchased the coach's plans)
    const fetchClients = async () => {
      try {
        setIsFetching(true);
        const response = await fetch("/api/users");
        if (!response.ok) {
          throw new Error("Failed to fetch clients");
        }
        const data = await response.json();
        // In a real app, this would be filtered to only show clients
        setClients(data);
      } catch (error) {
        console.error("Error fetching clients:", error);
        toast({
          title: "Error",
          description: "Failed to load client list",
          variant: "destructive",
        });
      } finally {
        setIsFetching(false);
      }
    };

    if (isOpen) {
      fetchClients();
    }
  }, [isOpen, toast]);

  const handleForkPlan = async () => {
    if (!selectedClientId) {
      toast({
        title: "Error",
        description: "Please select a client",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest(
        "POST",
        `/api/workout-plans/${planId}/fork`,
        { clientId: parseInt(selectedClientId) }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fork workout plan");
      }

      toast({
        title: "Success",
        description: "Workout plan forked successfully for client",
        variant: "default",
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error forking plan:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fork workout plan",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Fork Workout Plan for Client</DialogTitle>
          <DialogDescription>
            Create a customized copy of this workout plan for a specific client. 
            This lets you modify the plan for their individual needs without affecting 
            the original plan.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="client" className="text-right">
              Client
            </Label>
            <div className="col-span-3">
              {isFetching ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading clients...</span>
                </div>
              ) : (
                <Select
                  value={selectedClientId}
                  onValueChange={setSelectedClientId}
                  disabled={isLoading}
                >
                  <SelectTrigger id="client">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.name || client.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="button" onClick={handleForkPlan} disabled={isLoading || !selectedClientId}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Fork Plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Loader2, GitFork } from "lucide-react";

interface PlanForkModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string | number;
  onSuccess?: () => void;
}

interface Client {
  id: number;
  username: string;
  name: string | null;
}

export function PlanForkModal({ isOpen, onClose, planId, onSuccess }: PlanForkModalProps) {
  const { toast } = useToast();
  const [clientId, setClientId] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  // Fetch clients (users the coach can assign plans to)
  const {
    data: clients,
    isLoading: isLoadingClients,
    error: clientsError
  } = useQuery<Client[]>({
    queryKey: ["/api/coach/clients"],
    enabled: isOpen,
  });

  // Fetch original plan info to pre-populate the form
  const {
    data: plan,
    isLoading: isLoadingPlan
  } = useQuery({
    queryKey: ["/api/workout-plans", planId],
    enabled: isOpen && !!planId,
    onSuccess: (data: any) => {
      setTitle(`${data.title} (Client Custom)`);
      setDescription(data.description || "");
    }
  });

  // Fork plan mutation
  const forkPlanMutation = useMutation({
    mutationFn: async (data: { 
      planId: string | number; 
      clientId: string | number;
      title: string;
      description: string;
    }) => {
      const response = await apiRequest("POST", `/api/workout-plans/${data.planId}/fork`, { clientId: data.clientId, title: data.title, description: data.description });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fork plan");
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Plan forked successfully for client",
      });
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to fork plan",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientId) {
      toast({
        title: "Error",
        description: "Please select a client",
        variant: "destructive",
      });
      return;
    }
    
    forkPlanMutation.mutate({ 
      planId, 
      clientId,
      title: title || `${plan?.title} (Client Custom)`,
      description: description || plan?.description || "",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitFork className="h-5 w-5" />
            Fork Plan for Client
          </DialogTitle>
          <DialogDescription>
            Create a customized version of this plan for a specific client.
          </DialogDescription>
        </DialogHeader>

        {isLoadingPlan || isLoadingClients ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : clientsError ? (
          <div className="rounded-md bg-destructive/15 p-4 my-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-destructive mr-2" />
              <p className="text-sm text-destructive font-medium">
                Failed to load clients. Please try again.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="client">Select Client</Label>
              <Select 
                value={clientId} 
                onValueChange={setClientId}
              >
                <SelectTrigger id="client">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients && clients.length > 0 ? (
                    clients.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.name || client.username}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-clients" disabled>
                      No clients available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Plan Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter plan title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter plan description"
                className="min-h-[100px]"
              />
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={forkPlanMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={!clientId || forkPlanMutation.isPending}
              >
                {forkPlanMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Forking...
                  </>
                ) : (
                  <>
                    <GitFork className="mr-2 h-4 w-4" />
                    Fork Plan
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
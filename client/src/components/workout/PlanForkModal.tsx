import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

// UI Components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2 } from 'lucide-react';

// Types
interface Client {
  id: number;
  username: string;
  name: string | null;
}

interface PlanForkModalProps {
  planId: number;
  planTitle: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  afterFork?: (forkedPlanId: number) => void;
}

export default function PlanForkModal({ planId, planTitle, open, setOpen, afterFork }: PlanForkModalProps) {
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Get coach clients
  const { data: clients = [], isLoading: isLoadingClients } = useQuery<Client[]>({
    queryKey: ['/api/coach/clients'],
    enabled: open && !!user?.id
  });
  
  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setSelectedClient(null);
      setCustomTitle(`${planTitle} (Custom for client)`);
      setCustomNotes('');
    }
  }, [open, planTitle]);
  
  // Create fork mutation
  const { mutate: forkPlan, isPending } = useMutation({
    mutationFn: async () => {
      if (!selectedClient) {
        throw new Error('Please select a client');
      }
      
      const response = await apiRequest(
        'POST', 
        `/api/workout-plans/${planId}/fork`, 
        { 
          clientId: parseInt(selectedClient),
          customTitle: customTitle || `${planTitle} (Custom for client)`,
          customNotes: customNotes || ''
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fork workout plan');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Plan Forked Successfully",
        description: `You've created a custom plan for your client.`,
      });
      
      // Invalidate plans cache
      queryClient.invalidateQueries({ queryKey: ['/api/workout-plans'] });
      queryClient.invalidateQueries({ queryKey: ['/api/coach/forked-plans'] });
      
      // Close modal
      setOpen(false);
      
      // Call callback if provided
      if (afterFork && data.id) {
        afterFork(data.id);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to fork plan",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    forkPlan();
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* The trigger is no longer needed as we control the dialog from the parent */}
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Custom Plan for Client</DialogTitle>
            <DialogDescription>
              Create a personalized version of "{planTitle}" for an individual client.
              The custom plan will be free for the selected client.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {isLoadingClients ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !clients || clients.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <p>You don't have any clients yet.</p>
                <p className="text-sm mt-1">Clients are users who have purchased your plans or services.</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="client">Select Client</Label>
                  <Select value={selectedClient || ''} onValueChange={setSelectedClient}>
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
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="title">Custom Title</Label>
                  <Input
                    id="title"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Enter a custom title for this plan"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Custom Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    placeholder="Add custom notes about this plan for your client"
                    rows={3}
                  />
                </div>
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isPending || !selectedClient || isLoadingClients || (clients && clients.length === 0)}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : 'Create Custom Plan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
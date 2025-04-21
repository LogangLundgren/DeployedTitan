import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface ContactCoachButtonProps {
  coachId: number;
  coachName: string;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function ContactCoachButton({
  coachId,
  coachName,
  variant = "default",
  size = "default",
  className,
}: ContactCoachButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);

  const contactCoachMutation = useMutation({
    mutationFn: async ({ coachId, message }: { coachId: number; message: string }) => {
      return apiRequest("POST", `/api/coaches/${coachId}/contact`, { message }).then(
        (res) => res.json()
      );
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/threads"] });
      toast({
        title: "Message sent",
        description: "Your message has been sent to the coach",
      });
      setMessage("");
      setOpen(false);
      navigate(`/social?tab=messages&thread=${data.threadId}`);
    },
    onError: (error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    contactCoachMutation.mutate({ coachId, message: message.trim() });
  };

  if (!user) {
    return (
      <Button
        onClick={() => navigate("/auth")}
        variant={variant}
        size={size}
        className={className}
      >
        <MessageCircle className="mr-2 h-4 w-4" />
        Login to Contact
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <MessageCircle className="mr-2 h-4 w-4" />
          Contact Coach
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Message {coachName}</DialogTitle>
          <DialogDescription>
            Send a message to start a conversation with this coach.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                className="min-h-[120px]"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={!message.trim() || contactCoachMutation.isPending}
            >
              {contactCoachMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Message"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
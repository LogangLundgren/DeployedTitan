import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogClose,
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
import { MessageSquarePlus, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export type FeedbackType = "bug" | "feature" | "ux" | "other";

export interface FeedbackData {
  type: FeedbackType;
  content: string;
  userId?: number;
  username?: string;
  path: string;
  userAgent: string;
  timestamp: string;
}

export function FeedbackWidget() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("bug");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({
        title: "Feedback required",
        description: "Please provide some feedback before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const feedbackData: FeedbackData = {
        type: feedbackType,
        content: content.trim(),
        userId: user?.id,
        username: user?.username,
        path: window.location.pathname,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      };
      
      // Store in local storage temporarily (could later be sent to a server endpoint)
      const existingFeedback = JSON.parse(localStorage.getItem("titan-fitness-feedback") || "[]");
      existingFeedback.push(feedbackData);
      localStorage.setItem("titan-fitness-feedback", JSON.stringify(existingFeedback));
      
      // For future implementation - send to server endpoint
      // const res = await apiRequest("POST", "/api/feedback", feedbackData);
      // if (!res.ok) throw new Error("Failed to submit feedback");

      toast({
        title: "Feedback received",
        description: "Thank you for your feedback! We appreciate your help improving the app.",
      });
      
      setContent("");
      setFeedbackType("bug");
      setIsOpen(false);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-xl bg-primary text-white hover:bg-primary/90 z-50 transition-all duration-300 hover:scale-105 border-2 border-white"
          >
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse" />
            <MessageSquarePlus className="h-7 w-7" />
            <span className="sr-only">Send Feedback</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Send Feedback</DialogTitle>
            <DialogDescription>
              Help us improve Titan Fitness by sharing your experience.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="feedback-type">Feedback Type</Label>
              <Select
                value={feedbackType}
                onValueChange={(value) => setFeedbackType(value as FeedbackType)}
              >
                <SelectTrigger id="feedback-type">
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug">Bug Report</SelectItem>
                  <SelectItem value="feature">Feature Request</SelectItem>
                  <SelectItem value="ux">User Experience</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="feedback">Your Feedback</Label>
              <Textarea
                id="feedback"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Describe your experience, issue, or suggestion..."
                className="min-h-[120px]"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
import { useState } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Award, 
  CheckCircle, 
  DollarSign, 
  Users, 
  Briefcase, 
  ChevronRight 
} from 'lucide-react';

// Form schema
const formSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  experience: z.string().min(1, { message: "Please select your experience level" }),
  specialties: z.string().min(3, { message: "Please add your specialties" }),
  biography: z.string().min(20, { message: "Biography must be at least 20 characters" }),
  hourlyRate: z.coerce.number().optional(),
  certifications: z.string().optional(),
});

export default function BecomeCoach() {
  const [location, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const userId = 1; // Assuming user 1 is logged in - in a real app, would come from auth context

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      experience: "",
      specialties: "",
      biography: "",
      hourlyRate: undefined,
      certifications: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      // Format specialties as comma-separated if multiple are provided
      const formattedSpecialties = values.specialties
        .split(/[,;]/)
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .join(", ");

      // Create coach profile
      const coachProfileData = {
        userId,
        title: values.title,
        experience: values.experience,
        specialties: formattedSpecialties,
        biography: values.biography,
        hourlyRate: values.hourlyRate || null,
      };

      const response = await apiRequest('POST', '/api/coach-profiles', coachProfileData);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create coach profile');
      }
      
      // If certifications were provided, update the user profile
      if (values.certifications) {
        const certResponse = await apiRequest('PATCH', `/api/users/${userId}`, {
          certifications: values.certifications
        });
        
        if (!certResponse.ok) {
          console.warn('Failed to update certifications, but coach profile was created');
        }
      }

      // Success!
      toast({
        title: "Coach Profile Created!",
        description: "Your coach profile has been successfully created. You can now create and sell workout plans.",
        variant: "default",
      });

      // Redirect to the coach dashboard
      setLocation('/create-plan');
    } catch (error) {
      console.error('Error creating coach profile:', error);
      toast({
        title: "Error Creating Profile",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Become a Coach</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Share your expertise and earn by helping others achieve their fitness goals
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="flex flex-col items-center text-center p-4 border rounded-lg">
            <Users className="h-8 w-8 text-primary mb-2" />
            <h3 className="font-medium mb-1">Reach More Clients</h3>
            <p className="text-sm text-gray-500">Connect with thousands of athletes looking for guidance</p>
          </div>
          <div className="flex flex-col items-center text-center p-4 border rounded-lg">
            <DollarSign className="h-8 w-8 text-primary mb-2" />
            <h3 className="font-medium mb-1">Monetize Your Expertise</h3>
            <p className="text-sm text-gray-500">Sell workout plans and coaching services</p>
          </div>
          <div className="flex flex-col items-center text-center p-4 border rounded-lg">
            <Briefcase className="h-8 w-8 text-primary mb-2" />
            <h3 className="font-medium mb-1">Build Your Brand</h3>
            <p className="text-sm text-gray-500">Establish yourself as a trusted fitness professional</p>
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Coach Profile Details</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Professional Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Certified Personal Trainer, Strength Coach" {...field} />
                    </FormControl>
                    <FormDescription>
                      This appears under your name on your profile
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Experience Level</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="">Select your experience level</option>
                        <option value="Beginner (0-2 years)">Beginner (0-2 years)</option>
                        <option value="Intermediate (3-5 years)">Intermediate (3-5 years)</option>
                        <option value="Advanced (5-10 years)">Advanced (5-10 years)</option>
                        <option value="Expert (10+ years)">Expert (10+ years)</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="specialties"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specialties</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Strength Training, Weight Loss, Bodybuilding" {...field} />
                    </FormControl>
                    <FormDescription>
                      Separate multiple specialties with commas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="biography"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Biography</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tell potential clients about yourself, your approach, and your coaching philosophy..." 
                        className="min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hourlyRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hourly Rate (optional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input 
                          type="number" 
                          min="0"
                          className="pl-9" 
                          placeholder="e.g. 50" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Your standard hourly rate for coaching services
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="certifications"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certifications (optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="List your fitness certifications..." 
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      List each certification on a new line or separated by commas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator className="my-6" />

              <div className="flex flex-col gap-4 sm:flex-row sm:justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setLocation('/marketplace')}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Create Coach Profile
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>

        <div className="bg-blue-50 border border-blue-100 p-6 rounded-lg">
          <div className="flex items-start">
            <Award className="h-6 w-6 text-blue-500 mr-3 mt-1" />
            <div>
              <h3 className="font-medium text-blue-800 mb-2">Verification Process</h3>
              <p className="text-sm text-blue-700 mb-4">
                After creating your profile, you can request verification by providing proof of your certifications. 
                Verified coaches receive a badge on their profile and appear higher in search results.
              </p>
              <div className="flex items-center text-sm text-blue-700">
                <CheckCircle className="h-4 w-4 mr-1.5" />
                <span>Greater visibility in the marketplace</span>
              </div>
              <div className="flex items-center text-sm text-blue-700">
                <CheckCircle className="h-4 w-4 mr-1.5" />
                <span>Increased trust from potential clients</span>
              </div>
              <div className="flex items-center text-sm text-blue-700">
                <CheckCircle className="h-4 w-4 mr-1.5" />
                <span>Higher conversion rates for your services</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
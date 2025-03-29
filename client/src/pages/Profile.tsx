import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Edit, 
  User as UserIcon,
  Instagram,
  Twitter,
  Facebook,
  Linkedin,
  Github,
  Camera,
  Upload,
  Check
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Form refs for the different sections
  const nameRef = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const locationRef = useRef<HTMLInputElement>(null);
  const bioRef = useRef<HTMLTextAreaElement>(null);
  const fitnessLevelRef = useRef<HTMLInputElement>(null);
  const experienceYearsRef = useRef<HTMLInputElement>(null);
  const goalsRef = useRef<HTMLTextAreaElement>(null);
  const instagramRef = useRef<HTMLInputElement>(null);
  const twitterRef = useRef<HTMLInputElement>(null);
  const facebookRef = useRef<HTMLInputElement>(null);
  const linkedinRef = useRef<HTMLInputElement>(null);
  const githubRef = useRef<HTMLInputElement>(null);
  
  // Get the user's profile information
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/auth/user'],
    queryFn: () => ({ 
      id: 1, 
      username: 'demo', 
      name: 'John Smith', 
      email: 'demo@example.com',
      password: '',
      // Additional user fields
      bio: 'Fitness enthusiast focused on strength training and nutrition. Always looking to push my limits and achieve new personal records.',
      fitnessLevel: 'Intermediate',
      experienceYears: 3,
      goals: 'Build muscle mass and improve overall strength',
      location: 'New York, NY',
      socialMedia: {
        instagram: 'johnsmith_fitness',
        twitter: 'jsmith_lift',
        facebook: '',
        linkedin: 'john-smith-fitness',
        github: ''
      }
    }),
    refetchOnWindowFocus: false
  });
  
  // Mutation for updating user profile
  const updateProfileMutation = useMutation({
    mutationFn: async (userData: any) => {
      return await apiRequest(`/api/users/${user?.id}`, {
        method: 'PATCH',
        body: JSON.stringify(userData)
      });
    },
    onSuccess: () => {
      // Invalidate the user query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      
      setIsEditing(false);
      setIsSaving(false);
      
      toast({
        title: "Profile updated",
        description: "Your profile information has been successfully updated.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("Failed to update profile:", error);
      setIsSaving(false);
      
      toast({
        title: "Update failed",
        description: "There was a problem updating your profile. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Handle profile save
  const handleSaveProfile = () => {
    if (!user) return;
    
    setIsSaving(true);
    
    // Gather all the form data
    const updatedProfile = {
      name: nameRef.current?.value || user.name,
      username: usernameRef.current?.value || user.username,
      email: emailRef.current?.value || user.email,
      location: locationRef.current?.value || user.location,
      bio: bioRef.current?.value || user.bio,
      fitnessLevel: fitnessLevelRef.current?.value || user.fitnessLevel,
      experienceYears: experienceYearsRef.current?.value ? 
        parseInt(experienceYearsRef.current.value) : user.experienceYears,
      goals: goalsRef.current?.value || user.goals,
      socialMedia: {
        instagram: instagramRef.current?.value || user.socialMedia?.instagram || '',
        twitter: twitterRef.current?.value || user.socialMedia?.twitter || '',
        facebook: facebookRef.current?.value || user.socialMedia?.facebook || '',
        linkedin: linkedinRef.current?.value || user.socialMedia?.linkedin || '',
        github: githubRef.current?.value || user.socialMedia?.github || ''
      }
    };
    
    // In a real app, we would validate the data here
    
    // Use the update profile mutation to save the data
    updateProfileMutation.mutate(updatedProfile);
  };
  
  // Get the user's recent workouts for displaying stats
  const { data: workouts } = useQuery({
    queryKey: ['/api/workouts/recent'],
    queryFn: async () => {
      const response = await fetch('/api/workouts/recent');
      if (!response.ok) {
        throw new Error('Failed to fetch recent workouts');
      }
      return response.json();
    },
    refetchOnWindowFocus: false,
    enabled: !!user
  });
  
  // Get the user's templates for displaying stats
  const { data: templates } = useQuery({
    queryKey: ['/api/templates'],
    queryFn: async () => {
      const response = await fetch('/api/templates');
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      return response.json();
    },
    refetchOnWindowFocus: false,
    enabled: !!user
  });
  
  if (isLoading) {
    return (
      <div className="flex-grow container mx-auto px-4 py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="flex-grow container mx-auto px-4 py-6">
        <div className="text-center py-12">
          <div className="text-4xl font-bold text-gray-400 mb-4">
            <UserIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            User Not Found
          </div>
          <p className="text-gray-500">The requested user profile could not be loaded.</p>
        </div>
      </div>
    );
  }
  
  return (
    <main className="flex-grow container mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Profile</h2>
        <p className="text-gray-500">Manage your profile and personal information</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-xl">Profile Details</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsEditing(!isEditing)}
                className="h-8 px-2"
              >
                <Edit className="h-4 w-4 mr-1" />
                {isEditing ? "Cancel" : "Edit"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-col items-center mb-6">
              <div className="relative mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src="" alt={user.name || user.username} />
                  <AvatarFallback className="text-lg bg-primary/10 text-primary">
                    {(user.name || user.username || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <div className="absolute -right-2 bottom-0 bg-primary text-white p-1.5 rounded-full shadow-md cursor-pointer">
                    <Camera className="h-4 w-4" />
                  </div>
                )}
              </div>
              
              {isEditing ? (
                <div className="w-full space-y-2">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" ref={nameRef} defaultValue={user.name} placeholder="Your full name" />
                  </div>
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" ref={usernameRef} defaultValue={user.username} placeholder="Username" />
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-semibold">{user.name || user.username}</h3>
                  {user.name && <p className="text-gray-500">@{user.username}</p>}
                </>
              )}
            </div>
            
            <div className="space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" ref={emailRef} defaultValue={user.email} placeholder="Your email" />
                  </div>
                  
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" ref={locationRef} defaultValue={user.location} placeholder="City, State" />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p>{user.email || "Not provided"}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500">Location</p>
                    <p>{user.location || "Not specified"}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500">Member Since</p>
                    <p>March 25, 2025</p>
                  </div>
                </>
              )}
              
              {/* Quick Stats */}
              <Separator />
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Quick Stats</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 p-2 rounded-lg text-center">
                    <p className="text-lg font-bold">{workouts?.length || 0}</p>
                    <p className="text-xs text-gray-500">Workouts</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-lg text-center">
                    <p className="text-lg font-bold">{templates?.length || 0}</p>
                    <p className="text-xs text-gray-500">Templates</p>
                  </div>
                </div>
              </div>
              
              {isEditing && (
                <div className="mt-4">
                  <Button 
                    className="w-full" 
                    onClick={handleSaveProfile}
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? "Saving..." : "Save Profile"}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* User Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl">Personal Information</CardTitle>
            <CardDescription>
              Your fitness profile and experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Bio Section */}
              <div>
                <div className="flex justify-between mb-2">
                  <h3 className="font-medium">About Me</h3>
                  {isEditing && <Edit className="h-4 w-4 text-gray-400" />}
                </div>
                
                {isEditing ? (
                  <Textarea
                    ref={bioRef}
                    placeholder="Tell the community about yourself, your fitness journey, and your goals"
                    defaultValue={user.bio}
                    className="min-h-[100px]"
                  />
                ) : (
                  <p className="text-gray-700">{user.bio || "No bio provided."}</p>
                )}
              </div>
              
              <Separator />
              
              {/* Fitness Experience */}
              <div>
                <div className="flex justify-between mb-2">
                  <h3 className="font-medium">Fitness Experience</h3>
                  {isEditing && <Edit className="h-4 w-4 text-gray-400" />}
                </div>
                
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fitnessLevel">Fitness Level</Label>
                      <Input 
                        id="fitnessLevel" 
                        ref={fitnessLevelRef} 
                        defaultValue={user.fitnessLevel} 
                        placeholder="Beginner, Intermediate, Advanced" 
                      />
                    </div>
                    <div>
                      <Label htmlFor="experienceYears">Years of Experience</Label>
                      <Input 
                        id="experienceYears" 
                        ref={experienceYearsRef} 
                        type="number" 
                        defaultValue={user.experienceYears} 
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="goals">Fitness Goals</Label>
                      <Textarea 
                        id="goals" 
                        ref={goalsRef} 
                        defaultValue={user.goals} 
                        placeholder="What are your fitness goals?" 
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Fitness Level</p>
                        <p>{user.fitnessLevel || "Not specified"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Years of Experience</p>
                        <p>{user.experienceYears || "Not specified"}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Fitness Goals</p>
                      <p>{user.goals || "No goals specified"}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <Separator />
              
              {/* Social Media Links */}
              <div>
                <div className="flex justify-between mb-4">
                  <h3 className="font-medium">Social Media</h3>
                  {isEditing && <Edit className="h-4 w-4 text-gray-400" />}
                </div>
                
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Instagram className="h-5 w-5 mr-2 text-pink-600" />
                      <Input 
                        ref={instagramRef} 
                        placeholder="Instagram username" 
                        defaultValue={user.socialMedia?.instagram} 
                      />
                    </div>
                    <div className="flex items-center">
                      <Twitter className="h-5 w-5 mr-2 text-blue-400" />
                      <Input 
                        ref={twitterRef} 
                        placeholder="Twitter username" 
                        defaultValue={user.socialMedia?.twitter} 
                      />
                    </div>
                    <div className="flex items-center">
                      <Facebook className="h-5 w-5 mr-2 text-blue-600" />
                      <Input 
                        ref={facebookRef} 
                        placeholder="Facebook profile" 
                        defaultValue={user.socialMedia?.facebook} 
                      />
                    </div>
                    <div className="flex items-center">
                      <Linkedin className="h-5 w-5 mr-2 text-blue-700" />
                      <Input 
                        ref={linkedinRef} 
                        placeholder="LinkedIn profile" 
                        defaultValue={user.socialMedia?.linkedin} 
                      />
                    </div>
                    <div className="flex items-center">
                      <Github className="h-5 w-5 mr-2 text-gray-800" />
                      <Input 
                        ref={githubRef} 
                        placeholder="GitHub username" 
                        defaultValue={user.socialMedia?.github} 
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {user.socialMedia?.instagram && (
                      <a href={`https://instagram.com/${user.socialMedia.instagram}`} target="_blank" rel="noopener noreferrer" className="flex items-center p-2 rounded-md hover:bg-gray-50">
                        <Instagram className="h-5 w-5 mr-2 text-pink-600" />
                        <span>@{user.socialMedia.instagram}</span>
                      </a>
                    )}
                    {user.socialMedia?.twitter && (
                      <a href={`https://twitter.com/${user.socialMedia.twitter}`} target="_blank" rel="noopener noreferrer" className="flex items-center p-2 rounded-md hover:bg-gray-50">
                        <Twitter className="h-5 w-5 mr-2 text-blue-400" />
                        <span>@{user.socialMedia.twitter}</span>
                      </a>
                    )}
                    {user.socialMedia?.facebook && (
                      <a href={`https://facebook.com/${user.socialMedia.facebook}`} target="_blank" rel="noopener noreferrer" className="flex items-center p-2 rounded-md hover:bg-gray-50">
                        <Facebook className="h-5 w-5 mr-2 text-blue-600" />
                        <span>{user.socialMedia.facebook}</span>
                      </a>
                    )}
                    {user.socialMedia?.linkedin && (
                      <a href={`https://linkedin.com/in/${user.socialMedia.linkedin}`} target="_blank" rel="noopener noreferrer" className="flex items-center p-2 rounded-md hover:bg-gray-50">
                        <Linkedin className="h-5 w-5 mr-2 text-blue-700" />
                        <span>{user.socialMedia.linkedin}</span>
                      </a>
                    )}
                    {user.socialMedia?.github && (
                      <a href={`https://github.com/${user.socialMedia.github}`} target="_blank" rel="noopener noreferrer" className="flex items-center p-2 rounded-md hover:bg-gray-50">
                        <Github className="h-5 w-5 mr-2 text-gray-800" />
                        <span>{user.socialMedia.github}</span>
                      </a>
                    )}
                    {!user.socialMedia?.instagram && !user.socialMedia?.twitter && 
                     !user.socialMedia?.facebook && !user.socialMedia?.linkedin && 
                     !user.socialMedia?.github && (
                      <p className="text-gray-500 col-span-full">No social media profiles linked</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Account Settings Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-xl">Account Settings</CardTitle>
          <CardDescription>
            Manage your account preferences and settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-4">Preferences</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-500">Units</h4>
                  <div className="flex space-x-2">
                    <Button variant="outline" className="bg-primary/5 text-primary" size="sm">Imperial (lbs)</Button>
                    <Button variant="outline" size="sm">Metric (kg)</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-500">Theme</h4>
                  <div className="flex space-x-2">
                    <Button variant="outline" className="bg-primary/5 text-primary" size="sm">Light</Button>
                    <Button variant="outline" size="sm">Dark</Button>
                    <Button variant="outline" size="sm">System</Button>
                  </div>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-medium mb-4">Privacy Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-500">Profile Visibility</h4>
                  <div className="flex space-x-2">
                    <Button variant="outline" className="bg-primary/5 text-primary" size="sm">Public</Button>
                    <Button variant="outline" size="sm">Friends Only</Button>
                    <Button variant="outline" size="sm">Private</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-500">Workout Sharing</h4>
                  <div className="flex space-x-2">
                    <Button variant="outline" className="bg-primary/5 text-primary" size="sm">Enabled</Button>
                    <Button variant="outline" size="sm">Disabled</Button>
                  </div>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-medium mb-4">Account Actions</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" size="sm" className="flex items-center">
                  <Upload className="h-4 w-4 mr-1" />
                  Export Data
                </Button>
                <Button variant="outline" size="sm">Change Password</Button>
                <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                  Delete Account
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
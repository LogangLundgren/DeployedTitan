import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Edit, 
  User as UserIcon,
  Instagram,
  Twitter,
  Facebook,
  Award,
  Camera,
  Upload,
  CheckCircle,
  Clock,
  DollarSign,
  CheckCircle2,
  BadgeCheck,
  BookOpen,
  Star,
  Eye,
  Trash2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [isCoachProfileEditing, setIsCoachProfileEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTab, setSelectedTab] = useState("profile");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [coachAvailability, setCoachAvailability] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Settings preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [workoutReminders, setWorkoutReminders] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);
  const [showActivity, setShowActivity] = useState(true);
  const [anonymousStats, setAnonymousStats] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  
  // Theme management
  useEffect(() => {
    // Get the current theme from localStorage or default to light
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' || 'light';
    setTheme(savedTheme);
    
    // Apply the theme to the document
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else if (savedTheme === 'system') {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);
  
  // Handle theme change
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else if (newTheme === 'system') {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    
    // Show toast notification
    toast({
      title: "Theme updated",
      description: `Theme set to ${newTheme === 'system' ? 'system default' : newTheme} mode.`,
      variant: "default",
    });
  };
  
  // Form refs for the different sections
  const nameRef = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const locationRef = useRef<HTMLInputElement>(null);
  const bioRef = useRef<HTMLTextAreaElement>(null);
  const fitnessLevelRef = useRef<HTMLInputElement>(null);
  const experienceYearsRef = useRef<HTMLInputElement>(null);
  const goalsRef = useRef<HTMLTextAreaElement>(null);
  const certificationsRef = useRef<HTMLTextAreaElement>(null);
  const instagramRef = useRef<HTMLInputElement>(null);
  const twitterRef = useRef<HTMLInputElement>(null);
  const facebookRef = useRef<HTMLInputElement>(null);
  
  // Coach profile refs
  const coachTitleRef = useRef<HTMLInputElement>(null);
  const coachBiographyRef = useRef<HTMLTextAreaElement>(null);
  const coachExperienceRef = useRef<HTMLTextAreaElement>(null);
  const coachSpecialtiesRef = useRef<HTMLTextAreaElement>(null);
  const coachHourlyRateRef = useRef<HTMLInputElement>(null);

  // Get the authenticated user information
  const { user: authUser } = useAuth();
  
  // Get the user's profile information
  const { data: user, isLoading, refetch } = useQuery({
    queryKey: ['/api/user'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/user');
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }
        return await response.json();
      } catch (error) {
        console.error("Error fetching user:", error);
        throw error;
      }
    },
    enabled: !!authUser,
    refetchOnWindowFocus: false
  });
  
  // Get coach profile if user is a coach
  const { data: coachProfile } = useQuery({
    queryKey: ['/api/coaches/profile', user?.id],
    queryFn: async () => {
      if (!user || !user.isCoach) return null;
      
      try {
        // First try the regular coach profile endpoint
        const response = await fetch(`/api/coaches/profile?userId=${user.id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            // If not found on the first endpoint, try the alternate endpoint
            console.log("Trying alternate coach profile endpoint...");
            const altResponse = await fetch(`/api/users/${user.id}/coach-profile`);
            
            if (altResponse.ok) {
              return await altResponse.json();
            }
            
            // If both fail with 404, it's expected for new coaches without profiles
            return null;
          }
          throw new Error('Failed to fetch coach profile');
        }
        
        return await response.json();
      } catch (error) {
        console.error("Error fetching coach profile:", error);
        
        // Try alternate endpoint as a fallback
        try {
          console.log("Trying alternate coach profile endpoint as fallback...");
          const altResponse = await fetch(`/api/users/${user.id}/coach-profile`);
          
          if (altResponse.ok) {
            return await altResponse.json();
          }
        } catch (fallbackError) {
          console.error("Error fetching from fallback endpoint:", fallbackError);
        }
        
        return null;
      }
    },
    enabled: !!user && !!user.isCoach,
    refetchOnWindowFocus: false
  });
  
  // Initialize coach availability state
  useEffect(() => {
    if (coachProfile) {
      setCoachAvailability(coachProfile.isAvailableForHire !== false);
    }
  }, [coachProfile]);
  
  // Initialize preference state variables from user data
  useEffect(() => {
    if (user && user.preferences) {
      // Set theme preference
      if (user.preferences.theme) {
        setTheme(user.preferences.theme);
      }
      
      // Set notification preferences
      if (user.preferences.emailNotifications !== undefined) {
        setEmailNotifications(user.preferences.emailNotifications);
      }
      
      if (user.preferences.pushNotifications !== undefined) {
        setPushNotifications(user.preferences.pushNotifications);
      }
      
      if (user.preferences.workoutReminders !== undefined) {
        setWorkoutReminders(user.preferences.workoutReminders);
      }
      
      // Set privacy preferences
      if (user.preferences.publicProfile !== undefined) {
        setPublicProfile(user.preferences.publicProfile);
      }
      
      if (user.preferences.showActivity !== undefined) {
        setShowActivity(user.preferences.showActivity);
      }
      
      if (user.preferences.anonymousStats !== undefined) {
        setAnonymousStats(user.preferences.anonymousStats);
      }
    }
  }, [user]);
  
  // Get the user's recent workouts for displaying stats
  const { data: workouts } = useQuery({
    queryKey: ['/api/workouts/recent', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/workouts/recent?userId=${user?.id}`);
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
    queryKey: ['/api/templates', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/templates?userId=${user?.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      return response.json();
    },
    refetchOnWindowFocus: false,
    enabled: !!user
  });

  // Mutation for updating user profile
  const updateProfileMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiRequest("PATCH", `/api/users/${user?.id}`, userData);
      return response;
    },
    onSuccess: () => {
      // Invalidate the user query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      // Also explicitly refetch
      refetch();
      
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
  
  // Coach profile mutation
  const updateCoachProfileMutation = useMutation({
    mutationFn: async (coachData: any) => {
      try {
        const response = await apiRequest(
          coachProfile ? "PATCH" : "POST", 
          `/api/coaches/profile/${coachProfile?.id || 'new'}`,
          coachData
        );
        return response;
      } catch (error) {
        console.error("Error in primary coach update endpoint, trying alternate...");
        
        // Try alternate endpoint
        return await fetch(`/api/users/${user?.id}/coach-profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(coachData),
          credentials: 'include'
        });
      }
    },
    onSuccess: () => {
      // Invalidate both possible query keys
      queryClient.invalidateQueries({ queryKey: ['/api/coaches/profile', user?.id] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/coach-profile`] });
      setIsCoachProfileEditing(false);
      setIsSaving(false);
      
      toast({
        title: "Coach profile updated",
        description: "Your coach profile has been successfully updated.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("Failed to update coach profile:", error);
      setIsSaving(false);
      
      toast({
        title: "Update failed",
        description: "There was a problem updating your coach profile. Please try again.",
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
      certifications: certificationsRef.current?.value || user.certifications || '',
      socialMedia: {
        instagram: instagramRef.current?.value || user.socialMedia?.instagram || '',
        twitter: twitterRef.current?.value || user.socialMedia?.twitter || '',
        facebook: facebookRef.current?.value || user.socialMedia?.facebook || ''
      },
      preferences: {
        theme,
        emailNotifications,
        pushNotifications,
        workoutReminders,
        publicProfile,
        showActivity,
        anonymousStats
      }
    };
    
    // In a real app, we would validate the data here
    
    // Use the update profile mutation to save the data
    updateProfileMutation.mutate(updatedProfile);
  };
  
  // Handle coach profile save
  const handleSaveCoachProfile = () => {
    if (!user || !user.isCoach) return;
    
    setIsSaving(true);
    
    const updatedCoachProfile = {
      userId: user.id,
      title: coachTitleRef.current?.value || coachProfile?.title || `${user.name}'s Coaching`,
      biography: coachBiographyRef.current?.value || coachProfile?.biography || '',
      experience: coachExperienceRef.current?.value || coachProfile?.experience || '',
      specialties: coachSpecialtiesRef.current?.value || coachProfile?.specialties || '',
      hourlyRate: coachHourlyRateRef.current?.value ? 
        parseFloat(coachHourlyRateRef.current.value) : coachProfile?.hourlyRate || 0,
      isAvailableForHire: coachAvailability
    };
    
    updateCoachProfileMutation.mutate(updatedCoachProfile);
  };

  // View your public coach profile
  const handleViewCoachProfile = () => {
    setLocation(`/coach/${user?.id}`);
  };
  
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
        <h2 className="text-2xl font-bold text-foreground">Profile</h2>
        <p className="text-muted-foreground">Manage your profile and personal information</p>
      </div>
      
      {user && user.isCoach === true && (
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="profile">
              <UserIcon className="h-4 w-4 mr-2" />
              Personal Profile
            </TabsTrigger>
            <TabsTrigger value="coach">
              <BadgeCheck className="h-4 w-4 mr-2" />
              Coach Profile
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            {/* Personal profile tab content - this will render when selectedTab === 'profile' */}
          </TabsContent>
          
          <TabsContent value="coach">
            {/* Coach profile tab content - this will render when selectedTab === 'coach' */}
          </TabsContent>
        </Tabs>
      )}
      
      {(selectedTab === "profile" || !user || user.isCoach !== true) && (
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
                  <AvatarImage 
                    src={profileImage || user.profileImage || ""} 
                    alt={user.name || user.username} 
                  />
                  <AvatarFallback className="text-lg bg-primary/10 text-primary">
                    {(user.name || user.username || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setUploading(true);
                          // In a real app, we'd upload to a server here
                          // For now, just create a local data URL
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const dataUrl = event.target?.result as string;
                            setProfileImage(dataUrl);
                            setUploading(false);
                            
                            toast({
                              title: "Profile image updated",
                              description: "Your profile image has been updated (simulated).",
                              variant: "default",
                            });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <div 
                      className="absolute -right-2 bottom-0 bg-primary text-white p-1.5 rounded-full shadow-md cursor-pointer hover:bg-primary/90 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {uploading ? (
                        <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </div>
                  </>
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
                  {user.name && <p className="text-muted-foreground">@{user.username}</p>}
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
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="text-foreground">{user.email || "Not provided"}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Location</p>
                    <p className="text-foreground">{user.location || "Not specified"}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                    <p className="text-foreground">March 25, 2025</p>
                  </div>
                </>
              )}
              
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
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">Personal Information</CardTitle>
                <CardDescription>
                  Your fitness profile and experience
                </CardDescription>
              </div>
              {isEditing && (
                <Button 
                  variant="outline"
                  onClick={handleSaveProfile}
                  disabled={updateProfileMutation.isPending}
                  size="sm"
                >
                  {updateProfileMutation.isPending ? "Saving..." : "Save"}
                </Button>
              )}
            </div>
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
                  <p className="text-foreground">{user.bio || "No bio provided."}</p>
                )}
              </div>
              
              <Separator />
              
              {/* Fitness Experience */}
              <div>
                <div className="flex justify-between mb-2">
                  <h3 className="font-medium">Fitness Experience</h3>
                  {isEditing && <Edit className="h-4 w-4 text-muted-foreground" />}
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
                    <div className="md:col-span-2">
                      <Label htmlFor="certifications">Certifications</Label>
                      <Textarea 
                        id="certifications" 
                        ref={certificationsRef} 
                        defaultValue={user.certifications} 
                        placeholder="List your fitness certifications" 
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Fitness Level</p>
                        <p className="text-foreground">{user.fitnessLevel || "Not specified"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Years of Experience</p>
                        <p className="text-foreground">{user.experienceYears || "Not specified"}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Fitness Goals</p>
                      <p className="text-foreground">{user.goals || "No goals specified"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Certifications</p>
                      <p className="flex items-center">
                        {user.certifications ? (
                          <>
                            <Award className="h-4 w-4 mr-1 text-amber-500" />
                            {user.certifications}
                          </>
                        ) : "No certifications listed"}
                      </p>
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

                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {user.socialMedia?.instagram && (
                      <a href={`https://instagram.com/${user.socialMedia.instagram}`} target="_blank" rel="noopener noreferrer" className="flex items-center p-2 rounded-md hover:bg-accent">
                        <Instagram className="h-5 w-5 mr-2 text-pink-600" />
                        <span className="text-foreground">@{user.socialMedia.instagram}</span>
                      </a>
                    )}
                    {user.socialMedia?.twitter && (
                      <a href={`https://twitter.com/${user.socialMedia.twitter}`} target="_blank" rel="noopener noreferrer" className="flex items-center p-2 rounded-md hover:bg-accent">
                        <Twitter className="h-5 w-5 mr-2 text-blue-400" />
                        <span className="text-foreground">@{user.socialMedia.twitter}</span>
                      </a>
                    )}
                    {user.socialMedia?.facebook && (
                      <a href={`https://facebook.com/${user.socialMedia.facebook}`} target="_blank" rel="noopener noreferrer" className="flex items-center p-2 rounded-md hover:bg-accent">
                        <Facebook className="h-5 w-5 mr-2 text-blue-600" />
                        <span className="text-foreground">{user.socialMedia.facebook}</span>
                      </a>
                    )}
                    {!user.socialMedia?.instagram && !user.socialMedia?.twitter && !user.socialMedia?.facebook && (
                      <p className="text-muted-foreground col-span-2">No social media profiles linked</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      )}
      
      {selectedTab === "coach" && user.isCoach === true && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coach Profile Card */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl">Coach Details</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCoachProfileEditing(!isCoachProfileEditing)}
                  className="h-8 px-2"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  {isCoachProfileEditing ? "Cancel" : "Edit"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                {isCoachProfileEditing ? (
                  <>
                    <div>
                      <Label htmlFor="coachTitle">Professional Title</Label>
                      <Input 
                        id="coachTitle" 
                        ref={coachTitleRef} 
                        defaultValue={coachProfile?.title || `${user.name}'s Coaching`} 
                        placeholder="e.g. Certified Personal Trainer" 
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                      <Input 
                        id="hourlyRate" 
                        type="number" 
                        ref={coachHourlyRateRef}
                        defaultValue={coachProfile?.hourlyRate || "0"} 
                        min="0" 
                        step="5"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="availableForHire"
                        checked={coachAvailability}
                        onCheckedChange={setCoachAvailability}
                      />
                      <Label htmlFor="availableForHire">Available for Hire</Label>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Hourly Rate</p>
                      <p className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                        ${coachProfile?.hourlyRate || 0}/hour
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500">Availability</p>
                      <p className="flex items-center">
                        {coachProfile?.isAvailableForHire !== false ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-1 text-green-600" />
                            Available for Hire
                          </>
                        ) : (
                          <>
                            <Clock className="h-4 w-4 mr-1 text-amber-500" />
                            Not Currently Available
                          </>
                        )}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500">Ratings</p>
                      <p className="flex items-center">
                        <Star className="h-4 w-4 mr-1 text-amber-500" />
                        {coachProfile?.rating || "No ratings yet"} 
                        {coachProfile?.ratingsCount ? ` (${coachProfile.ratingsCount} reviews)` : ""}
                      </p>
                    </div>
                  </>
                )}
                
                {isCoachProfileEditing && (
                  <div className="mt-4">
                    <Button 
                      className="w-full" 
                      onClick={handleSaveCoachProfile}
                      disabled={updateCoachProfileMutation.isPending}
                    >
                      {updateCoachProfileMutation.isPending ? "Saving..." : "Save Coach Profile"}
                    </Button>
                  </div>
                )}
                
                {!isCoachProfileEditing && (
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleViewCoachProfile}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Public Profile
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Coach Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl">Coach Profile</CardTitle>
              <CardDescription>
                Your professional coaching profile visible to clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Biography Section */}
                <div>
                  <div className="flex justify-between mb-2">
                    <h3 className="font-medium">Biography</h3>
                    {isCoachProfileEditing && <Edit className="h-4 w-4 text-gray-400" />}
                  </div>
                  
                  {isCoachProfileEditing ? (
                    <Textarea
                      ref={coachBiographyRef}
                      placeholder="Tell potential clients about your coaching background, philosophy, and approach"
                      defaultValue={coachProfile?.biography}
                      className="min-h-[100px]"
                    />
                  ) : (
                    <p className="text-gray-700">{coachProfile?.biography || "No biography provided."}</p>
                  )}
                </div>
                
                <Separator />
                
                {/* Experience Section */}
                <div>
                  <div className="flex justify-between mb-2">
                    <h3 className="font-medium">Experience</h3>
                    {isCoachProfileEditing && <Edit className="h-4 w-4 text-gray-400" />}
                  </div>
                  
                  {isCoachProfileEditing ? (
                    <Textarea
                      ref={coachExperienceRef}
                      placeholder="Describe your professional experience, certifications, and achievements"
                      defaultValue={coachProfile?.experience}
                      className="min-h-[100px]"
                    />
                  ) : (
                    <div className="space-y-2">
                      <p className="text-gray-700">{coachProfile?.experience || "No experience details provided."}</p>
                    </div>
                  )}
                </div>
                
                <Separator />
                
                {/* Specialties Section */}
                <div>
                  <div className="flex justify-between mb-2">
                    <h3 className="font-medium">Specialties</h3>
                    {isCoachProfileEditing && <Edit className="h-4 w-4 text-gray-400" />}
                  </div>
                  
                  {isCoachProfileEditing ? (
                    <Textarea
                      ref={coachSpecialtiesRef}
                      placeholder="List your coaching specialties (e.g., strength training, nutrition, bodybuilding)"
                      defaultValue={coachProfile?.specialties}
                      className="min-h-[100px]"
                    />
                  ) : (
                    <div className="space-y-2">
                      <p className="text-gray-700">{coachProfile?.specialties || "No specialties listed."}</p>
                    </div>
                  )}
                </div>
                
                <Separator />
                
                {/* Coaching Stats */}
                <div>
                  <h3 className="font-medium mb-4">Coaching Stats</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-primary/5 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm text-gray-500">Active Clients</p>
                          <p className="text-2xl font-bold">12</p>
                        </div>
                        <UserIcon className="h-8 w-8 text-primary/60" />
                      </div>
                    </div>
                    
                    <div className="bg-primary/5 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm text-gray-500">Programs Sold</p>
                          <p className="text-2xl font-bold">48</p>
                        </div>
                        <BookOpen className="h-8 w-8 text-primary/60" />
                      </div>
                    </div>
                    
                    <div className="bg-primary/5 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm text-gray-500">Avg. Rating</p>
                          <p className="text-2xl font-bold flex items-center">
                            {coachProfile?.rating || "-"}
                            <Star className="h-4 w-4 ml-1 text-amber-500" />
                          </p>
                        </div>
                        <Star className="h-8 w-8 text-primary/60" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Settings Section */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl">Settings</CardTitle>
            <Button 
              variant="outline"
              onClick={handleSaveProfile}
              disabled={updateProfileMutation.isPending}
              size="sm"
            >
              {updateProfileMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-3">Theme Preferences</h3>
              <div className="flex flex-wrap gap-3">
                <Button 
                  variant={theme === 'light' ? 'default' : 'outline'} 
                  onClick={() => handleThemeChange('light')}
                  className="flex-1"
                >
                  Light Mode
                </Button>
                <Button 
                  variant={theme === 'dark' ? 'default' : 'outline'} 
                  onClick={() => handleThemeChange('dark')}
                  className="flex-1"
                >
                  Dark Mode
                </Button>
                <Button 
                  variant={theme === 'system' ? 'default' : 'outline'} 
                  onClick={() => handleThemeChange('system')}
                  className="flex-1"
                >
                  System Default
                </Button>
              </div>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-3">Notification Settings</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-gray-500">Receive email updates about your activity</p>
                    </div>
                    <Switch 
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Push Notifications</p>
                      <p className="text-sm text-gray-500">Get notifications in the app</p>
                    </div>
                    <Switch 
                      checked={pushNotifications}
                      onCheckedChange={setPushNotifications}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Workout Reminders</p>
                      <p className="text-sm text-gray-500">Get reminded about scheduled workouts</p>
                    </div>
                    <Switch 
                      checked={workoutReminders}
                      onCheckedChange={setWorkoutReminders}
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-3">Privacy Settings</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Public Profile</p>
                      <p className="text-sm text-gray-500">Make your profile visible to others</p>
                    </div>
                    <Switch 
                      checked={publicProfile}
                      onCheckedChange={setPublicProfile}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Show Activity</p>
                      <p className="text-sm text-gray-500">Allow others to see your recent workouts</p>
                    </div>
                    <Switch 
                      checked={showActivity}
                      onCheckedChange={setShowActivity}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Anonymous Statistics</p>
                      <p className="text-sm text-gray-500">Contribute anonymously to fitness statistics</p>
                    </div>
                    <Switch 
                      checked={anonymousStats}
                      onCheckedChange={setAnonymousStats}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Save Settings Button */}
            <div className="mt-6 flex justify-end">
              <Button 
                onClick={handleSaveProfile}
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
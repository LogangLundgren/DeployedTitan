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
  BookOpen
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [isCoachProfileEditing, setIsCoachProfileEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTab, setSelectedTab] = useState("profile");
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
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
  
  // Get the user's profile information
  const { data: user, isLoading, refetch } = useQuery({
    queryKey: ['/api/users/1'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/users/1');
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }
        const userData = await response.json();
        return userData || { 
          id: 1, 
          username: 'demo', 
          name: 'John Smith', 
          email: 'demo@example.com',
          // Additional user fields
          bio: 'Fitness enthusiast focused on strength training and nutrition. Always looking to push my limits and achieve new personal records.',
          fitnessLevel: 'Intermediate',
          experienceYears: 3,
          goals: 'Build muscle mass and improve overall strength',
          location: 'New York, NY',
          socialMedia: {
            instagram: 'johnsmith_fitness',
            twitter: 'jsmith_lift',
            facebook: ''
          },
          certifications: 'Certified Personal Trainer (CPT), Strength and Conditioning Specialist'
        };
      } catch (error) {
        console.error("Error fetching user:", error);
        // Return demo data if the API fails
        return { 
          id: 1, 
          username: 'demo', 
          name: 'John Smith', 
          email: 'demo@example.com',
          // Additional user fields
          bio: 'Fitness enthusiast focused on strength training and nutrition. Always looking to push my limits and achieve new personal records.',
          fitnessLevel: 'Intermediate',
          experienceYears: 3,
          goals: 'Build muscle mass and improve overall strength',
          location: 'New York, NY',
          socialMedia: {
            instagram: 'johnsmith_fitness',
            twitter: 'jsmith_lift',
            facebook: ''
          },
          certifications: 'Certified Personal Trainer (CPT), Strength and Conditioning Specialist'
        };
      }
    },
    refetchOnWindowFocus: false
  });
  
  // Mutation for updating user profile
  const updateProfileMutation = useMutation({
    mutationFn: async (userData: any) => {
      return await apiRequest(`/api/users/${user?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
    },
    onSuccess: () => {
      // Invalidate the user query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['/api/users/1'] });
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
      }
    };
    
    // In a real app, we would validate the data here
    
    // Use the update profile mutation to save the data
    updateProfileMutation.mutate(updatedProfile);
  };
  
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
  
  // Get coach profile if user is a coach
  const { data: coachProfile } = useQuery({
    queryKey: ['/api/coaches/profile', user?.id],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/coaches/profile?userId=${user?.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch coach profile');
        }
        return await response.json();
      } catch (error) {
        console.error("Error fetching coach profile:", error);
        return null;
      }
    },
    refetchOnWindowFocus: false,
    enabled: !!user && !!user.isCoach
  });

  // Coach profile refs
  const coachTitleRef = useRef<HTMLInputElement>(null);
  const coachBiographyRef = useRef<HTMLTextAreaElement>(null);
  const coachExperienceRef = useRef<HTMLInputElement>(null);
  const coachSpecialtiesRef = useRef<HTMLTextAreaElement>(null);
  const coachHourlyRateRef = useRef<HTMLInputElement>(null);
  const coachAvailableForHireRef = useRef<HTMLInputElement>(null);

  // Coach profile mutation
  const updateCoachProfileMutation = useMutation({
    mutationFn: async (coachData: any) => {
      return await apiRequest(`/api/coaches/profile/${coachProfile?.id || 'new'}`, {
        method: coachProfile ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(coachData)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/coaches/profile', user?.id] });
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
      isAvailableForHire: coachAvailableForHireRef.current?.checked ?? coachProfile?.isAvailableForHire ?? true
    };
    
    updateCoachProfileMutation.mutate(updatedCoachProfile);
  };

  // View your public coach profile
  const handleViewCoachProfile = () => {
    setLocation(`/coach/${user?.id}`);
  };

  return (
    <main className="flex-grow container mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Profile</h2>
        <p className="text-gray-500">Manage your profile and personal information</p>
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
                    <div>
                      <p className="text-sm font-medium text-gray-500">Certifications</p>
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
                    {!user.socialMedia?.instagram && !user.socialMedia?.twitter && 
                     !user.socialMedia?.facebook && (
                      <p className="text-gray-500 col-span-full">No social media profiles linked</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      )}
      
      {/* Coach Profile Section */}
      {selectedTab === "coach" && user && user.isCoach === true && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
              <div className="flex flex-col items-center mb-6">
                <div className="relative mb-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src="" alt={user.name || user.username} />
                    <AvatarFallback className="text-lg bg-primary/10 text-primary">
                      {(user.name || user.username || "C").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isCoachProfileEditing && (
                    <div className="absolute -right-2 bottom-0 bg-primary text-white p-1.5 rounded-full shadow-md cursor-pointer">
                      <Camera className="h-4 w-4" />
                    </div>
                  )}
                </div>
                
                {isCoachProfileEditing ? (
                  <div className="w-full space-y-2">
                    <div>
                      <Label htmlFor="coachTitle">Coach Title</Label>
                      <Input 
                        id="coachTitle" 
                        ref={coachTitleRef} 
                        defaultValue={coachProfile?.title} 
                        placeholder="Your coaching business name" 
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl font-semibold">
                      {coachProfile?.title || `${user.name}'s Coaching`}
                    </h3>
                    <div className="flex items-center mt-1">
                      <BadgeCheck className="h-4 w-4 text-primary mr-1" />
                      <span className="text-sm text-primary font-medium">Verified Coach</span>
                    </div>
                  </>
                )}
              </div>
              
              <div className="space-y-4">
                {!isCoachProfileEditing ? (
                  <>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Coach Since</p>
                      <p>{user.coachRegistrationDate ? new Date(user.coachRegistrationDate).toLocaleDateString() : "Recently"}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500">Hourly Rate</p>
                      <p className="font-semibold">${coachProfile?.hourlyRate || "0.00"}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500">Available for Hire</p>
                      <p className="flex items-center">
                        {coachProfile?.isAvailableForHire ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500 mr-1" /> 
                            Currently Available
                          </>
                        ) : (
                          <>
                            <Clock className="h-4 w-4 text-orange-500 mr-1" /> 
                            Not Available
                          </>
                        )}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="coachHourlyRate">Hourly Rate ($)</Label>
                      <Input 
                        id="coachHourlyRate" 
                        ref={coachHourlyRateRef} 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        defaultValue={coachProfile?.hourlyRate || 0} 
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="coachAvailableForHire"
                        ref={coachAvailableForHireRef}
                        defaultChecked={coachProfile?.isAvailableForHire ?? true}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <Label htmlFor="coachAvailableForHire" className="cursor-pointer">
                        Available for Hire
                      </Label>
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
                      className="w-full"
                      onClick={handleViewCoachProfile}
                      variant="outline"
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
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
                Your public coach information that clients will see
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Biography Section */}
                <div>
                  <div className="flex justify-between mb-2">
                    <h3 className="font-medium">Coach Biography</h3>
                    {isCoachProfileEditing && <Edit className="h-4 w-4 text-gray-400" />}
                  </div>
                  
                  {isCoachProfileEditing ? (
                    <Textarea
                      ref={coachBiographyRef}
                      placeholder="Tell potential clients about your coaching style, philosophy, and approach"
                      defaultValue={coachProfile?.biography}
                      className="min-h-[100px]"
                    />
                  ) : (
                    <p className="text-gray-700">{coachProfile?.biography || "No coach biography provided."}</p>
                  )}
                </div>
                
                <Separator />
                
                {/* Coach Experience */}
                <div>
                  <div className="flex justify-between mb-2">
                    <h3 className="font-medium">Experience & Expertise</h3>
                    {isCoachProfileEditing && <Edit className="h-4 w-4 text-gray-400" />}
                  </div>
                  
                  {isCoachProfileEditing ? (
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="coachExperience">Experience</Label>
                        <Input 
                          id="coachExperience" 
                          ref={coachExperienceRef} 
                          defaultValue={coachProfile?.experience} 
                          placeholder="Years of experience, credentials, etc." 
                        />
                      </div>
                      <div>
                        <Label htmlFor="coachSpecialties">Specialties</Label>
                        <Textarea 
                          id="coachSpecialties" 
                          ref={coachSpecialtiesRef} 
                          defaultValue={coachProfile?.specialties} 
                          placeholder="Your coaching specialties (e.g., strength training, weight loss, bodybuilding)" 
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Experience</p>
                        <p>{coachProfile?.experience || "Not specified"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Specialties</p>
                        <p>{coachProfile?.specialties || "No specialties listed"}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <Separator />
                
                {/* Statistics and Ratings */}
                <div>
                  <h3 className="font-medium mb-3">Coach Statistics</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg flex flex-col items-center">
                      <DollarSign className="h-8 w-8 text-green-500 mb-1" />
                      <span className="text-2xl font-bold">
                        {coachProfile?.sales || 0}
                      </span>
                      <span className="text-sm text-gray-500">Plans Sold</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg flex flex-col items-center">
                      <Star className="h-8 w-8 text-amber-400 mb-1" />
                      <span className="text-2xl font-bold">
                        {coachProfile?.rating || '0.0'}
                      </span>
                      <span className="text-sm text-gray-500">Average Rating</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg flex flex-col items-center">
                      <CheckCircle2 className="h-8 w-8 text-blue-500 mb-1" />
                      <span className="text-2xl font-bold">
                        {coachProfile?.ratingsCount || 0}
                      </span>
                      <span className="text-sm text-gray-500">Reviews</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
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
                    <Button 
                      variant="outline" 
                      className={theme === 'light' ? "bg-primary/5 text-primary" : ""} 
                      size="sm"
                      onClick={() => handleThemeChange('light')}
                    >
                      Light
                    </Button>
                    <Button 
                      variant="outline" 
                      className={theme === 'dark' ? "bg-primary/5 text-primary" : ""} 
                      size="sm"
                      onClick={() => handleThemeChange('dark')}
                    >
                      Dark
                    </Button>
                    <Button 
                      variant="outline" 
                      className={theme === 'system' ? "bg-primary/5 text-primary" : ""} 
                      size="sm"
                      onClick={() => handleThemeChange('system')}
                    >
                      System
                    </Button>
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
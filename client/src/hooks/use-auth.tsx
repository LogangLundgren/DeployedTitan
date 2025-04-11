import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useQuery, useMutation, UseMutationResult } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type LoginData = {
  username: string;
  password: string;
};

type RegisterData = {
  username: string;
  password: string;
  name: string;
  email: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
};

// Create the auth context
const AuthContext = createContext<AuthContextType | null>(null);

// For demo purposes, we'll continue using the hardcoded user
// In a real app, this would fetch from the API
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  // Demo user data for development until we implement backend auth
  const demoUser: User = {
    id: 1,
    username: 'demo',
    name: 'John Smith',
    email: 'demo@example.com',
    password: '',
    bio: null,
    location: null,
    fitnessLevel: null,
    experienceYears: null,
    goals: null,
    certifications: null,
    socialMedia: null,
    isCoach: false,
    coachRegistrationDate: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null
  };

  // Use query for getting the current user from the API
  const {
    data: user,
    isLoading,
    error,
  } = useQuery<User, Error>({
    queryKey: ['/api/users/1'],
    queryFn: async () => {
      try {
        // Fetch real user data from the API
        const res = await fetch('/api/users/1');
        if (!res.ok) throw new Error('Failed to fetch user');
        return res.json();
      } catch (error) {
        console.error("Error fetching user in useAuth:", error);
        // Fallback to demo user if API fails
        return demoUser;
      }
    },
    refetchOnWindowFocus: true, // Ensure we get fresh data when the window gets focus
    staleTime: 30000, // Consider data stale after 30 seconds
  });

  // Mock login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      // In a real app, this would authenticate with the backend
      // const res = await apiRequest('POST', '/api/login', credentials);
      // return await res.json();
      
      // For demo, return the hardcoded user
      return demoUser;
    },
    onSuccess: (userData: User) => {
      queryClient.setQueryData(['/api/user'], userData);
      toast({
        title: 'Login successful',
        description: `Welcome back, ${userData.name || userData.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Login failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mock register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      // In a real app, this would register with the backend
      // const res = await apiRequest('POST', '/api/register', userData);
      // return await res.json();
      
      // For demo, return the hardcoded user
      return demoUser;
    },
    onSuccess: (userData: User) => {
      queryClient.setQueryData(['/api/user'], userData);
      toast({
        title: 'Registration successful',
        description: `Welcome, ${userData.name || userData.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Registration failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mock logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      // In a real app, this would log out from the backend
      // await apiRequest('POST', '/api/logout');
    },
    onSuccess: () => {
      // Don't clear user data in demo mode
      // queryClient.setQueryData(['/api/user'], null);
      toast({
        title: 'Logged out',
        description: 'You have been logged out successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Logout failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
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

// Provides authentication functionality using cookies and the backend API
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  // Authentication is now fully implemented with the backend

  // Use query for getting the current user from the API
  const {
    data: user,
    isLoading,
    error,
  } = useQuery<User | null, Error>({
    queryKey: ['/api/user'],
    queryFn: async () => {
      try {
        // Fetch user data from the auth endpoint
        const res = await apiRequest('GET', '/api/user');
        
        if (!res.ok) {
          if (res.status === 401) {
            // User is not authenticated
            console.log("User not authenticated");
            return null;
          }
          throw new Error('Failed to fetch user');
        }
        
        return await res.json();
      } catch (error) {
        console.error("Error fetching user in useAuth:", error);
        return null;
      }
    },
    refetchOnWindowFocus: true, // Ensure we get fresh data when the window gets focus
    staleTime: 30000, // Consider data stale after 30 seconds
  });

  // Login mutation using the real backend API
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const response = await apiRequest('POST', '/api/auth/login', credentials);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      
      const data = await response.json();
      return data.user || data; // Extract user from response if present
    },
    onSuccess: (userData: User) => {
      // Update the user data in the cache
      queryClient.setQueryData(['/api/user'], userData);
      // Refetch user data to ensure we have the latest
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
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

  // Register mutation using the real backend API
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const response = await apiRequest('POST', '/api/auth/register', userData);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
      
      // Get the new user data from response
      const data = await response.json();
      return data.user || data; // User is already in session after registration
    },
    onSuccess: (userData: User) => {
      // Update the user data in the cache
      queryClient.setQueryData(['/api/user'], userData);
      // Refetch user data to ensure we have the latest
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
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

  // Logout mutation using the real backend API
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/auth/logout');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Logout failed');
      }
      
      return response.status === 204 ? {} : response.json();
    },
    onSuccess: () => {
      // Clear user data from the cache
      queryClient.setQueryData(['/api/user'], null);
      
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
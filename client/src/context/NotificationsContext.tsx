import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Define the notification type based on the schema
export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  loading: boolean;
  error: boolean;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};

interface NotificationsProviderProps {
  userId: number;
  children: React.ReactNode;
}

export const NotificationsProvider: React.FC<NotificationsProviderProps> = ({ 
  userId, 
  children 
}) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Fetch notifications
  const { 
    data: notifications = [], 
    isLoading: notificationsLoading,
    isError: notificationsError,
    refetch: refetchNotifications
  } = useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => apiRequest<Notification[]>(`/api/notifications?userId=${userId}`),
    refetchInterval: 60000, // Refetch every minute
    enabled: !!userId
  });
  
  // Fetch unread count
  const { 
    data: unreadCountData, 
    isLoading: countLoading,
    isError: countError,
    refetch: refetchCount
  } = useQuery({
    queryKey: ['notifications-count', userId],
    queryFn: () => apiRequest<{ count: number }>(`/api/notifications/unread-count?userId=${userId}`),
    refetchInterval: 60000, // Refetch every minute
    enabled: !!userId
  });
  
  const unreadCount = unreadCountData?.count || 0;
  const loading = notificationsLoading || countLoading;
  const error = notificationsError || countError;
  
  // Mark a notification as read
  const markAsRead = async (id: number) => {
    try {
      await apiRequest(`/api/notifications/${id}/mark-read`, {
        method: 'PATCH'
      });
      
      // Invalidate queries to refresh data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['notifications', userId] }),
        queryClient.invalidateQueries({ queryKey: ['notifications-count', userId] })
      ]);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        variant: 'destructive'
      });
    }
  };
  
  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await apiRequest('/api/notifications/mark-all-read', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });
      
      // Invalidate queries to refresh data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['notifications', userId] }),
        queryClient.invalidateQueries({ queryKey: ['notifications-count', userId] })
      ]);
      
      toast({
        title: 'Success',
        description: 'All notifications marked as read',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark all notifications as read',
        variant: 'destructive'
      });
    }
  };
  
  // Value object to be provided by the context
  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    loading,
    error
  };
  
  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};
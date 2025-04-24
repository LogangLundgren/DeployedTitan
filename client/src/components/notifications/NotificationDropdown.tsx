import React from 'react';
import { Bell } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications, Notification } from '@/context/NotificationsContext';
import { formatDistanceToNow } from 'date-fns';

// Map notification types to their respective styles
const notificationStyles: Record<string, { icon: React.ReactNode, className: string }> = {
  info: {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 16v-4"/>
        <path d="M12 8h.01"/>
      </svg>
    ),
    className: 'border-l-4 border-blue-500'
  },
  success: {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
    className: 'border-l-4 border-green-500'
  },
  warning: {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
        <path d="M12 9v4"/>
        <path d="M12 17h.01"/>
      </svg>
    ),
    className: 'border-l-4 border-yellow-500'
  },
  error: {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    ),
    className: 'border-l-4 border-red-500'
  },
  workout: {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500">
        <path d="M18 11V9a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2"/>
        <path d="m20 11-3-3"/>
        <path d="m17 14 3-3"/>
      </svg>
    ),
    className: 'border-l-4 border-purple-500'
  },
  achievement: {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
        <path d="M8.21 13.89 7 23l5-3 5 3-1.21-9.12"/>
        <circle cx="12" cy="8" r="7"/>
      </svg>
    ),
    className: 'border-l-4 border-amber-500'
  }
};

// Component for a single notification item
const NotificationItem = ({ notification, onRead }: { notification: Notification, onRead: () => void }) => {
  const style = notificationStyles[notification.type] || notificationStyles.info;
  const timeAgo = notification.createdAt ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true }) : '';
  
  return (
    <div 
      className={`p-4 mb-2.5 rounded-lg bg-card hover:bg-accent/60 cursor-pointer transition-all duration-200 
        ${style.className} ${notification.isRead ? 'opacity-70' : 'shadow-sm'} 
        ${!notification.isRead ? 'bg-primary/5' : ''}`}
      onClick={onRead}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          {style.icon}
        </div>
        <div className="flex-1">
          <div className={`font-semibold ${!notification.isRead ? 'text-primary' : ''}`}>
            {notification.title}
            {!notification.isRead && (
              <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-primary"></span>
            )}
          </div>
          <div className="text-sm text-muted-foreground mt-0.5">{notification.message}</div>
          <div className="text-xs text-muted-foreground/80 mt-1.5 font-medium">{timeAgo}</div>
        </div>
      </div>
    </div>
  );
};

export function NotificationDropdown() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();
  
  const handleMarkAsRead = async (id: number) => {
    await markAsRead(id);
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-white/10 transition-colors">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-5 h-5 flex items-center justify-center rounded-full animate-pulse shadow-sm" 
              variant="destructive"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 max-w-[90vw] shadow-xl overflow-hidden border">
        <DropdownMenuLabel className="flex justify-between items-center bg-gradient-to-r from-primary/5 to-primary/10 py-3">
          <span className="font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead} 
              className="text-xs hover:bg-white/40 transition-colors"
            >
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-[350px]">
          {loading ? (
            <div className="flex flex-col justify-center items-center p-8 space-y-3">
              <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-muted-foreground">Loading notifications...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col justify-center items-center p-12 space-y-2">
              <Bell className="h-10 w-10 text-muted-foreground/40" />
              <span className="text-sm font-medium text-muted-foreground">No notifications</span>
              <span className="text-xs text-muted-foreground max-w-52 text-center">
                We'll notify you when something important happens
              </span>
            </div>
          ) : (
            <div className="p-3">
              {notifications.map((notification) => (
                <NotificationItem 
                  key={notification.id} 
                  notification={notification} 
                  onRead={() => handleMarkAsRead(notification.id)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
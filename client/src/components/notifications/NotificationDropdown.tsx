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
    icon: <span className="text-blue-500">ℹ️</span>,
    className: 'border-l-4 border-blue-500'
  },
  success: {
    icon: <span className="text-green-500">✓</span>,
    className: 'border-l-4 border-green-500'
  },
  warning: {
    icon: <span className="text-yellow-500">⚠️</span>,
    className: 'border-l-4 border-yellow-500'
  },
  error: {
    icon: <span className="text-red-500">❌</span>,
    className: 'border-l-4 border-red-500'
  },
  workout: {
    icon: <span className="text-purple-500">💪</span>,
    className: 'border-l-4 border-purple-500'
  },
  achievement: {
    icon: <span className="text-amber-500">🏆</span>,
    className: 'border-l-4 border-amber-500'
  }
};

// Component for a single notification item
const NotificationItem = ({ notification, onRead }: { notification: Notification, onRead: () => void }) => {
  const style = notificationStyles[notification.type] || notificationStyles.info;
  const timeAgo = notification.createdAt ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true }) : '';
  
  return (
    <div 
      className={`p-4 mb-2 rounded bg-card hover:bg-accent cursor-pointer ${style.className} ${notification.isRead ? 'opacity-70' : 'font-medium'}`}
      onClick={onRead}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1">{style.icon}</div>
        <div className="flex-1">
          <div className="font-semibold">{notification.title}</div>
          <div className="text-sm text-muted-foreground">{notification.message}</div>
          <div className="text-xs text-muted-foreground mt-1">{timeAgo}</div>
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
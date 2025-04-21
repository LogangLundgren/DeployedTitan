import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface UnreadMessageCountProps {
  className?: string;
}

export function UnreadMessageCount({ className }: UnreadMessageCountProps) {
  const { user } = useAuth();

  const { data } = useQuery<{ count: number }>({
    queryKey: ["/api/messages/unread-count"],
    queryFn: () =>
      apiRequest("GET", "/api/messages/unread-count").then((res) => res.json()),
    enabled: !!user,
    // Check frequently for new messages
    refetchInterval: 30000, // 30 seconds
  });

  if (!data?.count || data.count === 0) {
    return null;
  }

  return (
    <Badge
      variant="destructive"
      className={cn(
        "px-1.5 py-0.5 text-xs rounded-full min-w-5 h-5 flex items-center justify-center",
        className
      )}
    >
      {data.count > 99 ? "99+" : data.count}
    </Badge>
  );
}
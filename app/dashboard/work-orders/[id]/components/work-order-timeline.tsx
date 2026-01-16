// app/dashboard/work-orders/[id]/components/work-order-timeline.tsx

"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  FileText,
  Activity,
  UserCheck,
  UserX,
  MessageCircle,
  Paperclip,
  Wrench,
  DollarSign,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getWorkOrderTimelineAction } from "@/app/actions/work-orders";

interface WorkOrderTimelineProps {
  workOrderId: string;
}

interface TimelineEvent {
  id: string;
  type: string;
  timestamp: string;
  user: {
    name: string;
    avatarUrl: string | null;
  } | null;
  title: string;
  description?: string;
  metadata?: any;
}

const iconMap: Record<string, any> = {
  CREATED: FileText,
  STATUS_CHANGED: Activity,
  ASSIGNED: UserCheck,
  UNASSIGNED: UserX,
  COMMENT_ADDED: MessageCircle,
  ATTACHMENT_UPLOADED: Paperclip,
  MAINTENANCE_LOG_ADDED: Wrench,
  EXPENSE_ADDED: DollarSign,
  COMPLETED: CheckCircle,
  CANCELLED: XCircle,
};

const colorMap: Record<string, string> = {
  CREATED: "bg-blue-100 text-blue-600",
  STATUS_CHANGED: "bg-purple-100 text-purple-600",
  ASSIGNED: "bg-green-100 text-green-600",
  UNASSIGNED: "bg-orange-100 text-orange-600",
  COMMENT_ADDED: "bg-gray-100 text-gray-600",
  ATTACHMENT_UPLOADED: "bg-indigo-100 text-indigo-600",
  MAINTENANCE_LOG_ADDED: "bg-yellow-100 text-yellow-600",
  EXPENSE_ADDED: "bg-red-100 text-red-600",
  COMPLETED: "bg-green-100 text-green-600",
  CANCELLED: "bg-gray-100 text-gray-600",
};

export function WorkOrderTimeline({ workOrderId }: WorkOrderTimelineProps) {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTimeline() {
      const result = await getWorkOrderTimelineAction(workOrderId);
      if (result.success && result.data) {
        setTimeline(result.data);
      }
      setIsLoading(false);
    }
    loadTimeline();
  }, [workOrderId]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (timestamp: string) => {
    return format(new Date(timestamp), "d MMM, HH:mm น.", { locale: th });
  };

  if (isLoading) {
    return (
      <Card className="lg:sticky lg:top-6">
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:sticky lg:top-6">
      <CardHeader>
        <CardTitle>Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {timeline.map((event, index) => {
              const Icon = iconMap[event.type] || Activity;
              const colorClass = colorMap[event.type] || "bg-gray-100 text-gray-600";

              return (
                <div key={event.id} className="flex gap-3 relative">
                  {/* Vertical line */}
                  {index < timeline.length - 1 && (
                    <div className="absolute left-5 top-10 bottom-0 w-px bg-border" />
                  )}

                  {/* Icon */}
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{event.title}</p>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {event.description}
                          </p>
                        )}
                        
                        {/* User info */}
                        {event.user && (
                          <div className="flex items-center gap-2 mt-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={event.user.avatarUrl || undefined} />
                              <AvatarFallback className="text-xs">
                                {getInitials(event.user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">
                              {event.user.name}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Timestamp */}
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatTime(event.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
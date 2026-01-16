/**
 * Status Badge Component
 * แสดง status/priority แบบ badge สวยงาม
 */

import { cn } from "@/lib/utils";
import {
  WorkOrderStatus,
  WorkOrderPriority,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
} from "@/lib/api/work-orders/types";

interface StatusBadgeProps {
  status: WorkOrderStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.color,
        className
      )}
    >
      {config.label}
    </span>
  );
}

interface PriorityBadgeProps {
  priority: WorkOrderPriority;
  className?: string;
  showIcon?: boolean;
}

export function PriorityBadge({
  priority,
  className,
  showIcon = true,
}: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.color,
        className
      )}
    >
      {showIcon && <span>{config.icon}</span>}
      <span>{config.label}</span>
    </span>
  );
}
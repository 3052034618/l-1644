import { cn } from "@/lib/utils"

interface PriorityBadgeProps {
  priority: "low" | "medium" | "high"
}

const priorityConfig = {
  low: { label: "低", className: "bg-success/15 text-success" },
  medium: { label: "中", className: "bg-warning/15 text-warning" },
  high: { label: "高", className: "bg-error/15 text-error" },
}

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = priorityConfig[priority]

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.className
      )}
    >
      {config.label}
    </span>
  )
}

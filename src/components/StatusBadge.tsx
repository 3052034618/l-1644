import { cn } from "@/lib/utils"

type ProjectStatus = "draft" | "active" | "reviewing" | "completed"
type TaskStatus = "pending" | "in_progress" | "submitted" | "reviewing" | "approved" | "rejected"

interface StatusBadgeProps {
  status: ProjectStatus | TaskStatus
  type: "project" | "task"
}

const projectStatusConfig: Record<ProjectStatus, { label: string; className: string }> = {
  draft: { label: "草稿", className: "bg-gray-500/15 text-gray-400" },
  active: { label: "进行中", className: "bg-blue-500/15 text-blue-400" },
  reviewing: { label: "审核中", className: "bg-warning/15 text-warning" },
  completed: { label: "已完成", className: "bg-success/15 text-success" },
}

const taskStatusConfig: Record<TaskStatus, { label: string; className: string }> = {
  pending: { label: "待处理", className: "bg-gray-500/15 text-gray-400" },
  in_progress: { label: "进行中", className: "bg-blue-500/15 text-blue-400" },
  submitted: { label: "已提交", className: "bg-purple-500/15 text-purple-400" },
  reviewing: { label: "审核中", className: "bg-warning/15 text-warning" },
  approved: { label: "已通过", className: "bg-success/15 text-success" },
  rejected: { label: "已退回", className: "bg-error/15 text-error" },
}

export default function StatusBadge({ status, type }: StatusBadgeProps) {
  const config = type === "project" ? projectStatusConfig : taskStatusConfig
  const entry = config[status as keyof typeof config]

  if (!entry) return null

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        entry.className
      )}
    >
      {entry.label}
    </span>
  )
}

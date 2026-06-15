import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { ClipboardList, Loader2, CheckCircle2, Clock, AlertTriangle } from "lucide-react"
import { useTaskStore } from "@/store/taskStore"
import { useAuthStore } from "@/store/authStore"
import { useProjectStore } from "@/store/projectStore"
import StatCard from "@/components/StatCard"
import PriorityBadge from "@/components/PriorityBadge"
import StatusBadge from "@/components/StatusBadge"
import DataTypeInfo from "@/components/DataTypeInfo"
import { cn } from "@/lib/utils"

type FilterTab = "all" | "pending" | "in_progress" | "submitted" | "rejected"

const filterTabs: { key: FilterTab; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "pending", label: "待处理" },
  { key: "in_progress", label: "进行中" },
  { key: "submitted", label: "已提交" },
  { key: "rejected", label: "退回" },
]

const statusToTabMap: Record<string, FilterTab> = {
  pending: "pending",
  in_progress: "in_progress",
  submitted: "submitted",
  rejected: "rejected",
  reviewing: "submitted",
  approved: "submitted",
  completed: "submitted",
}

export default function AnnotatorWorkspace() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all")
  const navigate = useNavigate()
  const { currentUser } = useAuthStore()
  const { loadTasks, getTasksByAssignee } = useTaskStore()
  const { loadProjects, getProjectById } = useProjectStore()

  useEffect(() => {
    loadTasks()
    loadProjects()
  }, [loadTasks, loadProjects])

  const myTasks = currentUser
    ? getTasksByAssignee(currentUser.id)
    : []

  const pendingCount = myTasks.filter((t) => t.status === "pending").length
  const inProgressCount = myTasks.filter((t) => t.status === "in_progress").length
  const completedTodayCount = myTasks.filter((t) => {
    if (!t.submittedAt) return false
    const submitted = new Date(t.submittedAt)
    const today = new Date()
    return (
      submitted.getFullYear() === today.getFullYear() &&
      submitted.getMonth() === today.getMonth() &&
      submitted.getDate() === today.getDate()
    )
  }).length

  const filteredTasks =
    activeTab === "all"
      ? myTasks
      : myTasks.filter((t) => statusToTabMap[t.status] === activeTab)

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-heading font-bold">
            你好，{currentUser?.name ?? "标注员"}
          </h1>
          <p className="text-gray-400 mt-1">
            当前共有 <span className="text-primary-accent font-medium">{myTasks.length}</span> 个任务
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={ClipboardList}
          label="待处理任务"
          value={pendingCount}
          color="#9CA3AF"
        />
        <StatCard
          icon={Loader2}
          label="进行中"
          value={inProgressCount}
          color="#3B82F6"
        />
        <StatCard
          icon={CheckCircle2}
          label="今日完成"
          value={completedTodayCount}
          trend="up"
          trendValue="+2"
          color="#10B981"
        />
      </div>

      <div className="glass rounded-lg">
        <div className="flex items-center gap-1 px-4 pt-4 pb-2 border-b border-white/5 overflow-x-auto">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "relative px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap",
                activeTab === tab.key
                  ? "text-primary-accent"
                  : "text-gray-400 hover:text-white"
              )}
            >
              {tab.label}
              {activeTab === tab.key && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-accent rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredTasks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-12 text-center text-gray-500"
              >
                暂无任务
              </motion.div>
            ) : (
              filteredTasks.map((task) => {
                const project = getProjectById(task.projectId)
                const isRejected = !!task.rejectReason

                return (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => navigate(`/annotator/task/${task.id}`)}
                    className={cn(
                      "glass rounded-lg p-4 cursor-pointer transition-all hover:bg-white/5",
                      isRejected && "border-2 border-error/60"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-medium truncate">
                            {project?.name ?? "未知项目"}
                          </h3>
                          <PriorityBadge priority={task.priority} />
                        </div>
                        {project && (
                          <DataTypeInfo
                            type={project.dataType as "text" | "image" | "audio" | "video"}
                            className="mb-2"
                          />
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            截止：{project?.deadline ? new Date(project.deadline).toLocaleDateString("zh-CN") : "无"}
                          </span>
                          <span>数据量：{task.dataItems.length} 条</span>
                        </div>
                        {isRejected && (
                          <div className="flex items-start gap-1.5 mt-2 text-xs text-error">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            <span>退回原因：{task.rejectReason}</span>
                          </div>
                        )}
                      </div>
                      <StatusBadge status={task.status} type="task" />
                    </div>
                  </motion.div>
                )
              })
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

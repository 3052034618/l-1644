import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { ClipboardCheck, CheckCircle2, TrendingUp, Clock, User, FolderOpen } from "lucide-react"
import { useTaskStore } from "@/store/taskStore"
import { useAuthStore } from "@/store/authStore"
import { useProjectStore } from "@/store/projectStore"
import { users } from "@/mock"
import StatCard from "@/components/StatCard"
import PriorityBadge from "@/components/PriorityBadge"
import StatusBadge from "@/components/StatusBadge"
import { cn } from "@/lib/utils"
import type { TaskStatus } from "@/types"

type FilterTab = "全部" | "待审核" | "已通过" | "已退回"

const filterTabs: FilterTab[] = ["全部", "待审核", "已通过", "已退回"]

const matchTab = (task: { status: string; rejectReason?: string; everRejected?: boolean }, tab: FilterTab): boolean => {
  switch (tab) {
    case "全部":
      return ["submitted", "reviewing", "approved", "rejected"].includes(task.status) || !!task.everRejected || !!task.rejectReason
    case "待审核":
      return ["submitted", "reviewing"].includes(task.status)
    case "已通过":
      return task.status === "approved"
    case "已退回":
      return task.status === "rejected" || task.everRejected === true || !!task.rejectReason
  }
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return "刚刚"
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}天前`
  return d.toLocaleDateString("zh-CN")
}

export default function ReviewerWorkspace() {
  const navigate = useNavigate()
  const { tasks, loadTasks } = useTaskStore()
  const { currentUser } = useAuthStore()
  const { projects, loadProjects } = useProjectStore()
  const [activeTab, setActiveTab] = useState<FilterTab>("全部")

  useEffect(() => {
    loadTasks()
    loadProjects()
  }, [loadTasks, loadProjects])

  const reviewTasks = useMemo(() => {
    return tasks.filter((t) => matchTab(t, "全部"))
  }, [tasks])

  const filteredTasks = useMemo(() => {
    return reviewTasks.filter((t) => matchTab(t, activeTab))
  }, [reviewTasks, activeTab])

  const pendingCount = useMemo(
    () => reviewTasks.filter((t) => ["submitted", "reviewing"].includes(t.status)).length,
    [reviewTasks]
  )

  const reviewedToday = useMemo(
    () => reviewTasks.filter((t) => ["approved", "rejected"].includes(t.status)).length,
    [reviewTasks]
  )

  const avgAccuracy = useMemo(() => {
    const approved = reviewTasks.filter((t) => t.accuracyRate != null)
    if (approved.length === 0) return 0
    return approved.reduce((sum, t) => sum + (t.accuracyRate ?? 0), 0) / approved.length
  }, [reviewTasks])

  const getUserById = (id: string) => users.find((u) => u.id === id)
  const getProjectName = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId)
    return project?.name ?? "未知项目"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">
            审核工作台
          </h1>
          <p className="text-gray-400 mt-1">
            欢迎回来，{currentUser?.name ?? "审核员"}，以下是为您分配的审核任务
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={ClipboardCheck}
          label="待审核"
          value={pendingCount}
          trend="up"
          trendValue={`${pendingCount}项`}
          color="#FF6B35"
        />
        <StatCard
          icon={CheckCircle2}
          label="今日已审"
          value={reviewedToday}
          trend="up"
          trendValue={`${reviewedToday}项`}
          color="#10B981"
        />
        <StatCard
          icon={TrendingUp}
          label="平均准确率"
          value={`${(avgAccuracy * 100).toFixed(1)}%`}
          trend={avgAccuracy >= 0.85 ? "up" : "down"}
          trendValue={avgAccuracy >= 0.85 ? "达标" : "低于阈值"}
          color={avgAccuracy >= 0.85 ? "#10B981" : "#EF4444"}
        />
      </div>

      <div className="glass rounded-lg">
        <div className="flex items-center gap-1 border-b border-white/5 px-4 pt-4">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "relative px-4 py-2 text-sm font-medium transition-colors rounded-t-lg",
                activeTab === tab
                  ? "text-primary-accent"
                  : "text-gray-400 hover:text-gray-200"
              )}
            >
              {tab}
              {activeTab === tab && (
                <motion.div
                  layoutId="reviewTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-accent rounded-full"
                  transition={{ duration: 0.2 }}
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
                className="flex flex-col items-center justify-center py-12 text-gray-500"
              >
                <ClipboardCheck className="h-12 w-12 mb-3 opacity-30" />
                <p>暂无{activeTab !== "全部" ? activeTab : ""}审核任务</p>
              </motion.div>
            ) : (
              filteredTasks.map((task) => {
                const annotator = getUserById(task.assigneeId)
                return (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => navigate(`/reviewer/task/${task.id}`)}
                    className="glass rounded-lg p-4 cursor-pointer hover:bg-white/5 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-sm font-medium truncate group-hover:text-primary-accent transition-colors">
                            {getProjectName(task.projectId)}
                          </h3>
                          <PriorityBadge priority={task.priority} />
                          <StatusBadge status={task.status} type="task" />
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5" />
                            <div className="flex items-center gap-1.5">
                              <div className="h-5 w-5 rounded-full bg-secondary flex items-center justify-center text-[10px] text-primary-accent font-medium">
                                {annotator?.name?.charAt(0) ?? "?"}
                              </div>
                              <span>{annotator?.name ?? "未知标注员"}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <FolderOpen className="h-3.5 w-3.5" />
                            <span>{getProjectName(task.projectId)}</span>
                          </div>
                          {task.submittedAt && (
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5" />
                              <span>提交于 {formatTime(task.submittedAt)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 shrink-0">
                        {task.dataItems.length} 条数据
                      </div>
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

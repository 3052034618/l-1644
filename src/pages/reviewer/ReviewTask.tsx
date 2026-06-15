import { useState, useMemo, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  FileText,
  Image,
  Mic,
  Video,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Tag,
  MessageSquare,
  Send,
} from "lucide-react"
import { useTaskStore } from "@/store/taskStore"
import { useNotificationStore } from "@/store/notificationStore"
import { useAuthStore } from "@/store/authStore"
import { useProjectStore } from "@/store/projectStore"
import DataTypeInfo from "@/components/DataTypeInfo"
import PriorityBadge from "@/components/PriorityBadge"
import { cn } from "@/lib/utils"
import { buildDeliveryRecord } from "@/lib/delivery"
import type { DatasetDelivery, DataItem, Project } from "@/types"

const dataTypeIcons = {
  text: FileText,
  image: Image,
  audio: Mic,
  video: Video,
}

function OriginalDataPanel({ item }: { item: DataItem }) {
  const type = item.type as keyof typeof dataTypeIcons

  return (
    <div className="glass rounded-lg p-4 space-y-3">
      <DataTypeInfo type={type} />
      <div className="rounded-lg bg-secondary/50 p-4 min-h-[160px] flex items-center justify-center">
        {type === "text" && (
          <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap w-full">
            {item.content}
          </p>
        )}
        {type === "image" && (
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <Image className="h-16 w-16 opacity-30" />
            <span className="text-xs">{item.content}</span>
          </div>
        )}
        {type === "audio" && (
          <div className="flex flex-col items-center gap-3 w-full">
            <Mic className="h-10 w-10 text-warning/50" />
            <div className="w-full h-12 flex items-center gap-[2px]">
              {Array.from({ length: 60 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 bg-warning/30 rounded-sm"
                  style={{
                    height: `${Math.random() * 80 + 20}%`,
                  }}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">{item.content}</span>
          </div>
        )}
        {type === "video" && (
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <Video className="h-16 w-16 opacity-30" />
            <span className="text-xs">{item.content}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function AnnotationPanel({ item }: { item: DataItem }) {
  const annotation = item.annotation as Record<string, unknown> | undefined

  if (!annotation) {
    return (
      <div className="glass rounded-lg p-4 flex items-center justify-center h-full text-gray-500 text-sm">
        暂无标注结果
      </div>
    )
  }

  const label = annotation.label as string | undefined
  const text = annotation.text as string | undefined
  const regions = annotation.regions as Array<{ x: number; y: number; width: number; height: number; label: string }> | undefined

  return (
    <div className="glass rounded-lg p-4 space-y-3">
      <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
        <Tag className="h-4 w-4 text-primary-accent" />
        标注结果
      </h4>

      {label && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">标签:</span>
          <span className="inline-flex items-center rounded-full bg-primary-accent/15 px-2.5 py-0.5 text-xs font-medium text-primary-accent">
            {label}
          </span>
        </div>
      )}

      {text && (
        <div className="space-y-1">
          <span className="text-xs text-gray-500">标注文本:</span>
          <div className="rounded-md bg-secondary/50 p-3 text-sm text-gray-200 border border-white/5">
            {text}
          </div>
        </div>
      )}

      {regions && regions.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs text-gray-500">标注区域:</span>
          <div className="space-y-1.5">
            {regions.map((region, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 rounded-md bg-secondary/50 px-3 py-2 text-xs"
              >
                <div className="h-2 w-2 rounded-full bg-primary-accent" />
                <span className="text-gray-300">{region.label}</span>
                <span className="text-gray-500 ml-auto">
                  ({region.x},{region.y}) {region.width}×{region.height}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ReviewTask() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { tasks, loadTasks, updateTask, getTasksByProject } = useTaskStore()
  const { addNotification } = useNotificationStore()
  const { currentUser } = useAuthStore()
  const { getProjectById, updateProject, loadProjects } = useProjectStore()
  const [itemStatuses, setItemStatuses] = useState<Record<string, boolean>>({})
  const [rejectReason, setRejectReason] = useState("")
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadTasks()
    loadProjects()
  }, [loadTasks, loadProjects])

  const task = useMemo(() => tasks.find((t) => t.id === id), [tasks, id])

  useEffect(() => {
    if (task) {
      const initial: Record<string, boolean> = {}
      task.dataItems.forEach((item) => {
        initial[item.id] = true
      })
      setItemStatuses(initial)
    }
  }, [task])

  const accuracy = useMemo(() => {
    const total = Object.keys(itemStatuses).length
    if (total === 0) return 0
    const passed = Object.values(itemStatuses).filter(Boolean).length
    return (passed / total) * 100
  }, [itemStatuses])

  const toggleItem = (itemId: string) => {
    setItemStatuses((prev) => ({ ...prev, [itemId]: !prev[itemId] }))
  }

  const handleApprove = () => {
    if (!task || isSubmitting || accuracy < 85) return
    setIsSubmitting(true)
    const rate = accuracy / 100
    const reviewerId = currentUser?.id
    const reviewerName = currentUser?.name ?? '审核员'

    updateTask(task.id, {
      status: "reviewing",
      reviewerId,
    })

    setTimeout(() => {
      updateTask(task.id, {
        status: "approved",
        accuracyRate: rate,
        reviewerId,
        rejectReason: undefined,
      })

      const projectTasks = getTasksByProject(task.projectId)
      const project = getProjectById(task.projectId)
      if (project && projectTasks.some((t) => t.status === 'approved')) {
        const record = buildDeliveryRecord('json', projectTasks, reviewerName)
        const delivery: DatasetDelivery = {
          id: record.id,
          format: record.format,
          dataCount: record.dataCount,
          generatedAt: record.generatedAt,
          generatedBy: record.generatedBy,
          fileSizeKB: record.fileSizeKB,
        }
        const nextDeliveries = [...(project.deliveries ?? []), delivery]
        updateProject(project.id, { deliveries: nextDeliveries } as Partial<Project>)
      }
    }, 200)

    addNotification({
      id: `n_${Date.now()}`,
      userId: task.assigneeId,
      type: "task_submitted",
      title: "任务审核通过",
      content: `您的任务 ${task.id} 已通过审核，准确率: ${(rate * 100).toFixed(1)}%`,
      read: false,
      createdAt: new Date().toISOString(),
    })

    setTimeout(() => {
      setIsSubmitting(false)
      navigate("/reviewer")
    }, 700)
  }

  const handleReject = () => {
    if (!task || isSubmitting || !rejectReason.trim()) return
    setIsSubmitting(true)
    const rate = accuracy / 100
    const reviewerId = currentUser?.id
    const currentRework = task.reworkCount ?? 0

    updateTask(task.id, {
      status: "in_progress",
      rejectReason: rejectReason.trim(),
      accuracyRate: rate,
      reviewerId,
      reworkCount: currentRework + 1,
      everRejected: true,
    })

    addNotification({
      id: `n_${Date.now()}`,
      userId: task.assigneeId,
      type: "quality_alert",
      title: "任务审核退回",
      content: `您的任务 ${task.id} 未通过审核，原因: ${rejectReason.trim()}，准确率: ${(rate * 100).toFixed(1)}%`,
      read: false,
      createdAt: new Date().toISOString(),
    })

    setTimeout(() => {
      setIsSubmitting(false)
      navigate("/reviewer")
    }, 500)
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-500">
        <FileText className="h-12 w-12 mb-3 opacity-30" />
        <p>任务不存在或已删除</p>
        <button
          onClick={() => navigate("/reviewer")}
          className="mt-4 text-primary-accent hover:underline text-sm"
        >
          返回工作台
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/reviewer")}
            className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-heading font-bold">审核任务</h1>
              <PriorityBadge priority={task.priority} />
            </div>
            <p className="text-sm text-gray-400 mt-0.5">任务ID: {task.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">
            准确率:
          </span>
          <span
            className={cn(
              "text-lg font-heading font-bold",
              accuracy >= 85 ? "text-success" : "text-error"
            )}
          >
            {accuracy.toFixed(1)}%
          </span>
          {accuracy < 85 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center gap-1 rounded-full bg-error/15 px-2 py-0.5 text-xs font-medium text-error"
            >
              <AlertTriangle className="h-3 w-3" />
              低于阈值
            </motion.span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            原始数据
          </h3>
          {task.dataItems.map((item) => (
            <OriginalDataPanel key={item.id} item={item} />
          ))}
        </div>
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <Tag className="h-4 w-4" />
            标注结果
          </h3>
          {task.dataItems.map((item) => (
            <AnnotationPanel key={item.id} item={item} />
          ))}
        </div>
      </div>

      <div className="glass rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary-accent" />
          逐条审核
        </h3>
        <div className="space-y-2">
          {task.dataItems.map((item, idx) => {
            const passed = itemStatuses[item.id] ?? true
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-lg bg-secondary/40 px-4 py-2.5"
              >
                <span className="text-xs text-gray-500 w-8 shrink-0">#{idx + 1}</span>
                <span className="text-sm text-gray-300 truncate flex-1">
                  {item.type === "text"
                    ? item.content
                    : `${(item.type === "image" ? "图像" : item.type === "audio" ? "音频" : "视频")}数据`}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleItem(item.id)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all",
                      passed
                        ? "bg-success/15 text-success"
                        : "bg-secondary text-gray-500"
                    )}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    通过
                  </button>
                  <button
                    onClick={() => toggleItem(item.id)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all",
                      !passed
                        ? "bg-error/15 text-error"
                        : "bg-secondary text-gray-500"
                    )}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    不通过
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="glass rounded-lg p-4">
        <AnimatePresence>
          {showRejectForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mb-3">
                <label className="text-sm text-gray-400 mb-1.5 block">退回原因</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="请输入退回原因，帮助标注员改进..."
                  rows={3}
                  className="w-full rounded-lg bg-secondary/50 border border-white/5 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-accent/50 resize-none"
                />
                <p className="text-xs text-gray-500 mt-2">退回后任务状态将改为"进行中"，标注员可重新处理</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>已审核 {task.dataItems.length} 条数据</span>
            <span>·</span>
            <span>通过 {Object.values(itemStatuses).filter(Boolean).length} 条</span>
            <span>·</span>
            <span>不通过 {Object.values(itemStatuses).filter((v) => !v).length} 条</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={handleApprove}
                disabled={isSubmitting || accuracy < 85}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all",
                  "bg-success/15 text-success hover:bg-success/25",
                  (isSubmitting || accuracy < 85) && "opacity-40 cursor-not-allowed grayscale"
                )}
              >
                <CheckCircle2 className="h-4 w-4" />
                通过
              </button>
              {accuracy < 85 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/15 px-2 py-0.5 text-xs font-medium text-yellow-400">
                  <AlertTriangle className="h-3 w-3" />
                  准确率低于阈值，必须退回返工
                </span>
              )}
            </div>
            <button
              onClick={() => {
                if (showRejectForm && rejectReason.trim()) {
                  handleReject()
                } else {
                  setShowRejectForm(true)
                }
              }}
              disabled={isSubmitting}
              className={cn(
                "flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all",
                "bg-error/15 text-error hover:bg-error/25",
                isSubmitting && "opacity-50 cursor-not-allowed"
              )}
            >
              {showRejectForm && rejectReason.trim() ? (
                <>
                  <Send className="h-4 w-4" />
                  确认退回
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  退回
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

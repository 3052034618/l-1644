import { useState, useEffect, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Send,
  Image,
  Mic,
  Video,
  Tag,
  MessageSquare,
  List,
  ArrowLeft,
} from "lucide-react"
import { useTaskStore } from "@/store/taskStore"
import { useProjectStore } from "@/store/projectStore"
import DataTypeInfo from "@/components/DataTypeInfo"
import PriorityBadge from "@/components/PriorityBadge"
import { cn } from "@/lib/utils"
import type { DataItem } from "@/types"

const textLabels = ["正面", "负面", "中性"]
const entityColors = ["#FF6B35", "#3B82F6", "#10B981", "#8B5CF6", "#F59E0B"]

function TextAnnotationPanel({ item }: { item: DataItem }) {
  const [selectedLabel, setSelectedLabel] = useState<string>(
    (item.annotation as Record<string, string>)?.label ?? ""
  )

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
        <Tag className="h-4 w-4 text-primary-accent" />
        <span className="text-sm text-gray-300">分类标签</span>
      </div>
      <div className="flex gap-2 px-4 py-3 border-b border-white/5">
        {textLabels.map((label) => (
          <button
            key={label}
            onClick={() => setSelectedLabel(label)}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              selectedLabel === label
                ? "bg-primary-accent text-white"
                : "bg-white/5 text-gray-300 hover:bg-white/10"
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex-1 p-4">
        <div className="glass rounded-lg p-6">
          <p className="text-base leading-relaxed">{item.content}</p>
        </div>
      </div>
    </div>
  )
}

function ImageAnnotationPanel({ item }: { item: DataItem }) {
  const regions = ((item.annotation as Record<string, unknown>)?.regions ?? []) as {
    x: number
    y: number
    width: number
    height: number
    label: string
  }[]

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
        <Tag className="h-4 w-4 text-primary-accent" />
        <span className="text-sm text-gray-300">目标检测标注</span>
      </div>
      <div className="flex-1 p-4">
        <div className="glass rounded-lg overflow-hidden relative" style={{ height: 420 }}>
          <div className="absolute inset-0 bg-secondary/50 flex items-center justify-center">
            <Image className="h-16 w-16 text-gray-600" />
          </div>
          {regions.map((region, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.15 }}
              className="absolute border-2 rounded-sm"
              style={{
                left: region.x,
                top: region.y,
                width: region.width,
                height: region.height,
                borderColor: entityColors[idx % entityColors.length],
                backgroundColor: `${entityColors[idx % entityColors.length]}15`,
              }}
            >
              <span
                className="absolute -top-5 left-0 text-xs px-1.5 py-0.5 rounded-sm font-medium"
                style={{
                  backgroundColor: entityColors[idx % entityColors.length],
                  color: "#fff",
                }}
              >
                {region.label}
              </span>
            </motion.div>
          ))}
          {regions.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-gray-500 text-sm">点击拖拽绘制标注框</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AudioAnnotationPanel({ item }: { item: DataItem }) {
  const [transcription, setTranscription] = useState<string>(
    (item.annotation as Record<string, string>)?.text ?? ""
  )

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
        <Mic className="h-4 w-4 text-primary-accent" />
        <span className="text-sm text-gray-300">语音转写</span>
      </div>
      <div className="flex-1 p-4 space-y-4">
        <div className="glass rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-full bg-primary-accent/20 flex items-center justify-center">
              <Mic className="h-5 w-5 text-primary-accent" />
            </div>
            <div className="flex-1">
              <div className="h-8 flex items-center gap-0.5">
                {Array.from({ length: 80 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-0.5 bg-primary-accent/40 rounded-full"
                    style={{ height: `${Math.random() * 24 + 4}px` }}
                  />
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>00:00</span>
                <span>02:35</span>
              </div>
            </div>
          </div>
        </div>
        <div>
          <label className="text-sm text-gray-300 mb-2 block">转写内容</label>
          <textarea
            value={transcription}
            onChange={(e) => setTranscription(e.target.value)}
            placeholder="请输入语音转写内容..."
            className="w-full h-32 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-accent/50 resize-none"
          />
        </div>
      </div>
    </div>
  )
}

function VideoAnnotationPanel() {
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
        <Video className="h-4 w-4 text-primary-accent" />
        <span className="text-sm text-gray-300">视频行为标注</span>
      </div>
      <div className="flex-1 p-4 space-y-4">
        <div className="glass rounded-lg overflow-hidden relative" style={{ height: 340 }}>
          <div className="absolute inset-0 bg-secondary/50 flex items-center justify-center">
            <Video className="h-16 w-16 text-gray-600" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
            <div className="flex items-center gap-3">
              <div className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full w-1/3 bg-primary-accent rounded-full" />
              </div>
              <span className="text-xs text-gray-300">00:08 / 00:25</span>
            </div>
          </div>
        </div>
        <div className="glass rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-gray-400">时间轴</span>
          </div>
          <div className="h-8 bg-white/5 rounded-md relative">
            <div className="absolute top-0 bottom-0 left-[10%] w-[25%] bg-primary-accent/20 border border-primary-accent/40 rounded-sm">
              <span className="absolute -top-4 left-0 text-[10px] text-primary-accent">走路</span>
            </div>
            <div className="absolute top-0 bottom-0 left-[50%] w-[20%] bg-blue-500/20 border border-blue-500/40 rounded-sm">
              <span className="absolute -top-4 left-0 text-[10px] text-blue-400">跑步</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AnnotationArea({ item, dataType }: { item: DataItem; dataType: string }) {
  switch (dataType) {
    case "text":
      return <TextAnnotationPanel item={item} />
    case "image":
      return <ImageAnnotationPanel item={item} />
    case "audio":
      return <AudioAnnotationPanel item={item} />
    case "video":
      return <VideoAnnotationPanel />
    default:
      return (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          不支持的数据类型
        </div>
      )
  }
}

export default function AnnotationTask() {
  const { id: taskId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { loadTasks, getTaskById, updateTask } = useTaskStore()
  const { loadProjects, getProjectById } = useProjectStore()
  const [activeItemIndex, setActiveItemIndex] = useState(0)
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadTasks()
    loadProjects()
  }, [loadTasks, loadProjects])

  const task = taskId ? getTaskById(taskId) : undefined
  const project = task ? getProjectById(task.projectId) : undefined

  const dataItems = task?.dataItems ?? []
  const activeItem = dataItems[activeItemIndex]
  const dataType = project?.dataType ?? "text"

  const completedItems = useMemo(
    () => dataItems.filter((item) => item.annotation).length,
    [dataItems]
  )

  const regions = activeItem
    ? ((activeItem.annotation as Record<string, unknown>)?.regions ?? []) as {
        x: number
        y: number
        width: number
        height: number
        label: string
      }[]
    : []

  const currentLabel = activeItem
    ? (activeItem.annotation as Record<string, string>)?.label ?? "未标注"
    : ""

  const handleSubmit = () => {
    if (!taskId) return
    setSubmitting(true)
    setTimeout(() => {
      updateTask(taskId, { status: "submitted", submittedAt: new Date().toISOString() })
      setSubmitting(false)
      navigate("/annotator")
    }, 800)
  }

  const goPrev = () => setActiveItemIndex((i) => Math.max(0, i - 1))
  const goNext = () => setActiveItemIndex((i) => Math.min(dataItems.length - 1, i + 1))

  if (!task || !project) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">加载中...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] -m-6">
      <div className="glass border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/annotator")}
            className="p-1.5 rounded-md hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-medium">{project.name}</h2>
              <PriorityBadge priority={task.priority} />
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{project.specification}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {task.status === "rejected" && task.rejectReason && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-error/10 border border-error/30">
              <AlertTriangle className="h-3.5 w-3.5 text-error" />
              <span className="text-xs text-error">退回原因：{task.rejectReason}</span>
            </div>
          )}
          <DataTypeInfo
            type={dataType as "text" | "image" | "audio" | "video"}
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-[280px] border-r border-white/5 flex flex-col bg-primary/40">
          <div className="px-3 py-2.5 border-b border-white/5 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400">数据列表</span>
            <span className="text-xs text-gray-500">
              {completedItems}/{dataItems.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {dataItems.map((item, idx) => {
              const isAnnotated = !!item.annotation
              const isActive = idx === activeItemIndex

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveItemIndex(idx)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors border-l-2",
                    isActive
                      ? "bg-primary-accent/10 border-l-primary-accent text-white"
                      : "border-l-transparent text-gray-400 hover:bg-white/5 hover:text-gray-200"
                  )}
                >
                  {isAnnotated ? (
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-gray-600 shrink-0" />
                  )}
                  <span className="text-sm truncate">
                    {item.type === "text" ? item.content : item.content.split("/").pop()}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            {activeItem && (
              <motion.div
                key={activeItem.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col overflow-auto"
              >
                <AnnotationArea item={activeItem} dataType={dataType} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="w-[300px] border-l border-white/5 flex flex-col bg-primary/40">
          <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-2">
            <List className="h-4 w-4 text-primary-accent" />
            <span className="text-xs font-medium text-gray-400">标注属性</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">当前标签</label>
              <div className="glass rounded-md px-3 py-2 text-sm">
                {currentLabel || (
                  <span className="text-gray-500">未标注</span>
                )}
              </div>
            </div>

            {dataType === "image" && regions.length > 0 && (
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">标注区域</label>
                <div className="space-y-1.5">
                  {regions.map((region, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 glass rounded-md px-3 py-2"
                    >
                      <div
                        className="h-2.5 w-2.5 rounded-sm"
                        style={{ backgroundColor: entityColors[idx % entityColors.length] }}
                      />
                      <span className="text-sm">{region.label}</span>
                      <span className="text-xs text-gray-500 ml-auto">
                        {region.width}×{region.height}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-xs text-gray-500 mb-1.5 flex items-center gap-1.5">
                <MessageSquare className="h-3 w-3" />
                备注
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="添加备注..."
                className="w-full h-28 bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-accent/50 resize-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="glass border-t border-white/5 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={goPrev}
            disabled={activeItemIndex === 0}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors",
              activeItemIndex === 0
                ? "text-gray-600 cursor-not-allowed"
                : "text-gray-300 hover:bg-white/5 hover:text-white"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            上一条
          </button>
          <button
            onClick={goNext}
            disabled={activeItemIndex === dataItems.length - 1}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors",
              activeItemIndex === dataItems.length - 1
                ? "text-gray-600 cursor-not-allowed"
                : "text-gray-300 hover:bg-white/5 hover:text-white"
            )}
          >
            下一条
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-32 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary-accent rounded-full"
                initial={false}
                animate={{ width: `${((activeItemIndex + 1) / dataItems.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-xs text-gray-400">
              {activeItemIndex + 1}/{dataItems.length}
            </span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              submitting
                ? "bg-primary-accent/50 text-white/60 cursor-not-allowed"
                : "bg-primary-accent text-white hover:bg-primary-accent/90"
            )}
          >
            {submitting ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Send className="h-4 w-4" />
                </motion.div>
                提交中...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                提交任务
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

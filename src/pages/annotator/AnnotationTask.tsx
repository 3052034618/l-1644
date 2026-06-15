import { useState, useEffect, useMemo, useCallback } from "react"
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
  Plus,
  X,
} from "lucide-react"
import { useTaskStore } from "@/store/taskStore"
import { useProjectStore } from "@/store/projectStore"
import DataTypeInfo from "@/components/DataTypeInfo"
import PriorityBadge from "@/components/PriorityBadge"
import { cn } from "@/lib/utils"
import type { DataItem } from "@/types"

const textLabels = ["正面", "负面", "中性"]
const entityColors = ["#FF6B35", "#3B82F6", "#10B981", "#8B5CF6", "#F59E0B"]
const defaultVideoBehaviors = [
  { startTime: "00:02", endTime: "00:08", label: "走路", color: "#FF6B35" },
  { startTime: "00:12", endTime: "00:17", label: "跑步", color: "#3B82F6" },
]

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

interface TextAnnotationPanelProps {
  item: DataItem
  selectedLabel: string
  onLabelChange: (itemId: string, newLabel: string) => void
}

function TextAnnotationPanel({ item, selectedLabel, onLabelChange }: TextAnnotationPanelProps) {
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
            onClick={() => onLabelChange(item.id, label)}
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

interface ImageAnnotationPanelProps {
  item: DataItem
  onRegionsChange: (itemId: string, regions: Array<{ x: number; y: number; width: number; height: number; label: string }>) => void
}

function ImageAnnotationPanel({ item, onRegionsChange }: ImageAnnotationPanelProps) {
  const regions = ((item.annotation as Record<string, unknown>)?.regions ?? []) as {
    x: number
    y: number
    width: number
    height: number
    label: string
  }[]

  const [isDrawing, setIsDrawing] = useState(false)
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null)
  const [currentRegion, setCurrentRegion] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [newLabel, setNewLabel] = useState("")
  const [showLabelInput, setShowLabelInput] = useState(false)
  const [pendingRegion, setPendingRegion] = useState<{ x: number; y: number; width: number; height: number } | null>(null)

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setIsDrawing(true)
    setStartPos({ x, y })
    setCurrentRegion({ x, y, width: 0, height: 0 })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !startPos) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const width = Math.abs(x - startPos.x)
    const height = Math.abs(y - startPos.y)
    const left = Math.min(startPos.x, x)
    const top = Math.min(startPos.y, y)
    setCurrentRegion({ x: left, y: top, width, height })
  }

  const handleMouseUp = () => {
    if (!isDrawing || !currentRegion) return
    setIsDrawing(false)
    if (currentRegion.width > 10 && currentRegion.height > 10) {
      setPendingRegion(currentRegion)
      setShowLabelInput(true)
    }
    setStartPos(null)
    setCurrentRegion(null)
  }

  const confirmLabel = () => {
    if (pendingRegion && newLabel.trim()) {
      const newRegions = [...regions, { ...pendingRegion, label: newLabel.trim() }]
      onRegionsChange(item.id, newRegions)
    }
    setPendingRegion(null)
    setNewLabel("")
    setShowLabelInput(false)
  }

  const removeRegion = (index: number) => {
    const newRegions = regions.filter((_, i) => i !== index)
    onRegionsChange(item.id, newRegions)
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-primary-accent" />
          <span className="text-sm text-gray-300">目标检测标注</span>
        </div>
        <button
          onClick={() => {
            const demoRegions = [
              { x: 80, y: 100, width: 120, height: 150, label: "人物" },
              { x: 280, y: 140, width: 100, height: 80, label: "车辆" },
            ]
            onRegionsChange(item.id, [...regions, ...demoRegions])
          }}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-primary-accent/20 text-primary-accent hover:bg-primary-accent/30 transition-colors"
        >
          <Plus className="h-3 w-3" />
          示例标注
        </button>
      </div>
      <div className="flex-1 p-4">
        <div
          className="glass rounded-lg overflow-hidden relative cursor-crosshair"
          style={{ height: 420 }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div className="absolute inset-0 bg-secondary/50 flex items-center justify-center">
            <Image className="h-16 w-16 text-gray-600" />
          </div>
          {regions.map((region, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.15 }}
              className="absolute border-2 rounded-sm group"
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
                className="absolute -top-5 left-0 text-xs px-1.5 py-0.5 rounded-sm font-medium flex items-center gap-1"
                style={{
                  backgroundColor: entityColors[idx % entityColors.length],
                  color: "#fff",
                }}
              >
                {region.label}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeRegion(idx)
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20 rounded"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            </motion.div>
          ))}
          {currentRegion && (
            <div
              className="absolute border-2 border-dashed border-primary-accent rounded-sm pointer-events-none"
              style={{
                left: currentRegion.x,
                top: currentRegion.y,
                width: currentRegion.width,
                height: currentRegion.height,
              }}
            />
          )}
          {regions.length === 0 && !isDrawing && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-gray-500 text-sm">点击拖拽绘制标注框</p>
            </div>
          )}
        </div>
        {showLabelInput && (
          <div className="mt-3 glass rounded-lg p-3 flex items-center gap-2">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="输入标签名称（如：人物、车辆）"
              className="flex-1 bg-white/5 border border-white/10 rounded-md px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-accent/50"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && confirmLabel()}
            />
            <button
              onClick={confirmLabel}
              className="px-3 py-1.5 rounded-md text-sm bg-primary-accent text-white hover:bg-primary-accent/90 transition-colors"
            >
              确定
            </button>
            <button
              onClick={() => {
                setShowLabelInput(false)
                setPendingRegion(null)
                setNewLabel("")
              }}
              className="px-3 py-1.5 rounded-md text-sm bg-white/5 text-gray-300 hover:bg-white/10 transition-colors"
            >
              取消
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

interface AudioAnnotationPanelProps {
  item: DataItem
  transcription: string
  onTranscriptionChange: (itemId: string, text: string) => void
}

function AudioAnnotationPanel({ item, transcription, onTranscriptionChange }: AudioAnnotationPanelProps) {
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
            onChange={(e) => onTranscriptionChange(item.id, e.target.value)}
            placeholder="请输入语音转写内容..."
            className="w-full h-32 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-accent/50 resize-none"
          />
        </div>
      </div>
    </div>
  )
}

interface VideoBehavior {
  startTime: string
  endTime: string
  label: string
  color: string
}

interface VideoAnnotationPanelProps {
  item: DataItem
  behaviors: VideoBehavior[]
  onBehaviorsChange: (itemId: string, behaviors: VideoBehavior[]) => void
  transcription: string
  onTranscriptionChange: (itemId: string, text: string) => void
}

function VideoAnnotationPanel({ item, behaviors, onBehaviorsChange, transcription, onTranscriptionChange }: VideoAnnotationPanelProps) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<VideoBehavior>({ startTime: "", endTime: "", label: "", color: entityColors[0] })

  const addBehavior = () => {
    const newBehavior: VideoBehavior = {
      startTime: "00:00",
      endTime: "00:05",
      label: "新行为",
      color: entityColors[behaviors.length % entityColors.length],
    }
    onBehaviorsChange(item.id, [...behaviors, newBehavior])
  }

  const removeBehavior = (idx: number) => {
    onBehaviorsChange(item.id, behaviors.filter((_, i) => i !== idx))
  }

  const startEdit = (idx: number) => {
    setEditingIdx(idx)
    setEditForm({ ...behaviors[idx] })
  }

  const saveEdit = () => {
    if (editingIdx === null) return
    const newBehaviors = [...behaviors]
    newBehaviors[editingIdx] = editForm
    onBehaviorsChange(item.id, newBehaviors)
    setEditingIdx(null)
  }

  const timeToPercent = (time: string) => {
    const [m, s] = time.split(":").map(Number)
    return ((m * 60 + s) / 25) * 100
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4 text-primary-accent" />
          <span className="text-sm text-gray-300">视频行为标注</span>
        </div>
        <button
          onClick={addBehavior}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-primary-accent/20 text-primary-accent hover:bg-primary-accent/30 transition-colors"
        >
          <Plus className="h-3 w-3" />
          添加行为
        </button>
      </div>
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        <div className="glass rounded-lg overflow-hidden relative" style={{ height: 280 }}>
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
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">时间轴</span>
          </div>
          <div className="h-12 bg-white/5 rounded-md relative overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 border-l border-white/10"
                style={{ left: `${(i / 5) * 100}%` }}
              >
                <span className="absolute -top-4 -translate-x-1/2 text-[9px] text-gray-500">
                  00:{String(i * 5).padStart(2, "0")}
                </span>
              </div>
            ))}
            {behaviors.map((behavior, idx) => {
              const left = timeToPercent(behavior.startTime)
              const width = timeToPercent(behavior.endTime) - left
              return (
                <div
                  key={idx}
                  className="absolute top-2 bottom-2 border rounded-sm cursor-pointer hover:brightness-110 transition-all"
                  style={{
                    left: `${left}%`,
                    width: `${Math.max(width, 5)}%`,
                    borderColor: behavior.color,
                    backgroundColor: `${behavior.color}30`,
                  }}
                  onClick={() => startEdit(idx)}
                >
                  <span
                    className="absolute -top-1 left-1 text-[10px] px-1 rounded whitespace-nowrap"
                    style={{ backgroundColor: behavior.color, color: "#fff" }}
                  >
                    {behavior.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="glass rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">行为列表</span>
          </div>
          <div className="space-y-2">
            {behaviors.length === 0 && (
              <p className="text-xs text-gray-500 text-center py-3">暂无行为标注，点击上方按钮添加</p>
            )}
            {behaviors.map((behavior, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div
                  className="h-6 w-1.5 rounded-sm shrink-0"
                  style={{ backgroundColor: behavior.color }}
                />
                {editingIdx === idx ? (
                  <>
                    <input
                      type="text"
                      value={editForm.startTime}
                      onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                      placeholder="开始"
                      className="w-14 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-primary-accent/50"
                    />
                    <span className="text-xs text-gray-500">~</span>
                    <input
                      type="text"
                      value={editForm.endTime}
                      onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                      placeholder="结束"
                      className="w-14 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-primary-accent/50"
                    />
                    <input
                      type="text"
                      value={editForm.label}
                      onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                      placeholder="标签"
                      className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-primary-accent/50"
                    />
                    <button
                      onClick={saveEdit}
                      className="px-2 py-1 rounded text-xs bg-primary-accent text-white hover:bg-primary-accent/90"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => setEditingIdx(null)}
                      className="px-2 py-1 rounded text-xs bg-white/5 text-gray-300 hover:bg-white/10"
                    >
                      取消
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-xs text-gray-400 w-20 shrink-0">
                      {behavior.startTime} ~ {behavior.endTime}
                    </span>
                    <span className="text-sm text-gray-200 flex-1">{behavior.label}</span>
                    <button
                      onClick={() => startEdit(idx)}
                      className="px-2 py-1 rounded text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => removeBehavior(idx)}
                      className="p-1 rounded text-gray-500 hover:text-error hover:bg-error/10 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Mic className="h-3.5 w-3.5 text-primary-accent" />
            <span className="text-xs text-gray-400">语音转写</span>
          </div>
          <textarea
            value={transcription}
            onChange={(e) => onTranscriptionChange(item.id, e.target.value)}
            placeholder="请输入视频语音转写内容..."
            className="w-full h-20 bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-accent/50 resize-none"
          />
        </div>
      </div>
    </div>
  )
}

interface AnnotationAreaProps {
  item: DataItem
  dataType: string
  selectedLabel: string
  onLabelChange: (itemId: string, newLabel: string) => void
  transcription: string
  onTranscriptionChange: (itemId: string, text: string) => void
  onRegionsChange: (itemId: string, regions: Array<{ x: number; y: number; width: number; height: number; label: string }>) => void
  videoBehaviors: VideoBehavior[]
  onVideoBehaviorsChange: (itemId: string, behaviors: VideoBehavior[]) => void
}

function AnnotationArea({
  item,
  dataType,
  selectedLabel,
  onLabelChange,
  transcription,
  onTranscriptionChange,
  onRegionsChange,
  videoBehaviors,
  onVideoBehaviorsChange,
}: AnnotationAreaProps) {
  switch (dataType) {
    case "text":
      return <TextAnnotationPanel item={item} selectedLabel={selectedLabel} onLabelChange={onLabelChange} />
    case "image":
      return <ImageAnnotationPanel item={item} onRegionsChange={onRegionsChange} />
    case "audio":
      return <AudioAnnotationPanel item={item} transcription={transcription} onTranscriptionChange={onTranscriptionChange} />
    case "video":
      return (
        <VideoAnnotationPanel
          item={item}
          behaviors={videoBehaviors}
          onBehaviorsChange={onVideoBehaviorsChange}
          transcription={transcription}
          onTranscriptionChange={onTranscriptionChange}
        />
      )
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
  const [localDataItems, setLocalDataItems] = useState<DataItem[]>([])
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    loadTasks()
    loadProjects()
  }, [loadTasks, loadProjects])

  const task = taskId ? getTaskById(taskId) : undefined
  const project = task ? getProjectById(task.projectId) : undefined

  useEffect(() => {
    if (task?.dataItems && !initialized) {
      setLocalDataItems(deepClone(task.dataItems))
      if (task.notes) {
        setNotes(task.notes)
      }
      setInitialized(true)
    }
  }, [task, initialized])

  const dataItems = localDataItems.length > 0 ? localDataItems : task?.dataItems ?? []
  const activeItem = dataItems[activeItemIndex]
  const dataType = project?.dataType ?? "text"

  const updateItemAnnotation = useCallback((itemId: string, annotationPatch: Record<string, unknown>) => {
    setLocalDataItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, annotation: { ...(item.annotation ?? {}), ...annotationPatch } }
          : item
      )
    )
  }, [])

  const handleLabelChange = useCallback(
    (itemId: string, newLabel: string) => {
      updateItemAnnotation(itemId, { label: newLabel })
    },
    [updateItemAnnotation]
  )

  const handleTranscriptionChange = useCallback(
    (itemId: string, text: string) => {
      updateItemAnnotation(itemId, { text })
    },
    [updateItemAnnotation]
  )

  const handleRegionsChange = useCallback(
    (itemId: string, regions: Array<{ x: number; y: number; width: number; height: number; label: string }>) => {
      updateItemAnnotation(itemId, { regions })
    },
    [updateItemAnnotation]
  )

  const handleVideoBehaviorsChange = useCallback(
    (itemId: string, behaviors: VideoBehavior[]) => {
      updateItemAnnotation(itemId, { behaviors })
    },
    [updateItemAnnotation]
  )

  const completedItems = useMemo(
    () => dataItems.filter((item) => item.annotation && Object.keys(item.annotation).length > 0).length,
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

  const currentTranscription = activeItem
    ? (activeItem.annotation as Record<string, string>)?.text ?? ""
    : ""

  const currentVideoBehaviors = useMemo<VideoBehavior[]>(() => {
    if (!activeItem) return []
    const stored = (activeItem.annotation as Record<string, unknown>)?.behaviors as VideoBehavior[] | undefined
    if (stored && stored.length > 0) return stored
    if (dataType === "video") return defaultVideoBehaviors.map(b => ({ ...b }))
    return []
  }, [activeItem, dataType])

  const handleSubmit = () => {
    if (!taskId) return
    setSubmitting(true)
    setTimeout(() => {
      updateTask(taskId, {
        status: "submitted",
        submittedAt: new Date().toISOString(),
        dataItems: deepClone(localDataItems),
        notes,
      })
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
              const isAnnotated = !!(item.annotation && Object.keys(item.annotation).length > 0)
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
                <AnnotationArea
                  item={activeItem}
                  dataType={dataType}
                  selectedLabel={currentLabel === "未标注" ? "" : currentLabel}
                  onLabelChange={handleLabelChange}
                  transcription={currentTranscription}
                  onTranscriptionChange={handleTranscriptionChange}
                  onRegionsChange={handleRegionsChange}
                  videoBehaviors={currentVideoBehaviors}
                  onVideoBehaviorsChange={handleVideoBehaviorsChange}
                />
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

            {(dataType === "audio" || dataType === "video") && currentTranscription && (
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">转写内容</label>
                <div className="glass rounded-md px-3 py-2 text-xs text-gray-300 max-h-24 overflow-y-auto whitespace-pre-wrap">
                  {currentTranscription}
                </div>
              </div>
            )}

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

            {dataType === "video" && currentVideoBehaviors.length > 0 && (
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">行为片段</label>
                <div className="space-y-1.5">
                  {currentVideoBehaviors.map((behavior, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 glass rounded-md px-3 py-2"
                    >
                      <div
                        className="h-2.5 w-2.5 rounded-sm"
                        style={{ backgroundColor: behavior.color }}
                      />
                      <span className="text-sm">{behavior.label}</span>
                      <span className="text-xs text-gray-500 ml-auto">
                        {behavior.startTime}-{behavior.endTime}
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

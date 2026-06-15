import { FileText, Image, Mic, Video, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type DataType = "text" | "image" | "audio" | "video"

interface DataTypeInfoProps {
  type: DataType
  className?: string
}

const dataTypeConfig: Record<DataType, { icon: LucideIcon; label: string; color: string }> = {
  text: { icon: FileText, label: "文本", color: "#3B82F6" },
  image: { icon: Image, label: "图像", color: "#8B5CF6" },
  audio: { icon: Mic, label: "音频", color: "#F59E0B" },
  video: { icon: Video, label: "视频", color: "#EF4444" },
}

export default function DataTypeInfo({ type, className }: DataTypeInfoProps) {
  const config = dataTypeConfig[type]
  const Icon = config.icon

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className="h-7 w-7 rounded-md flex items-center justify-center"
        style={{ backgroundColor: `${config.color}20` }}
      >
        <Icon className="h-4 w-4" style={{ color: config.color }} />
      </div>
      <span className="text-sm text-gray-300">{config.label}</span>
    </div>
  )
}

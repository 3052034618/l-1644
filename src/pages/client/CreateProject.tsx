import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Image,
  Mic,
  Video,
  Upload,
  X,
  Check,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react'
import { useProjectStore } from '@/store/projectStore'
import { useAuthStore } from '@/store/authStore'
import { templates } from '@/mock'
import { cn } from '@/lib/utils'

const STEPS = ['基本信息', '数据上传', '规范设定', '模板选择']

const dataTypes = [
  {
    key: 'text',
    label: '文本',
    icon: FileText,
    color: '#3B82F6',
    desc: '文本分类、情感分析、实体标注',
  },
  {
    key: 'image',
    label: '图像',
    icon: Image,
    color: '#8B5CF6',
    desc: '目标检测、语义分割、关键点标注',
  },
  {
    key: 'audio',
    label: '音频',
    icon: Mic,
    color: '#F59E0B',
    desc: '语音转写、音频分类、说话人识别',
  },
  {
    key: 'video',
    label: '视频',
    icon: Video,
    color: '#EF4444',
    desc: '行为识别、目标跟踪、事件标注',
  },
]

export default function CreateProject() {
  const navigate = useNavigate()
  const { addProject } = useProjectStore()
  const { currentUser } = useAuthStore()

  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [dataType, setDataType] = useState('text')
  const [deadline, setDeadline] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString().split('T')[0]
  })
  const [specification, setSpecification] = useState('')
  const [example, setExample] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<Array<{name: string, size: number, dataCount: number, type: string, progress?: number}>>([])

  const recommendedTemplates = templates.filter((t) => t.dataType === dataType)

  const canNext = () => {
    switch (step) {
      case 0:
        return name.trim() !== '' && dataType !== '' && deadline !== ''
      case 1:
        return true
      case 2:
        return true
      case 3:
        return true
      default:
        return false
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const estimateDataCount = (content: string, fileName: string, fileSize: number): number => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    try {
      if (ext === 'json') {
        const parsed = JSON.parse(content)
        if (Array.isArray(parsed)) return parsed.length
        if (typeof parsed === 'object' && parsed !== null) {
          const vals = Object.values(parsed)
          if (vals.length > 0) {
            const firstArr = vals.find(v => Array.isArray(v))
            if (firstArr) return (firstArr as unknown[]).length
          }
          return Object.keys(parsed).length || 1
        }
      } else if (ext === 'csv') {
        const lines = content.split('\n').filter(l => l.trim().length > 0)
        return Math.max(0, lines.length - 1) || 1
      } else if (ext === 'xml') {
        const matches = content.match(/<(\w+)[^>]*>/g)
        if (matches && matches.length > 0) {
          const counts: Record<string, number> = {}
          matches.forEach(m => {
            const tag = m.replace(/[<>\s/].*/g, '').replace(/[^a-zA-Z_]/g, '')
            if (tag) counts[tag] = (counts[tag] || 0) + 1
          })
          const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
          if (sorted.length > 0) return sorted[0][1]
        }
      }
    } catch {
    }
    return Math.max(1, Math.floor(fileSize / 1024))
  }

  const processFiles = (files: FileList | File[]) => {
    const validExts = ['.json', '.csv', '.xml']
    const fileArray = Array.from(files).filter(f => {
      const ext = '.' + f.name.split('.').pop()?.toLowerCase()
      return validExts.includes(ext)
    })

    fileArray.forEach(file => {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase()
      const fileType = ext === '.json' ? 'JSON' : ext === '.csv' ? 'CSV' : 'XML'
      const newFile = {
        name: file.name,
        size: file.size,
        dataCount: 0,
        type: fileType,
        progress: 0,
      }
      setUploadedFiles(prev => [...prev, newFile])

      const startTime = Date.now()
      const duration = 800
      const animateProgress = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(100, (elapsed / duration) * 100)
        setUploadedFiles(prev => prev.map(f => 
          f.name === file.name && f.size === file.size ? { ...f, progress } : f
        ))
        if (progress < 100) {
          requestAnimationFrame(animateProgress)
        }
      }
      animateProgress()

      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        const dataCount = estimateDataCount(content, file.name, file.size)
        setUploadedFiles(prev => prev.map(f => 
          f.name === file.name && f.size === file.size ? { ...f, dataCount } : f
        ))
      }
      reader.onerror = () => {
        const dataCount = Math.max(1, Math.floor(file.size / 1024))
        setUploadedFiles(prev => prev.map(f => 
          f.name === file.name && f.size === file.size ? { ...f, dataCount } : f
        ))
      }
      reader.readAsText(file)
    })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files)
    }
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleCreate = () => {
    const totalDataCount = uploadedFiles.length > 0
      ? uploadedFiles.reduce((sum, f) => sum + f.dataCount, 0)
      : 100
    const projectStatus = uploadedFiles.length > 0 ? 'active' : 'draft'
    const templateToUse = selectedTemplate || recommendedTemplates[0]?.id || ''
    const project = {
      id: `p${Date.now()}`,
      name,
      description,
      clientId: currentUser?.id ?? '',
      dataType,
      status: projectStatus as 'draft' | 'active' | 'reviewing' | 'completed',
      specification: specification || recommendedTemplates[0]?.spec || '按标准流程标注',
      templateId: templateToUse,
      createdAt: new Date().toISOString(),
      deadline: new Date(deadline).toISOString(),
      dataCount: totalDataCount,
      completedCount: 0,
      accuracyRate: 0,
      uploadedFiles: uploadedFiles.length > 0
        ? uploadedFiles.map(({ name, size, dataCount, type }) => ({ name, size, dataCount, type }))
        : undefined,
    }
    addProject(project)
    navigate('/client')
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">创建项目</h1>
        <p className="text-gray-400 mt-1">按照步骤创建新的标注项目</p>
      </div>

      <div className="glass rounded-lg p-4">
        <div className="flex items-center justify-between">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                    i < step
                      ? 'bg-success text-white'
                      : i === step
                        ? 'bg-primary-accent text-white'
                        : 'bg-white/10 text-gray-400',
                  )}
                >
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span
                  className={cn(
                    'text-sm hidden sm:inline',
                    i <= step ? 'text-white' : 'text-gray-500',
                  )}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    'w-8 sm:w-16 lg:w-24 h-px mx-2',
                    i < step ? 'bg-success' : 'bg-white/10',
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="glass rounded-lg p-6"
        >
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  项目名称
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="请输入项目名称"
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-primary-accent focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  项目描述
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="请输入项目描述"
                  rows={3}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-primary-accent focus:outline-none transition-colors resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  数据类型
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {dataTypes.map((dt) => (
                    <motion.div
                      key={dt.key}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setDataType(dt.key)}
                      className={cn(
                        'rounded-lg border p-4 cursor-pointer transition-colors',
                        dataType === dt.key
                          ? 'border-primary-accent bg-primary-accent/10'
                          : 'border-white/10 bg-white/5 hover:border-white/20',
                      )}
                    >
                      <dt.icon className="h-6 w-6 mb-2" style={{ color: dt.color }} />
                      <p className="text-sm font-medium">{dt.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{dt.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  截止日期
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white focus:border-primary-accent focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div
                className="border-2 border-dashed border-white/15 rounded-lg p-10 text-center hover:border-primary-accent/50 transition-colors cursor-pointer"
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.csv,.xml"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Upload className="h-10 w-10 mx-auto text-gray-400 mb-3" />
                <p className="text-sm text-gray-300">拖拽文件到此处上传</p>
                <p className="text-xs text-gray-500 mt-1">
                  支持 JSON、CSV、XML 格式，单文件最大 500MB
                </p>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                  className="mt-4 px-4 py-2 rounded-lg bg-primary-accent/15 text-primary-accent text-sm font-medium hover:bg-primary-accent/25 transition-colors"
                >
                  选择文件
                </button>
              </div>
              <div className="space-y-3">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center gap-3 bg-white/5 rounded-lg p-3"
                  >
                    <FileText className="h-5 w-5 text-gray-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm truncate">{file.name}</span>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className="text-xs text-gray-500">
                            {formatFileSize(file.size)}
                          </span>
                          {file.dataCount > 0 && (
                            <span className="text-xs text-primary-accent">
                              约 {file.dataCount} 条
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10 mt-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary-accent transition-all"
                          style={{ width: `${file.progress ?? 0}%` }}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-gray-400 hover:text-error transition-colors shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  标注规范
                </label>
                <textarea
                  value={specification}
                  onChange={(e) => setSpecification(e.target.value)}
                  placeholder="请详细描述标注规范和要求..."
                  rows={6}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-primary-accent focus:outline-none transition-colors resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  标注示例
                </label>
                <textarea
                  value={example}
                  onChange={(e) => setExample(e.target.value)}
                  placeholder="提供标注示例以帮助标注员理解要求..."
                  rows={4}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-primary-accent focus:outline-none transition-colors resize-none"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-400">根据您选择的数据类型，推荐以下模板：</p>
              {recommendedTemplates.length > 0 ? (
                <div className="grid gap-3">
                  {recommendedTemplates.map((tpl) => (
                    <motion.div
                      key={tpl.id}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => setSelectedTemplate(tpl.id)}
                      className={cn(
                        'rounded-lg border p-4 cursor-pointer transition-colors',
                        selectedTemplate === tpl.id
                          ? 'border-primary-accent bg-primary-accent/10'
                          : 'border-white/10 bg-white/5 hover:border-white/20',
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{tpl.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{tpl.description}</p>
                        </div>
                        {selectedTemplate === tpl.id && (
                          <Check className="h-5 w-5 text-primary-accent shrink-0" />
                        )}
                      </div>
                      <div className="mt-3 rounded bg-white/5 p-3">
                        <p className="text-xs text-gray-400">模板预览</p>
                        <div className="mt-1.5 space-y-1">
                          <div className="h-2 rounded bg-white/10 w-3/4" />
                          <div className="h-2 rounded bg-white/10 w-1/2" />
                          <div className="h-2 rounded bg-primary-accent/30 w-2/3" />
                          <div className="h-2 rounded bg-white/10 w-5/6" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">请先选择数据类型以获取推荐模板</p>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <button
          onClick={() => (step > 0 ? setStep(step - 1) : navigate('/client'))}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/5 text-gray-300 text-sm hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          {step === 0 ? '返回' : '上一步'}
        </button>
        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canNext()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-accent text-white text-sm font-medium hover:bg-primary-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            下一步
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleCreate}
            disabled={!canNext()}
            className="flex items-center gap-1.5 px-6 py-2 rounded-lg bg-primary-accent text-white text-sm font-medium hover:bg-primary-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            创建项目
          </button>
        )}
      </div>
    </div>
  )
}

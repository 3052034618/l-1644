import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  Download,
  FileJson,
  FileSpreadsheet,
  FileCode,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  BarChart3,
  Layers,
  Target,
  Database,
  FileText,
} from 'lucide-react'
import { useProjectStore } from '@/store/projectStore'
import { useTaskStore } from '@/store/taskStore'
import StatusBadge from '@/components/StatusBadge'
import DataTypeInfo from '@/components/DataTypeInfo'
import { cn } from '@/lib/utils'
import type { DatasetDelivery, Project, Task } from '@/types'

type DeliveryFormat = 'json' | 'csv' | 'xml'

const formatOptions: { key: DeliveryFormat; label: string; icon: typeof FileJson }[] = [
  { key: 'json', label: 'JSON', icon: FileJson },
  { key: 'csv', label: 'CSV', icon: FileSpreadsheet },
  { key: 'xml', label: 'XML', icon: FileCode },
]

const statusMeta = [
  { key: 'pending', label: '待处理', color: '#9CA3AF' },
  { key: 'in_progress', label: '进行中', color: '#3B82F6' },
  { key: 'submitted', label: '已提交', color: '#8B5CF6' },
  { key: 'reviewing', label: '审核中', color: '#F59E0B' },
  { key: 'approved', label: '已通过', color: '#10B981' },
  { key: 'rejected', label: '已退回', color: '#EF4444' },
]

const accuracyBuckets = [
  { label: '优秀 ≥95%', min: 0.95, max: 1, color: '#10B981' },
  { label: '良好 85-94%', min: 0.85, max: 0.95, color: '#3B82F6' },
  { label: '一般 70-84%', min: 0.7, max: 0.85, color: '#F59E0B' },
  { label: '偏低 <70%', min: 0, max: 0.7, color: '#EF4444' },
]

const formatBytes = (kb: number): string => {
  if (kb < 1024) return `${kb.toFixed(0)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

const buildSampleCSV = (tasks: Task[]): string => {
  const rows: string[][] = [['task_id', 'data_id', 'content', 'annotation_json', 'accuracy']]
  tasks.forEach((t) => {
    t.dataItems.forEach((d) => {
      rows.push([
        t.id,
        d.id,
        String(d.content ?? '').replace(/\r?\n/g, ' '),
        JSON.stringify(d.annotation ?? {}),
        t.accuracyRate != null ? String(t.accuracyRate) : '',
      ])
    })
  })
  return rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
}

const buildDeliveryFile = (fmt: DeliveryFormat, tasks: Task[]): { content: string; mime: string; ext: string } => {
  const approved = tasks.filter((t) => t.status === 'approved')
  const data = approved.flatMap((t) =>
    t.dataItems.map((d) => ({
      taskId: t.id,
      dataId: d.id,
      content: d.content,
      annotation: d.annotation ?? {},
      accuracy: t.accuracyRate,
    }))
  )
  if (fmt === 'json') {
    return { content: JSON.stringify(data, null, 2), mime: 'application/json', ext: 'json' }
  }
  if (fmt === 'xml') {
    const body = data
      .map(
        (item) =>
          `  <record><taskId>${item.taskId}</taskId><dataId>${item.dataId}</dataId><content><![CDATA[${String(
            item.content ?? ''
          ).replace(/\]\]>/g, '')}]]></content><annotation>${JSON.stringify(
            item.annotation
          )}</annotation><accuracy>${item.accuracy ?? ''}</accuracy></record>`
      )
      .join('\n')
    return { content: `<?xml version="1.0" encoding="UTF-8"?>\n<dataset>\n${body}\n</dataset>`, mime: 'application/xml', ext: 'xml' }
  }
  return { content: buildSampleCSV(approved), mime: 'text/csv', ext: 'csv' }
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getProjectById, loadProjects, updateProject } = useProjectStore()
  const { loadTasks, getTasksByProject } = useTaskStore()
  const [exportingFormat, setExportingFormat] = useState<DeliveryFormat | null>(null)

  useEffect(() => {
    loadProjects()
    loadTasks()
  }, [loadProjects, loadTasks])

  const project = id ? getProjectById(id) : undefined
  const projectTasks = id ? getTasksByProject(id) : []

  if (!project) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-400">项目未找到</p>
      </div>
    )
  }

  const progress =
    project.dataCount > 0
      ? Math.round((project.completedCount / project.dataCount) * 100)
      : 0
  const circumference = 2 * Math.PI * 54
  const strokeDashoffset = circumference - (progress / 100) * circumference

  const taskStatusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    statusMeta.forEach((s) => (counts[s.key] = 0))
    projectTasks.forEach((t) => {
      if (t.status in counts) counts[t.status] += 1
    })
    return counts
  }, [projectTasks])

  const tasksWithAccuracy = projectTasks.filter((t) => t.accuracyRate != null)

  const accuracyCounts = useMemo(() => {
    return accuracyBuckets.map((b) => ({
      ...b,
      count: tasksWithAccuracy.filter(
        (t) => (t.accuracyRate ?? 0) >= b.min && (t.accuracyRate ?? 0) < b.max
      ).length,
    }))
  }, [tasksWithAccuracy])

  const reworkStats = useMemo(() => {
    const neverReworked = projectTasks.filter((t) => !t.everRejected).length
    const once = projectTasks.filter((t) => (t.reworkCount ?? 0) === 1).length
    const twice = projectTasks.filter((t) => (t.reworkCount ?? 0) === 2).length
    const more = projectTasks.filter((t) => (t.reworkCount ?? 0) >= 3).length
    const everRejected = projectTasks.filter((t) => t.everRejected).length
    return { neverReworked, once, twice, more, everRejected }
  }, [projectTasks])

  const remaining = Math.max(0, project.dataCount - project.completedCount)

  const deliveries: DatasetDelivery[] = project.deliveries ?? []

  const handleGenerateDelivery = async (format: DeliveryFormat) => {
    if (!project || exportingFormat) return
    setExportingFormat(format)
    setTimeout(() => {
      const approvedTasks = projectTasks.filter((t) => t.status === 'approved')
      const { content, mime, ext } = buildDeliveryFile(format, approvedTasks)
      const sizeKB = Math.max(1, Math.round(new Blob([content]).size / 1024))
      const blob = new Blob(['\uFEFF' + content], { type: `${mime};charset=utf-8` })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
      a.href = url
      a.download = `${project.name}_数据集_${timestamp}.${ext}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      const delivery: DatasetDelivery = {
        id: `dlv_${Date.now()}`,
        format,
        dataCount: approvedTasks.reduce((sum, t) => sum + t.dataItems.length, 0),
        generatedAt: new Date().toISOString(),
        generatedBy: '审核员',
        fileSizeKB: sizeKB,
      }
      const nextDeliveries = [...(project.deliveries ?? []), delivery]
      updateProject(project.id, { deliveries: nextDeliveries } as Partial<Project>)

      setExportingFormat(null)
    }, 600)
  }

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => navigate('/client')}
          className="text-sm text-gray-400 hover:text-white transition-colors mb-2"
        >
          ← 返回工作台
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold">{project.name}</h1>
            <p className="text-gray-400 mt-1 text-sm">{project.description}</p>
          </div>
          <StatusBadge status={project.status as 'draft' | 'active' | 'reviewing' | 'completed'} type="project" />
        </div>
        <div className="flex items-center gap-4 mt-3 flex-wrap">
          <DataTypeInfo
            type={project.dataType as 'text' | 'image' | 'audio' | 'video'}
          />
          <span className="text-xs text-gray-500">
            <Calendar className="h-3.5 w-3.5 inline mr-1" />
            创建于 {new Date(project.createdAt).toLocaleDateString('zh-CN')}
          </span>
          <span className="text-xs text-gray-500">
            <Target className="h-3.5 w-3.5 inline mr-1" />
            截止 {new Date(project.deadline).toLocaleDateString('zh-CN')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-lg p-6 flex flex-col items-center"
        >
          <p className="text-sm text-gray-400 mb-4">项目进度</p>
          <div className="relative h-32 w-32">
            <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="54"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="8"
                fill="none"
              />
              <motion.circle
                cx="60"
                cy="60"
                r="54"
                stroke="#FF6B35"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-heading font-bold">{progress}%</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            {project.completedCount.toLocaleString()} / {project.dataCount.toLocaleString()} 条
          </p>
          <p className="text-xs text-warning mt-1 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            剩余待交付 {remaining.toLocaleString()} 条
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-lg p-6"
        >
          <p className="text-sm text-gray-400 mb-4 flex items-center gap-1.5">
            <Layers className="h-4 w-4" />
            任务状态分布
          </p>
          <div className="space-y-3">
            {statusMeta.map((s) => (
              <div key={s.key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="text-sm text-gray-300">{s.label}</span>
                </div>
                <span className="text-sm font-medium">{taskStatusCounts[s.key]}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-lg p-6"
        >
          <p className="text-sm text-gray-400 mb-4 flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4" />
            准确率区间
          </p>
          <div className="space-y-3">
            {accuracyCounts.map((b) => (
              <div key={b.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-300">{b.label}</span>
                  <span className="font-medium">{b.count} 任务</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width:
                        tasksWithAccuracy.length > 0
                          ? `${(b.count / tasksWithAccuracy.length) * 100}%`
                          : '0%',
                    }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: b.color }}
                  />
                </div>
              </div>
            ))}
            {tasksWithAccuracy.length === 0 && (
              <p className="text-xs text-gray-500 pt-2">暂无审核记录</p>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-lg p-6"
      >
        <p className="text-sm text-gray-400 mb-4 flex items-center gap-1.5">
          <RefreshCw className="h-4 w-4" />
          返工统计
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: '未返工',
              value: reworkStats.neverReworked,
              icon: CheckCircle2,
              color: 'text-success',
            },
            {
              label: '返工 1 次',
              value: reworkStats.once,
              icon: RefreshCw,
              color: 'text-primary-accent',
            },
            {
              label: '返工 2 次',
              value: reworkStats.twice,
              icon: AlertTriangle,
              color: 'text-warning',
            },
            {
              label: '返工 ≥3 次',
              value: reworkStats.more,
              icon: XCircle,
              color: 'text-error',
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white/5 rounded-lg p-4 flex items-center gap-3"
            >
              <s.icon className={cn('h-6 w-6 shrink-0', s.color)} />
              <div>
                <p className="text-2xl font-heading font-bold">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
        {reworkStats.everRejected > 0 && (
          <p className="text-xs text-gray-500 mt-4">
            历史累计 <span className="text-warning font-medium">{reworkStats.everRejected}</span> 个任务曾被退回返工
          </p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass rounded-lg p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-400 flex items-center gap-1.5">
            <Database className="h-4 w-4" />
            数据集交付记录
          </p>
          <div className="flex items-center gap-2">
            {formatOptions.map((fmt) => (
              <button
                key={fmt.key}
                onClick={() => handleGenerateDelivery(fmt.key)}
                disabled={!!exportingFormat || projectTasks.filter((t) => t.status === 'approved').length === 0}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  exportingFormat === fmt.key
                    ? 'bg-primary-accent/20 text-primary-accent cursor-wait'
                    : 'bg-white/5 border border-white/10 text-gray-300 hover:border-primary-accent hover:text-primary-accent disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-white/10'
                )}
              >
                {exportingFormat === fmt.key ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <fmt.icon className="h-3.5 w-3.5" />
                )}
                {fmt.label}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          {deliveries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-8 text-center text-gray-500 text-sm"
            >
              <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>暂无交付记录</p>
              <p className="text-xs mt-1">生成数据集后会在此展示</p>
            </motion.div>
          ) : (
            <div className="space-y-2">
              {deliveries
                .slice()
                .reverse()
                .map((dlv, i) => {
                  const fmt = formatOptions.find((f) => f.key === dlv.format)
                  const FmtIcon = fmt?.icon ?? FileText
                  return (
                    <motion.div
                      key={dlv.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-md bg-primary-accent/10 flex items-center justify-center shrink-0">
                          <FmtIcon className="h-4 w-4 text-primary-accent" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {project.name}_{dlv.format.toUpperCase()}_
                            {new Date(dlv.generatedAt).toISOString().slice(0, 10).replace(/-/g, '')}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(dlv.generatedAt).toLocaleString('zh-CN')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Database className="h-3 w-3" />
                              {dlv.dataCount.toLocaleString()} 条
                            </span>
                            <span>{formatBytes(dlv.fileSizeKB)}</span>
                            {dlv.generatedBy && <span>生成：{dlv.generatedBy}</span>}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleGenerateDelivery(dlv.format)}
                        disabled={!!exportingFormat}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary-accent/15 text-primary-accent text-xs font-medium hover:bg-primary-accent/25 transition-colors disabled:opacity-40"
                      >
                        <Download className="h-3.5 w-3.5" />
                        下载
                      </button>
                    </motion.div>
                  )
                })}
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

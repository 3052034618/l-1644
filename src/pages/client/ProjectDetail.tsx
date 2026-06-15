import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, Download, FileJson, FileSpreadsheet, FileCode } from 'lucide-react'
import { useProjectStore } from '@/store/projectStore'
import { useTaskStore } from '@/store/taskStore'
import StatusBadge from '@/components/StatusBadge'
import DataTypeInfo from '@/components/DataTypeInfo'
import { cn } from '@/lib/utils'

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getProjectById, loadProjects } = useProjectStore()
  const { loadTasks, getTasksByProject } = useTaskStore()

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

  const taskStats = {
    total: projectTasks.length,
    inProgress: projectTasks.filter((t) => t.status === 'in_progress').length,
    submitted: projectTasks.filter((t) => t.status === 'submitted').length,
    approved: projectTasks.filter((t) => t.status === 'approved').length,
  }

  const accuracyTasks = projectTasks.filter((t) => t.accuracyRate !== undefined)

  const formatOptions = [
    { key: 'json', label: 'JSON', icon: FileJson },
    { key: 'csv', label: 'CSV', icon: FileSpreadsheet },
    { key: 'xml', label: 'XML', icon: FileCode },
  ]

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
        <div className="flex items-center gap-4 mt-3">
          <DataTypeInfo
            type={project.dataType as 'text' | 'image' | 'audio' | 'video'}
          />
          <span className="text-xs text-gray-500">
            <Calendar className="h-3.5 w-3.5 inline mr-1" />
            创建于 {new Date(project.createdAt).toLocaleDateString('zh-CN')}
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
            {project.completedCount.toLocaleString()} /{' '}
            {project.dataCount.toLocaleString()} 条数据
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-lg p-6"
        >
          <p className="text-sm text-gray-400 mb-4">任务统计</p>
          <div className="space-y-3">
            {[
              { label: '总任务', value: taskStats.total, color: '#3B82F6' },
              { label: '进行中', value: taskStats.inProgress, color: '#FF6B35' },
              { label: '已提交', value: taskStats.submitted, color: '#8B5CF6' },
              { label: '已通过', value: taskStats.approved, color: '#10B981' },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: stat.color }}
                  />
                  <span className="text-sm text-gray-300">{stat.label}</span>
                </div>
                <span className="text-sm font-medium">{stat.value}</span>
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
          <p className="text-sm text-gray-400 mb-4">数据集下载</p>
          {project.status === 'completed' ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                {formatOptions.map((fmt) => (
                  <button
                    key={fmt.key}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300 hover:border-primary-accent hover:text-primary-accent transition-colors"
                  >
                    <fmt.icon className="h-3.5 w-3.5" />
                    {fmt.label}
                  </button>
                ))}
              </div>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary-accent text-white text-sm font-medium hover:bg-primary-accent/90 transition-colors">
                <Download className="h-4 w-4" />
                下载数据集
              </button>
            </div>
          ) : (
            <p className="text-xs text-gray-500">项目完成后可下载数据集</p>
          )}
        </motion.div>
      </div>

      {accuracyTasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-lg p-6"
        >
          <p className="text-sm text-gray-400 mb-4">任务准确率</p>
          <div className="space-y-2.5">
            {accuracyTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-20 shrink-0 truncate">
                  {task.id}
                </span>
                <div className="flex-1 h-4 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(task.accuracyRate ?? 0) * 100}%` }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className={cn(
                      'h-full rounded-full',
                      (task.accuracyRate ?? 0) >= 0.9
                        ? 'bg-success'
                        : (task.accuracyRate ?? 0) >= 0.8
                          ? 'bg-warning'
                          : 'bg-error',
                    )}
                  />
                </div>
                <span
                  className={cn(
                    'text-xs font-medium w-14 text-right',
                    (task.accuracyRate ?? 0) >= 0.9
                      ? 'text-success'
                      : (task.accuracyRate ?? 0) >= 0.8
                        ? 'text-warning'
                        : 'text-error',
                  )}
                >
                  {((task.accuracyRate ?? 0) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

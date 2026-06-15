import { useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ClipboardList, Loader2, Clock, Target, AlertTriangle, Users } from 'lucide-react'
import { useTaskStore } from '@/store/taskStore'
import { useProjectStore } from '@/store/projectStore'
import { useAuthStore } from '@/store/authStore'
import StatCard from '@/components/StatCard'
import PriorityBadge from '@/components/PriorityBadge'
import { cn } from '@/lib/utils'
import type { Task, TaskStatus } from '@/types'

const ACCURACY_THRESHOLD = 0.85

const KANBAN_COLUMNS: { key: TaskStatus | 'submitted_reviewing'; label: string; color: string }[] = [
  { key: 'pending', label: '待分配', color: '#64748B' },
  { key: 'in_progress', label: '进行中', color: '#3B82F6' },
  { key: 'submitted_reviewing', label: '待审核', color: '#F59E0B' },
  { key: 'approved', label: '已完成', color: '#10B981' },
]

function getKanbanColumn(task: Task): string {
  if (task.status === 'pending') return 'pending'
  if (task.status === 'in_progress') return 'in_progress'
  if (task.status === 'submitted' || task.status === 'reviewing') return 'submitted_reviewing'
  if (task.status === 'approved') return 'approved'
  return ''
}

const priorityBorder: Record<string, string> = {
  high: 'border-l-error',
  medium: 'border-l-warning',
  low: 'border-l-success',
}

export default function ManagerCenter() {
  const { tasks, loadTasks } = useTaskStore()
  const { projects, loadProjects } = useProjectStore()
  const { currentUser } = useAuthStore()

  useEffect(() => {
    loadTasks()
    loadProjects()
  }, [loadTasks, loadProjects])

  const totalTasks = tasks.length
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length
  const pendingReviewTasks = tasks.filter((t) => t.status === 'submitted' || t.status === 'reviewing').length
  const tasksWithAccuracy = tasks.filter((t) => t.accuracyRate !== undefined && t.accuracyRate !== null)
  const avgAccuracy = tasksWithAccuracy.length
    ? (tasksWithAccuracy.reduce((s, t) => s + (t.accuracyRate ?? 0), 0) / tasksWithAccuracy.length) * 100
    : 0

  const kanbanData = useMemo(() => {
    const map: Record<string, Task[]> = {}
    KANBAN_COLUMNS.forEach((col) => {
      map[col.key] = []
    })
    tasks.forEach((task) => {
      const col = getKanbanColumn(task)
      if (col && map[col]) {
        map[col].push(task)
      }
    })
    return map
  }, [tasks])

  const getProjectName = (projectId: string) => {
    return projects.find((p) => p.id === projectId)?.name ?? '未知项目'
  }

  const getProjectDeadline = (projectId: string) => {
    return projects.find((p) => p.id === projectId)?.deadline
  }

  const qualityAlerts = useMemo(() => {
    return tasks.filter(
      (t) =>
        t.accuracyRate !== undefined &&
        t.accuracyRate !== null &&
        t.accuracyRate < ACCURACY_THRESHOLD
    )
  }, [tasks])

  const getAssigneeName = (assigneeId: string) => {
    const userMap: Record<string, string> = {
      u003: '王强',
      u004: '刘洋',
      u006: '赵磊',
      u009: '吴敏',
    }
    return userMap[assigneeId] ?? '未分配'
  }

  const getAssigneeAvatar = (assigneeId: string) => {
    const userMap: Record<string, string> = {
      u003: '/avatars/wangqiang.png',
      u004: '/avatars/liuyang.png',
      u006: '/avatars/zhaolei.png',
      u009: '/avatars/wumin.png',
    }
    return userMap[assigneeId] ?? ''
  }

  return (
    <div className="min-h-screen bg-primary p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">管理中心</h1>
          <p className="text-gray-400 text-sm mt-1">
            {currentUser?.name ? `${currentUser.name}，欢迎回来` : '欢迎回来'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={ClipboardList}
          label="任务总量"
          value={totalTasks}
          color="#3B82F6"
        />
        <StatCard
          icon={Loader2}
          label="进行中"
          value={inProgressTasks}
          color="#F59E0B"
        />
        <StatCard
          icon={Clock}
          label="待审核"
          value={pendingReviewTasks}
          color="#8B5CF6"
        />
        <StatCard
          icon={Target}
          label="平均准确率"
          value={`${avgAccuracy.toFixed(1)}%`}
          trend={avgAccuracy >= 85 ? 'up' : 'down'}
          trendValue={`${avgAccuracy.toFixed(1)}%`}
          color="#10B981"
        />
      </div>

      {qualityAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-lg p-4 border border-error/30"
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-error" />
            <h3 className="font-heading font-semibold text-error">质量预警</h3>
            <span className="text-xs text-gray-400 ml-2">
              准确率低于 {(ACCURACY_THRESHOLD * 100).toFixed(0)}% 的任务
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {qualityAlerts.map((task) => (
              <div
                key={task.id}
                className="bg-error/5 rounded-lg p-3 border border-error/20 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium">
                    {getProjectName(task.projectId)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    负责人：{getAssigneeName(task.assigneeId)}
                  </p>
                </div>
                <div className="text-error font-heading font-bold text-lg">
                  {((task.accuracyRate ?? 0) * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-primary-accent" />
          <h2 className="text-lg font-heading font-semibold">任务看板</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {KANBAN_COLUMNS.map((column) => (
            <div key={column.key} className="flex flex-col">
              <div className="flex items-center gap-2 mb-3 px-1">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: column.color }}
                />
                <span className="text-sm font-medium text-gray-300">
                  {column.label}
                </span>
                <span className="text-xs text-gray-500 ml-auto">
                  {kanbanData[column.key]?.length ?? 0}
                </span>
              </div>
              <div className="flex flex-col gap-2 min-h-[200px]">
                <AnimatePresence>
                  {(kanbanData[column.key] ?? []).map((task, index) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        'glass rounded-lg p-3 border-l-4 cursor-pointer hover:bg-white/5 transition-colors',
                        priorityBorder[task.priority]
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium truncate mr-2">
                          {getProjectName(task.projectId)}
                        </span>
                        <PriorityBadge priority={task.priority} />
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        {getAssigneeAvatar(task.assigneeId) ? (
                          <img
                            src={getAssigneeAvatar(task.assigneeId)}
                            alt=""
                            className="w-5 h-5 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-gray-600 flex items-center justify-center text-[10px] text-gray-300">
                            ?
                          </div>
                        )}
                        <span className="text-xs text-gray-400">
                          {getAssigneeName(task.assigneeId)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{task.dataItems.length} 条数据</span>
                        {getProjectDeadline(task.projectId) && (
                          <span>
                            截止 {new Date(getProjectDeadline(task.projectId)!).toLocaleDateString('zh-CN')}
                          </span>
                        )}
                      </div>
                      {task.accuracyRate !== undefined && task.accuracyRate !== null && (
                        <div className="mt-2 flex items-center gap-1">
                          <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full',
                                task.accuracyRate >= 0.85
                                  ? 'bg-success'
                                  : 'bg-error'
                              )}
                              style={{ width: `${task.accuracyRate * 100}%` }}
                            />
                          </div>
                          <span
                            className={cn(
                              'text-[10px]',
                              task.accuracyRate >= 0.85
                                ? 'text-success'
                                : 'text-error'
                            )}
                          >
                            {(task.accuracyRate * 100).toFixed(0)}%
                          </span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

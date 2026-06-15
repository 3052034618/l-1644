import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, X, FileText, Tag, Calendar } from 'lucide-react'
import { useTaskStore } from '@/store/taskStore'
import { useProjectStore } from '@/store/projectStore'
import { useAuthStore } from '@/store/authStore'
import PriorityBadge from '@/components/PriorityBadge'
import { cn } from '@/lib/utils'
import type { Task, User } from '@/types'

const ANNOTATOR_ACCURACY: Record<string, number> = {
  u003: 0.96,
  u004: 0.83,
  u006: 0.89,
  u009: 0.78,
}

export default function TaskAssignment() {
  const { tasks, loadTasks, updateTask } = useTaskStore()
  const { projects, loadProjects } = useProjectStore()
  const { login } = useAuthStore()
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [annotators, setAnnotators] = useState<User[]>([])

  useEffect(() => {
    loadTasks()
    loadProjects()
  }, [loadTasks, loadProjects])

  useEffect(() => {
    import('@/mock').then(({ users }) => {
      setAnnotators(users.filter((u) => u.role === 'annotator'))
    })
  }, [])

  const unassignedTasks = useMemo(() => {
    return tasks.filter(
      (t) => t.status === 'pending' || !t.assigneeId
    )
  }, [tasks])

  const getProjectName = (projectId: string) => {
    return projects.find((p) => p.id === projectId)?.name ?? '未知项目'
  }

  const getProjectDeadline = (projectId: string) => {
    return projects.find((p) => p.id === projectId)?.deadline
  }

  const handleAssign = (annotatorId: string) => {
    if (!selectedTask) return
    updateTask(selectedTask.id, {
      assigneeId: annotatorId,
      status: 'in_progress',
    })
    setSelectedTask(null)
  }

  const getAnnotatorAccuracy = (id: string) => {
    return ANNOTATOR_ACCURACY[id] ?? 0
  }

  const getAnnotatorTaskCount = (id: string) => {
    return tasks.filter((t) => t.assigneeId === id && t.status === 'in_progress').length
  }

  return (
    <div className="min-h-screen bg-primary p-6 flex gap-6">
      <div className="flex-1 min-w-0">
        <div className="mb-6">
          <h1 className="text-2xl font-heading font-bold">任务分配</h1>
          <p className="text-gray-400 text-sm mt-1">
            将待分配任务指派给标注员
          </p>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary-accent" />
          <span className="text-sm font-medium text-gray-300">
            待分配任务
          </span>
          <span className="text-xs text-gray-500">
            ({unassignedTasks.length})
          </span>
        </div>

        <div className="space-y-2">
          <AnimatePresence>
            {unassignedTasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onClick={() => setSelectedTask(task)}
                className={cn(
                  'glass rounded-lg p-4 cursor-pointer transition-all hover:bg-white/5',
                  selectedTask?.id === task.id
                    ? 'ring-1 ring-primary-accent/50 bg-white/5'
                    : ''
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium truncate mr-3">
                    {getProjectName(task.projectId)}
                  </span>
                  <PriorityBadge priority={task.priority} />
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {task.dataItems.length} 条数据
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {getProjectDeadline(task.projectId)
                      ? new Date(
                          getProjectDeadline(task.projectId)!
                        ).toLocaleDateString('zh-CN')
                      : '无截止日期'}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {unassignedTasks.length === 0 && (
            <div className="glass rounded-lg p-8 text-center text-gray-500">
              暂无待分配任务
            </div>
          )}
        </div>
      </div>

      <div className="w-[440px] shrink-0">
        <div className="mb-4 flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-primary-accent" />
          <span className="text-sm font-medium text-gray-300">标注员</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {annotators.map((annotator) => {
            const accuracy = getAnnotatorAccuracy(annotator.id)
            const taskCount = getAnnotatorTaskCount(annotator.id)
            return (
              <motion.div
                key={annotator.id}
                whileHover={{ y: -2 }}
                className="glass rounded-lg p-4"
              >
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={annotator.avatar}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {annotator.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      当前 {taskCount} 个任务
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {(annotator.skills ?? []).slice(0, 3).map((skill) => (
                    <span
                      key={skill}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-primary-accent/10 text-primary-accent"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                  <div className="bg-white/5 rounded px-2 py-1.5">
                    <p className="text-gray-500">信用分</p>
                    <p className="font-heading font-semibold">
                      {annotator.creditScore ?? '-'}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded px-2 py-1.5">
                    <p className="text-gray-500">准确率</p>
                    <p
                      className={cn(
                        'font-heading font-semibold',
                        accuracy >= 0.85 ? 'text-success' : 'text-error'
                      )}
                    >
                      {(accuracy * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                <button
                  disabled={!selectedTask}
                  onClick={() => handleAssign(annotator.id)}
                  className={cn(
                    'w-full py-1.5 rounded text-xs font-medium transition-colors',
                    selectedTask
                      ? 'bg-primary-accent text-white hover:bg-primary-accent/90'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  )}
                >
                  分配
                </button>
              </motion.div>
            )
          })}
        </div>
      </div>

      <AnimatePresence>
        {selectedTask && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-[380px] bg-secondary/95 backdrop-blur-xl border-l border-white/10 p-6 z-50 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-heading font-semibold">任务详情</h3>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">所属项目</p>
                <p className="text-sm font-medium">
                  {getProjectName(selectedTask.projectId)}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">优先级</p>
                <PriorityBadge priority={selectedTask.priority} />
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">数据量</p>
                <p className="text-sm">{selectedTask.dataItems.length} 条</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">创建时间</p>
                <p className="text-sm">
                  {new Date(selectedTask.createdAt).toLocaleDateString('zh-CN')}
                </p>
              </div>

              {getProjectDeadline(selectedTask.projectId) && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">截止日期</p>
                  <p className="text-sm">
                    {new Date(
                      getProjectDeadline(selectedTask.projectId)!
                    ).toLocaleDateString('zh-CN')}
                  </p>
                </div>
              )}

              {selectedTask.dataItems.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">数据类型</p>
                  <div className="flex flex-wrap gap-2">
                    {[...new Set(selectedTask.dataItems.map((d) => d.type))].map(
                      (type) => (
                        <span
                          key={type}
                          className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-400"
                        >
                          {type}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-white/10">
                <p className="text-xs text-gray-500 mb-3">
                  选择右侧标注员进行分配
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

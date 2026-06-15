import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FolderKanban, Activity, CheckCircle2, Target, Plus } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useProjectStore } from '@/store/projectStore'
import StatCard from '@/components/StatCard'
import StatusBadge from '@/components/StatusBadge'
import DataTypeInfo from '@/components/DataTypeInfo'

export default function ClientWorkspace() {
  const navigate = useNavigate()
  const { currentUser } = useAuthStore()
  const { projects, loadProjects, getProjectsByClient } = useProjectStore()

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const clientProjects = currentUser
    ? getProjectsByClient(currentUser.id)
    : projects

  const totalProjects = clientProjects.length
  const activeProjects = clientProjects.filter((p) => p.status === 'active').length
  const completedDatasets = clientProjects.filter((p) => p.status === 'completed').length
  const avgAccuracy =
    clientProjects.length > 0
      ? (
          (clientProjects.reduce((sum, p) => sum + p.accuracyRate, 0) /
            clientProjects.length) *
          100
        ).toFixed(1)
      : '0.0'

  const getProgress = (p: (typeof clientProjects)[0]) =>
    p.dataCount > 0 ? Math.round((p.completedCount / p.dataCount) * 100) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">
          欢迎回来，{currentUser?.name ?? '客户'}
        </h1>
        <p className="text-gray-400 mt-1">以下是您的项目概览</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FolderKanban} label="总项目数" value={totalProjects} color="#3B82F6" />
        <StatCard icon={Activity} label="进行中项目" value={activeProjects} color="#FF6B35" />
        <StatCard icon={CheckCircle2} label="已完成数据集" value={completedDatasets} color="#10B981" />
        <StatCard icon={Target} label="平均准确率" value={`${avgAccuracy}%`} color="#8B5CF6" />
      </div>

      <div>
        <h2 className="text-lg font-heading font-semibold mb-4">我的项目</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {clientProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.3)' }}
              onClick={() => navigate(`/client/project/${project.id}`)}
              className="glass rounded-lg p-5 cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-heading font-semibold text-base">{project.name}</h3>
                <StatusBadge status={project.status as 'draft' | 'active' | 'reviewing' | 'completed'} type="project" />
              </div>

              <div className="mb-3">
                <DataTypeInfo
                  type={project.dataType as 'text' | 'image' | 'audio' | 'video'}
                />
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>进度</span>
                  <span>{getProgress(project)}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${getProgress(project)}%` }}
                    transition={{ duration: 0.8, delay: index * 0.05 }}
                    className="h-full rounded-full bg-primary-accent"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>
                  准确率:{' '}
                  <span className="text-white font-medium">
                    {(project.accuracyRate * 100).toFixed(1)}%
                  </span>
                </span>
                <span>截止: {new Date(project.deadline).toLocaleDateString('zh-CN')}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/client/project/create')}
        className="fixed bottom-8 right-8 h-14 w-14 rounded-full bg-primary-accent flex items-center justify-center shadow-lg shadow-primary-accent/25 hover:bg-primary-accent/90 transition-colors z-50"
      >
        <Plus className="h-6 w-6 text-white" />
      </motion.button>
    </div>
  )
}

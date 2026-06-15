import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, MessageSquareWarning } from 'lucide-react'
import { useComplaintStore } from '@/store/complaintStore'
import { useProjectStore } from '@/store/projectStore'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

const complaintStatusConfig: Record<
  string,
  { label: string; className: string }
> = {
  pending: { label: '待处理', className: 'bg-warning/15 text-warning' },
  processing: { label: '处理中', className: 'bg-blue-500/15 text-blue-400' },
  resolved: { label: '已解决', className: 'bg-success/15 text-success' },
}

export default function Complaints() {
  const { currentUser } = useAuthStore()
  const { complaints, loadComplaints, addComplaint, getComplaintsByClient } =
    useComplaintStore()
  const { projects, loadProjects, getProjectsByClient } = useProjectStore()
  const [showModal, setShowModal] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [reason, setReason] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    loadComplaints()
    loadProjects()
  }, [loadComplaints, loadProjects])

  const clientComplaints = currentUser
    ? getComplaintsByClient(currentUser.id)
    : complaints

  const clientProjects = currentUser
    ? getProjectsByClient(currentUser.id)
    : projects

  const getProjectName = (projectId: string) => {
    const p = projects.find((proj) => proj.id === projectId)
    return p?.name ?? projectId
  }

  const handleSubmit = () => {
    if (!selectedProjectId || !reason.trim()) return
    addComplaint({
      id: `c${Date.now()}`,
      projectId: selectedProjectId,
      clientId: currentUser?.id ?? '',
      reason: reason.trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    })
    setShowModal(false)
    setSelectedProjectId('')
    setReason('')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">投诉管理</h1>
          <p className="text-gray-400 mt-1">管理您的投诉与反馈</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-accent text-white text-sm font-medium hover:bg-primary-accent/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          新建投诉
        </button>
      </div>

      <div className="space-y-3">
        {clientComplaints.map((complaint, index) => {
          const statusConfig = complaintStatusConfig[complaint.status]
          const isExpanded = expandedId === complaint.id

          return (
            <motion.div
              key={complaint.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="glass rounded-lg p-4 cursor-pointer"
              onClick={() => setExpandedId(isExpanded ? null : complaint.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">
                      {getProjectName(complaint.projectId)}
                    </span>
                    {statusConfig && (
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                          statusConfig.className,
                        )}
                      >
                        {statusConfig.label}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate">
                    {complaint.reason}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {new Date(complaint.createdAt).toLocaleString('zh-CN')}
                  </p>
                </div>
                <MessageSquareWarning className="h-5 w-5 text-gray-500 shrink-0 ml-3" />
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
                      {complaint.responsibleParty && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-gray-500">责任人：</span>
                          <span className="text-gray-300">
                            {complaint.responsibleParty}
                          </span>
                        </div>
                      )}
                      {complaint.creditAdjustment !== undefined && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-gray-500">信用调整：</span>
                          <span className="text-error font-medium">
                            {complaint.creditAdjustment}
                          </span>
                        </div>
                      )}
                      {complaint.resolvedAt && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-gray-500">解决时间：</span>
                          <span className="text-gray-300">
                            {new Date(complaint.resolvedAt).toLocaleString(
                              'zh-CN',
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}

        {clientComplaints.length === 0 && (
          <div className="glass rounded-lg p-10 text-center">
            <MessageSquareWarning className="h-10 w-10 mx-auto text-gray-600 mb-3" />
            <p className="text-sm text-gray-500">暂无投诉记录</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-xl p-6 w-full max-w-md mx-4"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-heading font-semibold">新建投诉</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    选择项目
                  </label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white focus:border-primary-accent focus:outline-none transition-colors"
                  >
                    <option value="">请选择项目</option>
                    {clientProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    投诉原因
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="请详细描述投诉原因..."
                    rows={4}
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-primary-accent focus:outline-none transition-colors resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-5">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 text-gray-300 text-sm hover:bg-white/10 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!selectedProjectId || !reason.trim()}
                  className="px-4 py-2 rounded-lg bg-primary-accent text-white text-sm font-medium hover:bg-primary-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  提交
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquareWarning, Filter, User, CheckCircle2 } from 'lucide-react'
import { useComplaintStore } from '@/store/complaintStore'
import { useProjectStore } from '@/store/projectStore'
import { useAuthStore } from '@/store/authStore'
import { useUserStore } from '@/store/userStore'
import { cn } from '@/lib/utils'
import type { Complaint, User as UserType } from '@/types'

const complaintStatusConfig: Record<
  string,
  { label: string; className: string }
> = {
  pending: { label: '待处理', className: 'bg-warning/15 text-warning' },
  processing: { label: '处理中', className: 'bg-blue-500/15 text-blue-400' },
  resolved: { label: '已解决', className: 'bg-success/15 text-success' },
}

const roleLabels: Record<string, string> = {
  annotator: '标注员',
  reviewer: '审核员',
}

type FilterStatus = 'all' | 'pending' | 'processing' | 'resolved'

export default function ComplaintManagement() {
  const { currentUser } = useAuthStore()
  const { complaints, loadComplaints, updateComplaint } = useComplaintStore()
  const { projects, loadProjects } = useProjectStore()
  const { users, loadUsers, getUserById, adjustCreditScore } = useUserStore()
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [responsibleParty, setResponsibleParty] = useState('none')
  const [creditAdjustment, setCreditAdjustment] = useState(0)
  const [handleRemark, setHandleRemark] = useState('')

  useEffect(() => {
    loadComplaints()
    loadProjects()
    loadUsers()
  }, [loadComplaints, loadProjects, loadUsers])

  const annotatorsAndReviewers = useMemo(() => {
    return users.filter(
      (u) => u.role === 'annotator' || u.role === 'reviewer'
    )
  }, [users])

  const filteredComplaints = useMemo(() => {
    if (statusFilter === 'all') return complaints
    return complaints.filter((c) => c.status === statusFilter)
  }, [complaints, statusFilter])

  const getProjectName = (projectId: string) => {
    const p = projects.find((proj) => proj.id === projectId)
    return p?.name ?? projectId
  }

  const getClientName = (clientId: string) => {
    const u = getUserById(clientId)
    return u?.name ?? clientId
  }

  const getUserName = (userId: string) => {
    const u = getUserById(userId)
    return u?.name ?? userId
  }

  const getUserRoleLabel = (role: string) => {
    return roleLabels[role] ?? role
  }

  const truncateReason = (reason: string, maxLen = 30) => {
    if (reason.length <= maxLen) return reason
    return reason.slice(0, maxLen) + '...'
  }

  const handleSelectComplaint = (complaint: Complaint) => {
    setSelectedComplaint(complaint)
    setResponsibleParty(complaint.responsibleParty ?? 'none')
    setCreditAdjustment(complaint.creditAdjustment ?? 0)
    setHandleRemark('')
  }

  const handleResolve = () => {
    if (!selectedComplaint) return
    const responsibleId = responsibleParty === 'none' ? undefined : responsibleParty
    const resolvedAt = new Date().toISOString()
    const patch: Partial<Complaint> = {
      status: 'resolved',
      responsibleParty: responsibleId,
      creditAdjustment: creditAdjustment,
      resolutionNote: handleRemark.trim() || undefined,
      resolvedAt,
    }
    updateComplaint(selectedComplaint.id, patch)

    if (responsibleId && creditAdjustment !== 0) {
      adjustCreditScore(
        responsibleId,
        creditAdjustment,
        `投诉处理：${selectedComplaint.reason.slice(0, 30)}${selectedComplaint.reason.length > 30 ? '...' : ''}`,
        selectedComplaint.id
      )
    }

    setSelectedComplaint({
      ...selectedComplaint,
      ...patch,
    })
  }

  const formatCreditAdjustment = (value: number) => {
    if (value > 0) return `+${value}`
    return `${value}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">投诉处理</h1>
        <p className="text-gray-400 mt-1">处理客户投诉，追究责任并调整信用分</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 mr-2">
          <Filter className="h-4 w-4 text-primary-accent" />
          <span className="text-sm text-gray-300">状态筛选</span>
        </div>
        {(['all', 'pending', 'processing', 'resolved'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              statusFilter === status
                ? 'bg-primary-accent text-white'
                : 'glass text-gray-400 hover:text-white'
            )}
          >
            {status === 'all' ? '全部' : complaintStatusConfig[status]?.label ?? status}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {filteredComplaints.map((complaint, index) => {
            const statusConfig = complaintStatusConfig[complaint.status]
            const isSelected = selectedComplaint?.id === complaint.id

            return (
              <motion.div
                key={complaint.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => handleSelectComplaint(complaint)}
                className={cn(
                  'glass rounded-lg p-4 cursor-pointer transition-all border-2',
                  isSelected
                    ? 'border-primary-accent/50 shadow-lg shadow-primary-accent/10'
                    : 'border-transparent hover:border-white/10'
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-500">
                      {complaint.id.toUpperCase()}
                    </span>
                    {statusConfig && (
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                          statusConfig.className
                        )}
                      >
                        {statusConfig.label}
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-sm">
                    <span className="text-primary-accent font-medium truncate">
                      {getProjectName(complaint.projectId)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <User className="h-3 w-3" />
                    <span>{getClientName(complaint.clientId)}</span>
                  </div>
                  <p className="text-sm text-gray-300">
                    {truncateReason(complaint.reason)}
                  </p>
                  <p className="text-xs text-gray-600">
                    {new Date(complaint.createdAt).toLocaleString('zh-CN')}
                  </p>
                </div>
              </motion.div>
            )
          })}

          {filteredComplaints.length === 0 && (
            <div className="glass rounded-lg p-10 text-center">
              <MessageSquareWarning className="h-10 w-10 mx-auto text-gray-600 mb-3" />
              <p className="text-sm text-gray-500">暂无投诉记录</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {selectedComplaint ? (
              <motion.div
                key={selectedComplaint.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass rounded-lg p-6 space-y-5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-heading font-semibold">投诉详情</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {selectedComplaint.id.toUpperCase()}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
                      complaintStatusConfig[selectedComplaint.status]?.className
                    )}
                  >
                    {complaintStatusConfig[selectedComplaint.status]?.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">关联项目</label>
                    <p className="text-sm font-medium text-primary-accent">
                      {getProjectName(selectedComplaint.projectId)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">投诉客户</label>
                    <p className="text-sm font-medium">
                      {getClientName(selectedComplaint.clientId)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">投诉原因</label>
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-sm text-gray-300 whitespace-pre-wrap">
                        {selectedComplaint.reason}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">投诉时间</label>
                    <p className="text-sm">
                      {new Date(selectedComplaint.createdAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                </div>

                {selectedComplaint.status === 'resolved' ? (
                  <div className="border-t border-white/5 pt-5 space-y-4">
                    <h3 className="text-sm font-semibold text-success flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      处理结果
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">责任人</label>
                        <p className="text-sm font-medium">
                          {selectedComplaint.responsibleParty
                            ? getUserName(selectedComplaint.responsibleParty)
                            : '无责任'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          信用分调整
                        </label>
                        <p
                          className={cn(
                            'text-sm font-semibold',
                            (selectedComplaint.creditAdjustment ?? 0) > 0
                              ? 'text-success'
                              : (selectedComplaint.creditAdjustment ?? 0) < 0
                                ? 'text-error'
                                : 'text-gray-300'
                          )}
                        >
                          {formatCreditAdjustment(
                            selectedComplaint.creditAdjustment ?? 0
                          )}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">处理时间</label>
                        <p className="text-sm">
                          {selectedComplaint.resolvedAt
                            ? new Date(selectedComplaint.resolvedAt).toLocaleString(
                                'zh-CN'
                              )
                            : '-'}
                        </p>
                      </div>
                    </div>
                    {selectedComplaint.resolutionNote && (
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">处理结论</label>
                        <div className="bg-white/5 rounded-lg p-3">
                          <p className="text-sm text-gray-300 whitespace-pre-wrap">
                            {selectedComplaint.resolutionNote}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border-t border-white/5 pt-5 space-y-4">
                    <h3 className="text-sm font-semibold">处理操作</h3>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        责任方
                      </label>
                      <select
                        value={responsibleParty}
                        onChange={(e) => setResponsibleParty(e.target.value)}
                        className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white focus:border-primary-accent focus:outline-none transition-colors"
                      >
                        <option value="none">无责任</option>
                        {annotatorsAndReviewers.map((u: UserType) => (
                          <option key={u.id} value={u.id}>
                            {getUserRoleLabel(u.role)}-{u.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        信用分调整
                        <span className="text-xs text-gray-500 ml-2">
                          正值加分，负值扣分
                        </span>
                      </label>
                      <input
                        type="number"
                        value={creditAdjustment}
                        onChange={(e) =>
                          setCreditAdjustment(parseInt(e.target.value) || 0)
                        }
                        className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white focus:border-primary-accent focus:outline-none transition-colors"
                      />
                      <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-500">
                        <span>
                          当前值：
                          <span
                            className={cn(
                              'font-medium ml-1',
                              creditAdjustment > 0
                                ? 'text-success'
                                : creditAdjustment < 0
                                  ? 'text-error'
                                  : 'text-gray-400'
                            )}
                          >
                            {formatCreditAdjustment(creditAdjustment)}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        处理备注
                      </label>
                      <textarea
                        value={handleRemark}
                        onChange={(e) => setHandleRemark(e.target.value)}
                        placeholder="请输入处理备注..."
                        rows={3}
                        className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-primary-accent focus:outline-none transition-colors resize-none"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={handleResolve}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-accent text-white text-sm font-medium hover:bg-primary-accent/90 transition-colors"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        处理完成
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass rounded-lg p-16 text-center"
              >
                <MessageSquareWarning className="h-12 w-12 mx-auto text-gray-600 mb-4" />
                <p className="text-sm text-gray-500">请从左侧选择一条投诉</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

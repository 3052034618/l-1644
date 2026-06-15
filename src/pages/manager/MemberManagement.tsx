import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, ArrowUpDown, X, Plus, Pencil } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'
import type { User, UserRole } from '@/types'

const MEMBER_ACCURACY: Record<string, number> = {
  u003: 0.96,
  u004: 0.83,
  u005: 0.91,
  u006: 0.89,
  u009: 0.78,
  u010: 0.87,
}

type SortField = 'creditScore' | 'accuracy' | 'currentTaskCount'
type SortDir = 'asc' | 'desc'

const roleLabels: Record<string, string> = {
  annotator: '标注员',
  reviewer: '审核员',
}

export default function MemberManagement() {
  const [members, setMembers] = useState<User[]>([])
  const [roleFilter, setRoleFilter] = useState<'all' | 'annotator' | 'reviewer'>('all')
  const [sortField, setSortField] = useState<SortField>('creditScore')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editSkills, setEditSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState('')

  useEffect(() => {
    import('@/mock').then(({ users }) => {
      setMembers(
        users.filter((u) => u.role === 'annotator' || u.role === 'reviewer')
      )
    })
  }, [])

  const filteredMembers = useMemo(() => {
    let list = members
    if (roleFilter !== 'all') {
      list = list.filter((m) => m.role === roleFilter)
    }
    return [...list].sort((a, b) => {
      let aVal: number, bVal: number
      if (sortField === 'accuracy') {
        aVal = MEMBER_ACCURACY[a.id] ?? 0
        bVal = MEMBER_ACCURACY[b.id] ?? 0
      } else if (sortField === 'currentTaskCount') {
        aVal = a.currentTaskCount ?? 0
        bVal = b.currentTaskCount ?? 0
      } else {
        aVal = a.creditScore ?? 0
        bVal = b.creditScore ?? 0
      }
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal
    })
  }, [members, roleFilter, sortField, sortDir])

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const openSkillEditor = (user: User) => {
    setEditingUser(user)
    setEditSkills([...(user.skills ?? [])])
    setNewSkill('')
  }

  const addSkill = () => {
    const trimmed = newSkill.trim()
    if (trimmed && !editSkills.includes(trimmed)) {
      setEditSkills([...editSkills, trimmed])
      setNewSkill('')
    }
  }

  const removeSkill = (skill: string) => {
    setEditSkills(editSkills.filter((s) => s !== skill))
  }

  const saveSkills = () => {
    if (!editingUser) return
    setMembers((prev) =>
      prev.map((m) =>
        m.id === editingUser.id ? { ...m, skills: editSkills } : m
      )
    )
    setEditingUser(null)
  }

  const SortIcon = ({ field }: { field: SortField }) => (
    <ArrowUpDown
      className={cn(
        'h-3 w-3 ml-1',
        sortField === field ? 'text-primary-accent' : 'text-gray-600'
      )}
    />
  )

  return (
    <div className="min-h-screen bg-primary p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold">成员管理</h1>
        <p className="text-gray-400 text-sm mt-1">管理标注员与审核员信息</p>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 mr-4">
          <Users className="h-4 w-4 text-primary-accent" />
          <span className="text-sm text-gray-300">角色筛选</span>
        </div>
        {(['all', 'annotator', 'reviewer'] as const).map((role) => (
          <button
            key={role}
            onClick={() => setRoleFilter(role)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              roleFilter === role
                ? 'bg-primary-accent text-white'
                : 'glass text-gray-400 hover:text-white'
            )}
          >
            {role === 'all' ? '全部' : roleLabels[role]}
          </button>
        ))}
      </div>

      <div className="glass rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">
                成员
              </th>
              <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">
                角色
              </th>
              <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">
                技能标签
              </th>
              <th
                className="text-left text-xs text-gray-400 font-medium px-4 py-3 cursor-pointer select-none"
                onClick={() => toggleSort('currentTaskCount')}
              >
                <span className="inline-flex items-center">
                  当前任务
                  <SortIcon field="currentTaskCount" />
                </span>
              </th>
              <th
                className="text-left text-xs text-gray-400 font-medium px-4 py-3 cursor-pointer select-none"
                onClick={() => toggleSort('creditScore')}
              >
                <span className="inline-flex items-center">
                  信用分
                  <SortIcon field="creditScore" />
                </span>
              </th>
              <th
                className="text-left text-xs text-gray-400 font-medium px-4 py-3 cursor-pointer select-none"
                onClick={() => toggleSort('accuracy')}
              >
                <span className="inline-flex items-center">
                  准确率
                  <SortIcon field="accuracy" />
                </span>
              </th>
              <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map((member, index) => {
              const accuracy = MEMBER_ACCURACY[member.id] ?? 0
              return (
                <motion.tr
                  key={member.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={member.avatar}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full',
                        member.role === 'annotator'
                          ? 'bg-blue-500/15 text-blue-400'
                          : 'bg-purple-500/15 text-purple-400'
                      )}
                    >
                      {roleLabels[member.role] ?? member.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(member.skills ?? []).map((skill) => (
                        <span
                          key={skill}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-primary-accent/10 text-primary-accent"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-heading">
                      {member.currentTaskCount ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'text-sm font-heading font-semibold',
                        (member.creditScore ?? 0) >= 85
                          ? 'text-success'
                          : (member.creditScore ?? 0) >= 70
                            ? 'text-warning'
                            : 'text-error'
                      )}
                    >
                      {member.creditScore ?? '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'text-sm font-heading font-semibold',
                        accuracy >= 0.85 ? 'text-success' : 'text-error'
                      )}
                    >
                      {(accuracy * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openSkillEditor(member)}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-primary-accent transition-colors"
                    >
                      <Pencil className="h-3 w-3" />
                      编辑技能
                    </button>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>

        {filteredMembers.length === 0 && (
          <div className="p-8 text-center text-gray-500">暂无成员数据</div>
        )}
      </div>

      <AnimatePresence>
        {editingUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            onClick={() => setEditingUser(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-xl p-6 w-[420px] max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-heading font-semibold">
                  编辑技能标签
                </h3>
                <button
                  onClick={() => setEditingUser(null)}
                  className="p-1.5 rounded-lg hover:bg-white/10"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              </div>

              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <img
                    src={editingUser.avatar}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="text-sm font-medium">
                    {editingUser.name}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {editSkills.map((skill) => (
                    <span
                      key={skill}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-primary-accent/10 text-primary-accent"
                    >
                      {skill}
                      <button
                        onClick={() => removeSkill(skill)}
                        className="hover:text-white transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addSkill()
                    }}
                    placeholder="输入新技能"
                    className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-accent/50"
                  />
                  <button
                    onClick={addSkill}
                    className="px-3 py-2 rounded-lg bg-primary-accent/20 text-primary-accent hover:bg-primary-accent/30 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:bg-white/10 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={saveSkills}
                  className="px-4 py-2 rounded-lg text-sm bg-primary-accent text-white hover:bg-primary-accent/90 transition-colors"
                >
                  保存
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

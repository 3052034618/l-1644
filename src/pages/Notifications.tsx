import { useEffect, useState } from 'react'
import {
  Bell,
  ClipboardList,
  Send,
  AlertTriangle,
  MessageCircleWarning,
  FileBarChart,
  CheckCheck,
  ChevronDown,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotificationStore } from '@/store/notificationStore'
import { useAuthStore } from '@/store/authStore'
import type { NotificationType } from '@/types'
import { cn } from '@/lib/utils'

type FilterTab = 'all' | NotificationType

const TABS: { key: FilterTab; label: string; icon: typeof Bell }[] = [
  { key: 'all', label: '全部', icon: Bell },
  { key: 'task_assigned', label: '任务分配', icon: ClipboardList },
  { key: 'task_submitted', label: '提交审核', icon: Send },
  { key: 'quality_alert', label: '质量预警', icon: AlertTriangle },
  { key: 'complaint', label: '客诉处理', icon: MessageCircleWarning },
  { key: 'report_ready', label: '报表就绪', icon: FileBarChart },
]

const TYPE_ICON_MAP: Record<NotificationType, typeof Bell> = {
  task_assigned: ClipboardList,
  task_submitted: Send,
  quality_alert: AlertTriangle,
  complaint: MessageCircleWarning,
  report_ready: FileBarChart,
}

const TYPE_COLOR_MAP: Record<NotificationType, string> = {
  task_assigned: '#3B82F6',
  task_submitted: '#8B5CF6',
  quality_alert: '#F59E0B',
  complaint: '#EF4444',
  report_ready: '#10B981',
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin}分钟前`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}小时前`
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 7) return `${diffDay}天前`
  return d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
}

export default function Notifications() {
  const { notifications, loadNotifications, markAsRead, markAllAsRead } = useNotificationStore()
  const { currentUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    if (currentUser) {
      loadNotifications(currentUser.id)
    }
  }, [currentUser, loadNotifications])

  const filtered = activeTab === 'all'
    ? notifications
    : notifications.filter((n) => n.type === activeTab)

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleNotificationClick = (id: string) => {
    markAsRead(id)
    setExpandedId((prev) => (prev === id ? null : id))
  }

  const handleMarkAllRead = () => {
    markAllAsRead()
  }

  return (
    <div className="min-h-screen bg-primary bg-pattern flex">
      <motion.aside
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35 }}
        className="w-56 shrink-0 border-r border-white/5 p-5 flex flex-col gap-2"
      >
        <h2 className="text-lg font-heading font-bold text-white mb-3">通知类型</h2>
        {TABS.map((tab) => {
          const count =
            tab.key === 'all'
              ? notifications.length
              : notifications.filter((n) => n.type === tab.key).length
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all w-full text-left',
                activeTab === tab.key
                  ? 'bg-[#FF6B35]/15 text-[#FF6B35] font-medium'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
              )}
            >
              <tab.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{tab.label}</span>
              {count > 0 && (
                <span
                  className={cn(
                    'text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center',
                    activeTab === tab.key
                      ? 'bg-[#FF6B35]/20 text-[#FF6B35]'
                      : 'bg-white/5 text-gray-500'
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </motion.aside>

      <main className="flex-1 p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex items-center justify-between mb-5"
        >
          <div>
            <h1 className="text-2xl font-heading font-bold text-white">通知中心</h1>
            <p className="text-sm text-gray-400 mt-1">
              共 {notifications.length} 条通知，{unreadCount} 条未读
            </p>
          </div>
          <button
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              unreadCount > 0
                ? 'bg-[#FF6B35]/15 text-[#FF6B35] hover:bg-[#FF6B35]/25'
                : 'bg-white/5 text-gray-600 cursor-not-allowed'
            )}
          >
            <CheckCheck className="h-4 w-4" />
            全部已读
          </button>
        </motion.div>

        <div className="flex flex-col gap-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((notification, index) => {
              const Icon = TYPE_ICON_MAP[notification.type]
              const iconColor = TYPE_COLOR_MAP[notification.type]
              const isExpanded = expandedId === notification.id

              return (
                <motion.div
                  key={notification.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25, delay: index * 0.04 }}
                  onClick={() => handleNotificationClick(notification.id)}
                  className={cn(
                    'glass rounded-xl p-4 cursor-pointer transition-all',
                    !notification.read && 'border-l-2 border-l-[#3B82F6]',
                    isExpanded && 'bg-white/[0.04]'
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: `${iconColor}20` }}
                    >
                      <Icon className="h-4.5 w-4.5" style={{ color: iconColor }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3
                          className={cn(
                            'text-sm font-medium truncate',
                            notification.read ? 'text-gray-300' : 'text-white'
                          )}
                        >
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <span className="h-2 w-2 rounded-full bg-[#3B82F6] shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {notification.content}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-500">
                        {formatTime(notification.createdAt)}
                      </span>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      </motion.div>
                    </div>
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
                        <div className="mt-3 pt-3 border-t border-white/5 pl-13">
                          <p className="text-sm text-gray-300 leading-relaxed">
                            {notification.content}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(notification.createdAt).toLocaleString('zh-CN')}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-gray-500"
            >
              <Bell className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">暂无通知</p>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}

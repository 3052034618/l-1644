import { create } from 'zustand'
import type { NotificationItem } from '@/types'
import { notifications } from '@/mock'

interface NotificationState {
  notifications: NotificationItem[]
  loadNotifications: (userId: string) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  getUnreadCount: (userId: string) => number
  addNotification: (notification: NotificationItem) => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  loadNotifications: (userId) => {
    set({ notifications: notifications.filter((n) => n.userId === userId) })
  },
  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }))
  },
  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }))
  },
  getUnreadCount: (userId) => {
    return get().notifications.filter((n) => n.userId === userId && !n.read).length
  },
  addNotification: (notification) => {
    set((state) => ({ notifications: [...state.notifications, notification] }))
  },
}))

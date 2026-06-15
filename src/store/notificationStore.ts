import { create } from 'zustand'
import type { NotificationItem } from '@/types'
import { notifications as mockNotifications } from '@/mock'
import { loadFromStorage, saveToStorage } from './persist'

interface NotificationState {
  notifications: NotificationItem[]
  _loaded: boolean
  loadNotifications: (userId: string) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  getUnreadCount: (userId: string) => number
  addNotification: (notification: NotificationItem) => void
}

const STORAGE_KEY = 'notifications'

export const useNotificationStore = create<NotificationState>((set, get) => {
  const persisted = loadFromStorage<NotificationItem[]>(STORAGE_KEY, [])
  return {
    notifications: persisted.length > 0 ? persisted : [],
    _loaded: persisted.length > 0,
    loadNotifications: (userId) => {
      const state = get()
      if (state._loaded) return
      const fromStorage = loadFromStorage<NotificationItem[]>(STORAGE_KEY, [])
      if (fromStorage.length > 0) {
        set({ notifications: fromStorage, _loaded: true })
        return
      }
      const data = mockNotifications.filter((n) => n.userId === userId)
      set({ notifications: data, _loaded: true })
      saveToStorage(STORAGE_KEY, data)
    },
    markAsRead: (id) => {
      set((state) => {
        const notifications = state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        )
        saveToStorage(STORAGE_KEY, notifications)
        return { notifications }
      })
    },
    markAllAsRead: () => {
      set((state) => {
        const notifications = state.notifications.map((n) => ({ ...n, read: true }))
        saveToStorage(STORAGE_KEY, notifications)
        return { notifications }
      })
    },
    getUnreadCount: (userId) => {
      return get().notifications.filter((n) => n.userId === userId && !n.read).length
    },
    addNotification: (notification) => {
      set((state) => {
        const notifications = [...state.notifications, notification]
        saveToStorage(STORAGE_KEY, notifications)
        return { notifications }
      })
    },
  }
})

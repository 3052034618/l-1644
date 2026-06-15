import { create } from 'zustand'
import type { User, UserRole } from '@/types'
import { users } from '@/mock'

export type { UserRole }

const DEMO_ACCOUNTS: Record<string, { email: string; password: string }> = {
  admin: { email: 'admin@demo.com', password: '123456' },
  manager: { email: 'lina@example.com', password: '123456' },
  annotator: { email: 'wangqiang@example.com', password: '123456' },
  client: { email: 'zhangwei@example.com', password: '123456' },
  reviewer: { email: 'chenfang@example.com', password: '123456' },
}

interface AuthState {
  currentUser: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => boolean
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  isAuthenticated: false,
  login: (email, password) => {
    const isDemo = Object.values(DEMO_ACCOUNTS).some(
      (a) => a.email === email && a.password === password
    )
    if (isDemo) {
      const user = users.find((u) => u.email === email)
      if (user) {
        set({ currentUser: user, isAuthenticated: true })
        return true
      }
    }
    return false
  },
  logout: () => {
    set({ currentUser: null, isAuthenticated: false })
  },
}))

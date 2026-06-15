import { create } from 'zustand'
import type { Task } from '@/types'
import { tasks as mockTasks } from '@/mock'

interface TaskState {
  tasks: Task[]
  loadTasks: () => void
  addTask: (task: Task) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  getTasksByAssignee: (assigneeId: string) => Task[]
  getTasksByProject: (projectId: string) => Task[]
  getTaskById: (id: string) => Task | undefined
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loadTasks: () => {
    set({ tasks: [...mockTasks] })
  },
  addTask: (task) => {
    set((state) => ({ tasks: [...state.tasks, task] }))
  },
  updateTask: (id, updates) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }))
  },
  getTasksByAssignee: (assigneeId) => {
    return get().tasks.filter((t) => t.assigneeId === assigneeId)
  },
  getTasksByProject: (projectId) => {
    return get().tasks.filter((t) => t.projectId === projectId)
  },
  getTaskById: (id) => {
    return get().tasks.find((t) => t.id === id)
  },
}))

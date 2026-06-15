export type UserRole = 'admin' | 'manager' | 'annotator' | 'client' | 'reviewer'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar: string
  creditScore?: number
  skills?: string[]
  currentTaskCount?: number
}

export type ProjectStatus = 'active' | 'completed' | 'paused' | 'reviewing' | 'draft'

export interface Project {
  id: string
  name: string
  description: string
  clientId: string
  dataType: string
  status: ProjectStatus
  specification: string
  templateId: string
  createdAt: string
  deadline: string
  dataCount: number
  completedCount: number
  accuracyRate: number
  uploadedFiles?: Array<{name: string, size: number, dataCount: number, type: string}>
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'rejected' | 'submitted' | 'reviewing' | 'approved'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface DataItem {
  id: string
  content: string
  type: string
  annotation?: Record<string, unknown>
}

export interface Task {
  id: string
  projectId: string
  assigneeId: string
  reviewerId?: string
  status: TaskStatus
  priority: TaskPriority
  dataItems: DataItem[]
  createdAt: string
  submittedAt?: string
  accuracyRate?: number
  rejectReason?: string
  notes?: string
}

export type NotificationType = 'task_assigned' | 'task_submitted' | 'quality_alert' | 'complaint' | 'report_ready'

export interface NotificationItem {
  id: string
  userId: string
  type: NotificationType
  title: string
  content: string
  read: boolean
  createdAt: string
}

export type ComplaintStatus = 'pending' | 'processing' | 'resolved'

export interface Complaint {
  id: string
  projectId: string
  clientId: string
  reason: string
  status: ComplaintStatus
  responsibleParty?: string
  creditAdjustment?: number
  createdAt: string
  resolvedAt?: string
}

export interface Template {
  id: string
  name: string
  dataType: string
  description: string
  icon: string
}

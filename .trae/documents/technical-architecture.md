## 1. 架构设计

```mermaid
graph TB
    subgraph "前端层"
        A["React SPA 应用"]
        A1["登录注册"]
        A2["客户工作台"]
        A3["项目管理中心"]
        A4["标注工作台"]
        A5["审核工作台"]
        A6["消息通知中心"]
        A7["数据看板"]
    end

    subgraph "数据层"
        B["Mock 数据服务"]
        B1["用户数据"]
        B2["项目数据"]
        B3["任务数据"]
        B4["标注数据"]
        B5["审核数据"]
        B6["消息数据"]
        B7["统计数据"]
    end

    A --> A1
    A --> A2
    A --> A3
    A --> A4
    A --> A5
    A --> A6
    A --> A7

    A1 --> B1
    A2 --> B2
    A3 --> B3
    A4 --> B4
    A5 --> B5
    A6 --> B6
    A7 --> B7
```

## 2. 技术说明

- **前端框架**: React@18 + TypeScript
- **样式方案**: Tailwind CSS@3 + CSS Modules (复杂组件)
- **构建工具**: Vite
- **路由管理**: React Router v6
- **状态管理**: Zustand
- **图表库**: ECharts (via echarts-for-react)
- **图标库**: Phosphor React
- **动画库**: Framer Motion
- **HTTP客户端**: Axios (用于模拟请求)
- **后端**: 无后端，使用 Mock 数据模拟全流程
- **数据库**: 无数据库，使用内存状态 + Mock JSON 数据

## 3. 路由定义

| 路由 | 用途 | 权限 |
|------|------|------|
| `/login` | 登录注册页 | 公开 |
| `/client` | 客户工作台首页 | 客户 |
| `/client/project/create` | 创建标注项目 | 客户 |
| `/client/project/:id` | 项目详情/数据集下载 | 客户 |
| `/client/complaints` | 投诉管理 | 客户 |
| `/manager` | 项目管理中心首页 | 项目管理员 |
| `/manager/tasks` | 任务分配管理 | 项目管理员 |
| `/manager/members` | 标注员管理 | 项目管理员 |
| `/manager/reports` | 运营报表 | 项目管理员 |
| `/annotator` | 标注工作台首页 | 标注员 |
| `/annotator/task/:id` | 在线标注 | 标注员 |
| `/reviewer` | 审核工作台首页 | 审核员 |
| `/reviewer/task/:id` | 审核判定 | 审核员 |
| `/dashboard` | 数据看板 | 全部角色 |
| `/notifications` | 消息通知中心 | 全部角色 |

## 4. API 定义

### 4.1 用户相关

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: "client" | "manager" | "annotator" | "reviewer";
  avatar: string;
  creditScore: number;
  skills?: string[];
  currentTaskCount?: number;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: User;
}
```

### 4.2 项目相关

```typescript
interface Project {
  id: string;
  name: string;
  description: string;
  clientId: string;
  dataType: "text" | "image" | "audio" | "video";
  status: "draft" | "active" | "reviewing" | "completed";
  specification: string;
  templateId: string;
  createdAt: string;
  deadline: string;
  dataCount: number;
  completedCount: number;
  accuracyRate: number;
}

interface CreateProjectRequest {
  name: string;
  description: string;
  dataType: "text" | "image" | "audio" | "video";
  specification: string;
  templateId: string;
  deadline: string;
}
```

### 4.3 任务相关

```typescript
interface Task {
  id: string;
  projectId: string;
  assigneeId: string;
  status: "pending" | "in_progress" | "submitted" | "reviewing" | "approved" | "rejected";
  priority: "low" | "medium" | "high";
  dataItems: DataItem[];
  createdAt: string;
  submittedAt?: string;
  accuracyRate?: number;
  rejectReason?: string;
}

interface DataItem {
  id: string;
  content: string;
  type: "text" | "image" | "audio" | "video";
  annotation?: Annotation;
}

interface Annotation {
  label: string;
  regions?: Region[];
  text?: string;
  timestamp?: number;
}

interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}
```

### 4.4 审核相关

```typescript
interface Review {
  id: string;
  taskId: string;
  reviewerId: string;
  result: "approved" | "rejected";
  accuracyRate: number;
  comment?: string;
  reviewedAt: string;
}
```

### 4.5 消息通知

```typescript
interface Notification {
  id: string;
  userId: string;
  type: "task_assigned" | "task_submitted" | "quality_alert" | "complaint" | "report_ready";
  title: string;
  content: string;
  read: boolean;
  createdAt: string;
}
```

### 4.6 投诉相关

```typescript
interface Complaint {
  id: string;
  projectId: string;
  clientId: string;
  reason: string;
  status: "pending" | "processing" | "resolved";
  responsibleParty?: string;
  creditAdjustment?: number;
  createdAt: string;
  resolvedAt?: string;
}
```

## 5. 数据模型

### 5.1 数据模型定义

```mermaid
erDiagram
    User ||--o{ Project : "客户创建"
    User ||--o{ Task : "标注员执行"
    User ||--o{ Review : "审核员审核"
    Project ||--o{ Task : "包含"
    Project ||--o{ Complaint : "关联"
    Task ||--o{ DataItem : "包含"
    DataItem ||--o| Annotation : "标注"
    Task ||--o| Review : "审核"
    User ||--o{ Notification : "接收"

    User {
        string id PK
        string name
        string email
        string role
        number creditScore
        string skills
        number currentTaskCount
    }

    Project {
        string id PK
        string name
        string clientId FK
        string dataType
        string status
        string specification
        string templateId
        string deadline
        number dataCount
        number completedCount
        number accuracyRate
    }

    Task {
        string id PK
        string projectId FK
        string assigneeId FK
        string status
        string priority
        string createdAt
        number accuracyRate
    }

    DataItem {
        string id PK
        string taskId FK
        string content
        string type
    }

    Annotation {
        string id PK
        string dataItemId FK
        string label
        string text
    }

    Review {
        string id PK
        string taskId FK
        string reviewerId FK
        string result
        number accuracyRate
        string comment
    }

    Complaint {
        string id PK
        string projectId FK
        string clientId FK
        string reason
        string status
        string responsibleParty
        number creditAdjustment
    }

    Notification {
        string id PK
        string userId FK
        string type
        string title
        boolean read
    }
```

### 5.2 数据定义语言

```sql
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('client', 'manager', 'annotator', 'reviewer') NOT NULL,
    avatar VARCHAR(255),
    credit_score INT DEFAULT 100,
    skills JSON,
    current_task_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE projects (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    client_id VARCHAR(36) REFERENCES users(id),
    data_type ENUM('text', 'image', 'audio', 'video') NOT NULL,
    status ENUM('draft', 'active', 'reviewing', 'completed') DEFAULT 'draft',
    specification TEXT,
    template_id VARCHAR(36),
    deadline TIMESTAMP,
    data_count INT DEFAULT 0,
    completed_count INT DEFAULT 0,
    accuracy_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tasks (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) REFERENCES projects(id),
    assignee_id VARCHAR(36) REFERENCES users(id),
    status ENUM('pending', 'in_progress', 'submitted', 'reviewing', 'approved', 'rejected') DEFAULT 'pending',
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP NULL,
    accuracy_rate DECIMAL(5,2) DEFAULT 0,
    reject_reason TEXT
);

CREATE TABLE data_items (
    id VARCHAR(36) PRIMARY KEY,
    task_id VARCHAR(36) REFERENCES tasks(id),
    content TEXT NOT NULL,
    type ENUM('text', 'image', 'audio', 'video') NOT NULL
);

CREATE TABLE annotations (
    id VARCHAR(36) PRIMARY KEY,
    data_item_id VARCHAR(36) REFERENCES data_items(id),
    label VARCHAR(100),
    regions JSON,
    annotation_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reviews (
    id VARCHAR(36) PRIMARY KEY,
    task_id VARCHAR(36) REFERENCES tasks(id),
    reviewer_id VARCHAR(36) REFERENCES users(id),
    result ENUM('approved', 'rejected') NOT NULL,
    accuracy_rate DECIMAL(5,2) NOT NULL,
    comment TEXT,
    reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE complaints (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) REFERENCES projects(id),
    client_id VARCHAR(36) REFERENCES users(id),
    reason TEXT NOT NULL,
    status ENUM('pending', 'processing', 'resolved') DEFAULT 'pending',
    responsible_party VARCHAR(36),
    credit_adjustment INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL
);

CREATE TABLE notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(id),
    type ENUM('task_assigned', 'task_submitted', 'quality_alert', 'complaint', 'report_ready') NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_complaints_project ON complaints(project_id);
```

import { useState } from "react"
import { Outlet, NavLink, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  Bell,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  LogOut,
  FolderPlus,
  FolderOpen,
  MessageSquareWarning,
  ClipboardList,
  Users,
  BarChart3,
  PenTool,
  ListChecks,
  CheckSquare,
  Search,
} from "lucide-react"
import { useAuthStore } from "@/store/authStore"
import { useTheme } from "@/hooks/useTheme"
import { cn } from "@/lib/utils"

type UserRole = "client" | "manager" | "annotator" | "reviewer"

interface NavItem {
  label: string
  icon: React.ElementType
  path: string
}

const roleNavItems: Record<UserRole, NavItem[]> = {
  client: [
    { label: "工作台", icon: LayoutDashboard, path: "/client" },
    { label: "创建项目", icon: FolderPlus, path: "/client/project/create" },
    { label: "我的项目", icon: FolderOpen, path: "/client/projects" },
    { label: "投诉管理", icon: MessageSquareWarning, path: "/client/complaints" },
  ],
  manager: [
    { label: "管理中心", icon: LayoutDashboard, path: "/manager" },
    { label: "任务分配", icon: ClipboardList, path: "/manager/tasks" },
    { label: "标注员管理", icon: Users, path: "/manager/members" },
    { label: "运营报表", icon: BarChart3, path: "/manager/reports" },
  ],
  annotator: [
    { label: "标注工作台", icon: LayoutDashboard, path: "/annotator" },
    { label: "任务列表", icon: ListChecks, path: "/annotator/tasks" },
    { label: "标注工具", icon: PenTool, path: "/annotator/workspace" },
  ],
  reviewer: [
    { label: "审核工作台", icon: LayoutDashboard, path: "/reviewer" },
    { label: "审核队列", icon: Search, path: "/reviewer/queue" },
    { label: "审核判定", icon: CheckSquare, path: "/reviewer/review" },
  ],
}

const sharedNavItems: NavItem[] = [
  { label: "数据看板", icon: BarChart3, path: "/dashboard" },
  { label: "消息通知", icon: Bell, path: "/notifications" },
]

const roleLabels: Record<UserRole, string> = {
  client: "客户",
  manager: "项目管理员",
  annotator: "标注员",
  reviewer: "审核员",
}

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const { currentUser, logout } = useAuthStore()
  const { toggleTheme, isDark } = useTheme()
  const navigate = useNavigate()

  const role: UserRole = (currentUser?.role as UserRole) ?? "annotator"
  const navItems = [...roleNavItems[role], ...sharedNavItems]

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <div className={cn("flex h-screen bg-primary font-body text-white", isDark ? "dark" : "")}>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="glass flex flex-col border-r border-white/5 z-20"
      >
        <div className="flex h-16 items-center justify-between px-4">
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-2"
              >
                <div className="h-8 w-8 rounded-lg bg-primary-accent flex items-center justify-center">
                  <PenTool className="h-4 w-4 text-white" />
                </div>
                <span className="font-heading text-lg font-bold tracking-tight">
                  DataLabel
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          {collapsed && (
            <div className="h-8 w-8 rounded-lg bg-primary-accent flex items-center justify-center mx-auto">
              <PenTool className="h-4 w-4 text-white" />
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary-accent/15 text-primary-accent"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                )
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/5 p-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex w-full items-center justify-center rounded-lg py-2 text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>
      </motion.aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="glass flex h-16 items-center justify-between border-b border-white/5 px-6 z-10">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary-accent/15 px-3 py-0.5 text-xs font-medium text-primary-accent">
              {roleLabels[role]}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            <button className="relative rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary-accent" />
            </button>

            <div className="h-6 w-px bg-white/10" />

            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-sm font-medium text-primary-accent">
                {currentUser?.name?.charAt(0) ?? "U"}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium leading-tight">{currentUser?.name ?? "用户"}</span>
                <span className="text-xs text-gray-500 leading-tight">{currentUser?.email ?? ""}</span>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-white/5 hover:text-error transition-colors ml-1"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-pattern">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

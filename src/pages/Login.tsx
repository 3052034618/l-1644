import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ChevronDown,
  Briefcase,
  Shield,
  Tag,
  ClipboardCheck,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const ROLE_PATH: Record<string, string> = {
  client: '/client',
  manager: '/manager',
  annotator: '/annotator',
  reviewer: '/reviewer',
}

const ROLES = [
  { value: 'client', label: '客户' },
  { value: 'manager', label: '项目管理员' },
  { value: 'annotator', label: '标注员' },
  { value: 'reviewer', label: '审核员' },
]

const DEMO_ACCOUNTS = [
  { role: 'client', label: '客户', email: 'zhangwei@example.com', password: '123456', icon: Briefcase },
  { role: 'manager', label: '项目管理员', email: 'lina@example.com', password: '123456', icon: Shield },
  { role: 'annotator', label: '标注员', email: 'wangqiang@example.com', password: '123456', icon: Tag },
  { role: 'reviewer', label: '审核员', email: 'chenfang@example.com', password: '123456', icon: ClipboardCheck },
]

const FLOATING_SHAPES = [
  { size: 80, x: 15, y: 20, color: 'rgba(255,107,53,0.12)', duration: 8, isCircle: true },
  { size: 60, x: 72, y: 15, color: 'rgba(59,130,246,0.12)', duration: 10, isCircle: false },
  { size: 100, x: 78, y: 58, color: 'rgba(16,185,129,0.08)', duration: 12, isCircle: true },
  { size: 45, x: 22, y: 72, color: 'rgba(168,85,247,0.12)', duration: 9, isCircle: false },
  { size: 55, x: 55, y: 78, color: 'rgba(255,107,53,0.08)', duration: 11, isCircle: true },
  { size: 70, x: 40, y: 38, color: 'rgba(59,130,246,0.06)', duration: 7, isCircle: true },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

function FloatingShape({ shape }: { shape: (typeof FLOATING_SHAPES)[number] }) {
  return (
    <motion.div
      className="absolute"
      style={{
        width: shape.size,
        height: shape.size,
        left: `${shape.x}%`,
        top: `${shape.y}%`,
        borderRadius: shape.isCircle ? '50%' : 16,
        background: shape.color,
        border: '1px solid rgba(255,255,255,0.04)',
      }}
      animate={{
        y: [0, -25, 0],
        rotate: [0, 180, 360],
        scale: [1, 1.08, 1],
      }}
      transition={{
        duration: shape.duration,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  )
}

const inputClass =
  'w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#FF6B35]/50 transition-colors'

export default function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('annotator')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')

  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  const handleLogin = () => {
    setError('')
    if (!email || !password) {
      setError('请填写邮箱和密码')
      return
    }
    const success = login(email, password)
    if (success) {
      const currentUser = useAuthStore.getState().currentUser
      if (currentUser) {
        navigate(ROLE_PATH[currentUser.role] || '/')
      }
    } else {
      setError('邮箱或密码错误')
    }
  }

  const handleQuickLogin = (demo: (typeof DEMO_ACCOUNTS)[number]) => {
    setError('')
    const success = login(demo.email, demo.password)
    if (success) {
      navigate(ROLE_PATH[demo.role] || '/')
    }
  }

  const handleRegister = () => {
    setError('')
    if (!name || !email || !password || !confirmPassword) {
      setError('请填写所有字段')
      return
    }
    if (password !== confirmPassword) {
      setError('两次密码不一致')
      return
    }
    setIsLogin(true)
    setPassword('')
    setConfirmPassword('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      isLogin ? handleLogin() : handleRegister()
    }
  }

  return (
    <div
      className="min-h-screen w-full flex"
      style={{ background: 'linear-gradient(135deg, #0A1628 0%, #1E293B 100%)' }}
    >
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center overflow-hidden">
        {FLOATING_SHAPES.map((shape, i) => (
          <FloatingShape key={i} shape={shape} />
        ))}

        <motion.div
          className="relative z-10 text-center px-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <motion.h1
            className="font-heading text-6xl font-bold text-white mb-4 tracking-tight"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            DataLabel Pro
          </motion.h1>
          <motion.p
            className="text-xl text-white/50 font-body"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            智能数据标注平台
          </motion.p>
          <motion.div
            className="mt-8 flex items-center justify-center gap-6 text-white/30 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            <span>文本标注</span>
            <span>·</span>
            <span>图像标注</span>
            <span>·</span>
            <span>语音标注</span>
            <span>·</span>
            <span>视频标注</span>
          </motion.div>
        </motion.div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8">
        <motion.div
          className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="mb-6 text-center lg:hidden">
            <h1 className="font-heading text-2xl font-bold text-white tracking-tight">
              DataLabel Pro
            </h1>
            <p className="text-sm text-white/40 mt-1">智能数据标注平台</p>
          </motion.div>

          <motion.div variants={itemVariants} className="flex bg-white/5 rounded-xl p-1 mb-8">
            <button
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isLogin
                  ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF8F5E] text-white shadow-lg shadow-[#FF6B35]/20'
                  : 'text-white/40 hover:text-white/70'
              }`}
              onClick={() => {
                setIsLogin(true)
                setError('')
              }}
            >
              登录
            </button>
            <button
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                !isLogin
                  ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF8F5E] text-white shadow-lg shadow-[#FF6B35]/20'
                  : 'text-white/40 hover:text-white/70'
              }`}
              onClick={() => {
                setIsLogin(false)
                setError('')
              }}
            >
              注册
            </button>
          </motion.div>

          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                onKeyDown={handleKeyDown}
              >
                <div className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                    <input
                      type="email"
                      placeholder="邮箱"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="密码"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${inputClass} !pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        className="w-4 h-4 rounded border-white/20 bg-white/5 accent-[#FF6B35]"
                      />
                      <span className="text-sm text-white/40">记住我</span>
                    </label>
                    <button className="text-sm text-[#FF6B35]/70 hover:text-[#FF6B35] transition-colors">
                      忘记密码？
                    </button>
                  </div>
                  <button
                    onClick={handleLogin}
                    className="w-full py-3 rounded-lg bg-gradient-to-r from-[#FF6B35] to-[#FF8F5E] text-white font-medium hover:shadow-lg hover:shadow-[#FF6B35]/25 transition-all active:scale-[0.98]"
                  >
                    登录
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                onKeyDown={handleKeyDown}
              >
                <div className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                    <input
                      type="text"
                      placeholder="姓名"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                    <input
                      type="email"
                      placeholder="邮箱"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="密码"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${inputClass} !pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                    <input
                      type="password"
                      placeholder="确认密码"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="relative">
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white/60 focus:outline-none focus:border-[#FF6B35]/50 transition-colors appearance-none cursor-pointer"
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value} className="bg-[#1E293B] text-white">
                          {r.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                  </div>
                  <button
                    onClick={handleRegister}
                    className="w-full py-3 rounded-lg bg-gradient-to-r from-[#FF6B35] to-[#FF8F5E] text-white font-medium hover:shadow-lg hover:shadow-[#FF6B35]/25 transition-all active:scale-[0.98]"
                  >
                    注册
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.div
              className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}

          <motion.div variants={itemVariants} className="mt-6 pt-6 border-t border-white/10">
            <p className="text-center text-white/30 text-xs mb-3">演示账号快速登录</p>
            <div className="grid grid-cols-4 gap-2">
              {DEMO_ACCOUNTS.map((demo) => (
                <button
                  key={demo.role}
                  onClick={() => handleQuickLogin(demo)}
                  className="flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-white/50 hover:text-white/80"
                >
                  <demo.icon className="w-4 h-4" />
                  <span className="text-[11px]">{demo.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

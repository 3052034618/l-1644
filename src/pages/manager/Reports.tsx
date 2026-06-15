import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Download, Calendar } from 'lucide-react'
import ReactEChartsCore from 'echarts-for-react'
import { useTaskStore } from '@/store/taskStore'
import { useProjectStore } from '@/store/projectStore'
import StatCard from '@/components/StatCard'
import { cn } from '@/lib/utils'

export default function Reports() {
  const { tasks, loadTasks } = useTaskStore()
  const { projects, loadProjects } = useProjectStore()
  const [startDate, setStartDate] = useState('2025-06')
  const [endDate, setEndDate] = useState('2026-06')
  const [isExporting, setIsExporting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    loadTasks()
    loadProjects()
  }, [loadTasks, loadProjects])

  const metrics = useMemo(() => {
    const totalAnnotations = tasks.reduce((s, t) => s + t.dataItems.length, 0)
    const tasksWithAccuracy = tasks.filter(
      (t) => t.accuracyRate !== undefined && t.accuracyRate !== null
    )
    const avgAccuracy = tasksWithAccuracy.length
      ? tasksWithAccuracy.reduce((s, t) => s + (t.accuracyRate ?? 0), 0) /
        tasksWithAccuracy.length
      : 0
    const approvedTasks = tasks.filter((t) => t.status === 'approved')
    const avgDeliveryDays = approvedTasks.length
      ? approvedTasks.reduce((s, t) => {
          if (!t.submittedAt) return s
          const created = new Date(t.createdAt).getTime()
          const submitted = new Date(t.submittedAt).getTime()
          return s + (submitted - created) / (1000 * 60 * 60 * 24)
        }, 0) / approvedTasks.length
      : 0
    const rejectedTasks = tasks.filter((t) => t.status === 'rejected').length
    const totalReviewed = tasks.filter(
      (t) =>
        t.status === 'approved' ||
        t.status === 'rejected' ||
        t.status === 'reviewing'
    ).length
    const rejectRate = totalReviewed ? rejectedTasks / totalReviewed : 0

    return {
      totalAnnotations,
      avgAccuracy,
      avgDeliveryDays,
      rejectRate,
    }
  }, [tasks])

  const monthlyVolumeOption = useMemo(() => {
    const months = [
      '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12',
      '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06',
    ]
    const data = months.map((m) => {
      const monthTasks = tasks.filter((t) => t.createdAt.startsWith(m))
      return monthTasks.reduce((s, t) => s + t.dataItems.length, 0)
    })

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis' as const,
        backgroundColor: 'rgba(30,41,59,0.9)',
        borderColor: 'rgba(255,255,255,0.1)',
        textStyle: { color: '#e2e8f0', fontSize: 12 },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'category' as const,
        data: months.map((m) => m.replace('-', '年') + '月'),
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        axisLabel: { color: '#94a3b8', fontSize: 10 },
      },
      yAxis: {
        type: 'value' as const,
        axisLine: { show: false },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
        axisLabel: { color: '#94a3b8', fontSize: 10 },
      },
      series: [
        {
          type: 'line' as const,
          data,
          smooth: true,
          lineStyle: { color: '#FF6B35', width: 2 },
          itemStyle: { color: '#FF6B35' },
          areaStyle: {
            color: {
              type: 'linear' as const,
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(255,107,53,0.3)' },
                { offset: 1, color: 'rgba(255,107,53,0.02)' },
              ],
            },
          },
        },
      ],
    }
  }, [tasks])

  const projectAccuracyOption = useMemo(() => {
    const activeProjects = projects.filter((p) => p.accuracyRate > 0)
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis' as const,
        backgroundColor: 'rgba(30,41,59,0.9)',
        borderColor: 'rgba(255,255,255,0.1)',
        textStyle: { color: '#e2e8f0', fontSize: 12 },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'category' as const,
        data: activeProjects.map((p) => p.name),
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        axisLabel: {
          color: '#94a3b8',
          fontSize: 10,
          rotate: 15,
        },
      },
      yAxis: {
        type: 'value' as const,
        max: 100,
        axisLine: { show: false },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
        axisLabel: {
          color: '#94a3b8',
          fontSize: 10,
          formatter: '{value}%',
        },
      },
      series: [
        {
          type: 'bar' as const,
          data: activeProjects.map((p) => ({
            value: +(p.accuracyRate * 100).toFixed(1),
            itemStyle: {
              color: p.accuracyRate >= 0.9
                ? '#10B981'
                : p.accuracyRate >= 0.85
                  ? '#F59E0B'
                  : '#EF4444',
              borderRadius: [4, 4, 0, 0],
            },
          })),
          barWidth: '40%',
        },
      ],
    }
  }, [projects])

  const radarOption = useMemo(() => {
    return {
      backgroundColor: 'transparent',
      tooltip: {
        backgroundColor: 'rgba(30,41,59,0.9)',
        borderColor: 'rgba(255,255,255,0.1)',
        textStyle: { color: '#e2e8f0', fontSize: 12 },
      },
      radar: {
        indicator: [
          { name: '按时交付率', max: 100 },
          { name: '审核通过率', max: 100 },
          { name: '首次交付准确率', max: 100 },
          { name: '返工率', max: 100 },
          { name: '平均响应速度', max: 100 },
        ],
        shape: 'polygon' as const,
        splitArea: {
          areaStyle: { color: ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.04)'] },
        },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
        axisName: { color: '#94a3b8', fontSize: 11 },
      },
      series: [
        {
          type: 'radar' as const,
          data: [
            {
              value: [88, 92, 85, 23, 78],
              name: '当前周期',
              lineStyle: { color: '#FF6B35', width: 2 },
              itemStyle: { color: '#FF6B35' },
              areaStyle: { color: 'rgba(255,107,53,0.2)' },
            },
            {
              value: [82, 88, 80, 30, 72],
              name: '上一周期',
              lineStyle: { color: '#3B82F6', width: 2 },
              itemStyle: { color: '#3B82F6' },
              areaStyle: { color: 'rgba(59,130,246,0.15)' },
            },
          ],
        },
      ],
    }
  }, [])

  const escapeCSV = (value: string | number): string => {
    const str = String(value ?? '')
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  const formatDateTime = (dateStr: string): string => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  const statusMap: Record<string, string> = {
    active: '进行中',
    completed: '已完成',
    paused: '已暂停',
    reviewing: '审核中',
    draft: '草稿',
  }

  const dataTypeMap: Record<string, string> = {
    text: '文本',
    image: '图像',
    audio: '音频',
    video: '视频',
  }

  const getProjectTasks = (projectId: string) => {
    return tasks.filter((t) => t.projectId === projectId)
  }

  const getProjectCompletedTasks = (projectId: string) => {
    return tasks.filter(
      (t) =>
        t.projectId === projectId &&
        (t.status === 'completed' ||
          t.status === 'approved' ||
          t.status === 'submitted' ||
          t.status === 'reviewing')
    )
  }

  const getProjectAccuracy = (projectId: string, fallback: number) => {
    const projectTasks = tasks.filter(
      (t) => t.projectId === projectId && t.accuracyRate !== undefined && t.accuracyRate !== null
    )
    if (projectTasks.length === 0) return fallback
    const avg =
      projectTasks.reduce((s, t) => s + (t.accuracyRate ?? 0), 0) / projectTasks.length
    return avg
  }

  const generateReportCSV = (): string => {
    const lines: string[] = []

    const now = new Date()
    const nowStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`

    lines.push(`${escapeCSV('运营指标报表')},${escapeCSV('')}`)
    lines.push(`${escapeCSV('生成时间')},${escapeCSV(nowStr)}`)
    lines.push(`${escapeCSV('日期范围')},${escapeCSV(`${startDate} 至 ${endDate}`)}`)
    lines.push(`${escapeCSV('项目总数')},${escapeCSV(projects.length)}`)
    lines.push(`${escapeCSV('任务总数')},${escapeCSV(tasks.length)}`)
    lines.push(`${escapeCSV('标注总量')},${escapeCSV(metrics.totalAnnotations)}`)
    lines.push(
      `${escapeCSV('平均准确率')},${escapeCSV(`${(metrics.avgAccuracy * 100).toFixed(1)}%`)}`
    )
    lines.push(
      `${escapeCSV('平均交付天数')},${escapeCSV(`${metrics.avgDeliveryDays.toFixed(1)}天`)}`
    )
    lines.push(
      `${escapeCSV('退回率')},${escapeCSV(`${(metrics.rejectRate * 100).toFixed(1)}%`)}`
    )

    lines.push('')

    lines.push(
      [
        '项目ID',
        '项目名称',
        '数据类型',
        '总任务数',
        '已完成',
        '准确率',
        '状态',
        '创建时间',
        '截止时间',
      ]
        .map(escapeCSV)
        .join(',')
    )

    projects.forEach((p) => {
      const projectTasks = getProjectTasks(p.id)
      const completedTasks = getProjectCompletedTasks(p.id)
      const accuracy = getProjectAccuracy(p.id, p.accuracyRate)
      lines.push(
        [
          p.id,
          p.name,
          dataTypeMap[p.dataType] ?? p.dataType,
          projectTasks.length,
          completedTasks.length,
          `${(accuracy * 100).toFixed(1)}%`,
          statusMap[p.status] ?? p.status,
          formatDateTime(p.createdAt),
          formatDate(p.deadline),
        ]
          .map(escapeCSV)
          .join(',')
      )
    })

    lines.push('')

    lines.push(
      ['月份', '标注量', '平均准确率', '平均交付天数', '退回率'].map(escapeCSV).join(',')
    )

    const months = [
      '2025-07',
      '2025-08',
      '2025-09',
      '2025-10',
      '2025-11',
      '2025-12',
      '2026-01',
      '2026-02',
      '2026-03',
      '2026-04',
      '2026-05',
      '2026-06',
    ]

    months.forEach((m) => {
      const monthTasks = tasks.filter((t) => t.createdAt.startsWith(m))
      const annotationVolume = monthTasks.reduce((s, t) => s + t.dataItems.length, 0)

      const tasksWithAccuracy = monthTasks.filter(
        (t) => t.accuracyRate !== undefined && t.accuracyRate !== null
      )
      const avgAccuracy = tasksWithAccuracy.length
        ? tasksWithAccuracy.reduce((s, t) => s + (t.accuracyRate ?? 0), 0) /
          tasksWithAccuracy.length
        : 0

      const approvedTasks = monthTasks.filter((t) => t.status === 'approved')
      const avgDeliveryDays = approvedTasks.length
        ? approvedTasks.reduce((s, t) => {
            if (!t.submittedAt) return s
            const created = new Date(t.createdAt).getTime()
            const submitted = new Date(t.submittedAt).getTime()
            return s + (submitted - created) / (1000 * 60 * 60 * 24)
          }, 0) / approvedTasks.length
        : 0

      const rejectedCount = monthTasks.filter((t) => t.status === 'rejected').length
      const reviewedCount = monthTasks.filter(
        (t) =>
          t.status === 'approved' || t.status === 'rejected' || t.status === 'reviewing'
      ).length
      const rejectRate = reviewedCount ? rejectedCount / reviewedCount : 0

      const monthDisplay = m.replace('-', '年') + '月'
      lines.push(
        [
          monthDisplay,
          annotationVolume,
          `${(avgAccuracy * 100).toFixed(1)}%`,
          `${avgDeliveryDays.toFixed(1)}天`,
          `${(rejectRate * 100).toFixed(1)}%`,
        ]
          .map(escapeCSV)
          .join(',')
      )
    })

    return '\uFEFF' + lines.join('\n')
  }

  const handleExport = () => {
    if (isExporting) return
    setIsExporting(true)
    setTimeout(() => {
      try {
        const csvContent = generateReportCSV()
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        const now = new Date()
        const timestamp =
          now.getFullYear().toString() +
          String(now.getMonth() + 1).padStart(2, '0') +
          String(now.getDate()).padStart(2, '0') +
          '_' +
          String(now.getHours()).padStart(2, '0') +
          String(now.getMinutes()).padStart(2, '0') +
          String(now.getSeconds()).padStart(2, '0')
        link.href = url
        link.download = `运营报表_${timestamp}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        setShowSuccess(true)
        setTimeout(() => {
          setShowSuccess(false)
        }, 2000)
      } finally {
        setIsExporting(false)
      }
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-primary p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">运营报告</h1>
          <p className="text-gray-400 text-sm mt-1">数据标注运营指标总览</p>
        </div>
        <div className="flex items-center gap-3">
          {showSuccess && (
            <span className="text-sm text-emerald-400">导出成功</span>
          )}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-accent text-white text-sm font-medium transition-colors',
              isExporting
                ? 'opacity-70 cursor-not-allowed'
                : 'hover:bg-primary-accent/90'
            )}
          >
            <Download className="h-4 w-4" />
            {isExporting ? '导出中...' : '导出报告'}
          </button>
        </div>
      </div>

      <div className="glass rounded-lg p-4 flex items-center gap-4">
        <Calendar className="h-4 w-4 text-primary-accent" />
        <span className="text-sm text-gray-400">日期范围</span>
        <input
          type="month"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-primary-accent/50"
        />
        <span className="text-gray-500">至</span>
        <input
          type="month"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-primary-accent/50"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={BarChart3}
          label="标注总量"
          value={metrics.totalAnnotations}
          color="#3B82F6"
        />
        <StatCard
          icon={BarChart3}
          label="平均准确率"
          value={`${(metrics.avgAccuracy * 100).toFixed(1)}%`}
          trend={metrics.avgAccuracy >= 0.85 ? 'up' : 'down'}
          trendValue={`${(metrics.avgAccuracy * 100).toFixed(1)}%`}
          color="#10B981"
        />
        <StatCard
          icon={BarChart3}
          label="交付时效"
          value={`${metrics.avgDeliveryDays.toFixed(1)}天`}
          color="#F59E0B"
        />
        <StatCard
          icon={BarChart3}
          label="退回率"
          value={`${(metrics.rejectRate * 100).toFixed(1)}%`}
          trend={metrics.rejectRate <= 0.1 ? 'up' : 'down'}
          trendValue={`${(metrics.rejectRate * 100).toFixed(1)}%`}
          color="#EF4444"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-lg p-5"
        >
          <h3 className="text-sm font-medium text-gray-300 mb-4">
            月度标注量趋势
          </h3>
          <ReactEChartsCore
            option={monthlyVolumeOption}
            style={{ height: 300 }}
            opts={{ renderer: 'svg' }}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-lg p-5"
        >
          <h3 className="text-sm font-medium text-gray-300 mb-4">
            项目准确率对比
          </h3>
          <ReactEChartsCore
            option={projectAccuracyOption}
            style={{ height: 300 }}
            opts={{ renderer: 'svg' }}
          />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-lg p-5"
      >
        <h3 className="text-sm font-medium text-gray-300 mb-4">
          交付时效雷达图
        </h3>
        <div className="max-w-lg mx-auto">
          <ReactEChartsCore
            option={radarOption}
            style={{ height: 350 }}
            opts={{ renderer: 'svg' }}
          />
        </div>
      </motion.div>
    </div>
  )
}

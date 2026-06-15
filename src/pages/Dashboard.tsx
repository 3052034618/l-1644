import { useEffect, useMemo } from 'react'
import {
  Tags,
  FolderKanban,
  Target,
  Clock,
  Users,
} from 'lucide-react'
import { motion } from 'framer-motion'
import ReactECharts from 'echarts-for-react'
import { useProjectStore } from '@/store/projectStore'
import { useTaskStore } from '@/store/taskStore'
import { useAuthStore } from '@/store/authStore'
import StatCard from '@/components/StatCard'
import { cn } from '@/lib/utils'

const CHART_THEME = {
  bgColor: 'transparent',
  textColor: '#94A3B8',
  splitLineColor: 'rgba(148, 163, 184, 0.08)',
  orange: '#FF6B35',
  orangeLight: 'rgba(255, 107, 53, 0.25)',
  blue: '#3B82F6',
  blueLight: 'rgba(59, 130, 246, 0.25)',
  green: '#10B981',
  yellow: '#F59E0B',
  purple: '#8B5CF6',
  cyan: '#06B6D4',
}

const glassCardClass = 'glass rounded-xl p-5'

function getBaseChartOption() {
  return {
    backgroundColor: CHART_THEME.bgColor,
    textStyle: { color: CHART_THEME.textColor, fontSize: 12 },
    grid: { top: 40, right: 20, bottom: 30, left: 50, containLabel: true },
  }
}

export default function Dashboard() {
  const { projects, loadProjects } = useProjectStore()
  const { tasks, loadTasks } = useTaskStore()
  const { currentUser } = useAuthStore()

  useEffect(() => {
    loadProjects()
    loadTasks()
  }, [loadProjects, loadTasks])

  const metrics = useMemo(() => {
    const totalAnnotations = projects.reduce((s, p) => s + p.completedCount, 0)
    const totalProjects = projects.length
    const avgAccuracy =
      projects.length > 0
        ? (
            (projects
              .filter((p) => p.accuracyRate > 0)
              .reduce((s, p) => s + p.accuracyRate, 0) /
              projects.filter((p) => p.accuracyRate > 0).length) *
            100
          ).toFixed(1)
        : '0.0'
    const avgDelivery =
      projects.length > 0
        ? (
            projects
              .filter((p) => p.completedCount > 0)
              .reduce((s, p) => s + (p.completedCount / p.dataCount) * 100, 0) /
              projects.filter((p) => p.completedCount > 0).length
          ).toFixed(1)
        : '0.0'
    const activeAnnotators = tasks.filter((t) => t.status === 'in_progress').length

    return [
      { icon: Tags, label: '总标注量', value: totalAnnotations.toLocaleString(), trend: 'up' as const, trendValue: '+12.5%', color: '#FF6B35' },
      { icon: FolderKanban, label: '总项目数', value: totalProjects, trend: 'up' as const, trendValue: '+2', color: '#3B82F6' },
      { icon: Target, label: '平均准确率', value: `${avgAccuracy}%`, trend: 'up' as const, trendValue: '+1.2%', color: '#10B981' },
      { icon: Clock, label: '平均交付时效', value: `${avgDelivery}%`, trend: 'down' as const, trendValue: '-0.8%', color: '#F59E0B' },
      { icon: Users, label: '活跃标注员', value: activeAnnotators, trend: 'up' as const, trendValue: '+3', color: '#8B5CF6' },
    ]
  }, [projects, tasks])

  const monthlyVolumeOption = useMemo(() => {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    const barData = [8200, 9500, 7800, 11200, 13500, 10800, 14200, 12600, 15800, 13100, 16400, 18200]
    const lineData = [8200, 9500, 7800, 11200, 13500, 10800, 14200, 12600, 15800, 13100, 16400, 18200]

    return {
      ...getBaseChartOption(),
      title: {
        text: '月度标注量',
        left: 'left',
        textStyle: { color: '#E2E8F0', fontSize: 16, fontWeight: 600 },
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        textStyle: { color: '#E2E8F0' },
      },
      legend: {
        data: ['标注量', '趋势'],
        right: 20,
        top: 5,
        textStyle: { color: CHART_THEME.textColor },
      },
      xAxis: {
        type: 'category',
        data: months,
        axisLine: { lineStyle: { color: CHART_THEME.splitLineColor } },
        axisLabel: { color: CHART_THEME.textColor },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: CHART_THEME.splitLineColor } },
        axisLabel: { color: CHART_THEME.textColor },
      },
      series: [
        {
          name: '标注量',
          type: 'bar',
          barWidth: '45%',
          data: barData,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: CHART_THEME.orange },
                { offset: 1, color: CHART_THEME.orangeLight },
              ],
            },
            borderRadius: [4, 4, 0, 0],
          },
        },
        {
          name: '趋势',
          type: 'line',
          data: lineData,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: CHART_THEME.blue, width: 2 },
          itemStyle: { color: CHART_THEME.blue },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
                { offset: 1, color: 'rgba(59, 130, 246, 0)' },
              ],
            },
          },
        },
      ],
    }
  }, [])

  const projectStatusOption = useMemo(() => {
    const statusMap: Record<string, number> = { draft: 0, active: 0, reviewing: 0, completed: 0 }
    projects.forEach((p) => {
      if (statusMap[p.status] !== undefined) statusMap[p.status]++
    })

    return {
      backgroundColor: CHART_THEME.bgColor,
      title: {
        text: '项目状态分布',
        left: 'left',
        textStyle: { color: '#E2E8F0', fontSize: 16, fontWeight: 600 },
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        textStyle: { color: '#E2E8F0' },
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        textStyle: { color: CHART_THEME.textColor, fontSize: 13 },
        itemWidth: 12,
        itemHeight: 12,
      },
      series: [
        {
          type: 'pie',
          radius: ['45%', '72%'],
          center: ['38%', '55%'],
          avoidLabelOverlap: false,
          padAngle: 3,
          itemStyle: { borderRadius: 6 },
          label: { show: false },
          emphasis: {
            label: { show: true, fontSize: 14, fontWeight: 'bold', color: '#E2E8F0' },
          },
          data: [
            { value: statusMap.draft, name: '草稿', itemStyle: { color: CHART_THEME.yellow } },
            { value: statusMap.active, name: '进行中', itemStyle: { color: CHART_THEME.orange } },
            { value: statusMap.reviewing, name: '审核中', itemStyle: { color: CHART_THEME.blue } },
            { value: statusMap.completed, name: '已完成', itemStyle: { color: CHART_THEME.green } },
          ],
        },
      ],
    }
  }, [projects])

  const accuracyTrendOption = useMemo(() => {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    const data = [91.2, 92.5, 90.8, 93.1, 94.0, 92.8, 93.5, 91.9, 94.2, 93.6, 95.1, 94.8]

    return {
      ...getBaseChartOption(),
      title: {
        text: '准确率趋势',
        left: 'left',
        textStyle: { color: '#E2E8F0', fontSize: 16, fontWeight: 600 },
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        textStyle: { color: '#E2E8F0' },
        formatter: '{b}: {c}%',
      },
      xAxis: {
        type: 'category',
        data: months,
        boundaryGap: false,
        axisLine: { lineStyle: { color: CHART_THEME.splitLineColor } },
        axisLabel: { color: CHART_THEME.textColor },
      },
      yAxis: {
        type: 'value',
        min: 88,
        max: 100,
        axisLine: { show: false },
        splitLine: { lineStyle: { color: CHART_THEME.splitLineColor } },
        axisLabel: { color: CHART_THEME.textColor, formatter: '{value}%' },
      },
      series: [
        {
          type: 'line',
          data,
          smooth: true,
          symbol: 'circle',
          symbolSize: 7,
          lineStyle: { color: CHART_THEME.green, width: 3 },
          itemStyle: { color: CHART_THEME.green, borderWidth: 2 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(16, 185, 129, 0.35)' },
                { offset: 1, color: 'rgba(16, 185, 129, 0)' },
              ],
            },
          },
          markLine: {
            silent: true,
            lineStyle: { color: '#FF6B35', type: 'dashed' },
            data: [{ yAxis: 90, label: { formatter: '目标 90%', color: '#FF6B35' } }],
          },
        },
      ],
    }
  }, [])

  const radarOption = useMemo(() => {
    return {
      backgroundColor: CHART_THEME.bgColor,
      title: {
        text: '交付时效雷达',
        left: 'left',
        textStyle: { color: '#E2E8F0', fontSize: 16, fontWeight: 600 },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        textStyle: { color: '#E2E8F0' },
      },
      radar: {
        indicator: [
          { name: '文本标注', max: 100 },
          { name: '图像标注', max: 100 },
          { name: '语音转写', max: 100 },
          { name: '视频标注', max: 100 },
          { name: '质检审核', max: 100 },
        ],
        shape: 'polygon',
        splitNumber: 4,
        axisName: { color: CHART_THEME.textColor, fontSize: 12 },
        splitLine: { lineStyle: { color: CHART_THEME.splitLineColor } },
        splitArea: { areaStyle: { color: ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.04)'] } },
        axisLine: { lineStyle: { color: CHART_THEME.splitLineColor } },
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: [88, 76, 92, 65, 85],
              name: '当前月',
              lineStyle: { color: CHART_THEME.orange, width: 2 },
              itemStyle: { color: CHART_THEME.orange },
              areaStyle: { color: 'rgba(255, 107, 53, 0.2)' },
            },
            {
              value: [80, 70, 85, 72, 78],
              name: '上月',
              lineStyle: { color: CHART_THEME.blue, width: 2, type: 'dashed' },
              itemStyle: { color: CHART_THEME.blue },
              areaStyle: { color: 'rgba(59, 130, 246, 0.1)' },
            },
          ],
        },
      ],
    }
  }, [])

  const creditDistOption = useMemo(() => {
    const ranges = ['60-69', '70-79', '80-84', '85-89', '90-94', '95-100']
    const counts = [0, 2, 2, 2, 3, 1]
    const colors = [
      '#EF4444', '#F59E0B', '#06B6D4', '#3B82F6', '#8B5CF6', '#10B981',
    ]

    return {
      ...getBaseChartOption(),
      title: {
        text: '标注员信用分分布',
        left: 'left',
        textStyle: { color: '#E2E8F0', fontSize: 16, fontWeight: 600 },
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        textStyle: { color: '#E2E8F0' },
      },
      xAxis: {
        type: 'category',
        data: ranges,
        axisLine: { lineStyle: { color: CHART_THEME.splitLineColor } },
        axisLabel: { color: CHART_THEME.textColor },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: CHART_THEME.splitLineColor } },
        axisLabel: { color: CHART_THEME.textColor },
      },
      series: [
        {
          type: 'bar',
          barWidth: '50%',
          data: counts.map((v, i) => ({
            value: v,
            itemStyle: {
              color: colors[i],
              borderRadius: [4, 4, 0, 0],
            },
          })),
        },
      ],
    }
  }, [])

  return (
    <div className="min-h-screen bg-primary bg-pattern p-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-heading font-bold text-white">
          数据看板
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          {currentUser ? `${currentUser.name}，欢迎回来` : '全局数据概览'}
        </p>
      </motion.div>

      <div className="grid grid-cols-5 gap-5 mb-5">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.08 }}
          >
            <StatCard
              icon={m.icon}
              label={m.label}
              value={m.value}
              trend={m.trend}
              trendValue={m.trendValue}
              color={m.color}
            />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-10 gap-5 mb-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className={cn(glassCardClass, 'col-span-6')}
        >
          <ReactECharts option={monthlyVolumeOption} style={{ height: 320 }} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className={cn(glassCardClass, 'col-span-4')}
        >
          <ReactECharts option={projectStatusOption} style={{ height: 320 }} />
        </motion.div>
      </div>

      <div className="grid grid-cols-2 gap-5 mb-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className={glassCardClass}
        >
          <ReactECharts option={accuracyTrendOption} style={{ height: 320 }} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className={glassCardClass}
        >
          <ReactECharts option={radarOption} style={{ height: 320 }} />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.7 }}
        className={glassCardClass}
      >
        <ReactECharts option={creditDistOption} style={{ height: 300 }} />
      </motion.div>
    </div>
  )
}

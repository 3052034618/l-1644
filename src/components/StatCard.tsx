import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  trend?: "up" | "down"
  trendValue?: string
  color?: string
}

export default function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  trendValue,
  color = "#FF6B35",
}: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 12px 32px rgba(0,0,0,0.3)" }}
      transition={{ duration: 0.2 }}
      className="glass rounded-lg p-5 flex flex-col gap-3 cursor-default"
    >
      <div className="flex items-center justify-between">
        <div
          className="h-10 w-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        {trend && trendValue && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5",
              trend === "up"
                ? "bg-success/15 text-success"
                : "bg-error/15 text-error"
            )}
          >
            {trend === "up" ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {trendValue}
          </div>
        )}
      </div>
      <div>
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-2xl font-heading font-bold mt-0.5">{value}</p>
      </div>
    </motion.div>
  )
}

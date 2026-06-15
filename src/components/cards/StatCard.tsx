import { type ReactNode } from 'react'
import Card from './Card'

interface StatCardProps {
  title: string; value: string | number; subtitle?: string; icon?: ReactNode; color?: string
}

export default function StatCard({ title, value, subtitle, icon, color = '#3B82F6' }: StatCardProps) {
  return (
    <Card hover>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-[#6B7280] dark:text-[#94A3B8] uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-[#111827] dark:text-[#F9FAFB] mt-1">{value}</p>
          {subtitle && <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-1">{subtitle}</p>}
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: color + '18', color }}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Calendar, ClipboardList, BookOpen, BarChart3 } from 'lucide-react'

const items = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Home'     },
  { to: '/kalender',    icon: Calendar,         label: 'Kalender' },
  { to: '/aufgaben',    icon: ClipboardList,    label: 'Aufgaben' },
  { to: '/noten',       icon: BookOpen,         label: 'Noten'    },
  { to: '/statistiken', icon: BarChart3,        label: 'Statistik'},
]

export default function MobileNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#111827] border-t border-[#E5E7EB] dark:border-[#334155] z-40">
      <div className="flex items-center justify-around py-2 pb-safe">
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-colors
              ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-[#6B7280] dark:text-[#94A3B8]'}`
            }
          >
            <Icon size={20} />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
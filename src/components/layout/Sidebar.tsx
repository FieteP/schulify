import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Calendar, ClipboardList, FileText,
  BookOpen, GraduationCap, Target, BarChart3,
  Calculator, Settings, ChevronLeft, ChevronRight, Flag
} from 'lucide-react'

interface SidebarProps { collapsed: boolean; onToggle: () => void }

const navItems = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard'    },
  { to: '/kalender',     icon: Calendar,         label: 'Kalender'     },
  { to: '/aufgaben',     icon: ClipboardList,    label: 'Aufgaben'     },
  { to: '/pruefungen',   icon: FileText,         label: 'Prüfungen'    },
  { to: '/noten',        icon: BookOpen,         label: 'Noten'        },
  { to: '/faecher',      icon: GraduationCap,    label: 'Fächer'       },
  { to: '/ziele',        icon: Flag,             label: 'Ziele'        },
  { to: '/dokumente',    icon: Target,           label: 'Dokumente'    },
  { to: '/statistiken',  icon: BarChart3,        label: 'Statistiken'  },
  { to: '/abitur',       icon: Calculator,       label: 'Abiturrechner'},
  { to: '/einstellungen',icon: Settings,         label: 'Einstellungen'},
]

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside className="h-full flex flex-col bg-white dark:bg-[#111827] border-r border-[#E5E7EB] dark:border-[#334155]">
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-[#E5E7EB] dark:border-[#334155]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm shadow-blue-500/25">
            S
          </div>
          {!collapsed && (
            <span className="text-lg font-bold text-[#111827] dark:text-[#F9FAFB]">Schulify</span>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto no-scrollbar">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
              ${isActive
                ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                : 'text-[#6B7280] dark:text-[#94A3B8] hover:bg-gray-50 dark:hover:bg-white/5 hover:text-[#111827] dark:hover:text-[#F9FAFB]'
              }`
            }
          >
            <Icon size={20} className="shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Toggle */}
      <div className="p-3 border-t border-[#E5E7EB] dark:border-[#334155]">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center p-2 rounded-xl text-[#6B7280] dark:text-[#94A3B8] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
    </aside>
  )
}
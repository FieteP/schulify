import { useState } from 'react'
import { Menu, Search, X, LogOut } from 'lucide-react'
import { useSettingsStore } from '../../store/settingsStore'
import { useAuthStore } from '../../store/authStore'

interface TopBarProps { onMenuClick: () => void }

export default function TopBar({ onMenuClick }: TopBarProps) {
  const currentSemester = useSettingsStore(s => s.currentSemester)
  const userName        = useSettingsStore(s => s.userName)
  const signOut         = useAuthStore(s => s.signOut)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery]           = useState('')

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#111827] shrink-0">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="lg:hidden p-2 rounded-xl text-[#6B7280] hover:bg-gray-50 dark:hover:bg-white/5">
          <Menu size={20} />
        </button>
        <div>
          <p className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB]">
            {userName ? `Hallo, ${userName}` : 'Willkommen'}
          </p>
          <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">Semester {currentSemester}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative">
          <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 rounded-xl text-[#6B7280] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
            <Search size={20} />
          </button>
          {searchOpen && (
            <div className="absolute right-0 top-12 w-72 bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-2xl shadow-lg z-50 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3">
                <Search size={16} className="text-[#6B7280]" />
                <input
                  autoFocus
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Suchen..."
                  className="flex-1 bg-transparent text-sm outline-none text-[#111827] dark:text-[#F9FAFB] placeholder:text-[#6B7280]"
                />
                <button onClick={() => { setSearchOpen(false); setQuery('') }}>
                  <X size={16} className="text-[#6B7280]" />
                </button>
              </div>
              <div className="px-4 py-3 text-xs text-[#6B7280] dark:text-[#94A3B8] border-t border-[#E5E7EB] dark:border-[#334155]">
                Tippe um zu suchen...
              </div>
            </div>
          )}
        </div>

        {/* Semester Badge */}
        <div className="hidden md:flex items-center px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-semibold">
          {currentSemester}
        </div>

        {/* Sign Out */}
        <button
          onClick={signOut}
          title="Abmelden"
          className="p-2 rounded-xl text-[#6B7280] hover:bg-gray-50 dark:hover:bg-white/5 hover:text-red-500 transition-colors"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  )
}
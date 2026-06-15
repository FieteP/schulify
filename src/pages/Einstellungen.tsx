import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sun, Moon, Monitor, User, School, BarChart3, Shield, LogOut } from 'lucide-react'
import { useSettingsStore } from '../store/settingsStore'
import { useAuthStore }     from '../store/authStore'
import { Semester, GradeType } from '../types'
import Card from '../components/cards/Card'
import Input from '../components/forms/Input'
import Button from '../components/forms/Button'

export default function Einstellungen() {
  const { theme, currentSemester, userName, schoolName, gradeWeights, patch } = useSettingsStore()
  const { user, signOut } = useAuthStore()
  const [localName, setLocalName]   = useState(userName)
  const [localSchool, setLocalSchool] = useState(schoolName)

  const save = () => {
    if (!user) return
    patch(user.id, { userName: localName, schoolName: localSchool })
  }

  const themes: { value: 'light' | 'dark' | 'system'; label: string; icon: typeof Sun }[] = [
    { value: 'light',  label: 'Hell',   icon: Sun     },
    { value: 'dark',   label: 'Dunkel', icon: Moon    },
    { value: 'system', label: 'System', icon: Monitor },
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-[#111827] dark:text-[#F9FAFB]">Einstellungen</h1>

      {/* Profile */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <User size={18} className="text-[#6B7280]" />
          <h2 className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB]">Profil</h2>
        </div>
        <div className="space-y-4">
          <p className="text-xs text-[#6B7280] bg-gray-50 dark:bg-white/5 rounded-xl px-4 py-2">{user?.email}</p>
          <Input label="Name" value={localName} onChange={e => setLocalName(e.target.value)} placeholder="Dein Name" />
          <Input label="Schule" value={localSchool} onChange={e => setLocalSchool(e.target.value)} placeholder="Name deiner Schule" />
          <Button onClick={save}>Speichern</Button>
        </div>
      </Card>

      {/* Semester */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <School size={18} className="text-[#6B7280]" />
          <h2 className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB]">Aktuelles Semester</h2>
        </div>
        <div className="flex gap-2">
          {(['11.1','11.2','12.1','12.2'] as Semester[]).map(sem => (
            <button key={sem} onClick={() => user && patch(user.id, { currentSemester: sem })}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${currentSemester === sem ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-white/10 text-[#6B7280]'}`}>
              {sem}
            </button>
          ))}
        </div>
      </Card>

      {/* Theme */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Sun size={18} className="text-[#6B7280]" />
          <h2 className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB]">Erscheinungsbild</h2>
        </div>
        <div className="flex gap-3">
          {themes.map(({ value, label, icon: Icon }) => (
            <button key={value} onClick={() => user && patch(user.id, { theme: value })}
              className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-xl transition-all ${theme === value ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500' : 'bg-gray-50 dark:bg-white/5 text-[#6B7280] hover:bg-gray-100 dark:hover:bg-white/10'}`}>
              <Icon size={24} />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Grade Weights */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 size={18} className="text-[#6B7280]" />
          <h2 className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB]">Notengewichtung</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(Object.entries(gradeWeights) as [GradeType, number][]).map(([key, value]) => (
            <div key={key} className="space-y-1">
              <label className="text-xs text-[#6B7280]">{key}</label>
              <input type="number" min={0.5} max={5} step={0.5} value={value}
                onChange={e => user && patch(user.id, { gradeWeights: { ...gradeWeights, [key]: parseFloat(e.target.value) } })}
                className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-[#F8F9FB] dark:bg-[#0F172A] text-sm text-[#111827] dark:text-[#F9FAFB] text-center" />
            </div>
          ))}
        </div>
      </Card>

      {/* Account */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Shield size={18} className="text-[#6B7280]" />
          <h2 className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB]">Konto</h2>
        </div>
        <div className="space-y-3">
          <p className="text-xs text-[#6B7280]">Alle Daten werden sicher in der Cloud gespeichert und sind auf allen Geräten verfügbar.</p>
          <Button variant="danger" icon={<LogOut size={16} />} onClick={signOut} className="w-full">
            Abmelden
          </Button>
        </div>
      </Card>

      <Card>
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">S</div>
          <h3 className="text-lg font-bold text-[#111827] dark:text-[#F9FAFB]">Schulify</h3>
          <p className="text-xs text-[#6B7280] mt-1">Premium Oberstufenplaner · Version 2.0</p>
          <p className="text-xs text-[#6B7280] mt-2">Cloud-synchronisiert · Alle Geräte · Kein Datenverlust</p>
        </div>
      </Card>
    </motion.div>
  )
}
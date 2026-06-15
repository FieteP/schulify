import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { Settings, Semester, GradeType } from '../types'

const DEFAULT: Settings = {
  theme: 'dark',
  currentSemester: '11.1',
  schoolName: '',
  userName: '',
  gradeWeights: {
    Klausur:2, Mündlich:1, Referat:1,
    Projekt:1, Mitarbeit:1, Test:1, Sonstige:1
  } as Record<GradeType, number>,
  dashboardWidgets: [
    'average','semester','bestSubjects','worstSubjects',
    'nextExams','tasks','goals','statistics'
  ],
}

interface SettingsState extends Settings {
  loading: boolean
  fetch: (userId: string) => Promise<void>
  patch: (userId: string, updates: Partial<Settings>) => Promise<void>
  setThemeLocal: (theme: Settings['theme']) => void
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULT,
  loading: false,

  fetch: async (userId) => {
    set({ loading: true })
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (data) {
      set({
        userName: data.user_name,
        schoolName: data.school_name,
        currentSemester: data.current_semester as Semester,
        theme: data.theme as Settings['theme'],
        gradeWeights: data.grade_weights as Record<GradeType, number>,
        dashboardWidgets: data.dashboard_widgets,
      })
      applyTheme(data.theme)
    }
    set({ loading: false })
  },

  patch: async (userId, updates) => {
    const mapped: Record<string, unknown> = {}
    if (updates.userName       !== undefined) mapped.user_name         = updates.userName
    if (updates.schoolName     !== undefined) mapped.school_name       = updates.schoolName
    if (updates.currentSemester !== undefined) mapped.current_semester = updates.currentSemester
    if (updates.theme          !== undefined) { mapped.theme           = updates.theme; applyTheme(updates.theme) }
    if (updates.gradeWeights   !== undefined) mapped.grade_weights     = updates.gradeWeights
    if (updates.dashboardWidgets !== undefined) mapped.dashboard_widgets = updates.dashboardWidgets

    set(updates as Partial<Settings>)
    await supabase.from('profiles').update(mapped).eq('id', userId)
  },

  setThemeLocal: (theme) => {
    set({ theme })
    applyTheme(theme)
  },
}))

function applyTheme(theme: string) {
  if (theme === 'system') {
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches
    document.body.className = dark ? 'dark' : 'light'
  } else {
    document.body.className = theme
  }
}
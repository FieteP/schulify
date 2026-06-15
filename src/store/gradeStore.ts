import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { Grade, GradeType, Semester } from '../types'
import type { GradeRow } from '../lib/supabase'

function rowToGrade(r: GradeRow): Grade {
  return {
    id: r.id, subjectId: r.subject_id, semester: r.semester as Semester,
    type: r.type as GradeType, points: r.points, weight: r.weight,
    date: r.date, description: r.description, notes: r.notes,
  }
}

interface GradeState {
  grades: Grade[]
  loading: boolean
  fetch: (userId: string) => Promise<void>
  add: (userId: string, g: Omit<Grade, 'id'>) => Promise<void>
  update: (id: string, updates: Partial<Grade>) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useGradeStore = create<GradeState>((set, get) => ({
  grades: [],
  loading: false,

  fetch: async (userId) => {
    set({ loading: true })
    const { data } = await supabase
      .from('grades').select('*').eq('user_id', userId).order('date', { ascending: false })
    set({ grades: (data ?? []).map(rowToGrade), loading: false })
  },

  add: async (userId, g) => {
    const { data } = await supabase.from('grades').insert({
      user_id: userId, subject_id: g.subjectId, semester: g.semester,
      type: g.type, points: g.points, weight: g.weight, date: g.date,
      description: g.description, notes: g.notes,
    }).select().single()
    if (data) set({ grades: [rowToGrade(data), ...get().grades] })
  },

  update: async (id, u) => {
    const mapped: Record<string, unknown> = {}
    if (u.points      !== undefined) mapped.points      = u.points
    if (u.type        !== undefined) mapped.type        = u.type
    if (u.weight      !== undefined) mapped.weight      = u.weight
    if (u.date        !== undefined) mapped.date        = u.date
    if (u.description !== undefined) mapped.description = u.description
    if (u.notes       !== undefined) mapped.notes       = u.notes

    const { data } = await supabase.from('grades').update(mapped).eq('id', id).select().single()
    if (data) set({ grades: get().grades.map(g => g.id === id ? rowToGrade(data) : g) })
  },

  remove: async (id) => {
    await supabase.from('grades').delete().eq('id', id)
    set({ grades: get().grades.filter(g => g.id !== id) })
  },
}))
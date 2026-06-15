import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { Goal, Semester } from '../types'
import type { GoalRow } from '../lib/supabase'

function rowToGoal(r: GoalRow): Goal {
  return {
    id: r.id, subjectId: r.subject_id ?? undefined, title: r.title,
    targetPoints: r.target_points, currentPoints: r.current_points ?? undefined,
    semester: r.semester as Semester, deadline: r.deadline ?? undefined,
    achieved: r.achieved,
  }
}

interface GoalState {
  goals: Goal[]
  loading: boolean
  fetch: (userId: string) => Promise<void>
  add: (userId: string, g: Omit<Goal, 'id'>) => Promise<void>
  update: (id: string, updates: Partial<Goal>) => Promise<void>
  toggle: (id: string) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: [],
  loading: false,

  fetch: async (userId) => {
    set({ loading: true })
    const { data } = await supabase
      .from('goals').select('*').eq('user_id', userId).order('created_at')
    set({ goals: (data ?? []).map(rowToGoal), loading: false })
  },

  add: async (userId, g) => {
    const { data } = await supabase.from('goals').insert({
      user_id: userId, subject_id: g.subjectId ?? null, title: g.title,
      target_points: g.targetPoints, current_points: g.currentPoints ?? null,
      semester: g.semester, deadline: g.deadline ?? null, achieved: g.achieved,
    }).select().single()
    if (data) set({ goals: [...get().goals, rowToGoal(data)] })
  },

  update: async (id, u) => {
    const mapped: Record<string, unknown> = {}
    if (u.title         !== undefined) mapped.title          = u.title
    if (u.targetPoints  !== undefined) mapped.target_points  = u.targetPoints
    if (u.currentPoints !== undefined) mapped.current_points = u.currentPoints
    if (u.achieved      !== undefined) mapped.achieved       = u.achieved
    if (u.deadline      !== undefined) mapped.deadline       = u.deadline ?? null

    const { data } = await supabase.from('goals').update(mapped).eq('id', id).select().single()
    if (data) set({ goals: get().goals.map(g => g.id === id ? rowToGoal(data) : g) })
  },

  toggle: async (id) => {
    const goal = get().goals.find(g => g.id === id)
    if (!goal) return
    await get().update(id, { achieved: !goal.achieved })
  },

  remove: async (id) => {
    await supabase.from('goals').delete().eq('id', id)
    set({ goals: get().goals.filter(g => g.id !== id) })
  },
}))
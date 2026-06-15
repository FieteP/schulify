import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { Exam, Semester } from '../types'
import type { ExamRow } from '../lib/supabase'

function rowToExam(r: ExamRow): Exam {
  return {
    id: r.id, subjectId: r.subject_id, semester: r.semester as Semester,
    date: r.date, time: r.time, duration: r.duration, room: r.room,
    topics: r.topics, description: r.description,
    grade: r.grade ?? undefined, status: r.status as Exam['status'], notes: r.notes,
  }
}

interface ExamState {
  exams: Exam[]
  loading: boolean
  fetch: (userId: string) => Promise<void>
  add: (userId: string, e: Omit<Exam, 'id'>) => Promise<void>
  update: (id: string, updates: Partial<Exam>) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useExamStore = create<ExamState>((set, get) => ({
  exams: [],
  loading: false,

  fetch: async (userId) => {
    set({ loading: true })
    const { data } = await supabase
      .from('exams').select('*').eq('user_id', userId).order('date')
    set({ exams: (data ?? []).map(rowToExam), loading: false })
  },

  add: async (userId, e) => {
    const { data } = await supabase.from('exams').insert({
      user_id: userId, subject_id: e.subjectId, semester: e.semester,
      date: e.date, time: e.time, duration: e.duration, room: e.room,
      topics: e.topics, description: e.description,
      grade: e.grade ?? null, status: e.status, notes: e.notes,
    }).select().single()
    if (data) set({ exams: [...get().exams, rowToExam(data)].sort((a,b)=>a.date.localeCompare(b.date)) })
  },

  update: async (id, u) => {
    const mapped: Record<string, unknown> = {}
    if (u.date        !== undefined) mapped.date        = u.date
    if (u.time        !== undefined) mapped.time        = u.time
    if (u.duration    !== undefined) mapped.duration    = u.duration
    if (u.room        !== undefined) mapped.room        = u.room
    if (u.topics      !== undefined) mapped.topics      = u.topics
    if (u.description !== undefined) mapped.description = u.description
    if (u.grade       !== undefined) mapped.grade       = u.grade ?? null
    if (u.status      !== undefined) mapped.status      = u.status
    if (u.notes       !== undefined) mapped.notes       = u.notes

    const { data } = await supabase.from('exams').update(mapped).eq('id', id).select().single()
    if (data) set({ exams: get().exams.map(e => e.id === id ? rowToExam(data) : e) })
  },

  remove: async (id) => {
    await supabase.from('exams').delete().eq('id', id)
    set({ exams: get().exams.filter(e => e.id !== id) })
  },
}))
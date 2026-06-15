import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { Subject, CourseType, Semester } from '../types'
import type { SubjectRow } from '../lib/supabase'

function rowToSubject(r: SubjectRow): Subject {
  return {
    id: r.id,
    name: r.name,
    shortName: r.short_name,
    color: r.color,
    teacher: r.teacher,
    room: r.room,
    courseType: r.course_type as CourseType,
    semester: r.semester as Semester[],
    isAbiSubject: r.is_abi_subject,
    abiType: r.abi_type as Subject['abiType'],
    targetGrade: r.target_grade ?? undefined,
    notes: r.notes,
  }
}

interface SubjectState {
  subjects: Subject[]
  loading: boolean
  fetch: (userId: string) => Promise<void>
  add: (userId: string, s: Omit<Subject, 'id'>) => Promise<void>
  update: (id: string, updates: Partial<Subject>) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useSubjectStore = create<SubjectState>((set, get) => ({
  subjects: [],
  loading: false,

  fetch: async (userId) => {
    set({ loading: true })
    const { data } = await supabase
      .from('subjects')
      .select('*')
      .eq('user_id', userId)
      .order('name')
    set({ subjects: (data ?? []).map(rowToSubject), loading: false })
  },

  add: async (userId, s) => {
    const { data } = await supabase.from('subjects').insert({
      user_id: userId,
      name: s.name, short_name: s.shortName, color: s.color,
      teacher: s.teacher, room: s.room, course_type: s.courseType,
      semester: s.semester, is_abi_subject: s.isAbiSubject,
      abi_type: s.abiType ?? null, target_grade: s.targetGrade ?? null,
      notes: s.notes,
    }).select().single()
    if (data) set({ subjects: [...get().subjects, rowToSubject(data)] })
  },

  update: async (id, updates) => {
    const mapped: Record<string, unknown> = {}
    if (updates.name          !== undefined) mapped.name           = updates.name
    if (updates.shortName     !== undefined) mapped.short_name     = updates.shortName
    if (updates.color         !== undefined) mapped.color          = updates.color
    if (updates.teacher       !== undefined) mapped.teacher        = updates.teacher
    if (updates.room          !== undefined) mapped.room           = updates.room
    if (updates.courseType    !== undefined) mapped.course_type    = updates.courseType
    if (updates.semester      !== undefined) mapped.semester       = updates.semester
    if (updates.isAbiSubject  !== undefined) mapped.is_abi_subject = updates.isAbiSubject
    if (updates.abiType       !== undefined) mapped.abi_type       = updates.abiType ?? null
    if (updates.targetGrade   !== undefined) mapped.target_grade   = updates.targetGrade ?? null
    if (updates.notes         !== undefined) mapped.notes          = updates.notes

    const { data } = await supabase.from('subjects').update(mapped).eq('id', id).select().single()
    if (data) set({ subjects: get().subjects.map(s => s.id === id ? rowToSubject(data) : s) })
  },

  remove: async (id) => {
    await supabase.from('subjects').delete().eq('id', id)
    set({ subjects: get().subjects.filter(s => s.id !== id) })
  },
}))
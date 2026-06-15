import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { Task, TaskPriority, TaskStatus, Semester } from '../types'
import type { TaskRow } from '../lib/supabase'

function rowToTask(r: TaskRow): Task {
  return {
    id: r.id, subjectId: r.subject_id ?? undefined, title: r.title,
    description: r.description, dueDate: r.due_date,
    priority: r.priority as TaskPriority, status: r.status as TaskStatus,
    semester: r.semester as Semester, category: r.category, notes: r.notes,
  }
}

interface TaskState {
  tasks: Task[]
  loading: boolean
  fetch: (userId: string) => Promise<void>
  add: (userId: string, t: Omit<Task, 'id'>) => Promise<void>
  update: (id: string, updates: Partial<Task>) => Promise<void>
  toggle: (id: string) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: false,

  fetch: async (userId) => {
    set({ loading: true })
    const { data } = await supabase
      .from('tasks').select('*').eq('user_id', userId).order('due_date')
    set({ tasks: (data ?? []).map(rowToTask), loading: false })
  },

  add: async (userId, t) => {
    const { data } = await supabase.from('tasks').insert({
      user_id: userId, subject_id: t.subjectId ?? null, title: t.title,
      description: t.description, due_date: t.dueDate, priority: t.priority,
      status: t.status, semester: t.semester, category: t.category, notes: t.notes,
    }).select().single()
    if (data) set({ tasks: [...get().tasks, rowToTask(data)] })
  },

  update: async (id, u) => {
    const mapped: Record<string, unknown> = {}
    if (u.title       !== undefined) mapped.title      = u.title
    if (u.description !== undefined) mapped.description = u.description
    if (u.dueDate     !== undefined) mapped.due_date   = u.dueDate
    if (u.priority    !== undefined) mapped.priority   = u.priority
    if (u.status      !== undefined) mapped.status     = u.status
    if (u.category    !== undefined) mapped.category   = u.category

    const { data } = await supabase.from('tasks').update(mapped).eq('id', id).select().single()
    if (data) set({ tasks: get().tasks.map(t => t.id === id ? rowToTask(data) : t) })
  },

  toggle: async (id) => {
    const task = get().tasks.find(t => t.id === id)
    if (!task) return
    const newStatus: TaskStatus = task.status === 'Erledigt' ? 'Offen' : 'Erledigt'
    await get().update(id, { status: newStatus })
  },

  remove: async (id) => {
    await supabase.from('tasks').delete().eq('id', id)
    set({ tasks: get().tasks.filter(t => t.id !== id) })
  },
}))
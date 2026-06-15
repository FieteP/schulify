import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { CalendarEvent } from '../types'
import type { CalendarEventRow } from '../lib/supabase'

function rowToEvent(r: CalendarEventRow): CalendarEvent {
  return {
    id: r.id, title: r.title, date: r.date, endDate: r.end_date ?? undefined,
    time: r.time ?? undefined, endTime: r.end_time ?? undefined,
    type: r.type as CalendarEvent['type'], subjectId: r.subject_id ?? undefined,
    color: r.color ?? undefined, description: r.description, allDay: r.all_day,
  }
}

interface CalendarState {
  events: CalendarEvent[]
  loading: boolean
  fetch: (userId: string) => Promise<void>
  add: (userId: string, e: Omit<CalendarEvent, 'id'>) => Promise<void>
  update: (id: string, updates: Partial<CalendarEvent>) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  events: [],
  loading: false,

  fetch: async (userId) => {
    set({ loading: true })
    const { data } = await supabase
      .from('calendar_events').select('*').eq('user_id', userId).order('date')
    set({ events: (data ?? []).map(rowToEvent), loading: false })
  },

  add: async (userId, e) => {
    const { data } = await supabase.from('calendar_events').insert({
      user_id: userId, title: e.title, date: e.date, end_date: e.endDate ?? null,
      time: e.time ?? null, end_time: e.endTime ?? null, type: e.type,
      subject_id: e.subjectId ?? null, color: e.color ?? null,
      description: e.description, all_day: e.allDay,
    }).select().single()
    if (data) set({ events: [...get().events, rowToEvent(data)] })
  },

  update: async (id, u) => {
    const mapped: Record<string, unknown> = {}
    if (u.title       !== undefined) mapped.title       = u.title
    if (u.date        !== undefined) mapped.date        = u.date
    if (u.description !== undefined) mapped.description = u.description
    if (u.type        !== undefined) mapped.type        = u.type

    const { data } = await supabase.from('calendar_events').update(mapped).eq('id', id).select().single()
    if (data) set({ events: get().events.map(ev => ev.id === id ? rowToEvent(data) : ev) })
  },

  remove: async (id) => {
    await supabase.from('calendar_events').delete().eq('id', id)
    set({ events: get().events.filter(ev => ev.id !== id) })
  },
}))
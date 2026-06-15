import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase env vars fehlen! Prüfe .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
})

export type Database = {
  public: {
    Tables: {
      profiles:        { Row: ProfileRow }
      subjects:        { Row: SubjectRow }
      grades:          { Row: GradeRow }
      exams:           { Row: ExamRow }
      tasks:           { Row: TaskRow }
      calendar_events: { Row: CalendarEventRow }
      documents:       { Row: DocumentRow }
      goals:           { Row: GoalRow }
    }
  }
}

export interface ProfileRow {
  id: string
  user_name: string
  school_name: string
  current_semester: string
  theme: string
  grade_weights: Record<string, number>
  dashboard_widgets: string[]
  created_at: string
  updated_at: string
}

export interface SubjectRow {
  id: string; user_id: string; name: string; short_name: string
  color: string; teacher: string; room: string; course_type: string
  semester: string[]; is_abi_subject: boolean; abi_type: string | null
  target_grade: number | null; notes: string
  created_at: string; updated_at: string
}

export interface GradeRow {
  id: string; user_id: string; subject_id: string; semester: string
  type: string; points: number; weight: number; date: string
  description: string; notes: string; created_at: string; updated_at: string
}

export interface ExamRow {
  id: string; user_id: string; subject_id: string; semester: string
  date: string; time: string; duration: number; room: string
  topics: string[]; description: string; grade: number | null
  status: string; notes: string; created_at: string; updated_at: string
}

export interface TaskRow {
  id: string; user_id: string; subject_id: string | null; title: string
  description: string; due_date: string; priority: string; status: string
  semester: string; category: string; notes: string
  created_at: string; updated_at: string
}

export interface CalendarEventRow {
  id: string; user_id: string; title: string; date: string
  end_date: string | null; time: string | null; end_time: string | null
  type: string; subject_id: string | null; color: string | null
  description: string; all_day: boolean; created_at: string; updated_at: string
}

export interface DocumentRow {
  id: string; user_id: string; name: string; subject_id: string | null
  semester: string | null; category: string; content: string
  tags: string[]; created_at: string; updated_at: string
}

export interface GoalRow {
  id: string; user_id: string; subject_id: string | null; title: string
  target_points: number; current_points: number | null; semester: string
  deadline: string | null; achieved: boolean; created_at: string; updated_at: string
}
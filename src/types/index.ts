export type Semester = '11.1' | '11.2' | '12.1' | '12.2'
export type CourseType = 'GK' | 'LK' | 'Seminar' | 'Wahl'
export type GradeType = 'Klausur' | 'Mündlich' | 'Referat' | 'Projekt' | 'Mitarbeit' | 'Test' | 'Sonstige'
export type TaskPriority = 'Hoch' | 'Mittel' | 'Niedrig'
export type TaskStatus = 'Offen' | 'In Bearbeitung' | 'Erledigt'

export interface Subject {
  id: string; name: string; shortName: string; color: string
  teacher: string; room: string; courseType: CourseType
  semester: Semester[]; isAbiSubject: boolean
  abiType?: 'schriftlich' | 'mündlich'; targetGrade?: number; notes: string
}

export interface Grade {
  id: string; subjectId: string; semester: Semester; type: GradeType
  points: number; weight: number; date: string; description: string; notes: string
}

export interface Exam {
  id: string; subjectId: string; semester: Semester; date: string
  time: string; duration: number; room: string; topics: string[]
  description: string; grade?: number; status: 'Ausstehend' | 'Geschrieben' | 'Benotet'; notes: string
}

export interface Task {
  id: string; subjectId?: string; title: string; description: string
  dueDate: string; priority: TaskPriority; status: TaskStatus
  semester: Semester; category: string; notes: string
}

export interface CalendarEvent {
  id: string; title: string; date: string; endDate?: string
  time?: string; endTime?: string; type: 'Klausur' | 'Aufgabe' | 'Termin' | 'Ferien' | 'Sonstige'
  subjectId?: string; color?: string; description: string; allDay: boolean
}

export interface Document {
  id: string; name: string; subjectId?: string; semester?: Semester
  category: string; content: string; createdAt: string; updatedAt: string; tags: string[]
  filePath?: string; fileName?: string; fileSize?: number; fileType?: string
}

export interface Goal {
  id: string; subjectId?: string; title: string; targetPoints: number
  currentPoints?: number; semester: Semester; deadline?: string; achieved: boolean
}

export interface Settings {
  theme: 'light' | 'dark' | 'system'; currentSemester: Semester
  schoolName: string; userName: string
  gradeWeights: Record<GradeType, number>; dashboardWidgets: string[]
}
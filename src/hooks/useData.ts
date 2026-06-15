// Zentraler Hook: lädt alle Stores nach Login
import { useEffect } from 'react'
import { useAuthStore }     from '../store/authStore'
import { useSettingsStore }  from '../store/settingsStore'
import { useSubjectStore }   from '../store/subjectStore'
import { useGradeStore }     from '../store/gradeStore'
import { useExamStore }      from '../store/examStore'
import { useTaskStore }      from '../store/taskStore'
import { useCalendarStore }  from '../store/calendarStore'
import { useDocumentStore }  from '../store/documentStore'
import { useGoalStore }      from '../store/goalStore'

export function useData() {
  const user = useAuthStore(s => s.user)

  const fetchSettings  = useSettingsStore(s => s.fetch)
  const fetchSubjects  = useSubjectStore(s => s.fetch)
  const fetchGrades    = useGradeStore(s => s.fetch)
  const fetchExams     = useExamStore(s => s.fetch)
  const fetchTasks     = useTaskStore(s => s.fetch)
  const fetchCalendar  = useCalendarStore(s => s.fetch)
  const fetchDocuments = useDocumentStore(s => s.fetch)
  const fetchGoals     = useGoalStore(s => s.fetch)

  useEffect(() => {
    if (!user) return
    const id = user.id
    fetchSettings(id)
    fetchSubjects(id)
    fetchGrades(id)
    fetchExams(id)
    fetchTasks(id)
    fetchCalendar(id)
    fetchDocuments(id)
    fetchGoals(id)
  }, [user])
}
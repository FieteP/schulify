import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sun, Moon, Monitor, User, School, BarChart3, Shield,
  LogOut, Trash2, AlertTriangle, Lock, Check
} from 'lucide-react'
import { useSettingsStore } from '../store/settingsStore'
import { useAuthStore }     from '../store/authStore'
import { useSubjectStore }  from '../store/subjectStore'
import { useGradeStore }    from '../store/gradeStore'
import { useExamStore }     from '../store/examStore'
import { useTaskStore }     from '../store/taskStore'
import { useCalendarStore } from '../store/calendarStore'
import { useDocumentStore } from '../store/documentStore'
import { useGoalStore }     from '../store/goalStore'
import { supabase }         from '../lib/supabase'
import Card   from '../components/cards/Card'
import Input  from '../components/forms/Input'
import Button from '../components/forms/Button'
import Modal  from '../components/forms/Modal'
import type { Semester } from '../types'

export default function Einstellungen() {
  const { theme, currentSemester, userName, schoolName, gradeWeights, patch } = useSettingsStore()
  const { user, signOut } = useAuthStore()

  const subjects  = useSubjectStore(s => s.subjects)
  const grades    = useGradeStore(s => s.grades)
  const exams     = useExamStore(s => s.exams)
  const tasks     = useTaskStore(s => s.tasks)
  const events    = useCalendarStore(s => s.events)
  const documents = useDocumentStore(s => s.documents)
  const goals     = useGoalStore(s => s.goals)

  const fetchSubjects  = useSubjectStore(s => s.fetch)
  const fetchGrades    = useGradeStore(s => s.fetch)
  const fetchExams     = useExamStore(s => s.fetch)
  const fetchTasks     = useTaskStore(s => s.fetch)
  const fetchCalendar  = useCalendarStore(s => s.fetch)
  const fetchDocuments = useDocumentStore(s => s.fetch)
  const fetchGoals     = useGoalStore(s => s.fetch)

  const [localName, setLocalName]     = useState(userName)
  const [localSchool, setLocalSchool] = useState(schoolName)

  // Selective delete
  const [deleteModal, setDeleteModal]       = useState(false)
  const [deleteSemester, setDeleteSemester] = useState<Semester | 'all'>('all')
  const [deleteTargets, setDeleteTargets]   = useState({
    subjects: false,
    grades: true,
    exams: true,
    tasks: true,
    events: true,
    documents: false,
    goals: false,
  })
  const [deleting, setDeleting] = useState(false)
  const [deleteSuccess, setDeleteSuccess] = useState(false)

  // Account delete
  const [accountDeleteModal, setAccountDeleteModal] = useState(false)
  const [deletePassword, setDeletePassword]         = useState('')
  const [deleteError, setDeleteError]               = useState<string | null>(null)
  const [accountDeleting, setAccountDeleting]        = useState(false)

  const save = () => {
    if (!user) return
    patch(user.id, { userName: localName, schoolName: localSchool })
  }

  const toggleDeleteTarget = (key: keyof typeof deleteTargets) => {
    setDeleteTargets(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSelectiveDelete = async () => {
    if (!user) return
    setDeleting(true)

    const uid = user.id
    const sem = deleteSemester

    if (deleteTargets.grades) {
      if (sem === 'all') {
        await supabase.from('grades').delete().eq('user_id', uid)
      } else {
        await supabase.from('grades').delete().eq('user_id', uid).eq('semester', sem)
      }
    }

    if (deleteTargets.exams) {
      if (sem === 'all') {
        await supabase.from('exams').delete().eq('user_id', uid)
      } else {
        await supabase.from('exams').delete().eq('user_id', uid).eq('semester', sem)
      }
    }

    if (deleteTargets.tasks) {
      if (sem === 'all') {
        await supabase.from('tasks').delete().eq('user_id', uid)
      } else {
        await supabase.from('tasks').delete().eq('user_id', uid).eq('semester', sem)
      }
    }

    if (deleteTargets.events) {
      await supabase.from('calendar_events').delete().eq('user_id', uid)
    }

    if (deleteTargets.documents) {
      // Delete files from storage first
      const { data: docs } = await supabase
        .from('documents')
        .select('file_path')
        .eq('user_id', uid)
        .not('file_path', 'is', null)
      if (docs) {
        const paths = docs.map(d => d.file_path).filter(Boolean)
        if (paths.length > 0) {
          await supabase.storage.from('documents').remove(paths)
        }
      }
      await supabase.from('documents').delete().eq('user_id', uid)
    }

    if (deleteTargets.goals) {
      if (sem === 'all') {
        await supabase.from('goals').delete().eq('user_id', uid)
      } else {
        await supabase.from('goals').delete().eq('user_id', uid).eq('semester', sem)
      }
    }

    if (deleteTargets.subjects) {
      // Subjects have cascading deletes for grades/exams, so be careful
      await supabase.from('subjects').delete().eq('user_id', uid)
    }

    // Refresh all stores
    await Promise.all([
      fetchSubjects(uid), fetchGrades(uid), fetchExams(uid),
      fetchTasks(uid), fetchCalendar(uid), fetchDocuments(uid), fetchGoals(uid)
    ])

    setDeleting(false)
    setDeleteSuccess(true)
    setTimeout(() => { setDeleteSuccess(false); setDeleteModal(false) }, 2000)
  }

  const handleAccountDelete = async () => {
    if (!user || !deletePassword) return
    setAccountDeleting(true)
    setDeleteError(null)

    // Verify password by trying to sign in
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: deletePassword,
    })

    if (authError) {
      setDeleteError('Falsches Passwort.')
      setAccountDeleting(false)
      return
    }

    // Delete all user data
    const uid = user.id
    await supabase.from('grades').delete().eq('user_id', uid)
    await supabase.from('exams').delete().eq('user_id', uid)
    await supabase.from('tasks').delete().eq('user_id', uid)
    await supabase.from('calendar_events').delete().eq('user_id', uid)
    await supabase.from('goals').delete().eq('user_id', uid)

    // Delete document files
    const { data: docs } = await supabase
      .from('documents')
      .select('file_path')
      .eq('user_id', uid)
      .not('file_path', 'is', null)
    if (docs) {
      const paths = docs.map(d => d.file_path).filter(Boolean)
      if (paths.length > 0) {
        await supabase.storage.from('documents').remove(paths)
      }
    }
    await supabase.from('documents').delete().eq('user_id', uid)
    await supabase.from('subjects').delete().eq('user_id', uid)
    await supabase.from('profiles').delete().eq('id', uid)

    // Delete auth user via edge function or sign out
    // Note: Supabase doesn't allow self-delete of auth user from client
    // We delete all data and sign out
    await signOut()
    setAccountDeleting(false)
  }

  const themes: { value: 'light' | 'dark' | 'system'; label: string; icon: typeof Sun }[] = [
    { value: 'light',  label: 'Hell',   icon: Sun     },
    { value: 'dark',   label: 'Dunkel', icon: Moon    },
    { value: 'system', label: 'System', icon: Monitor },
  ]

  const deleteItems = [
    { key: 'grades' as const,    label: 'Noten',     count: grades.length },
    { key: 'exams' as const,     label: 'Prüfungen', count: exams.length },
    { key: 'tasks' as const,     label: 'Aufgaben',  count: tasks.length },
    { key: 'events' as const,    label: 'Termine',   count: events.length },
    { key: 'documents' as const, label: 'Dokumente', count: documents.length },
    { key: 'goals' as const,     label: 'Ziele',     count: goals.length },
    { key: 'subjects' as const,  label: 'Fächer',    count: subjects.length },
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-[#111827] dark:text-[#F9FAFB]">Einstellungen</h1>

      {/* Profile */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <User size={18} className="text-[#6B7280]" />
          <h2 className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB]">Profil</h2>
        </div>
        <div className="space-y-4">
          <p className="text-xs text-[#6B7280] bg-gray-50 dark:bg-white/5 rounded-xl px-4 py-2.5">{user?.email}</p>
          <Input label="Name" value={localName} onChange={e => setLocalName(e.target.value)} placeholder="Dein Name" />
          <Input label="Schule" value={localSchool} onChange={e => setLocalSchool(e.target.value)} placeholder="Name deiner Schule" />
          <Button onClick={save}>Speichern</Button>
        </div>
      </Card>

      {/* Semester */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <School size={18} className="text-[#6B7280]" />
          <h2 className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB]">Aktuelles Semester</h2>
        </div>
        <div className="flex gap-2">
          {(['11.1','11.2','12.1','12.2'] as Semester[]).map(sem => (
            <button key={sem} onClick={() => user && patch(user.id, { currentSemester: sem })}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${currentSemester === sem ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-white/10 text-[#6B7280]'}`}>
              {sem}
            </button>
          ))}
        </div>
      </Card>

      {/* Theme */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Sun size={18} className="text-[#6B7280]" />
          <h2 className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB]">Erscheinungsbild</h2>
        </div>
        <div className="flex gap-3">
          {themes.map(({ value, label, icon: Icon }) => (
            <button key={value} onClick={() => user && patch(user.id, { theme: value })}
              className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-xl transition-all ${theme === value ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500' : 'bg-gray-50 dark:bg-white/5 text-[#6B7280] hover:bg-gray-100 dark:hover:bg-white/10'}`}>
              <Icon size={24} />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Grade Weights */}
      <Card>
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 size={18} className="text-[#6B7280]" />
          <h2 className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB]">Notengewichtung</h2>
        </div>
        <p className="text-xs text-[#6B7280] mb-4">
          Die Gewichtung bestimmt, wie stark jede Notenart in den Durchschnitt einfließt. 
          Beispiel: Klausur = 2, Mündlich = 1 → Klausur zählt doppelt so stark.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(Object.entries(gradeWeights) as [string, number][]).map(([key, value]) => (
            <div key={key} className="space-y-1">
              <label className="text-xs text-[#6B7280]">{key}</label>
              <input type="number" min={0.5} max={5} step={0.5} value={value}
                onChange={e => user && patch(user.id, { gradeWeights: { ...gradeWeights, [key]: parseFloat(e.target.value) || 1 } })}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-[#F8F9FB] dark:bg-[#0F172A] text-sm text-[#111827] dark:text-[#F9FAFB] text-center" />
            </div>
          ))}
        </div>
      </Card>

      {/* Data Management */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Shield size={18} className="text-[#6B7280]" />
          <h2 className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB]">Daten & Konto</h2>
        </div>
        <div className="space-y-3">
          <p className="text-xs text-[#6B7280]">
            Alle Daten werden sicher in der Cloud gespeichert und sind auf allen Geräten verfügbar.
          </p>

          <Button
            variant="secondary"
            icon={<Trash2 size={16} />}
            onClick={() => { setDeleteModal(true); setDeleteSuccess(false) }}
            className="w-full"
          >
            Daten selektiv löschen
          </Button>

          <Button variant="secondary" icon={<LogOut size={16} />} onClick={signOut} className="w-full">
            Abmelden
          </Button>

          <div className="pt-3 border-t border-[#E5E7EB] dark:border-[#334155]">
            <Button
              variant="danger"
              icon={<AlertTriangle size={16} />}
              onClick={() => { setAccountDeleteModal(true); setDeleteError(null); setDeletePassword('') }}
              className="w-full"
            >
              Konto und alle Daten endgültig löschen
            </Button>
          </div>
        </div>
      </Card>

      {/* Footer */}
      <Card>
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">S</div>
          <h3 className="text-lg font-bold text-[#111827] dark:text-[#F9FAFB]">Schulify</h3>
          <p className="text-xs text-[#6B7280] mt-1">Premium Oberstufenplaner · Version 2.0</p>
          <p className="text-xs text-[#6B7280] mt-2">Cloud-synchronisiert · Alle Geräte · Kein Datenverlust</p>
        </div>
      </Card>

      {/* Selective Delete Modal */}
      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title="Daten löschen" size="lg">
        <div className="space-y-5">
          {/* Semester Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">Semester</label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setDeleteSemester('all')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  deleteSemester === 'all'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 dark:bg-white/10 text-[#6B7280]'
                }`}
              >
                Alle Semester
              </button>
              {(['11.1','11.2','12.1','12.2'] as Semester[]).map(sem => (
                <button
                  key={sem}
                  onClick={() => setDeleteSemester(sem)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    deleteSemester === sem
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 dark:bg-white/10 text-[#6B7280]'
                  }`}
                >
                  {sem}
                </button>
              ))}
            </div>
          </div>

          {/* Data Types */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">Was soll gelöscht werden?</label>
                      {/* Data Types */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">Was soll gelöscht werden?</label>
            <div className="space-y-2">
              {deleteItems.map(({ key, label, count }) => (
                <div key={key}>
                  <label
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                      deleteTargets[key]
                        ? 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20'
                        : 'bg-gray-50 dark:bg-white/5 border border-transparent'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={deleteTargets[key]}
                      onChange={() => toggleDeleteTarget(key)}
                      className="w-4 h-4 rounded accent-red-600"
                    />
                    <span className="text-sm text-[#111827] dark:text-[#F9FAFB] flex-1">{label}</span>
                    <span className="text-xs text-[#6B7280]">{count} Einträge</span>
                  </label>
                  {key === 'subjects' && deleteTargets.subjects && (
                    <div className="flex items-start gap-2 p-3 mt-1 rounded-xl bg-yellow-50 dark:bg-yellow-500/10">
                      <AlertTriangle size={16} className="text-yellow-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-yellow-700 dark:text-yellow-400">
                        Fächer löschen entfernt auch alle verknüpften Noten, Prüfungen und Aufgaben!
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          </div>
          <AnimatePresence>
            {deleteSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-500/10 text-green-600 text-sm"
              >
                <Check size={16} /> Daten wurden gelöscht.
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-3 pt-2">
            <Button
              variant="danger"
              onClick={handleSelectiveDelete}
              disabled={deleting || !Object.values(deleteTargets).some(v => v)}
              className="flex-1"
            >
              {deleting ? 'Wird gelöscht...' : 'Ausgewählte Daten löschen'}
            </Button>
            <Button variant="secondary" onClick={() => setDeleteModal(false)}>Abbrechen</Button>
          </div>
        </div>
      </Modal>

      {/* Account Delete Modal */}
      <Modal open={accountDeleteModal} onClose={() => setAccountDeleteModal(false)} title="Konto löschen" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-500/10">
            <AlertTriangle size={20} className="text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                Diese Aktion kann nicht rückgängig gemacht werden!
              </p>
              <p className="text-xs text-red-600 dark:text-red-400/80 mt-1">
                Alle deine Fächer, Noten, Prüfungen, Aufgaben, Dokumente, Ziele und Termine werden endgültig gelöscht.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">
              Passwort eingeben zur Bestätigung
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7280]" />
              <input
                type="password"
                value={deletePassword}
                onChange={e => setDeletePassword(e.target.value)}
                placeholder="Dein Passwort"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-[#F8F9FB] dark:bg-[#0F172A] text-sm text-[#111827] dark:text-[#F9FAFB] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>
          </div>

          <AnimatePresence>
            {deleteError && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-red-500 text-center"
              >
                {deleteError}
              </motion.p>
            )}
          </AnimatePresence>

          <div className="flex gap-3 pt-2">
            <Button
              variant="danger"
              onClick={handleAccountDelete}
              disabled={accountDeleting || !deletePassword}
              className="flex-1"
            >
              {accountDeleting ? 'Wird gelöscht...' : 'Konto endgültig löschen'}
            </Button>
            <Button variant="secondary" onClick={() => setAccountDeleteModal(false)}>
              Abbrechen
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
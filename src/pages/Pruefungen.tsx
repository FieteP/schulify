import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, FileText, Trash2 } from 'lucide-react'
import { useExamStore }    from '../store/examStore'
import { useSubjectStore } from '../store/subjectStore'
import { useSettingsStore }from '../store/settingsStore'
import { useAuthStore }    from '../store/authStore'
import { Exam, Semester } from '../types'
import { formatDate, getDaysUntil, getPointsColor, pointsToGrade } from '../utils/helpers'
import Card from '../components/cards/Card'
import Modal from '../components/forms/Modal'
import Input from '../components/forms/Input'
import Select from '../components/forms/Select'
import TextArea from '../components/forms/TextArea'
import Button from '../components/forms/Button'
import PointsSlider from '../components/forms/PointsSlider'
import EmptyState from '../components/forms/EmptyState'

export default function Pruefungen() {
  const { exams, add, update, remove } = useExamStore()
  const subjects = useSubjectStore(s => s.subjects)
  const currentSemester = useSettingsStore(s => s.currentSemester)
  const user = useAuthStore(s => s.user)

  const [modalOpen, setModalOpen] = useState(false)
  const [gradeModal, setGradeModal] = useState(false)
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [gradeInput, setGradeInput] = useState(10)
  const [topicInput, setTopicInput] = useState('')

  const [form, setForm] = useState({
    subjectId: '', semester: currentSemester as Semester, date: '', time: '',
    duration: 90, room: '', topics: [] as string[], description: '', status: 'Ausstehend' as Exam['status'], notes: ''
  })

  const sorted = useMemo(() => [...exams].sort((a, b) => a.date.localeCompare(b.date)), [exams])
  const upcoming = sorted.filter(e => e.status === 'Ausstehend')
  const past     = sorted.filter(e => e.status !== 'Ausstehend')

  const handleSubmit = async () => {
    if (!form.subjectId || !form.date || !user) return
    await add(user.id, form)
    setModalOpen(false)
    setForm({ subjectId: '', semester: currentSemester, date: '', time: '', duration: 90, room: '', topics: [], description: '', status: 'Ausstehend', notes: '' })
  }

  const handleGrade = async () => {
    if (!selectedExam) return
    await update(selectedExam.id, { grade: gradeInput, status: 'Benotet' })
    setGradeModal(false); setSelectedExam(null)
  }

  const addTopic = () => {
    if (topicInput.trim()) { setForm(f => ({ ...f, topics: [...f.topics, topicInput.trim()] })); setTopicInput('') }
  }

  const ExamCard = ({ exam }: { exam: Exam }) => {
    const sub  = subjects.find(s => s.id === exam.subjectId)
    const days = getDaysUntil(exam.date)
    return (
      <Card hover>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ backgroundColor: sub?.color || '#6B7280' }}>
            {sub?.shortName || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB]">{sub?.name || 'Unbekannt'}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-[#6B7280]">{formatDate(exam.date)}</span>
              {exam.time && <span className="text-xs text-[#6B7280]">{exam.time} Uhr</span>}
              <span className="text-xs text-[#6B7280]">{exam.duration} min</span>
            </div>
            {exam.topics.length > 0 && (
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {exam.topics.map((t, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-[#6B7280]">{t}</span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {exam.status === 'Benotet' && exam.grade !== undefined ? (
              <div className="text-right">
                <p className="text-xl font-bold" style={{ color: getPointsColor(exam.grade) }}>{exam.grade}</p>
                <p className="text-[10px] text-[#6B7280]">{pointsToGrade(exam.grade)}</p>
              </div>
            ) : (
              <div className="flex flex-col items-end gap-1">
                <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${days <= 3 ? 'bg-red-50 text-red-600' : days <= 7 ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600'}`}>
                  {days === 0 ? 'Heute' : days === 1 ? 'Morgen' : `${days}d`}
                </span>
                <button onClick={() => { setSelectedExam(exam); setGradeInput(10); setGradeModal(true) }} className="text-[10px] text-blue-500 hover:underline">
                  Benoten
                </button>
              </div>
            )}
            <button onClick={() => remove(exam.id)} className="p-1.5 rounded-lg text-[#6B7280] hover:text-red-500 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111827] dark:text-[#F9FAFB]">Prüfungen</h1>
          <p className="text-sm text-[#6B7280] dark:text-[#94A3B8] mt-1">{upcoming.length} ausstehend</p>
        </div>
        <Button icon={<Plus size={18} />} onClick={() => setModalOpen(true)}>Prüfung</Button>
      </div>

      {exams.length > 0 ? (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3">Anstehend</p>
              <div className="space-y-3">{upcoming.map(e => <ExamCard key={e.id} exam={e} />)}</div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3">Vergangene</p>
              <div className="space-y-3">{past.map(e => <ExamCard key={e.id} exam={e} />)}</div>
            </div>
          )}
        </div>
      ) : (
        <EmptyState icon={<FileText size={32} />} title="Keine Prüfungen" description="Plane deine nächsten Klausuren."
          action={<Button icon={<Plus size={18} />} onClick={() => setModalOpen(true)}>Prüfung anlegen</Button>} />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Neue Prüfung" size="lg">
        <div className="space-y-4">
          <Select label="Fach" value={form.subjectId} onChange={e => setForm({ ...form, subjectId: e.target.value })}
            options={[{ value: '', label: 'Fach wählen...' }, ...subjects.map(s => ({ value: s.id, label: s.name }))]} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Datum" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            <Input label="Uhrzeit" type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Dauer (min)" type="number" value={form.duration} onChange={e => setForm({ ...form, duration: parseInt(e.target.value) })} />
            <Input label="Raum" value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">Themen</label>
            <div className="flex gap-2">
              <input value={topicInput} onChange={e => setTopicInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTopic())}
                placeholder="Thema + Enter" className="flex-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-[#F8F9FB] dark:bg-[#0F172A] text-sm text-[#111827] dark:text-[#F9FAFB]" />
              <Button size="sm" onClick={addTopic}>+</Button>
            </div>
            {form.topics.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mt-2">
                {form.topics.map((t, i) => (
                  <span key={i} className="text-xs px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 flex items-center gap-1">
                    {t}<button onClick={() => setForm(f => ({ ...f, topics: f.topics.filter((_, j) => j !== i) }))}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <TextArea label="Beschreibung" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSubmit} className="flex-1">Anlegen</Button>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Abbrechen</Button>
          </div>
        </div>
      </Modal>

      <Modal open={gradeModal} onClose={() => setGradeModal(false)} title="Prüfung benoten" size="sm">
        <div className="space-y-4">
          <PointsSlider label="Punkte" value={gradeInput} onChange={setGradeInput} />
          <div className="flex gap-3 pt-4">
            <Button onClick={handleGrade} className="flex-1">Speichern</Button>
            <Button variant="secondary" onClick={() => setGradeModal(false)}>Abbrechen</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
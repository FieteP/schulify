import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, BookOpen, Trash2, Filter } from 'lucide-react'
import { useGradeStore }   from '../store/gradeStore'
import { useSubjectStore } from '../store/subjectStore'
import { useSettingsStore }from '../store/settingsStore'
import { useAuthStore }    from '../store/authStore'
import { Grade, GradeType, Semester } from '../types'
import { calculateSubjectAverage, pointsToGrade, getPointsColor, formatDate } from '../utils/helpers'
import Card from '../components/cards/Card'
import Modal from '../components/forms/Modal'
import Input from '../components/forms/Input'
import Select from '../components/forms/Select'
import Button from '../components/forms/Button'
import PointsSlider from '../components/forms/PointsSlider'
import EmptyState from '../components/forms/EmptyState'

export default function Noten() {
  const { grades, add, remove } = useGradeStore()
  const subjects = useSubjectStore(s => s.subjects)
  const currentSemester = useSettingsStore(s => s.currentSemester)
  const user = useAuthStore(s => s.user)

  const [modalOpen, setModalOpen] = useState(false)
  const [filterSemester, setFilterSemester] = useState<Semester | ''>(currentSemester)
  const [filterSubject, setFilterSubject]   = useState('')
  const [form, setForm] = useState({
    subjectId: '', semester: currentSemester as Semester, type: 'Klausur' as GradeType,
    points: 10, weight: 1, date: new Date().toISOString().split('T')[0], description: '', notes: ''
  })

  const filtered = useMemo(() => {
    let r = [...grades]
    if (filterSemester) r = r.filter(g => g.semester === filterSemester)
    if (filterSubject)  r = r.filter(g => g.subjectId === filterSubject)
    return r.sort((a, b) => b.date.localeCompare(a.date))
  }, [grades, filterSemester, filterSubject])

  const groups = useMemo(() => {
    const g: Record<string, Grade[]> = {}
    filtered.forEach(gr => { if (!g[gr.subjectId]) g[gr.subjectId] = []; g[gr.subjectId].push(gr) })
    return g
  }, [filtered])

  const handleSubmit = async () => {
    if (!form.subjectId || !user) return
    await add(user.id, form)
    setModalOpen(false)
    setForm({ subjectId: '', semester: currentSemester, type: 'Klausur', points: 10, weight: 1, date: new Date().toISOString().split('T')[0], description: '', notes: '' })
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111827] dark:text-[#F9FAFB]">Noten</h1>
          <p className="text-sm text-[#6B7280] dark:text-[#94A3B8] mt-1">{grades.length} Noten</p>
        </div>
        <Button icon={<Plus size={18} />} onClick={() => setModalOpen(true)}>Note eintragen</Button>
      </div>

      <Card>
        <div className="flex items-center gap-4 flex-wrap">
          <Filter size={16} className="text-[#6B7280]" />
          <select value={filterSemester} onChange={e => setFilterSemester(e.target.value as Semester | '')}
            className="px-3 py-1.5 rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-[#F8F9FB] dark:bg-[#0F172A] text-sm text-[#111827] dark:text-[#F9FAFB]">
            <option value="">Alle Semester</option>
            {(['11.1','11.2','12.1','12.2'] as Semester[]).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-[#F8F9FB] dark:bg-[#0F172A] text-sm text-[#111827] dark:text-[#F9FAFB]">
            <option value="">Alle Fächer</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </Card>

      {Object.keys(groups).length > 0 ? (
        <div className="space-y-4">
          {Object.entries(groups).map(([subjectId, subGrades]) => {
            const subject = subjects.find(s => s.id === subjectId)
            if (!subject) return null
            const avg = calculateSubjectAverage(subGrades, subjectId)
            return (
              <Card key={subjectId}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: subject.color }}>
                    {subject.shortName}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB]">{subject.name}</h3>
                    <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">{subGrades.length} Noten · {subject.courseType}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold" style={{ color: getPointsColor(avg) }}>{avg.toFixed(1)}</p>
                    <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">{pointsToGrade(avg)}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {subGrades.map(grade => (
                    <div key={grade.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#F8F9FB] dark:bg-[#0F172A]">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: getPointsColor(grade.points) }}>
                        {grade.points}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">
                          {grade.type}{grade.description ? ` · ${grade.description}` : ''}
                        </p>
                        <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">{formatDate(grade.date)} · {grade.weight}x</p>
                      </div>
                      <span className="text-xs text-[#6B7280]">{pointsToGrade(grade.points)}</span>
                      <button onClick={() => remove(grade.id)} className="p-1.5 rounded-lg text-[#6B7280] hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState icon={<BookOpen size={32} />} title="Keine Noten" description="Trage deine erste Note ein."
          action={<Button icon={<Plus size={18} />} onClick={() => setModalOpen(true)}>Note eintragen</Button>} />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Note eintragen">
        <div className="space-y-4">
          <Select label="Fach" value={form.subjectId} onChange={e => setForm({ ...form, subjectId: e.target.value })}
            options={[{ value: '', label: 'Fach wählen...' }, ...subjects.map(s => ({ value: s.id, label: s.name }))]} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Semester" value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value as Semester })}
              options={(['11.1','11.2','12.1','12.2'] as Semester[]).map(s => ({ value: s, label: s }))} />
            <Select label="Art" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as GradeType })}
              options={['Klausur','Mündlich','Referat','Projekt','Mitarbeit','Test','Sonstige'].map(t => ({ value: t, label: t }))} />
          </div>
          <PointsSlider label="Punkte" value={form.points} onChange={v => setForm({ ...form, points: v })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Datum" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            <Input label="Gewichtung" type="number" min={0.5} max={5} step={0.5} value={form.weight} onChange={e => setForm({ ...form, weight: parseFloat(e.target.value) })} />
          </div>
          <Input label="Beschreibung" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="z.B. Analysis Klausur 1" />
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSubmit} className="flex-1">Speichern</Button>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Abbrechen</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
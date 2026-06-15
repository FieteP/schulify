import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, GraduationCap, Trash2, Edit } from 'lucide-react'
import { useSubjectStore } from '../store/subjectStore'
import { useAuthStore }    from '../store/authStore'
import { Subject, CourseType, Semester } from '../types'
import SubjectCard from '../components/cards/SubjectCard'
import Modal from '../components/forms/Modal'
import Input from '../components/forms/Input'
import Select from '../components/forms/Select'
import Button from '../components/forms/Button'
import EmptyState from '../components/forms/EmptyState'
import { SUBJECT_COLORS } from '../utils/helpers'

const EMPTY = {
  name: '', shortName: '', color: SUBJECT_COLORS[0], teacher: '', room: '',
  courseType: 'GK' as CourseType, semester: ['11.1'] as Semester[],
  isAbiSubject: false, abiType: '' as '' | 'schriftlich' | 'mündlich', targetGrade: 0, notes: ''
}

export default function Faecher() {
  const { subjects, add, update, remove } = useSubjectStore()
  const user = useAuthStore(s => s.user)
  const [modalOpen, setModalOpen] = useState(false)
  const [editSubject, setEditSubject] = useState<Subject | null>(null)
  const [form, setForm] = useState(EMPTY)

  const reset = () => { setForm(EMPTY); setEditSubject(null) }

  const openEdit = (s: Subject) => {
    setEditSubject(s)
    setForm({
      name: s.name, shortName: s.shortName, color: s.color,
      teacher: s.teacher, room: s.room, courseType: s.courseType,
      semester: s.semester, isAbiSubject: s.isAbiSubject,
      abiType: s.abiType || '', targetGrade: s.targetGrade || 0, notes: s.notes
    })
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.name || !form.shortName || !user) return
    const data = { ...form, abiType: form.abiType || undefined, targetGrade: form.targetGrade || undefined }
    if (editSubject) {
      await update(editSubject.id, data)
    } else {
      await add(user.id, data as Omit<Subject, 'id'>)
    }
    setModalOpen(false); reset()
  }

  const toggleSemester = (sem: Semester) =>
    setForm(f => ({ ...f, semester: f.semester.includes(sem) ? f.semester.filter(s => s !== sem) : [...f.semester, sem] }))

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111827] dark:text-[#F9FAFB]">Fächer</h1>
          <p className="text-sm text-[#6B7280] dark:text-[#94A3B8] mt-1">{subjects.length} Fächer</p>
        </div>
        <Button icon={<Plus size={18} />} onClick={() => { reset(); setModalOpen(true) }}>Fach hinzufügen</Button>
      </div>

      {subjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjects.map(subject => (
            <div key={subject.id} className="relative group">
              <SubjectCard subject={subject} onClick={() => openEdit(subject)} />
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={e => { e.stopPropagation(); openEdit(subject) }}
                  className="p-1.5 rounded-lg bg-white dark:bg-[#1E293B] shadow-sm border border-[#E5E7EB] dark:border-[#334155] text-[#6B7280] hover:text-blue-500">
                  <Edit size={14} />
                </button>
                <button onClick={e => { e.stopPropagation(); remove(subject.id) }}
                  className="p-1.5 rounded-lg bg-white dark:bg-[#1E293B] shadow-sm border border-[#E5E7EB] dark:border-[#334155] text-[#6B7280] hover:text-red-500">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={<GraduationCap size={32} />} title="Keine Fächer" description="Füge deine Schulfächer hinzu."
          action={<Button icon={<Plus size={18} />} onClick={() => { reset(); setModalOpen(true) }}>Erstes Fach anlegen</Button>} />
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); reset() }} title={editSubject ? 'Fach bearbeiten' : 'Neues Fach'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Fachname" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Mathematik" />
            <Input label="Kürzel" value={form.shortName} onChange={e => setForm({ ...form, shortName: e.target.value })} placeholder="M" maxLength={4} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Lehrkraft" value={form.teacher} onChange={e => setForm({ ...form, teacher: e.target.value })} placeholder="Fr. Müller" />
            <Input label="Raum" value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} placeholder="204" />
          </div>
          <Select label="Kursart" value={form.courseType} onChange={e => setForm({ ...form, courseType: e.target.value as CourseType })}
            options={[{ value: 'GK', label: 'Grundkurs' }, { value: 'LK', label: 'Leistungskurs' }, { value: 'Seminar', label: 'Seminar' }, { value: 'Wahl', label: 'Wahlfach' }]} />

          {/* Color */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">Farbe</label>
            <div className="flex flex-wrap gap-2">
              {SUBJECT_COLORS.map(c => (
                <button key={c} onClick={() => setForm({ ...form, color: c })}
                  className={`w-8 h-8 rounded-xl transition-all ${form.color === c ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          {/* Semester */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">Semester</label>
            <div className="flex gap-2">
              {(['11.1', '11.2', '12.1', '12.2'] as Semester[]).map(sem => (
                <button key={sem} onClick={() => toggleSemester(sem)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${form.semester.includes(sem) ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-white/10 text-[#6B7280] dark:text-[#94A3B8]'}`}>
                  {sem}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" id="abi" checked={form.isAbiSubject} onChange={e => setForm({ ...form, isAbiSubject: e.target.checked })} className="w-4 h-4 rounded accent-blue-600" />
            <label htmlFor="abi" className="text-sm text-[#111827] dark:text-[#F9FAFB]">Abiturfach</label>
          </div>
          {form.isAbiSubject && (
            <Select label="Prüfungsart" value={form.abiType} onChange={e => setForm({ ...form, abiType: e.target.value as 'schriftlich' | 'mündlich' })}
              options={[{ value: '', label: 'Auswählen...' }, { value: 'schriftlich', label: 'Schriftlich' }, { value: 'mündlich', label: 'Mündlich' }]} />
          )}
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSubmit} className="flex-1">{editSubject ? 'Speichern' : 'Anlegen'}</Button>
            <Button variant="secondary" onClick={() => { setModalOpen(false); reset() }}>Abbrechen</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
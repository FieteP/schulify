import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ClipboardList, Trash2, Circle, CheckCircle2 } from 'lucide-react'
import { useTaskStore }    from '../store/taskStore'
import { useSubjectStore } from '../store/subjectStore'
import { useSettingsStore }from '../store/settingsStore'
import { useAuthStore }    from '../store/authStore'
import { Task, TaskPriority, TaskStatus, Semester } from '../types'
import { formatDate, getDaysUntil } from '../utils/helpers'
import Card from '../components/cards/Card'
import Modal from '../components/forms/Modal'
import Input from '../components/forms/Input'
import Select from '../components/forms/Select'
import TextArea from '../components/forms/TextArea'
import Button from '../components/forms/Button'
import EmptyState from '../components/forms/EmptyState'

const PRIORITY_COLOR: Record<TaskPriority, string> = { Hoch: 'text-red-500', Mittel: 'text-yellow-500', Niedrig: 'text-green-500' }

export default function Aufgaben() {
  const { tasks, add, toggle, remove } = useTaskStore()
  const subjects = useSubjectStore(s => s.subjects)
  const currentSemester = useSettingsStore(s => s.currentSemester)
  const user = useAuthStore(s => s.user)

  const [modalOpen, setModalOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'open' | 'done'>('open')
  const [form, setForm] = useState({
    title: '', description: '', subjectId: '',
    dueDate: new Date().toISOString().split('T')[0],
    priority: 'Mittel' as TaskPriority, status: 'Offen' as TaskStatus,
    semester: currentSemester as Semester, category: 'Hausaufgabe', notes: ''
  })

  const filtered = useMemo(() => {
    let r = [...tasks]
    if (filter === 'open') r = r.filter(t => t.status !== 'Erledigt')
    if (filter === 'done') r = r.filter(t => t.status === 'Erledigt')
    return r.sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  }, [tasks, filter])

  const handleSubmit = async () => {
    if (!form.title || !user) return
    await add(user.id, form)
    setModalOpen(false)
    setForm({ title: '', description: '', subjectId: '', dueDate: new Date().toISOString().split('T')[0], priority: 'Mittel', status: 'Offen', semester: currentSemester, category: 'Hausaufgabe', notes: '' })
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111827] dark:text-[#F9FAFB]">Aufgaben</h1>
          <p className="text-sm text-[#6B7280] dark:text-[#94A3B8] mt-1">
            {tasks.filter(t => t.status !== 'Erledigt').length} offen
          </p>
        </div>
        <Button icon={<Plus size={18} />} onClick={() => setModalOpen(true)}>Neue Aufgabe</Button>
      </div>

      <div className="flex gap-2">
        {(['all', 'open', 'done'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-white/10 text-[#6B7280] dark:text-[#94A3B8]'}`}>
            {f === 'all' ? 'Alle' : f === 'open' ? 'Offen' : 'Erledigt'}
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map(task => {
              const sub = subjects.find(s => s.id === task.subjectId)
              const days = getDaysUntil(task.dueDate)
              const done = task.status === 'Erledigt'
              return (
                <motion.div key={task.id} layout initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -30 }}>
                  <Card>
                    <div className="flex items-start gap-3">
                      <button onClick={() => toggle(task.id)}
                        className={`mt-0.5 shrink-0 transition-colors ${done ? 'text-green-500' : 'text-[#6B7280] hover:text-blue-500'}`}>
                        {done ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${done ? 'line-through text-[#6B7280]' : 'text-[#111827] dark:text-[#F9FAFB]'}`}>{task.title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {sub && <span className="text-[10px] font-medium px-2 py-0.5 rounded-md text-white" style={{ backgroundColor: sub.color }}>{sub.shortName}</span>}
                          <span className={`text-[10px] font-medium ${PRIORITY_COLOR[task.priority]}`}>{task.priority}</span>
                          <span className="text-[10px] text-[#6B7280]">{formatDate(task.dueDate)}</span>
                          {!done && days <= 1 && <span className="text-[10px] font-semibold text-red-500">{days === 0 ? 'Heute!' : 'Morgen!'}</span>}
                        </div>
                        {task.description && <p className="text-xs text-[#6B7280] mt-1">{task.description}</p>}
                      </div>
                      <button onClick={() => remove(task.id)} className="p-1.5 rounded-lg text-[#6B7280] hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      ) : (
        <EmptyState
          icon={<ClipboardList size={32} />}
          title={filter === 'done' ? 'Keine erledigten Aufgaben' : 'Keine offenen Aufgaben'}
          description={filter === 'open' ? 'Super, alles erledigt! 🎉' : 'Erstelle deine erste Aufgabe.'}
          action={filter !== 'done' ? <Button icon={<Plus size={18} />} onClick={() => setModalOpen(true)}>Neue Aufgabe</Button> : undefined}
        />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Neue Aufgabe">
        <div className="space-y-4">
          <Input label="Titel" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="z.B. Mathe S.45" />
          <TextArea label="Beschreibung" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Fach" value={form.subjectId} onChange={e => setForm({ ...form, subjectId: e.target.value })}
              options={[{ value: '', label: 'Kein Fach' }, ...subjects.map(s => ({ value: s.id, label: s.name }))]} />
            <Input label="Fällig am" type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Priorität" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as TaskPriority })}
              options={[{ value: 'Hoch', label: '🔴 Hoch' }, { value: 'Mittel', label: '🟡 Mittel' }, { value: 'Niedrig', label: '🟢 Niedrig' }]} />
            <Select label="Kategorie" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              options={['Hausaufgabe','Vorbereitung','Projekt','Sonstige'].map(v => ({ value: v, label: v }))} />
          </div>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSubmit} className="flex-1">Erstellen</Button>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Abbrechen</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useCalendarStore } from '../store/calendarStore'
import { useSubjectStore }  from '../store/subjectStore'
import { useExamStore }     from '../store/examStore'
import { useTaskStore }     from '../store/taskStore'
import { useAuthStore }     from '../store/authStore'
import { CalendarEvent } from '../types'
import Card from '../components/cards/Card'
import Modal from '../components/forms/Modal'
import Input from '../components/forms/Input'
import Select from '../components/forms/Select'
import TextArea from '../components/forms/TextArea'
import Button from '../components/forms/Button'

const MONTHS = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember']
const DAYS   = ['Mo','Di','Mi','Do','Fr','Sa','So']

export default function Kalender() {
  const { events, add, remove } = useCalendarStore()
  const subjects = useSubjectStore(s => s.subjects)
  const exams    = useExamStore(s => s.exams)
  const tasks    = useTaskStore(s => s.tasks)
  const user     = useAuthStore(s => s.user)

  const [cur, setCur]   = useState(new Date())
  const [sel, setSel]   = useState<string | null>(null)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ title: '', date: new Date().toISOString().split('T')[0], time: '', type: 'Termin' as CalendarEvent['type'], description: '', allDay: true })

  const year = cur.getFullYear(), month = cur.getMonth()

  const calDays = useMemo(() => {
    const first = new Date(year, month, 1)
    let startDay = first.getDay() - 1; if (startDay < 0) startDay = 6
    const dInM   = new Date(year, month + 1, 0).getDate()
    const days: { date: Date; inMonth: boolean }[] = []
    for (let i = startDay - 1; i >= 0; i--) days.push({ date: new Date(year, month, -i), inMonth: false })
    for (let i = 1; i <= dInM; i++)         days.push({ date: new Date(year, month, i), inMonth: true })
    const rem = 42 - days.length
    for (let i = 1; i <= rem; i++)          days.push({ date: new Date(year, month + 1, i), inMonth: false })
    return days
  }, [year, month])

  const allMarkers = useMemo(() => {
    const m: { date: string; color: string }[] = []
    events.forEach(e => m.push({ date: e.date, color: e.color || '#3B82F6' }))
    exams.forEach(e => { const s = subjects.find(su => su.id === e.subjectId); m.push({ date: e.date, color: s?.color || '#EF4444' }) })
    tasks.filter(t => t.status !== 'Erledigt').forEach(t => { const s = subjects.find(su => su.id === t.subjectId); m.push({ date: t.dueDate, color: s?.color || '#F59E0B' }) })
    return m
  }, [events, exams, tasks, subjects])

  const today = new Date().toISOString().split('T')[0]

  const selEvents = useMemo(() => {
    if (!sel) return []
    const r: { title: string; color: string; type: string }[] = []
    events.filter(e => e.date === sel).forEach(e => r.push({ title: e.title, color: e.color || '#3B82F6', type: e.type }))
    exams.filter(e => e.date === sel).forEach(e => { const s = subjects.find(su => su.id === e.subjectId); r.push({ title: `Klausur: ${s?.name}`, color: s?.color || '#EF4444', type: 'Klausur' }) })
    tasks.filter(t => t.dueDate === sel && t.status !== 'Erledigt').forEach(t => { const s = subjects.find(su => su.id === t.subjectId); r.push({ title: t.title, color: s?.color || '#F59E0B', type: 'Aufgabe' }) })
    return r
  }, [sel, events, exams, tasks, subjects])

  const handleSubmit = async () => {
    if (!form.title || !user) return
    await add(user.id, { ...form, subjectId: undefined, endDate: undefined, endTime: undefined })
    setModal(false)
    setForm({ title: '', date: new Date().toISOString().split('T')[0], time: '', type: 'Termin', description: '', allDay: true })
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#111827] dark:text-[#F9FAFB]">Kalender</h1>
        <Button icon={<Plus size={18} />} onClick={() => setModal(true)}>Termin</Button>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setCur(new Date(year, month - 1, 1))} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
            <ChevronLeft size={20} className="text-[#6B7280]" />
          </button>
          <h2 className="text-lg font-semibold text-[#111827] dark:text-[#F9FAFB]">{MONTHS[month]} {year}</h2>
          <button onClick={() => setCur(new Date(year, month + 1, 1))} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
            <ChevronRight size={20} className="text-[#6B7280]" />
          </button>
        </div>

        <div className="grid grid-cols-7 mb-2">
          {DAYS.map(d => <div key={d} className="text-center text-xs font-semibold text-[#6B7280] py-2">{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calDays.map(({ date, inMonth }, i) => {
            const ds = date.toISOString().split('T')[0]
            const dots = allMarkers.filter(m => m.date === ds)
            const isToday = ds === today
            const isSel   = ds === sel
            return (
              <button key={i} onClick={() => setSel(ds)}
                className={`relative p-2 rounded-xl text-center min-h-[70px] transition-all ${!inMonth ? 'opacity-30' : ''} ${isSel ? 'bg-blue-50 dark:bg-blue-500/10 ring-2 ring-blue-500' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                <span className={`text-sm font-medium ${isToday ? 'w-7 h-7 bg-blue-600 text-white rounded-full inline-flex items-center justify-center' : 'text-[#111827] dark:text-[#F9FAFB]'}`}>
                  {date.getDate()}
                </span>
                {dots.length > 0 && (
                  <div className="flex justify-center gap-0.5 mt-1">
                    {dots.slice(0, 3).map((d, j) => <div key={j} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: d.color }} />)}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </Card>

      {sel && (
        <Card>
          <h3 className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB] mb-3">
            {new Date(sel + 'T00:00').toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </h3>
          {selEvents.length > 0 ? (
            <div className="space-y-2">
              {selEvents.map((e, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[#F8F9FB] dark:bg-[#0F172A]">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">{e.title}</p>
                    <p className="text-xs text-[#6B7280]">{e.type}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-[#6B7280] text-center py-4">Keine Termine</p>}
        </Card>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Neuer Termin">
        <div className="space-y-4">
          <Input label="Titel" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="z.B. Elternabend" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Datum" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            <Input label="Uhrzeit" type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
          </div>
          <Select label="Typ" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as CalendarEvent['type'] })}
            options={['Termin','Klausur','Aufgabe','Ferien','Sonstige'].map(v => ({ value: v, label: v }))} />
          <TextArea label="Beschreibung" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSubmit} className="flex-1">Erstellen</Button>
            <Button variant="secondary" onClick={() => setModal(false)}>Abbrechen</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
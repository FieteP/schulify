import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus, Trash2, Edit, X, Clock, MapPin } from 'lucide-react'
import { useCalendarStore } from '../store/calendarStore'
import { useSubjectStore }  from '../store/subjectStore'
import { useExamStore }     from '../store/examStore'
import { useTaskStore }     from '../store/taskStore'
import { useAuthStore }     from '../store/authStore'
import type { CalendarEvent } from '../types'
import { formatDate } from '../utils/helpers'
import Card from '../components/cards/Card'
import Modal from '../components/forms/Modal'
import Input from '../components/forms/Input'
import Select from '../components/forms/Select'
import TextArea from '../components/forms/TextArea'
import Button from '../components/forms/Button'

const MONTHS = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember']
const DAYS   = ['Mo','Di','Mi','Do','Fr','Sa','So']

interface CombinedEvent {
  id: string
  title: string
  date: string
  time?: string
  type: string
  color: string
  description?: string
  source: 'event' | 'exam' | 'task'
  subjectName?: string
  room?: string
  duration?: number
}

export default function Kalender() {
  const { events, add, update, remove } = useCalendarStore()
  const subjects = useSubjectStore(s => s.subjects)
  const exams    = useExamStore(s => s.exams)
  const tasks    = useTaskStore(s => s.tasks)
  const user     = useAuthStore(s => s.user)

  const [cur, setCur] = useState(new Date())
  const [sel, setSel] = useState<string | null>(null)
  const [createModal, setCreateModal] = useState(false)
  const [detailModal, setDetailModal] = useState(false)
  const [editModal, setEditModal]     = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CombinedEvent | null>(null)

  const [form, setForm] = useState({
    title: '', date: new Date().toISOString().split('T')[0], time: '',
    type: 'Termin' as CalendarEvent['type'], description: '', allDay: true
  })

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

  // Build combined events list
  const allCombinedEvents = useMemo(() => {
    const combined: CombinedEvent[] = []

    events.forEach(e => {
      const sub = subjects.find(s => s.id === e.subjectId)
      combined.push({
        id: e.id, title: e.title, date: e.date, time: e.time,
        type: e.type, color: e.color || '#3B82F6',
        description: e.description, source: 'event',
        subjectName: sub?.name,
      })
    })

    exams.forEach(e => {
      const sub = subjects.find(s => s.id === e.subjectId)
      combined.push({
        id: e.id, title: `Klausur: ${sub?.name || '?'}`, date: e.date, time: e.time,
        type: 'Klausur', color: sub?.color || '#EF4444',
        description: e.description, source: 'exam',
        subjectName: sub?.name, room: e.room, duration: e.duration,
      })
    })

    tasks.filter(t => t.status !== 'Erledigt').forEach(t => {
      const sub = subjects.find(s => s.id === t.subjectId)
      combined.push({
        id: t.id, title: t.title, date: t.dueDate,
        type: 'Aufgabe', color: sub?.color || '#F59E0B',
        description: t.description, source: 'task',
        subjectName: sub?.name,
      })
    })

    return combined
  }, [events, exams, tasks, subjects])

  const today = new Date().toISOString().split('T')[0]

  const selEvents = useMemo(() => {
    if (!sel) return []
    return allCombinedEvents.filter(e => e.date === sel)
  }, [sel, allCombinedEvents])

  const handleCreate = async () => {
    if (!form.title || !user) return
    await add(user.id, { ...form, subjectId: undefined, endDate: undefined, endTime: undefined, color: undefined })
    setCreateModal(false)
    setForm({ title: '', date: new Date().toISOString().split('T')[0], time: '', type: 'Termin', description: '', allDay: true })
  }

  const openDetail = (event: CombinedEvent) => {
    setSelectedEvent(event)
    setDetailModal(true)
  }

  const openEdit = () => {
    if (!selectedEvent || selectedEvent.source !== 'event') return
    const original = events.find(e => e.id === selectedEvent.id)
    if (!original) return
    setForm({
      title: original.title, date: original.date,
      time: original.time || '', type: original.type,
      description: original.description, allDay: original.allDay
    })
    setDetailModal(false)
    setEditModal(true)
  }

  const handleEdit = async () => {
    if (!selectedEvent || !form.title) return
    await update(selectedEvent.id, {
      title: form.title, date: form.date, time: form.time,
      type: form.type as CalendarEvent['type'],
      description: form.description, allDay: form.allDay
    })
    setEditModal(false)
    setSelectedEvent(null)
  }

  const handleDelete = async () => {
    if (!selectedEvent) return
    if (selectedEvent.source === 'event') {
      await remove(selectedEvent.id)
    }
    setDetailModal(false)
    setSelectedEvent(null)
  }

  const typeColors: Record<string, string> = {
    Klausur: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400',
    Aufgabe: 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
    Termin:  'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
    Ferien:  'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400',
    Sonstige:'bg-gray-50 dark:bg-gray-500/10 text-gray-600 dark:text-gray-400',
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#111827] dark:text-[#F9FAFB]">Kalender</h1>
        <Button icon={<Plus size={18} />} onClick={() => {
          setForm({ title: '', date: sel || new Date().toISOString().split('T')[0], time: '', type: 'Termin', description: '', allDay: true })
          setCreateModal(true)
        }}>Termin</Button>
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
            const dots = allCombinedEvents.filter(m => m.date === ds)
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
                    {dots.length > 3 && <span className="text-[8px] text-[#6B7280]">+{dots.length - 3}</span>}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </Card>

      {/* Selected Date Events */}
      {sel && (
        <Card>
          <h3 className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB] mb-3">
            {new Date(sel + 'T00:00').toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </h3>
          {selEvents.length > 0 ? (
            <div className="space-y-2">
              {selEvents.map(event => (
                <button
                  key={`${event.source}-${event.id}`}
                  onClick={() => openDetail(event)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#F8F9FB] dark:bg-[#0F172A] hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-left"
                >
                  <div className="w-3 h-8 rounded-full shrink-0" style={{ backgroundColor: event.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB] truncate">{event.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${typeColors[event.type] || typeColors.Sonstige}`}>
                        {event.type}
                      </span>
                      {event.time && (
                        <span className="text-[10px] text-[#6B7280] flex items-center gap-0.5">
                          <Clock size={10} /> {event.time}
                        </span>
                      )}
                      {event.subjectName && (
                        <span className="text-[10px] text-[#6B7280]">{event.subjectName}</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-[#6B7280] shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#6B7280] text-center py-6">Keine Termine an diesem Tag</p>
          )}
        </Card>
      )}

      {/* Create Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Neuer Termin">
        <div className="space-y-4">
          <Input label="Titel" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="z.B. Elternabend" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Datum" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            <Input label="Uhrzeit (optional)" type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
          </div>
          <Select label="Typ" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as CalendarEvent['type'] })}
            options={['Termin','Klausur','Aufgabe','Ferien','Sonstige'].map(v => ({ value: v, label: v }))} />
          <TextArea label="Beschreibung (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <div className="flex gap-3 pt-4">
            <Button onClick={handleCreate} className="flex-1">Erstellen</Button>
            <Button variant="secondary" onClick={() => setCreateModal(false)}>Abbrechen</Button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal open={detailModal} onClose={() => { setDetailModal(false); setSelectedEvent(null) }} title="Termindetails" size="sm">
        {selectedEvent && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 rounded-full mt-1 shrink-0" style={{ backgroundColor: selectedEvent.color }} />
              <div>
                <h3 className="text-lg font-semibold text-[#111827] dark:text-[#F9FAFB]">{selectedEvent.title}</h3>
                <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-md mt-1 ${typeColors[selectedEvent.type] || typeColors.Sonstige}`}>
                  {selectedEvent.type}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                <span>📅</span>
                <span>{formatDate(selectedEvent.date)}</span>
              </div>
              {selectedEvent.time && (
                <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                  <Clock size={14} />
                  <span>{selectedEvent.time} Uhr</span>
                </div>
              )}
              {selectedEvent.subjectName && (
                <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                  <span>📚</span>
                  <span>{selectedEvent.subjectName}</span>
                </div>
              )}
              {selectedEvent.room && (
                <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                  <MapPin size={14} />
                  <span>Raum {selectedEvent.room}</span>
                </div>
              )}
              {selectedEvent.duration && (
                <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                  <Clock size={14} />
                  <span>{selectedEvent.duration} Minuten</span>
                </div>
              )}
            </div>

            {selectedEvent.description && (
              <div className="p-3 rounded-xl bg-[#F8F9FB] dark:bg-[#0F172A]">
                <p className="text-sm text-[#6B7280]">{selectedEvent.description}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {selectedEvent.source === 'event' && (
                <>
                  <Button variant="secondary" icon={<Edit size={16} />} onClick={openEdit} className="flex-1">
                    Bearbeiten
                  </Button>
                  <Button variant="danger" icon={<Trash2 size={16} />} onClick={handleDelete}>
                    Löschen
                  </Button>
                </>
              )}
              {selectedEvent.source !== 'event' && (
                <p className="text-xs text-[#6B7280] italic w-full text-center">
                  {selectedEvent.source === 'exam' ? 'Klausuren werden unter Prüfungen verwaltet.' : 'Aufgaben werden unter Aufgaben verwaltet.'}
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal open={editModal} onClose={() => { setEditModal(false); setSelectedEvent(null) }} title="Termin bearbeiten">
        <div className="space-y-4">
          <Input label="Titel" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Datum" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            <Input label="Uhrzeit" type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
          </div>
          <Select label="Typ" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as CalendarEvent['type'] })}
            options={['Termin','Klausur','Aufgabe','Ferien','Sonstige'].map(v => ({ value: v, label: v }))} />
          <TextArea label="Beschreibung" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <div className="flex gap-3 pt-4">
            <Button onClick={handleEdit} className="flex-1">Speichern</Button>
            <Button variant="secondary" onClick={() => { setEditModal(false); setSelectedEvent(null) }}>Abbrechen</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
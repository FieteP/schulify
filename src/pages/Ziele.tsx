import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Flag, Trash2, CheckCircle2, Circle } from 'lucide-react'
import { useGoalStore }    from '../store/goalStore'
import { useSubjectStore } from '../store/subjectStore'
import { useSettingsStore }from '../store/settingsStore'
import { useAuthStore }    from '../store/authStore'
import { getPointsColor }  from '../utils/helpers'
import Card          from '../components/cards/Card'
import Modal         from '../components/forms/Modal'
import Input         from '../components/forms/Input'
import Select        from '../components/forms/Select'
import Button        from '../components/forms/Button'
import EmptyState    from '../components/forms/EmptyState'
import PointsSlider  from '../components/forms/PointsSlider'
import type { Semester } from '../types'

export default function Ziele() {
  const { goals, add, toggle, remove } = useGoalStore()
  const subjects        = useSubjectStore(s => s.subjects)
  const currentSemester = useSettingsStore(s => s.currentSemester)
  const user            = useAuthStore(s => s.user)

  const [modal, setModal] = useState(false)
  const [form, setForm]   = useState({
    title: '',
    subjectId: '',
    targetPoints: 10,
    currentPoints: undefined as number | undefined,
    semester: currentSemester as Semester,
    deadline: '',
    achieved: false,
  })

  const handleSubmit = async () => {
    if (!form.title || !user) return
    await add(user.id, form)
    setModal(false)
    setForm({
      title: '', subjectId: '', targetPoints: 10,
      currentPoints: undefined, semester: currentSemester,
      deadline: '', achieved: false,
    })
  }

  const open = goals.filter(g => !g.achieved)
  const done = goals.filter(g => g.achieved)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111827] dark:text-[#F9FAFB]">Ziele</h1>
          <p className="text-sm text-[#6B7280] dark:text-[#94A3B8] mt-1">
            {done.length}/{goals.length} erreicht
          </p>
        </div>
        <Button icon={<Plus size={18} />} onClick={() => setModal(true)}>
          Neues Ziel
        </Button>
      </div>

      {goals.length > 0 ? (
        <div className="space-y-6">
          {open.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3">
                Aktiv
              </p>
              <div className="space-y-3">
                <AnimatePresence>
                  {open.map(goal => {
                    const sub = subjects.find(s => s.id === goal.subjectId)
                    const pct = goal.currentPoints
                      ? Math.min((goal.currentPoints / goal.targetPoints) * 100, 100)
                      : 0
                    return (
                      <motion.div
                        key={goal.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <Card>
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => toggle(goal.id)}
                              className="text-[#6B7280] hover:text-green-500 transition-colors mt-0.5"
                            >
                              <Circle size={22} />
                            </button>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">
                                {goal.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                {sub && (
                                  <span
                                    className="text-[10px] font-medium px-2 py-0.5 rounded-md text-white"
                                    style={{ backgroundColor: sub.color }}
                                  >
                                    {sub.shortName}
                                  </span>
                                )}
                                <span className="text-xs text-[#6B7280]">
                                  Ziel: {goal.targetPoints} P
                                </span>
                                {goal.deadline && (
                                  <span className="text-xs text-[#6B7280]">
                                    bis {new Date(goal.deadline).toLocaleDateString('de-DE')}
                                  </span>
                                )}
                              </div>
                              <div className="mt-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-[#6B7280]">
                                    {goal.currentPoints || 0} / {goal.targetPoints} P
                                  </span>
                                  <span
                                    className="text-xs font-medium"
                                    style={{ color: getPointsColor(goal.targetPoints) }}
                                  >
                                    {Math.round(pct)}%
                                  </span>
                                </div>
                                <div className="h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                      width: `${pct}%`,
                                      backgroundColor: getPointsColor(goal.targetPoints)
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => remove(goal.id)}
                              className="p-1.5 rounded-lg text-[#6B7280] hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </Card>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </div>
          )}

          {done.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3">
                Erreicht 🎉
              </p>
              <div className="space-y-3">
                {done.map(goal => {
                  const sub = subjects.find(s => s.id === goal.subjectId)
                  return (
                    <Card key={goal.id}>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggle(goal.id)}
                          className="text-green-500"
                        >
                          <CheckCircle2 size={22} />
                        </button>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[#6B7280] line-through">
                            {goal.title}
                          </p>
                          {sub && (
                            <span
                              className="text-[10px] font-medium px-2 py-0.5 rounded-md text-white"
                              style={{ backgroundColor: sub.color }}
                            >
                              {sub.shortName}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => remove(goal.id)}
                          className="p-1.5 rounded-lg text-[#6B7280] hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          icon={<Flag size={32} />}
          title="Keine Ziele gesetzt"
          description="Setze dir Lernziele und verfolge deinen Fortschritt."
          action={
            <Button icon={<Plus size={18} />} onClick={() => setModal(true)}>
              Erstes Ziel erstellen
            </Button>
          }
        />
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Neues Ziel">
        <div className="space-y-4">
          <Input
            label="Titel"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            placeholder="z.B. Mathe auf 10 Punkte verbessern"
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Fach (optional)"
              value={form.subjectId}
              onChange={e => setForm({ ...form, subjectId: e.target.value })}
              options={[
                { value: '', label: 'Kein Fach' },
                ...subjects.map(s => ({ value: s.id, label: s.name }))
              ]}
            />
            <Select
              label="Semester"
              value={form.semester}
              onChange={e => setForm({ ...form, semester: e.target.value as Semester })}
              options={(['11.1','11.2','12.1','12.2'] as Semester[]).map(s => ({
                value: s, label: s
              }))}
            />
          </div>
          <PointsSlider
            label="Zielpunkte"
            value={form.targetPoints}
            onChange={v => setForm({ ...form, targetPoints: v })}
          />
          <Input
            label="Deadline (optional)"
            type="date"
            value={form.deadline}
            onChange={e => setForm({ ...form, deadline: e.target.value })}
          />
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSubmit} className="flex-1">Erstellen</Button>
            <Button variant="secondary" onClick={() => setModal(false)}>Abbrechen</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Flag, Trash2, CheckCircle2, Circle, Edit } from 'lucide-react'
import { useGoalStore }    from '../store/goalStore'
import { useSubjectStore } from '../store/subjectStore'
import { useGradeStore }   from '../store/gradeStore'
import { useSettingsStore } from '../store/settingsStore'
import { useAuthStore }    from '../store/authStore'
import { getPointsColor, calculateSubjectAverage } from '../utils/helpers'
import Card          from '../components/cards/Card'
import Modal         from '../components/forms/Modal'
import Input         from '../components/forms/Input'
import Select        from '../components/forms/Select'
import Button        from '../components/forms/Button'
import EmptyState    from '../components/forms/EmptyState'
import PointsSlider  from '../components/forms/PointsSlider'
import type { Semester } from '../types'

export default function Ziele() {
  const { goals, add, toggle, remove, update } = useGoalStore()
  const subjects        = useSubjectStore(s => s.subjects)
  const grades          = useGradeStore(s => s.grades)
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

  // Calculate actual current points from grades
  const goalsWithProgress = useMemo(() => {
    return goals.map(goal => {
      let currentAvg: number | undefined = goal.currentPoints

      // If goal has a subject, auto-calculate from grades
      if (goal.subjectId) {
        const avg = calculateSubjectAverage(grades, goal.subjectId, goal.semester)
        if (avg > 0) {
          currentAvg = avg
        }
      }

      const pct = currentAvg
        ? Math.min((currentAvg / goal.targetPoints) * 100, 100)
        : 0

      const autoAchieved = currentAvg ? currentAvg >= goal.targetPoints : false

      return {
        ...goal,
        calculatedPoints: currentAvg,
        percentage: pct,
        autoAchieved,
      }
    })
  }, [goals, grades])

  const handleSubmit = async () => {
    if (!form.title || !user) return
    await add(user.id, {
      ...form,
      subjectId: form.subjectId || undefined,
      deadline: form.deadline || undefined,
    })
    setModal(false)
    setForm({
      title: '', subjectId: '', targetPoints: 10,
      currentPoints: undefined, semester: currentSemester,
      deadline: '', achieved: false,
    })
  }

  const open = goalsWithProgress.filter(g => !g.achieved && !g.autoAchieved)
  const done = goalsWithProgress.filter(g => g.achieved || g.autoAchieved)

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

      {goalsWithProgress.length > 0 ? (
        <div className="space-y-6">
          {open.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3">Aktiv</p>
              <div className="space-y-3">
                <AnimatePresence>
                  {open.map(goal => {
                    const sub = subjects.find(s => s.id === goal.subjectId)
                    return (
                      <motion.div key={goal.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Card>
                          <div className="flex items-start gap-3">
                            <button onClick={() => toggle(goal.id)} className="text-[#6B7280] hover:text-green-500 transition-colors mt-0.5">
                              <Circle size={22} />
                            </button>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">{goal.title}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {sub && (
                                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md text-white" style={{ backgroundColor: sub.color }}>
                                    {sub.shortName}
                                  </span>
                                )}
                                <span className="text-xs text-[#6B7280]">Ziel: {goal.targetPoints} P</span>
                                <span className="text-xs text-[#6B7280]">Semester: {goal.semester}</span>
                                {goal.deadline && (
                                  <span className="text-xs text-[#6B7280]">
                                    bis {new Date(goal.deadline).toLocaleDateString('de-DE')}
                                  </span>
                                )}
                              </div>
                              <div className="mt-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-[#6B7280]">
                                    {goal.calculatedPoints?.toFixed(1) || '0'} / {goal.targetPoints} P
                                    {goal.subjectId && <span className="text-[10px] ml-1">(automatisch)</span>}
                                  </span>
                                  <span className="text-xs font-medium" style={{ color: getPointsColor(goal.calculatedPoints || 0) }}>
                                    {Math.round(goal.percentage)}%
                                  </span>
                                </div>
                                <div className="h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                      width: `${goal.percentage}%`,
                                      backgroundColor: getPointsColor(goal.calculatedPoints || 0)
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                            <button onClick={() => remove(goal.id)} className="p-1.5 rounded-lg text-[#6B7280] hover:text-red-500 transition-colors">
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
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3">Erreicht 🎉</p>
              <div className="space-y-3">
                {done.map(goal => {
                  const sub = subjects.find(s => s.id === goal.subjectId)
                  return (
                    <Card key={goal.id}>
                      <div className="flex items-center gap-3">
                        <button onClick={() => toggle(goal.id)} className="text-green-500">
                          <CheckCircle2 size={22} />
                        </button>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">
                            {goal.title}
                            {goal.autoAchieved && !goal.achieved && (
                              <span className="text-[10px] ml-2 px-2 py-0.5 rounded-md bg-green-50 dark:bg-green-500/10 text-green-600">
                                Automatisch erreicht!
                              </span>
                            )}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {sub && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-md text-white" style={{ backgroundColor: sub.color }}>
                                {sub.shortName}
                              </span>
                            )}
                            <span className="text-xs text-[#6B7280]">
                              {goal.calculatedPoints?.toFixed(1) || '?'} / {goal.targetPoints} P
                            </span>
                          </div>
                        </div>
                        <button onClick={() => remove(goal.id)} className="p-1.5 rounded-lg text-[#6B7280] hover:text-red-500">
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
          description="Setze dir Lernziele und verfolge deinen Fortschritt. Wähle ein Fach aus und die Prozente werden automatisch berechnet!"
          action={
            <Button icon={<Plus size={18} />} onClick={() => setModal(true)}>
              Erstes Ziel erstellen
            </Button>
          }
        />
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Neues Ziel">
        <div className="space-y-4">
          <Input label="Titel" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="z.B. Mathe auf 10 Punkte verbessern" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Fach (optional)" value={form.subjectId} onChange={e => setForm({ ...form, subjectId: e.target.value })}
              options={[
                { value: '', label: 'Kein Fach' },
                ...subjects.map(s => ({ value: s.id, label: s.name }))
              ]} />
            <Select label="Semester" value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value as Semester })}
              options={(['11.1','11.2','12.1','12.2'] as Semester[]).map(s => ({ value: s, label: s }))} />
          </div>
          <PointsSlider label="Zielpunkte" value={form.targetPoints} onChange={v => setForm({ ...form, targetPoints: v })} />
          <Input label="Deadline (optional)" type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />

          {form.subjectId && (
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-xs text-blue-700 dark:text-blue-400">
              💡 Da ein Fach ausgewählt ist, wird der Fortschritt automatisch aus deinen Noten berechnet.
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button onClick={handleSubmit} className="flex-1">Erstellen</Button>
            <Button variant="secondary" onClick={() => setModal(false)}>Abbrechen</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
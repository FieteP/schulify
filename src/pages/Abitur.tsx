import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Info } from 'lucide-react'
import { useSubjectStore } from '../store/subjectStore'
import { useGradeStore }   from '../store/gradeStore'
import { calculateSubjectAverage, calculateAbiGrade, getPointsColor, pointsToGrade } from '../utils/helpers'
import Card from '../components/cards/Card'
import PointsSlider from '../components/forms/PointsSlider'
import { Semester } from '../types'

export default function Abitur() {
  const subjects = useSubjectStore(s => s.subjects)
  const grades   = useGradeStore(s => s.grades)
  const [abiScores, setAbiScores] = useState<Record<string, number>>({})

  const semData = useMemo(() => {
    const sems: Semester[] = ['11.1','11.2','12.1','12.2']
    const d: Record<string, Record<string, number>> = {}
    subjects.forEach(s => {
      d[s.id] = {}
      sems.forEach(sem => { d[s.id][sem] = calculateSubjectAverage(grades, s.id, sem) })
    })
    return d
  }, [subjects, grades])

  const blockI = useMemo(() => {
    const sems: Semester[] = ['11.1','11.2','12.1','12.2']
    let tp = 0, tc = 0
    subjects.forEach(s => {
      sems.forEach(sem => {
        const avg = semData[s.id]?.[sem] || 0
        if (avg > 0) { const f = s.courseType === 'LK' ? 2 : 1; tp += Math.round(avg) * f; tc++ }
      })
    })
    return { points: tc > 0 ? Math.min(Math.round((tp / tc) * 40), 600) : 0, count: tc }
  }, [subjects, semData])

  const abiSubs = subjects.filter(s => s.isAbiSubject)
  const blockII = useMemo(() => {
    return Math.min(abiSubs.reduce((t, s) => t + (abiScores[s.id] || 0) * 4, 0), 300)
  }, [abiSubs, abiScores])

  const total   = blockI.points + blockII
  const abiNote = calculateAbiGrade(total)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[#111827] dark:text-[#F9FAFB]">Abiturrechner</h1>
        <p className="text-sm text-[#6B7280] dark:text-[#94A3B8] mt-1">Voraussichtlicher Abiturschnitt</p>
      </div>

      <Card>
        <div className="text-center py-8">
          <p className="text-sm font-medium text-[#6B7280] mb-2">Voraussichtlicher Abiturschnitt</p>
          <p className="text-6xl font-bold text-[#111827] dark:text-[#F9FAFB] mb-2">{abiNote}</p>
          <p className="text-lg text-[#6B7280]">{total} / 900 Punkte</p>
          <div className="w-full max-w-md mx-auto mt-6 h-3 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500" style={{ width: `${(total / 900) * 100}%` }} />
          </div>
          <div className="flex justify-center gap-8 mt-4 text-sm">
            <div><p className="font-bold text-[#111827] dark:text-[#F9FAFB]">{blockI.points}</p><p className="text-xs text-[#6B7280]">Block I (max. 600)</p></div>
            <div><p className="font-bold text-[#111827] dark:text-[#F9FAFB]">{blockII}</p><p className="text-xs text-[#6B7280]">Block II (max. 300)</p></div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB] mb-1">Block I – Kurshalbjahre</h3>
          <p className="text-xs text-[#6B7280] mb-4">Ergebnisse aus allen Halbjahren</p>
          <div className="text-center py-2 mb-4">
            <p className="text-3xl font-bold" style={{ color: getPointsColor(blockI.points / 40) }}>{blockI.points}</p>
            <p className="text-xs text-[#6B7280] mt-1">von 600 · {blockI.count} Kurse</p>
          </div>
          <div className="space-y-2">
            {subjects.map(s => {
              const avgs = (['11.1','11.2','12.1','12.2'] as Semester[]).map(sem => semData[s.id]?.[sem] || 0)
              if (!avgs.some(a => a > 0)) return null
              return (
                <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg bg-[#F8F9FB] dark:bg-[#0F172A]">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ backgroundColor: s.color }}>{s.shortName}</div>
                  <span className="text-xs flex-1 text-[#111827] dark:text-[#F9FAFB] truncate">{s.name}</span>
                  <div className="flex gap-1">
                    {avgs.map((a, i) => <span key={i} className="text-[10px] font-medium w-6 text-center" style={{ color: a > 0 ? getPointsColor(a) : '#9CA3AF' }}>{a > 0 ? Math.round(a) : '–'}</span>)}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB] mb-1">Block II – Abiturprüfungen</h3>
          <p className="text-xs text-[#6B7280] mb-4">Prüfungsergebnisse</p>
          <div className="text-center py-2 mb-4">
            <p className="text-3xl font-bold" style={{ color: getPointsColor(blockII / 20) }}>{blockII}</p>
            <p className="text-xs text-[#6B7280] mt-1">von 300 Punkten</p>
          </div>
          {abiSubs.length > 0 ? (
            <div className="space-y-4">
              {abiSubs.map(s => (
                <div key={s.id}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ backgroundColor: s.color }}>{s.shortName}</div>
                    <span className="text-xs text-[#111827] dark:text-[#F9FAFB] flex-1">{s.name}</span>
                    <span className="text-[10px] text-[#6B7280]">{s.abiType || 'Prüfung'}</span>
                  </div>
                  <PointsSlider value={abiScores[s.id] || 0} onChange={v => setAbiScores(p => ({ ...p, [s.id]: v }))} />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center">
              <Info size={20} className="mx-auto text-[#6B7280] mb-2" />
              <p className="text-sm text-[#6B7280]">Markiere Fächer als Abiturfächer in der Fächerverwaltung</p>
            </div>
          )}
        </Card>
      </div>

      <Card>
        <div className="flex items-start gap-3">
          <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-[#6B7280]">Vereinfachte Berechnung. Die genauen Regeln variieren je nach Bundesland. Bitte überprüfe mit deiner Schule.</p>
        </div>
      </Card>
    </motion.div>
  )
}
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, BookOpen, Target, Calendar, ClipboardList, Award, AlertCircle, Clock } from 'lucide-react'
import { useGradeStore }   from '../store/gradeStore'
import { useSubjectStore } from '../store/subjectStore'
import { useTaskStore }    from '../store/taskStore'
import { useExamStore }    from '../store/examStore'
import { useGoalStore }    from '../store/goalStore'
import { useSettingsStore }from '../store/settingsStore'
import {
  calculateSubjectAverage, calculateOverallAverage,
  pointsToGrade, getPointsColor, getDaysUntil, formatDateShort
} from '../utils/helpers'
import StatCard  from '../components/cards/StatCard'
import Card      from '../components/cards/Card'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell
} from 'recharts'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }

export default function Dashboard() {
  const grades   = useGradeStore(s => s.grades)
  const subjects = useSubjectStore(s => s.subjects)
  const tasks    = useTaskStore(s => s.tasks)
  const exams    = useExamStore(s => s.exams)
  const goals    = useGoalStore(s => s.goals)
  const currentSemester = useSettingsStore(s => s.currentSemester)

  const semesterGrades = grades.filter(g => g.semester === currentSemester)
  const overallAvg     = calculateOverallAverage(semesterGrades, subjects)
  const openTasks      = tasks.filter(t => t.status !== 'Erledigt')
  const achievedGoals  = goals.filter(g => g.achieved)

  const upcomingExams = useMemo(() => {
    const now = new Date().toISOString().split('T')[0]
    return exams
      .filter(e => e.date >= now && e.status !== 'Benotet')
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5)
  }, [exams])

  const subjectAverages = useMemo(() =>
    subjects
      .map(s => ({ subject: s, avg: calculateSubjectAverage(semesterGrades, s.id, currentSemester) }))
      .filter(s => s.avg > 0)
      .sort((a, b) => b.avg - a.avg),
    [subjects, semesterGrades, currentSemester]
  )

  const bestSubjects  = subjectAverages.slice(0, 3)
  const worstSubjects = [...subjectAverages].sort((a, b) => a.avg - b.avg).slice(0, 3)
  const chartData     = subjectAverages.map(s => ({ name: s.subject.shortName, punkte: s.avg, color: s.subject.color }))

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-7xl mx-auto">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-[#111827] dark:text-[#F9FAFB]">Dashboard</h1>
        <p className="text-sm text-[#6B7280] dark:text-[#94A3B8] mt-1">Semester {currentSemester}</p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Ø Punkte"
          value={overallAvg > 0 ? `${overallAvg.toFixed(1)} P` : '–'}
          subtitle={overallAvg > 0 ? pointsToGrade(overallAvg) : 'Keine Noten'}
          icon={<TrendingUp size={20} />}
          color={overallAvg > 0 ? getPointsColor(overallAvg) : '#6B7280'}
        />
        <StatCard title="Fächer" value={subjects.length} subtitle={`${subjectAverages.length} benotet`} icon={<BookOpen size={20} />} color="#8B5CF6" />
        <StatCard title="Aufgaben" value={openTasks.length} subtitle="offen" icon={<ClipboardList size={20} />} color="#F59E0B" />
        <StatCard title="Ziele" value={`${achievedGoals.length}/${goals.length}`} subtitle="erreicht" icon={<Target size={20} />} color="#10B981" />
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card>
            <h3 className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB] mb-4">Fächerübersicht</h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 15]} tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '13px' }} formatter={(v) => [`${v} Punkte`]} />
                  <Bar dataKey="punkte" radius={[8, 8, 0, 0]} maxBarSize={40}>
                    {chartData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-sm text-[#6B7280] dark:text-[#94A3B8]">Noch keine Noten eingetragen</div>
            )}
          </Card>
        </motion.div>

        {/* Upcoming Exams */}
        <motion.div variants={item}>
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={16} className="text-[#6B7280] dark:text-[#94A3B8]" />
              <h3 className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB]">Nächste Prüfungen</h3>
            </div>
            {upcomingExams.length > 0 ? (
              <div className="space-y-3">
                {upcomingExams.map(exam => {
                  const sub = subjects.find(s => s.id === exam.subjectId)
                  const days = getDaysUntil(exam.date)
                  return (
                    <div key={exam.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#F8F9FB] dark:bg-[#0F172A]">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: sub?.color || '#6B7280' }}>
                        {sub?.shortName || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB] truncate">{sub?.name || 'Unbekannt'}</p>
                        <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">{formatDateShort(exam.date)}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                        days <= 3 ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                        : days <= 7 ? 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                        : 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400'
                      }`}>
                        {days === 0 ? 'Heute' : days === 1 ? 'Morgen' : `${days}d`}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-[#6B7280] dark:text-[#94A3B8]">Keine anstehenden Prüfungen</div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={item}>
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Award size={16} className="text-green-500" />
              <h3 className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB]">Beste Fächer</h3>
            </div>
            {bestSubjects.length > 0 ? (
              <div className="space-y-3">
                {bestSubjects.map(({ subject, avg }, i) => (
                  <div key={subject.id} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#6B7280] dark:text-[#94A3B8] w-4">{i + 1}</span>
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color }} />
                    <span className="text-sm flex-1 text-[#111827] dark:text-[#F9FAFB]">{subject.name}</span>
                    <span className="text-sm font-bold" style={{ color: getPointsColor(avg) }}>{avg.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-[#6B7280] text-center py-4">Keine Daten</p>}
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle size={16} className="text-red-500" />
              <h3 className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB]">Verbesserungsbedarf</h3>
            </div>
            {worstSubjects.length > 0 ? (
              <div className="space-y-3">
                {worstSubjects.map(({ subject, avg }, i) => (
                  <div key={subject.id} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#6B7280] dark:text-[#94A3B8] w-4">{i + 1}</span>
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color }} />
                    <span className="text-sm flex-1 text-[#111827] dark:text-[#F9FAFB]">{subject.name}</span>
                    <span className="text-sm font-bold" style={{ color: getPointsColor(avg) }}>{avg.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-[#6B7280] text-center py-4">Keine Daten</p>}
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Clock size={16} className="text-yellow-500" />
              <h3 className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB]">Offene Aufgaben</h3>
            </div>
            {openTasks.length > 0 ? (
              <div className="space-y-2">
                {openTasks.slice(0, 5).map(task => {
                  const sub = subjects.find(s => s.id === task.subjectId)
                  return (
                    <div key={task.id} className="flex items-center gap-2 p-2 rounded-lg">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sub?.color || '#6B7280' }} />
                      <span className="text-sm flex-1 text-[#111827] dark:text-[#F9FAFB] truncate">{task.title}</span>
                      <span className="text-[10px] text-[#6B7280] shrink-0">{formatDateShort(task.dueDate)}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-[#6B7280] text-center py-4">Alles erledigt! 🎉</p>
            )}
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
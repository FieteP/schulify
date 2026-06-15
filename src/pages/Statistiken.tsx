import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
  LineChart, Line, PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts'
import { useGradeStore }   from '../store/gradeStore'
import { useSubjectStore } from '../store/subjectStore'
import { useSettingsStore }from '../store/settingsStore'
import { calculateSubjectAverage, calculateOverallAverage, pointsToGrade, getPointsColor } from '../utils/helpers'
import Card from '../components/cards/Card'
import StatCard from '../components/cards/StatCard'
import EmptyState from '../components/forms/EmptyState'

export default function Statistiken() {
  const grades   = useGradeStore(s => s.grades)
  const subjects = useSubjectStore(s => s.subjects)
  const currentSemester = useSettingsStore(s => s.currentSemester)
  const sg = grades.filter(g => g.semester === currentSemester)

  const stats = useMemo(() => {
    if (!sg.length) return null
    const overallAvg = calculateOverallAverage(sg, subjects)
    const pts = sg.map(g => g.points)
    const subjectAvgs = subjects.map(s => ({ name: s.shortName, fullName: s.name, punkte: calculateSubjectAverage(sg, s.id, currentSemester), color: s.color })).filter(s => s.punkte > 0).sort((a, b) => b.punkte - a.punkte)
    const distribution = Array.from({ length: 16 }, (_, i) => ({ punkte: i, anzahl: sg.filter(g => g.points === i).length }))
    const typeMap: Record<string, number> = {}
    sg.forEach(g => { typeMap[g.type] = (typeMap[g.type] || 0) + 1 })
    const typeData = Object.entries(typeMap).map(([name, value]) => ({ name, value }))
    const timeline = [...sg].sort((a, b) => a.date.localeCompare(b.date)).map((g, i, arr) => {
      const avg = arr.slice(0, i + 1).reduce((a, x) => a + x.points, 0) / (i + 1)
      return { datum: g.date.slice(5), punkte: g.points, durchschnitt: Math.round(avg * 10) / 10, fach: subjects.find(s => s.id === g.subjectId)?.shortName || '?' }
    })
    return { overallAvg, best: Math.max(...pts), worst: Math.min(...pts), subjectAvgs, distribution, typeData, timeline, total: sg.length }
  }, [sg, subjects, currentSemester])

  const COLORS = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#06B6D4']

  if (!stats) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-[#111827] dark:text-[#F9FAFB] mb-6">Statistiken</h1>
      <EmptyState icon={<BarChart3 size={32} />} title="Noch keine Daten" description="Trage Noten ein, um Statistiken zu sehen." />
    </motion.div>
  )

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-[#111827] dark:text-[#F9FAFB]">Statistiken</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Durchschnitt" value={`${stats.overallAvg.toFixed(1)} P`} subtitle={pointsToGrade(stats.overallAvg)} icon={<TrendingUp size={20} />} color={getPointsColor(stats.overallAvg)} />
        <StatCard title="Beste Note"   value={`${stats.best} P`}  subtitle={pointsToGrade(stats.best)}  icon={<TrendingUp size={20} />}   color="#10B981" />
        <StatCard title="Schlechteste" value={`${stats.worst} P`} subtitle={pointsToGrade(stats.worst)} icon={<TrendingDown size={20} />} color="#EF4444" />
        <StatCard title="Noten total"  value={stats.total}         subtitle={`${subjects.length} Fächer`} icon={<BarChart3 size={20} />}   color="#8B5CF6" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB] mb-4">Fächervergleich</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.subjectAvgs} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
              <XAxis type="number" domain={[0, 15]} tick={{ fontSize: 12, fill: '#6B7280' }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} width={36} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '13px' }} />
              <Bar dataKey="punkte" radius={[0, 8, 8, 0]} maxBarSize={24}>
                {stats.subjectAvgs.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB] mb-4">Notenverlauf</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="fach" tick={{ fontSize: 11, fill: '#6B7280' }} />
              <YAxis domain={[0, 15]} tick={{ fontSize: 12, fill: '#6B7280' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '13px' }} />
              <Line type="monotone" dataKey="punkte" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="durchschnitt" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB] mb-4">Notenverteilung</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.distribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis dataKey="punkte" tick={{ fontSize: 11, fill: '#6B7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '13px' }} />
              <Bar dataKey="anzahl" radius={[6, 6, 0, 0]} maxBarSize={28}>
                {stats.distribution.map((e, i) => <Cell key={i} fill={getPointsColor(e.punkte)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB] mb-4">Notenarten</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={stats.typeData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                {stats.typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '13px' }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {stats.subjectAvgs.length >= 3 && (
          <Card>
            <h3 className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB] mb-4">Stärkenprofil</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={stats.subjectAvgs.slice(0, 8).map(s => ({ subject: s.name, punkte: s.punkte, fullMark: 15 }))}>
                <PolarGrid stroke="#E5E7EB" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#6B7280' }} />
                <PolarRadiusAxis domain={[0, 15]} tick={{ fontSize: 10, fill: '#6B7280' }} />
                <Radar dataKey="punkte" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>
    </motion.div>
  )
}
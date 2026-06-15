import { Subject } from '../../types'
import { calculateSubjectAverage, pointsToGrade, getPointsColor } from '../../utils/helpers'
import { useGradeStore } from '../../store/gradeStore'
import { useSettingsStore } from '../../store/settingsStore'
import Card from './Card'

interface SubjectCardProps { subject: Subject; onClick?: () => void }

export default function SubjectCard({ subject, onClick }: SubjectCardProps) {
  const grades = useGradeStore(s => s.grades)
  const currentSemester = useSettingsStore(s => s.currentSemester)
  const avg = calculateSubjectAverage(grades, subject.id, currentSemester)

  return (
    <Card hover onClick={onClick}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ backgroundColor: subject.color }}>
          {subject.shortName}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB] truncate">{subject.name}</h3>
          <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-0.5">
            {subject.teacher} · {subject.courseType} · {subject.room}
          </p>
        </div>
        {avg > 0 && (
          <div className="text-right shrink-0">
            <p className="text-lg font-bold" style={{ color: getPointsColor(avg) }}>{avg.toFixed(1)}</p>
            <p className="text-[10px] text-[#6B7280] dark:text-[#94A3B8]">{pointsToGrade(avg)}</p>
          </div>
        )}
      </div>
    </Card>
  )
}
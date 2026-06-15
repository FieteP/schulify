import { getPointsColor, pointsToGrade } from '../../utils/helpers'

interface Props { value: number; onChange: (v: number) => void; label?: string }

export default function PointsSlider({ value, onChange, label }: Props) {
  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">{label}</label>}
      <div className="flex items-center gap-4">
        <input
          type="range" min={0} max={15} step={1} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="flex-1 h-2 rounded-full appearance-none cursor-pointer accent-blue-600"
        />
        <div className="flex items-center gap-2 shrink-0 w-16">
          <span className="text-xl font-bold w-6 text-center" style={{ color: getPointsColor(value) }}>{value}</span>
          <span className="text-xs text-[#6B7280] dark:text-[#94A3B8]">{pointsToGrade(value)}</span>
        </div>
      </div>
    </div>
  )
}
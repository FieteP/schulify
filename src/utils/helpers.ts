import { Grade, Subject, Semester } from '../types'

export function pointsToGrade(p: number): string {
  const m: Record<number, string> = {
    15:'1+',14:'1',13:'1-',12:'2+',11:'2',10:'2-',
    9:'3+',8:'3',7:'3-',6:'4+',5:'4',4:'4-',
    3:'5+',2:'5',1:'5-',0:'6'
  }
  return m[Math.max(0, Math.min(15, Math.round(p)))] ?? '6'
}

export function calculateAverage(grades: Grade[]): number {
  if (!grades.length) return 0
  const defaultW: Record<string, number> = {
    Klausur:2, Mündlich:1, Referat:1, Projekt:1, Mitarbeit:1, Test:1, Sonstige:1
  }
  let tw = 0, tp = 0
  grades.forEach(g => {
    const w = (defaultW[g.type] ?? 1) * g.weight
    tp += g.points * w; tw += w
  })
  return tw > 0 ? Math.round((tp / tw) * 100) / 100 : 0
}

export function calculateSubjectAverage(
  grades: Grade[], subjectId: string, semester?: Semester
): number {
  let f = grades.filter(g => g.subjectId === subjectId)
  if (semester) f = f.filter(g => g.semester === semester)
  return calculateAverage(f)
}

export function calculateOverallAverage(grades: Grade[], subjects: Subject[]): number {
  if (!subjects.length) return 0
  const avgs = subjects.map(s => calculateSubjectAverage(grades, s.id)).filter(a => a > 0)
  if (!avgs.length) return 0
  return Math.round((avgs.reduce((a, b) => a + b, 0) / avgs.length) * 100) / 100
}

export function calculateAbiGrade(p: number): string {
  if (p >= 823) return '1,0'; if (p >= 805) return '1,1'; if (p >= 787) return '1,2'
  if (p >= 769) return '1,3'; if (p >= 751) return '1,4'; if (p >= 733) return '1,5'
  if (p >= 715) return '1,6'; if (p >= 697) return '1,7'; if (p >= 679) return '1,8'
  if (p >= 661) return '1,9'; if (p >= 643) return '2,0'; if (p >= 625) return '2,1'
  if (p >= 607) return '2,2'; if (p >= 589) return '2,3'; if (p >= 571) return '2,4'
  if (p >= 553) return '2,5'; if (p >= 535) return '2,6'; if (p >= 517) return '2,7'
  if (p >= 499) return '2,8'; if (p >= 481) return '2,9'; if (p >= 463) return '3,0'
  if (p >= 445) return '3,1'; if (p >= 427) return '3,2'; if (p >= 409) return '3,3'
  if (p >= 391) return '3,4'; if (p >= 373) return '3,5'; if (p >= 355) return '3,6'
  if (p >= 337) return '3,7'; if (p >= 319) return '3,8'; if (p >= 301) return '3,9'
  if (p >= 283) return '4,0'; return 'n.b.'
}

export function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit', year:'numeric' })
}

export function formatDateShort(d: string): string {
  return new Date(d).toLocaleDateString('de-DE', { day:'2-digit', month:'short' })
}

export function getDaysUntil(d: string): number {
  const now = new Date(); now.setHours(0,0,0,0)
  const t = new Date(d); t.setHours(0,0,0,0)
  return Math.ceil((t.getTime() - now.getTime()) / 86400000)
}

export function getPointsColor(p: number): string {
  if (p >= 13) return '#10B981'
  if (p >= 10) return '#34D399'
  if (p >= 7)  return '#FBBF24'
  if (p >= 4)  return '#F97316'
  return '#EF4444'
}

export const SUBJECT_COLORS = [
  // Blau
  '#3B82F6',
  '#2563EB',
  '#1D4ED8',

  // Hellblau
  '#38BDF8',
  '#7DD3FC',
  '#06B6D4',

  // Rot
  '#EF4444',
  '#DC2626',
  '#B91C1C',

  // Orange / Rot
  '#F97316',
  '#EA580C',
  '#FB7185',

  // Orange
  '#FB923C',
  '#F59E0B',

  // Gelb
  '#FACC15',
  '#EAB308',

  // Grün
  '#22C55E',

  // Hellgrün
  '#84CC16',
  '#A3E635',

  // Pink
  '#EC4899',
  '#F472B6',

  // Lila
  '#8B5CF6',
  '#A855F7',
  '#7C3AED',

  // Dunkelgrau
  '#374151',

  // Grau
  '#6B7280',

  // Hellgrau
  '#9CA3AF',

  // Weiteres Grau
  '#4B5563',

  // Türkis
  '#14B8A6',

  // Schwarz
  '#111827'
]
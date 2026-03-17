import { TopicStatus, IssueStatus } from '@/types'

export const SITES = ['OPS', 'BBT', 'KSN', 'CBI', 'RA2', 'AYA'] as const

export const SITE_LABELS: Record<string, string> = {
  OPS: 'ภาพรวม (Main)',
  BBT: 'บางบัวทอง',
  KSN: 'คลองส่งน้ำ',
  CBI: 'ชลบุรี',
  RA2: 'พระราม 2',
  AYA: 'อยุธยา',
}

export const STATUS_CONFIG: Record<
  TopicStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  open: {
    label: 'Open',
    color: 'text-gray-400',
    bg: 'bg-gray-800',
    dot: 'bg-gray-400',
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-blue-400',
    bg: 'bg-blue-900/40',
    dot: 'bg-blue-400',
  },
  blocked: {
    label: 'Blocked',
    color: 'text-yellow-400',
    bg: 'bg-yellow-900/40',
    dot: 'bg-yellow-400',
  },
  done: {
    label: 'Done',
    color: 'text-green-400',
    bg: 'bg-green-900/40',
    dot: 'bg-green-400',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-red-400',
    bg: 'bg-red-900/40',
    dot: 'bg-red-400',
  },
}

export const ISSUE_STATUS_CONFIG: Record<
  IssueStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  open: { label: 'Open', color: 'text-red-400', bg: 'bg-red-900/40', dot: 'bg-red-400' },
  in_progress: {
    label: 'In Progress',
    color: 'text-blue-400',
    bg: 'bg-blue-900/40',
    dot: 'bg-blue-400',
  },
  resolved: {
    label: 'Resolved',
    color: 'text-green-400',
    bg: 'bg-green-900/40',
    dot: 'bg-green-400',
  },
}

export function formatDate(date: string | Date | undefined): string {
  if (!date) return '—'
  const d = new Date(date)
  return d.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function isOverdue(date?: string): boolean {
  if (!date) return false
  return new Date(date) < new Date()
}

export function daysUntil(date?: string): number | null {
  if (!date) return null
  const diff = new Date(date).getTime() - new Date().getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function calcProgress(items: { done: boolean }[]): { done: number; total: number; pct: number } {
  const total = items.length
  const done = items.filter((i) => i.done).length
  return { done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100) }
}

// ── Week helpers ──────────────────────────────────────────────
/** Returns the Monday of the week for a given date */
export function getWeekStart(date: string | Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust when Sunday
  const monday = new Date(d)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

/** "17-21 Feb 2026" style label */
export function formatWeekLabel(weekStart: Date): string {
  const end = new Date(weekStart)
  end.setDate(end.getDate() + 4) // Friday
  const startDay = weekStart.getDate()
  const endDay = end.getDate()
  const month = end.toLocaleDateString('en-GB', { month: 'short' })
  const year = end.getFullYear()
  return `${startDay}–${endDay} ${month} ${year}`
}

/** ISO key like "2026-02-17" for grouping */
export function getWeekKey(date: string | Date): string {
  const mon = getWeekStart(date)
  return mon.toISOString().split('T')[0]
}

/** Get all unique week keys from a list of topics, sorted newest first */
export function getWeekKeys(dates: (string | Date)[]): string[] {
  const keys = new Set(dates.map(getWeekKey))
  return Array.from(keys).sort((a, b) => (a < b ? 1 : -1))
}

'use client'
import { TopicStatus, IssueStatus } from '@/types'
import { STATUS_CONFIG, ISSUE_STATUS_CONFIG } from '@/lib/utils'

export function TopicStatusBadge({ status }: { status: TopicStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

export function IssueStatusBadge({ status }: { status: IssueStatus }) {
  const cfg = ISSUE_STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

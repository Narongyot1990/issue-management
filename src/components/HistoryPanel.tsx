'use client'
import { HistoryEntry, HistoryAction } from '@/types'
import { formatDate } from '@/lib/utils'
import { Clock, CheckSquare, Plus, Trash2, RefreshCw, Edit3, Link } from 'lucide-react'

const ACTION_CONFIG: Record<HistoryAction, { icon: React.ReactNode; label: string; color: string }> = {
  created:          { icon: <Plus className="w-3.5 h-3.5" />,       label: 'Created',        color: 'text-blue-400' },
  status_changed:   { icon: <RefreshCw className="w-3.5 h-3.5" />,  label: 'Status changed', color: 'text-yellow-400' },
  item_checked:     { icon: <CheckSquare className="w-3.5 h-3.5" />,label: 'Checked',        color: 'text-green-400' },
  item_unchecked:   { icon: <CheckSquare className="w-3.5 h-3.5" />,label: 'Unchecked',      color: 'text-gray-400' },
  item_added:       { icon: <Plus className="w-3.5 h-3.5" />,       label: 'Item added',     color: 'text-blue-400' },
  item_deleted:     { icon: <Trash2 className="w-3.5 h-3.5" />,     label: 'Item deleted',   color: 'text-red-400' },
  field_updated:    { icon: <Edit3 className="w-3.5 h-3.5" />,      label: 'Updated',        color: 'text-purple-400' },
  issue_linked:     { icon: <Link className="w-3.5 h-3.5" />,       label: 'Issue linked',   color: 'text-orange-400' },
  progress_updated: { icon: <RefreshCw className="w-3.5 h-3.5" />,  label: 'Progress',       color: 'text-teal-400' },
}

interface Props {
  history: HistoryEntry[]
}

export function HistoryPanel({ history }: Props) {
  const sorted = [...history].reverse()

  return (
    <div className="border-t border-[#2a2a30] pt-5">
      <p className="text-xs text-gray-500 mb-3 flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5" />
        History ({history.length} entries)
      </p>

      {sorted.length === 0 ? (
        <p className="text-sm text-gray-600">No history yet.</p>
      ) : (
        <div className="flex flex-col gap-1">
          {sorted.map((entry) => {
            const cfg = ACTION_CONFIG[entry.action] ?? {
              icon: <Clock className="w-3.5 h-3.5" />,
              label: entry.action,
              color: 'text-gray-400',
            }
            return (
              <div key={entry._id} className="flex items-start gap-2.5 py-1.5">
                <span className={`mt-0.5 shrink-0 ${cfg.color}`}>{cfg.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-300">
                    {entry.note ?? (
                      <>
                        <span className={cfg.color}>{cfg.label}</span>
                        {entry.field && <span className="text-gray-500"> · {entry.field}</span>}
                        {entry.oldValue && (
                          <span className="text-gray-600"> {entry.oldValue} → </span>
                        )}
                        {entry.newValue && (
                          <span className="text-gray-400">{entry.newValue}</span>
                        )}
                      </>
                    )}
                  </p>
                </div>
                <span className="text-xs text-gray-600 shrink-0">
                  {formatDate(entry.createdAt)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

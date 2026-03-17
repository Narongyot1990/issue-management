'use client'

interface ProgressBarProps {
  done: number
  total: number
  showLabel?: boolean
}

export function ProgressBar({ done, total, showLabel = true }: ProgressBarProps) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)
  const color =
    pct === 100
      ? 'bg-green-500'
      : pct >= 50
      ? 'bg-blue-500'
      : pct > 0
      ? 'bg-yellow-500'
      : 'bg-gray-600'

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-gray-400 w-14 text-right shrink-0">
          {done}/{total}
        </span>
      )}
    </div>
  )
}

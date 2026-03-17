'use client'
import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { TopicStatusBadge } from '@/components/StatusBadge'
import { Topic, Site, HistoryEntry, HistoryAction } from '@/types'
import { SITES, formatDate } from '@/lib/utils'
import {
  Clock, CheckSquare, Plus, Trash2, RefreshCw,
  Edit3, Link, Calendar,
} from 'lucide-react'

const ACTION_ICON: Record<HistoryAction, React.ReactNode> = {
  created:          <Plus className="w-3.5 h-3.5" />,
  status_changed:   <RefreshCw className="w-3.5 h-3.5" />,
  item_checked:     <CheckSquare className="w-3.5 h-3.5" />,
  item_unchecked:   <CheckSquare className="w-3.5 h-3.5" />,
  item_added:       <Plus className="w-3.5 h-3.5" />,
  item_deleted:     <Trash2 className="w-3.5 h-3.5" />,
  field_updated:    <Edit3 className="w-3.5 h-3.5" />,
  issue_linked:     <Link className="w-3.5 h-3.5" />,
  progress_updated: <RefreshCw className="w-3.5 h-3.5" />,
}

const ACTION_COLOR: Record<HistoryAction, string> = {
  created:          'text-blue-400',
  status_changed:   'text-yellow-400',
  item_checked:     'text-green-400',
  item_unchecked:   'text-gray-400',
  item_added:       'text-blue-400',
  item_deleted:     'text-red-400',
  field_updated:    'text-purple-400',
  issue_linked:     'text-orange-400',
  progress_updated: 'text-teal-400',
}

interface FlatEntry {
  topicId: string
  topicTitle: string
  topicSite: Site
  topicStatus: Topic['status']
  topicDate: string
  entry: HistoryEntry
}

export default function HistoryPage() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [siteFilter, setSiteFilter] = useState<Site | 'ALL'>('ALL')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/topics')
      .then((r) => r.json())
      .then((data) => { setTopics(data); setLoading(false) })
  }, [])

  const flat: FlatEntry[] = topics
    .filter((t) => siteFilter === 'ALL' || t.site === siteFilter)
    .flatMap((t) =>
      (t.history ?? []).map((entry) => ({
        topicId: t._id,
        topicTitle: t.title,
        topicSite: t.site,
        topicStatus: t.status,
        topicDate: t.date,
        entry,
      }))
    )
    .sort((a, b) => new Date(b.entry.createdAt).getTime() - new Date(a.entry.createdAt).getTime())

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto scrollbar-thin bg-[#0d0d0f]">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-lg font-semibold text-white">History</h1>
              <p className="text-sm text-gray-500 mt-0.5">All activity across topics</p>
            </div>
            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value as Site | 'ALL')}
              className="bg-[#18181c] border border-[#2a2a30] rounded-lg px-2.5 py-1.5 text-sm text-gray-300 focus:outline-none"
            >
              <option value="ALL">All Sites</option>
              {SITES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="text-center py-16 text-gray-600 text-sm">Loading...</div>
          ) : flat.length === 0 ? (
            <div className="text-center py-16 text-gray-600 text-sm">No history yet</div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[18px] top-0 bottom-0 w-px bg-[#2a2a30]" />

              <div className="flex flex-col gap-0">
                {flat.map((item, idx) => {
                  const color = ACTION_COLOR[item.entry.action] ?? 'text-gray-400'
                  const icon = ACTION_ICON[item.entry.action] ?? <Clock className="w-3.5 h-3.5" />
                  const showDateSep =
                    idx === 0 ||
                    formatDate(flat[idx - 1].entry.createdAt) !== formatDate(item.entry.createdAt)

                  return (
                    <div key={`${item.topicId}-${item.entry._id}`}>
                      {showDateSep && (
                        <div className="flex items-center gap-3 py-3 pl-10">
                          <Calendar className="w-3 h-3 text-gray-600" />
                          <span className="text-xs text-gray-600 font-medium">
                            {formatDate(item.entry.createdAt)}
                          </span>
                        </div>
                      )}

                      <div className="flex items-start gap-4 py-2.5 pl-1">
                        {/* Timeline dot */}
                        <div className={`w-8 h-8 rounded-full bg-[#18181c] border border-[#2a2a30] flex items-center justify-center shrink-0 z-10 ${color}`}>
                          {icon}
                        </div>

                        <div className="flex-1 min-w-0 bg-[#18181c] border border-[#2a2a30] rounded-lg px-3 py-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-200">
                                {item.entry.note ?? (
                                  <>
                                    <span className={color}>{item.entry.action.replace(/_/g, ' ')}</span>
                                    {item.entry.oldValue && (
                                      <span className="text-gray-500"> {item.entry.oldValue} → {item.entry.newValue}</span>
                                    )}
                                  </>
                                )}
                              </p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-xs text-gray-600 bg-[#111114] px-1.5 py-0.5 rounded">
                                  {item.topicSite}
                                </span>
                                <span className="text-xs text-gray-500 truncate">{item.topicTitle}</span>
                                <TopicStatusBadge status={item.topicStatus} />
                              </div>
                            </div>
                            <span className="text-xs text-gray-600 shrink-0">
                              {new Date(item.entry.createdAt).toLocaleTimeString('th-TH', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

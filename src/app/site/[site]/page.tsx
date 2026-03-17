'use client'
import { use, useEffect, useState, useCallback } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { TopicStatusBadge } from '@/components/StatusBadge'
import { ProgressBar } from '@/components/ProgressBar'
import { TopicDetail } from '@/components/TopicDetail'
import { NewTopicModal } from '@/components/NewTopicModal'
import { Topic, Site, TopicStatus } from '@/types'
import { SITE_LABELS, STATUS_CONFIG, formatDate, calcProgress, isOverdue, daysUntil } from '@/lib/utils'
import { Plus, Calendar, Clock } from 'lucide-react'

const STATUS_FILTERS: { key: TopicStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'blocked', label: 'Blocked' },
  { key: 'done', label: 'Done' },
  { key: 'cancelled', label: 'Cancelled' },
]

export default function SitePage({ params }: { params: Promise<{ site: string }> }) {
  const { site } = use(params)
  const [topics, setTopics] = useState<Topic[]>([])
  const [selected, setSelected] = useState<Topic | null>(null)
  const [statusFilter, setStatusFilter] = useState<TopicStatus | 'all'>('all')
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchTopics = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/topics?site=${site}`)
    const data = await res.json()
    setTopics(data)
    setLoading(false)
  }, [site])

  useEffect(() => {
    fetchTopics()
    setSelected(null)
  }, [fetchTopics])

  const filtered = statusFilter === 'all' ? topics : topics.filter((t) => t.status === statusFilter)

  const handleTopicUpdated = (updated: Topic) => {
    setTopics((prev) => prev.map((t) => (t._id === updated._id ? updated : t)))
    setSelected(updated)
  }

  const handleTopicDeleted = (id: string) => {
    setTopics((prev) => prev.filter((t) => t._id !== id))
    setSelected(null)
  }

  const handleCreated = (topic: Topic) => {
    setTopics((prev) => [topic, ...prev])
    setSelected(topic)
    setShowNew(false)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <div className="flex flex-1 overflow-hidden">
        {/* Topic List Panel */}
        <div className="w-80 shrink-0 border-r border-[#2a2a30] flex flex-col bg-[#111114]">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[#2a2a30] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">{site}</h2>
              <p className="text-xs text-gray-500">{SITE_LABELS[site]}</p>
            </div>
            <button
              onClick={() => setShowNew(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New
            </button>
          </div>

          {/* Status filter */}
          <div className="px-3 py-2 border-b border-[#2a2a30] flex gap-1 flex-wrap">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${
                  statusFilter === f.key
                    ? 'bg-[#2a2a38] text-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {loading ? (
              <div className="flex items-center justify-center h-32 text-gray-600 text-sm">
                Loading...
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-600 text-sm gap-2">
                <p>No topics yet</p>
                <button
                  onClick={() => setShowNew(true)}
                  className="text-blue-500 hover:text-blue-400 text-xs"
                >
                  + Add first topic
                </button>
              </div>
            ) : (
              filtered.map((topic) => {
                const prog = calcProgress(topic.items)
                const overdue = isOverdue(topic.estCompletionDate) && topic.status !== 'done'
                const days = daysUntil(topic.estCompletionDate)
                const isSelected = selected?._id === topic._id
                const cfg = STATUS_CONFIG[topic.status]

                return (
                  <button
                    key={topic._id}
                    onClick={() => setSelected(topic)}
                    className={`w-full text-left px-4 py-3 border-b border-[#1e1e24] transition-colors ${
                      isSelected ? 'bg-[#1a1a22]' : 'hover:bg-[#16161a]'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium truncate ${
                            topic.status === 'done'
                              ? 'line-through text-gray-500'
                              : 'text-gray-200'
                          }`}
                        >
                          {topic.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="w-3 h-3 text-gray-600 shrink-0" />
                          <span className="text-xs text-gray-500">{formatDate(topic.date)}</span>
                        </div>
                        {topic.items.length > 0 && (
                          <div className="mt-2">
                            <ProgressBar done={prog.done} total={prog.total} />
                          </div>
                        )}
                        {topic.estCompletionDate && topic.status !== 'done' && (
                          <div className={`flex items-center gap-1 mt-1 text-xs ${overdue ? 'text-red-400' : 'text-gray-500'}`}>
                            <Clock className="w-3 h-3" />
                            {overdue
                              ? `Overdue ${Math.abs(days ?? 0)}d`
                              : `${days}d left`}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="flex-1 overflow-y-auto scrollbar-thin bg-[#0d0d0f]">
          {selected ? (
            <TopicDetail
              topic={selected}
              onUpdated={handleTopicUpdated}
              onDeleted={handleTopicDeleted}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-3">
              <p className="text-sm">Select a topic to view details</p>
              <button
                onClick={() => setShowNew(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#2a2a30] text-gray-400 hover:text-white hover:border-gray-500 text-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Topic
              </button>
            </div>
          )}
        </div>
      </div>

      {showNew && (
        <NewTopicModal
          site={site as Site}
          onClose={() => setShowNew(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}

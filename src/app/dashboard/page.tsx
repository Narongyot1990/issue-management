'use client'
import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { TopicStatusBadge } from '@/components/StatusBadge'
import { Topic, TopicStatus, Site } from '@/types'
import {
  SITES, SITE_LABELS, STATUS_CONFIG,
  formatDate, calcProgress, isOverdue, daysUntil,
  getWeekKey, getWeekKeys, formatWeekLabel, getWeekStart,
} from '@/lib/utils'
import {
  Printer, RefreshCw, AlertTriangle, CheckCircle2,
  Circle, Clock, CalendarDays, ChevronRight,
} from 'lucide-react'

// ── Helpers ────────────────────────────────────────────────────
function MiniBar({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)
  const color = pct === 100 ? 'bg-green-500' : pct >= 50 ? 'bg-blue-500' : pct > 0 ? 'bg-yellow-500' : 'bg-gray-700'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
    </div>
  )
}

function CountBadge({ status, count }: { status: TopicStatus; count: number }) {
  const cfg = STATUS_CONFIG[status]
  if (count === 0) return null
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs ${cfg.bg} ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {count}
    </span>
  )
}

// ── Site Card ──────────────────────────────────────────────────
function SiteCard({ site, topics }: { site: Site; topics: Topic[] }) {
  const byStatus = (s: TopicStatus) => topics.filter(t => t.status === s).length
  const totalItems = topics.reduce((s, t) => s + t.items.length, 0)
  const doneItems = topics.reduce((s, t) => s + t.items.filter(i => i.done).length, 0)
  const overdueTopics = topics.filter(
    t => isOverdue(t.estCompletionDate) && t.status !== 'done' && t.status !== 'cancelled'
  )

  return (
    <div className="bg-[#18181c] border border-[#2a2a30] rounded-xl p-4 print:border print:border-gray-300 print:rounded-lg print:break-inside-avoid">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-white print:text-black">{site}</h3>
          <p className="text-xs text-gray-500 print:text-gray-600">{SITE_LABELS[site]}</p>
        </div>
        <div className="flex gap-1 flex-wrap justify-end">
          <CountBadge status="open" count={byStatus('open')} />
          <CountBadge status="in_progress" count={byStatus('in_progress')} />
          <CountBadge status="blocked" count={byStatus('blocked')} />
          <CountBadge status="done" count={byStatus('done')} />
        </div>
      </div>

      {totalItems > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Action Items</span>
            <span>{doneItems}/{totalItems}</span>
          </div>
          <MiniBar done={doneItems} total={totalItems} />
        </div>
      )}

      <div className="flex flex-col gap-1.5 mt-3">
        {topics.length === 0 ? (
          <p className="text-xs text-gray-600 italic">ยังไม่มี topic</p>
        ) : (
          topics.map(t => {
            const prog = calcProgress(t.items)
            const over = isOverdue(t.estCompletionDate) && t.status !== 'done'
            const days = daysUntil(t.estCompletionDate)
            return (
              <div key={t._id} className="flex items-start gap-2 py-1 border-b border-[#1e1e24] last:border-0 print:border-gray-200">
                <span className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_CONFIG[t.status].dot}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs ${t.status === 'done' ? 'line-through text-gray-600' : 'text-gray-300 print:text-gray-800'}`}>
                    {t.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-[10px] text-gray-600">{formatDate(t.date)}</span>
                    {t.items.length > 0 && (
                      <span className="text-[10px] text-gray-600">{prog.done}/{prog.total} items</span>
                    )}
                    {over && days !== null && (
                      <span className="text-[10px] text-red-400 flex items-center gap-0.5">
                        <AlertTriangle className="w-2.5 h-2.5" />เลย {Math.abs(days)}วัน
                      </span>
                    )}
                    {!over && days !== null && days <= 7 && t.status !== 'done' && (
                      <span className="text-[10px] text-yellow-400 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />{days}วัน
                      </span>
                    )}
                  </div>
                </div>
                <TopicStatusBadge status={t.status} />
              </div>
            )
          })
        )}
      </div>

      {overdueTopics.length > 0 && (
        <div className="mt-3 bg-red-900/20 border border-red-900/40 rounded-lg px-3 py-2">
          <p className="text-xs text-red-400 font-medium flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {overdueTopics.length} topic เลย due date
          </p>
        </div>
      )}
    </div>
  )
}

// ── Timeline Row ───────────────────────────────────────────────
function TimelineRow({
  weekKey,
  topics,
  isActive,
  onClick,
}: {
  weekKey: string
  topics: Topic[]
  isActive: boolean
  onClick: () => void
}) {
  const weekStart = getWeekStart(weekKey)
  const label = formatWeekLabel(weekStart)
  const byStatus = (s: TopicStatus) => topics.filter(t => t.status === s).length
  const totalItems = topics.reduce((s, t) => s + t.items.length, 0)
  const doneItems = topics.reduce((s, t) => s + t.items.filter(i => i.done).length, 0)
  const pct = totalItems === 0 ? 0 : Math.round((doneItems / totalItems) * 100)
  const overdueCount = topics.filter(
    t => isOverdue(t.estCompletionDate) && t.status !== 'done' && t.status !== 'cancelled'
  ).length

  // Group by site for mini dots
  const siteCounts = SITES.map(s => ({ site: s, count: topics.filter(t => t.site === s).length }))
    .filter(s => s.count > 0)

  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-center gap-4 px-4 py-3 rounded-xl border transition-all ${
        isActive
          ? 'bg-blue-900/20 border-blue-700/50'
          : 'bg-[#18181c] border-[#2a2a30] hover:border-[#3a3a45]'
      }`}
    >
      {/* Week label */}
      <div className="w-36 shrink-0">
        <p className={`text-sm font-medium ${isActive ? 'text-blue-300' : 'text-gray-300'}`}>
          {label}
        </p>
        <div className="flex gap-1 mt-1 flex-wrap">
          {siteCounts.map(s => (
            <span key={s.site} className="text-[10px] bg-[#111114] text-gray-500 px-1.5 py-0.5 rounded">
              {s.site} ×{s.count}
            </span>
          ))}
        </div>
      </div>

      {/* Status pills */}
      <div className="flex items-center gap-1.5 shrink-0">
        {(['open', 'in_progress', 'blocked', 'done'] as TopicStatus[]).map(s => {
          const cnt = byStatus(s)
          if (!cnt) return null
          return <CountBadge key={s} status={s} count={cnt} />
        })}
      </div>

      {/* Action items bar */}
      <div className="flex-1 min-w-0">
        {totalItems > 0 ? (
          <div>
            <MiniBar done={doneItems} total={totalItems} />
            <p className="text-[10px] text-gray-600 mt-0.5">{doneItems}/{totalItems} action items</p>
          </div>
        ) : (
          <p className="text-xs text-gray-600">—</p>
        )}
      </div>

      {/* Overdue */}
      {overdueCount > 0 && (
        <span className="flex items-center gap-1 text-xs text-red-400 shrink-0">
          <AlertTriangle className="w-3.5 h-3.5" />{overdueCount}
        </span>
      )}

      <ChevronRight className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-blue-400' : 'text-gray-600'}`} />
    </button>
  )
}

// ── Print View ─────────────────────────────────────────────────
function PrintView({ topics, weekLabel }: { topics: Topic[]; weekLabel: string }) {
  const now = new Date().toLocaleDateString('th-TH', { day: '2-digit', month: 'long', year: 'numeric' })
  const byStatus = (s: TopicStatus) => topics.filter(t => t.status === s).length

  return (
    <div className="hidden print:block p-8 text-black font-sans">
      <div className="border-b-2 border-gray-800 pb-4 mb-6">
        <h1 className="text-xl font-bold">Weekly Ops Meeting Summary</h1>
        <p className="text-gray-600 mt-0.5">{weekLabel !== 'all' ? `Week: ${weekLabel}` : 'All Topics'}</p>
        <p className="text-gray-400 text-sm">Printed: {now}</p>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        {([
          { label: 'Open', s: 'open' as TopicStatus, color: 'text-gray-700' },
          { label: 'In Progress', s: 'in_progress' as TopicStatus, color: 'text-blue-700' },
          { label: 'Blocked', s: 'blocked' as TopicStatus, color: 'text-yellow-700' },
          { label: 'Done', s: 'done' as TopicStatus, color: 'text-green-700' },
        ]).map(s => (
          <div key={s.label} className="border border-gray-300 rounded p-3 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{byStatus(s.s)}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {SITES.map(site => {
        const st = topics.filter(t => t.site === site)
        if (st.length === 0) return null
        return (
          <div key={site} className="mb-6 break-inside-avoid">
            <h2 className="text-base font-bold border-b border-gray-300 pb-1 mb-2">
              {site} — {SITE_LABELS[site]}
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200 text-xs">
                  <th className="pb-1 pr-4 font-medium">Topic</th>
                  <th className="pb-1 pr-4 font-medium">Date</th>
                  <th className="pb-1 pr-4 font-medium">Status</th>
                  <th className="pb-1 pr-4 font-medium">Est. Done</th>
                  <th className="pb-1 font-medium">Items</th>
                </tr>
              </thead>
              <tbody>
                {st.map(t => {
                  const prog = calcProgress(t.items)
                  const over = isOverdue(t.estCompletionDate) && t.status !== 'done'
                  return (
                    <tr key={t._id} className="border-b border-gray-100">
                      <td className={`py-1.5 pr-4 ${t.status === 'done' ? 'line-through text-gray-400' : ''}`}>{t.title}</td>
                      <td className="py-1.5 pr-4 text-gray-500 text-xs">{formatDate(t.date)}</td>
                      <td className="py-1.5 pr-4 text-xs">{STATUS_CONFIG[t.status].label}</td>
                      <td className={`py-1.5 pr-4 text-xs ${over ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                        {t.estCompletionDate ? formatDate(t.estCompletionDate) : '—'}{over ? ' ⚠️' : ''}
                      </td>
                      <td className="py-1.5 text-xs text-gray-500">
                        {t.items.length > 0 ? `${prog.done}/${prog.total}` : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      })}

      <p className="text-xs text-gray-400 mt-8 border-t border-gray-200 pt-4">
        ITL Ops Weekly Tracker · {new Date().toLocaleString('th-TH')}
      </p>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────
export default function DashboardPage() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [siteFilter, setSiteFilter] = useState<Site | 'ALL'>('ALL')
  const [weekFilter, setWeekFilter] = useState<string>('all') // 'all' or week key

  const fetch_ = async () => {
    setLoading(true)
    const res = await fetch('/api/topics')
    setTopics(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetch_() }, [])

  // All unique week keys from all topics
  const allWeekKeys = getWeekKeys(topics.map(t => t.date))

  // Filtered topics for site cards + stats
  const filtered = topics.filter(t => {
    const matchSite = siteFilter === 'ALL' || t.site === siteFilter
    const matchWeek = weekFilter === 'all' || getWeekKey(t.date) === weekFilter
    return matchSite && matchWeek
  })

  // Stats
  const byStatus = (s: TopicStatus) => filtered.filter(t => t.status === s).length
  const overdueAll = filtered.filter(
    t => isOverdue(t.estCompletionDate) && t.status !== 'done' && t.status !== 'cancelled'
  )
  const totalItems = filtered.reduce((s, t) => s + t.items.length, 0)
  const doneItems = filtered.reduce((s, t) => s + t.items.filter(i => i.done).length, 0)

  const activeWeekLabel = weekFilter === 'all'
    ? 'All Topics'
    : formatWeekLabel(getWeekStart(weekFilter))

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto scrollbar-thin bg-[#0d0d0f]">

        <PrintView topics={filtered} weekLabel={activeWeekLabel} />

        <div className="print:hidden max-w-5xl mx-auto px-6 py-6">

          {/* ── Header ────────────────────────────── */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-lg font-semibold text-white">Dashboard</h1>
              <p className="text-sm text-gray-500 mt-0.5">Weekly Operations Summary</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={fetch_}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2a2a30] text-gray-400 hover:text-white text-sm transition-colors">
                <RefreshCw className="w-4 h-4" />Refresh
              </button>
              <button onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
                <Printer className="w-4 h-4" />Print / Email
              </button>
            </div>
          </div>

          {/* ── Filters ───────────────────────────── */}
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <select value={siteFilter} onChange={e => setSiteFilter(e.target.value as Site | 'ALL')}
              className="bg-[#18181c] border border-[#2a2a30] rounded-lg px-2.5 py-1.5 text-sm text-gray-300 focus:outline-none">
              <option value="ALL">ทุก Site</option>
              {SITES.map(s => <option key={s} value={s}>{s} — {SITE_LABELS[s]}</option>)}
            </select>

            {/* Week selector */}
            <div className="flex items-center gap-1 bg-[#18181c] border border-[#2a2a30] rounded-lg p-1">
              <button
                onClick={() => setWeekFilter('all')}
                className={`px-2.5 py-1 rounded-md text-xs transition-colors ${weekFilter === 'all' ? 'bg-[#2a2a38] text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                All
              </button>
              {allWeekKeys.map(key => (
                <button
                  key={key}
                  onClick={() => setWeekFilter(key)}
                  className={`px-2.5 py-1 rounded-md text-xs transition-colors whitespace-nowrap ${weekFilter === key ? 'bg-[#2a2a38] text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  {formatWeekLabel(getWeekStart(key))}
                </button>
              ))}
            </div>
          </div>

          {/* ── Active week label ──────────────────── */}
          {weekFilter !== 'all' && (
            <div className="flex items-center gap-2 mb-4">
              <CalendarDays className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-300 font-medium">{activeWeekLabel}</span>
              <button onClick={() => setWeekFilter('all')} className="text-xs text-gray-600 hover:text-gray-400 ml-1">
                × Clear
              </button>
            </div>
          )}

          {/* ── Stat cards ────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Open', count: byStatus('open'), icon: <Circle className="w-4 h-4" />, color: 'text-gray-400', border: 'border-gray-700' },
              { label: 'In Progress', count: byStatus('in_progress'), icon: <RefreshCw className="w-4 h-4" />, color: 'text-blue-400', border: 'border-blue-900/50' },
              { label: 'Blocked', count: byStatus('blocked'), icon: <AlertTriangle className="w-4 h-4" />, color: 'text-yellow-400', border: 'border-yellow-900/50' },
              { label: 'Done', count: byStatus('done'), icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-green-400', border: 'border-green-900/50' },
            ].map(s => (
              <div key={s.label} className={`bg-[#18181c] border ${s.border} rounded-xl p-4`}>
                <div className={`flex items-center gap-2 ${s.color} mb-1`}>{s.icon}<span className="text-xs font-medium">{s.label}</span></div>
                <p className={`text-3xl font-bold ${s.color}`}>{s.count}</p>
                <p className="text-xs text-gray-600 mt-0.5">/ {filtered.length} topics</p>
              </div>
            ))}
          </div>

          {/* ── Action items + overdue ─────────────── */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-[#18181c] border border-[#2a2a30] rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Action Items</p>
              <p className="text-2xl font-bold text-white">{doneItems}<span className="text-gray-500 text-lg font-normal">/{totalItems}</span></p>
              {totalItems > 0 && <MiniBar done={doneItems} total={totalItems} />}
            </div>
            <div className={`border rounded-xl p-4 ${overdueAll.length > 0 ? 'bg-red-900/20 border-red-900/40' : 'bg-[#18181c] border-[#2a2a30]'}`}>
              <p className="text-xs text-gray-500 mb-1">Overdue</p>
              <p className={`text-2xl font-bold ${overdueAll.length > 0 ? 'text-red-400' : 'text-gray-500'}`}>{overdueAll.length}</p>
              {overdueAll.slice(0, 3).map(t => (
                <p key={t._id} className="text-xs text-red-400/70 truncate mt-0.5">· {t.site}: {t.title}</p>
              ))}
            </div>
          </div>

          {/* ── Site Cards ────────────────────────── */}
          {loading ? (
            <div className="text-center py-8 text-gray-600 text-sm">Loading...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
              {SITES.filter(s => siteFilter === 'ALL' || s === siteFilter).map(site => (
                <SiteCard key={site} site={site} topics={filtered.filter(t => t.site === site)} />
              ))}
            </div>
          )}

          {/* ── Timeline ──────────────────────────── */}
          {!loading && allWeekKeys.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CalendarDays className="w-4 h-4 text-gray-500" />
                <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Timeline</h2>
                <span className="text-xs text-gray-600">— คลิกสัปดาห์เพื่อ filter</span>
              </div>

              <div className="flex flex-col gap-2">
                {allWeekKeys.map(key => {
                  const weekTopics = topics.filter(
                    t => getWeekKey(t.date) === key && (siteFilter === 'ALL' || t.site === siteFilter)
                  )
                  return (
                    <TimelineRow
                      key={key}
                      weekKey={key}
                      topics={weekTopics}
                      isActive={weekFilter === key}
                      onClick={() => setWeekFilter(weekFilter === key ? 'all' : key)}
                    />
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

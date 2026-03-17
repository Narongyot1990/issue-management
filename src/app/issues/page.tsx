'use client'
import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { IssueStatusBadge } from '@/components/StatusBadge'
import { HistoryPanel } from '@/components/HistoryPanel'
import { Issue, IssueStatus, Site } from '@/types'
import { SITES, SITE_LABELS, ISSUE_STATUS_CONFIG, formatDate, isOverdue, daysUntil } from '@/lib/utils'
import { Plus, X, Save, ChevronDown, Check, Trash2, History, Clock, Calendar } from 'lucide-react'

const STATUS_FILTERS: { key: IssueStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'resolved', label: 'Resolved' },
]

const ISSUE_STATUSES: IssueStatus[] = ['open', 'in_progress', 'resolved']

function NewIssueModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (i: Issue) => void
}) {
  const [title, setTitle] = useState('')
  const [plan, setPlan] = useState('')
  const [site, setSite] = useState<Site>('OPS')
  const [dueDate, setDueDate] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    const res = await fetch('/api/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, plan, site, dueDate: dueDate || undefined }),
    })
    onCreated(await res.json())
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#18181c] border border-[#2a2a30] rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a30]">
          <h2 className="text-sm font-semibold text-white">New Issue</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Issue Title *</label>
            <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="ระบุปัญหาหรือ action item..."
              className="w-full bg-[#111114] border border-[#2a2a30] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Action Plan</label>
            <textarea value={plan} onChange={(e) => setPlan(e.target.value)}
              placeholder="แผนการดำเนินการ..." rows={3}
              className="w-full bg-[#111114] border border-[#2a2a30] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Site</label>
              <select value={site} onChange={(e) => setSite(e.target.value as Site)}
                className="w-full bg-[#111114] border border-[#2a2a30] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                {SITES.map((s) => <option key={s} value={s}>{s} — {SITE_LABELS[s]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-[#111114] border border-[#2a2a30] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-[#2a2a30] text-gray-400 hover:text-white text-sm">Cancel</button>
            <button type="submit" disabled={!title.trim() || saving}
              className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium">
              {saving ? 'Creating...' : 'Create Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function IssueCard({ issue, onUpdated, onDeleted }: { issue: Issue; onUpdated: (i: Issue) => void; onDeleted: (id: string) => void }) {
  const [showHistory, setShowHistory] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [editingPlan, setEditingPlan] = useState(false)
  const [plan, setPlan] = useState(issue.plan)
  const overdue = isOverdue(issue.dueDate) && issue.status !== 'resolved'
  const days = daysUntil(issue.dueDate)

  const patch = async (body: object, historyEntry?: object) => {
    const res = await fetch(`/api/issues/${issue._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, ...(historyEntry ? { historyEntry } : {}) }),
    })
    onUpdated(await res.json())
  }

  const changeStatus = async (status: IssueStatus) => {
    setShowStatusMenu(false)
    await patch(
      { status, ...(status === 'resolved' ? { resolvedDate: new Date().toISOString() } : {}) },
      { action: 'status_changed', oldValue: issue.status, newValue: status }
    )
  }

  const savePlan = async () => {
    await patch({ plan }, { action: 'field_updated', field: 'plan', newValue: plan })
    setEditingPlan(false)
  }

  const handleDelete = async () => {
    if (!confirm(`Delete "${issue.title}"?`)) return
    await fetch(`/api/issues/${issue._id}`, { method: 'DELETE' })
    onDeleted(issue._id)
  }

  const updateDueDate = async (value: string) => {
    await patch({ dueDate: value || null }, { action: 'field_updated', field: 'dueDate', newValue: value })
  }

  return (
    <div className={`bg-[#18181c] border rounded-xl p-4 transition-all ${
      issue.status === 'resolved' ? 'border-[#2a2a30] opacity-70' : overdue ? 'border-red-900/60' : 'border-[#2a2a30]'
    }`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-medium ${issue.status === 'resolved' ? 'line-through text-gray-500' : 'text-white'}`}>
            {issue.title}
          </h3>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-xs text-gray-500 bg-[#111114] px-2 py-0.5 rounded">
              {issue.site} · {SITE_LABELS[issue.site]}
            </span>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              {formatDate(issue.openedDate)}
            </div>
            {issue.dueDate && (
              <div className={`flex items-center gap-1 text-xs ${overdue ? 'text-red-400' : 'text-gray-500'}`}>
                <Clock className="w-3 h-3" />
                {overdue ? `Overdue ${Math.abs(days ?? 0)}d` : `${days}d left`}
              </div>
            )}
            {issue.resolvedDate && (
              <div className="flex items-center gap-1 text-xs text-green-500">
                <Check className="w-3 h-3" />
                Resolved {formatDate(issue.resolvedDate)}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <button onClick={() => setShowStatusMenu(!showStatusMenu)} className="flex items-center gap-1">
              <IssueStatusBadge status={issue.status} />
              <ChevronDown className="w-3 h-3 text-gray-500" />
            </button>
            {showStatusMenu && (
              <div className="absolute right-0 top-8 bg-[#1e1e24] border border-[#2a2a30] rounded-lg shadow-xl z-10 py-1 w-40">
                {ISSUE_STATUSES.map((s) => {
                  const cfg = ISSUE_STATUS_CONFIG[s]
                  return (
                    <button key={s} onClick={() => changeStatus(s)}
                      className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-[#2a2a30] ${s === issue.status ? 'text-white' : 'text-gray-400'}`}>
                      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                      {s === issue.status && <Check className="w-3 h-3 ml-auto text-blue-400" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          <button onClick={() => setShowHistory(!showHistory)}
            className={`p-1.5 rounded-md text-xs transition-colors ${showHistory ? 'text-white bg-[#2a2a38]' : 'text-gray-500 hover:text-gray-300'}`}>
            <History className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleDelete}
            className="p-1.5 rounded-md text-gray-600 hover:text-red-400 hover:bg-red-900/20 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Due date input */}
      <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
        <span>Due:</span>
        <input type="date" defaultValue={issue.dueDate?.split('T')[0] ?? ''}
          onChange={(e) => updateDueDate(e.target.value)}
          className={`bg-transparent border-b border-dashed focus:outline-none text-xs ${overdue ? 'text-red-400 border-red-700' : 'text-gray-400 border-gray-700'}`} />
      </div>

      {/* Plan */}
      {editingPlan ? (
        <div>
          <textarea value={plan} onChange={(e) => setPlan(e.target.value)} rows={3} autoFocus
            className="w-full bg-[#111114] border border-blue-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none resize-none" />
          <div className="flex gap-2 mt-2">
            <button onClick={savePlan} className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-md">
              <Save className="w-3 h-3" /> Save
            </button>
            <button onClick={() => { setEditingPlan(false); setPlan(issue.plan) }}
              className="px-2.5 py-1 text-gray-400 hover:text-white text-xs">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setEditingPlan(true)} className="w-full text-left">
          {issue.plan ? (
            <p className="text-sm text-gray-300 border border-transparent hover:border-[#2a2a30] rounded-lg p-2 -m-2 transition-colors">
              {issue.plan}
            </p>
          ) : (
            <p className="text-sm text-gray-600 italic border border-dashed border-[#2a2a30] rounded-lg p-2 hover:border-gray-500 transition-colors">
              + Add action plan...
            </p>
          )}
        </button>
      )}

      {showHistory && <div className="mt-4"><HistoryPanel history={issue.history} /></div>}
    </div>
  )
}

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [statusFilter, setStatusFilter] = useState<IssueStatus | 'all'>('open')
  const [siteFilter, setSiteFilter] = useState<Site | 'ALL'>('ALL')
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchIssues = async () => {
    setLoading(true)
    const res = await fetch('/api/issues')
    setIssues(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchIssues() }, [])

  const filtered = issues.filter((i) => {
    const matchStatus = statusFilter === 'all' || i.status === statusFilter
    const matchSite = siteFilter === 'ALL' || i.site === siteFilter
    return matchStatus && matchSite
  })

  const handleUpdated = (updated: Issue) =>
    setIssues((prev) => prev.map((i) => (i._id === updated._id ? updated : i)))

  const handleDeleted = (id: string) =>
    setIssues((prev) => prev.filter((i) => i._id !== id))

  const counts = {
    open: issues.filter((i) => i.status === 'open').length,
    in_progress: issues.filter((i) => i.status === 'in_progress').length,
    resolved: issues.filter((i) => i.status === 'resolved').length,
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto scrollbar-thin bg-[#0d0d0f]">
        <div className="max-w-3xl mx-auto px-6 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-lg font-semibold text-white">Issue Tracker</h1>
              <p className="text-sm text-gray-500 mt-0.5">ติดตามปัญหาข้ามสัปดาห์</p>
            </div>
            <button onClick={() => setShowNew(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" />
              New Issue
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { key: 'open', label: 'Open', count: counts.open, color: 'text-red-400', bg: 'bg-red-900/20 border-red-900/40' },
              { key: 'in_progress', label: 'In Progress', count: counts.in_progress, color: 'text-blue-400', bg: 'bg-blue-900/20 border-blue-900/40' },
              { key: 'resolved', label: 'Resolved', count: counts.resolved, color: 'text-green-400', bg: 'bg-green-900/20 border-green-900/40' },
            ].map((s) => (
              <button key={s.key} onClick={() => setStatusFilter(s.key as IssueStatus | 'all')}
                className={`border rounded-xl p-3 text-left transition-all ${s.bg} ${statusFilter === s.key ? 'ring-1 ring-white/20' : ''}`}>
                <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <div className="flex gap-1">
              {STATUS_FILTERS.map((f) => (
                <button key={f.key} onClick={() => setStatusFilter(f.key)}
                  className={`px-2.5 py-1 rounded-md text-xs transition-colors ${statusFilter === f.key ? 'bg-[#2a2a38] text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                  {f.label}
                </button>
              ))}
            </div>
            <select value={siteFilter} onChange={(e) => setSiteFilter(e.target.value as Site | 'ALL')}
              className="bg-[#18181c] border border-[#2a2a30] rounded-lg px-2.5 py-1 text-xs text-gray-300 focus:outline-none">
              <option value="ALL">All Sites</option>
              {SITES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Issue list */}
          {loading ? (
            <div className="text-center py-16 text-gray-600 text-sm">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-600 text-sm">No issues found</div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((issue) => (
                <IssueCard key={issue._id} issue={issue} onUpdated={handleUpdated} onDeleted={handleDeleted} />
              ))}
            </div>
          )}
        </div>
      </div>

      {showNew && (
        <NewIssueModal
          onClose={() => setShowNew(false)}
          onCreated={(i) => { setIssues((prev) => [i, ...prev]); setShowNew(false) }}
        />
      )}
    </div>
  )
}

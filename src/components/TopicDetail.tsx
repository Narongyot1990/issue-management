'use client'
import { useState } from 'react'
import { Topic, TopicStatus, ChecklistItem, WhyNode } from '@/types'
import { TopicStatusBadge } from './StatusBadge'
import { HistoryPanel } from './HistoryPanel'
import { WhyAnalysis } from './WhyAnalysis'
import { STATUS_CONFIG, formatDate, isOverdue } from '@/lib/utils'
import {
  Check, Trash2, Plus, ChevronDown, Calendar, Clock,
  History, Edit3, X, Save, CheckSquare, HelpCircle, ListTodo
} from 'lucide-react'

const STATUSES: TopicStatus[] = ['open', 'in_progress', 'blocked', 'done', 'cancelled']

interface Props {
  topic: Topic
  onUpdated: (t: Topic) => void
  onDeleted: (id: string) => void
}


export function TopicDetail({ topic, onUpdated, onDeleted }: Props) {
  const [showHistory, setShowHistory] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [editingField, setEditingField] = useState<'title' | 'description' | null>(null)
  const [editTitle, setEditTitle] = useState(topic.title)
  const [editDesc, setEditDesc] = useState(topic.description)
  const [newItem, setNewItem] = useState('')
  const [addingItem, setAddingItem] = useState(false)
  const [savingField, setSavingField] = useState(false)

  const overdue = isOverdue(topic.estCompletionDate) && topic.status !== 'done'

  const patch = async (body: object, historyEntry?: object) => {
    const res = await fetch(`/api/topics/${topic._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, ...(historyEntry ? { historyEntry } : {}) }),
    })
    const updated = await res.json()
    onUpdated(updated)
    return updated
  }

  const changeStatus = async (status: TopicStatus) => {
    setShowStatusMenu(false)
    await patch(
      { status, ...(status === 'done' ? { actualCompletionDate: new Date().toISOString() } : {}) },
      { action: 'status_changed', oldValue: topic.status, newValue: status }
    )
  }

  const toggleItem = async (item: ChecklistItem) => {
    await fetch(`/api/topics/${topic._id}/items/${item._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: !item.done }),
    })
    const res = await fetch(`/api/topics/${topic._id}`)
    onUpdated(await res.json())
  }

  const deleteItem = async (itemId: string) => {
    await fetch(`/api/topics/${topic._id}/items/${itemId}`, { method: 'DELETE' })
    const res = await fetch(`/api/topics/${topic._id}`)
    onUpdated(await res.json())
  }

  const addItem = async () => {
    if (!newItem.trim()) return
    await fetch(`/api/topics/${topic._id}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newItem.trim() }),
    })
    setNewItem('')
    setAddingItem(false)
    const res = await fetch(`/api/topics/${topic._id}`)
    onUpdated(await res.json())
  }

  const saveTitle = async () => {
    if (!editTitle.trim() || editTitle === topic.title) { setEditingField(null); return }
    setSavingField(true)
    await patch({ title: editTitle }, { action: 'field_updated', field: 'title', oldValue: topic.title, newValue: editTitle })
    setSavingField(false)
    setEditingField(null)
  }

  const saveDesc = async () => {
    setSavingField(true)
    await patch({ description: editDesc }, { action: 'field_updated', field: 'description', newValue: editDesc })
    setSavingField(false)
    setEditingField(null)
  }

  const updateDate = async (field: 'date' | 'estCompletionDate' | 'actualCompletionDate', value: string) => {
    await patch({ [field]: value || null }, { action: 'field_updated', field, newValue: value || 'cleared' })
  }

  const saveWhys = async (whys: WhyNode[]) => {
    await patch({ whys }, { action: 'field_updated', field: 'whys', note: 'Why analysis updated' })
  }

  const handleDelete = async () => {
    if (!confirm(`Delete "${topic.title}"?`)) return
    await fetch(`/api/topics/${topic._id}`, { method: 'DELETE' })
    onDeleted(topic._id)
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-6">

      {/* ── Top bar ─────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div className="relative">
          <button onClick={() => setShowStatusMenu(!showStatusMenu)} className="flex items-center gap-1.5">
            <TopicStatusBadge status={topic.status} />
            <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
          </button>
          {showStatusMenu && (
            <div className="absolute top-8 left-0 bg-[#1e1e24] border border-[#2a2a30] rounded-lg shadow-xl z-10 py-1 w-44">
              {STATUSES.map((s) => {
                const cfg = STATUS_CONFIG[s]
                return (
                  <button key={s} onClick={() => changeStatus(s)}
                    className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-[#2a2a30] ${s === topic.status ? 'text-white' : 'text-gray-400'}`}>
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                    {s === topic.status && <Check className="w-3.5 h-3.5 ml-auto text-blue-400" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors ${showHistory ? 'bg-[#2a2a38] text-white' : 'text-gray-500 hover:text-gray-300'}`}>
            <History className="w-3.5 h-3.5" />History
          </button>
          <button onClick={handleDelete}
            className="p-1.5 rounded-md text-gray-600 hover:text-red-400 hover:bg-red-900/20 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Title ───────────────────────────────────────── */}
      <div className="mb-4">
        {editingField === 'title' ? (
          <div className="flex items-center gap-2">
            <input autoFocus value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditingField(null) }}
              className="flex-1 bg-[#111114] border border-blue-500 rounded-lg px-3 py-1.5 text-xl font-bold text-white focus:outline-none" />
            <button onClick={saveTitle} disabled={savingField} className="p-1.5 text-green-400 hover:bg-green-900/20 rounded">
              <Save className="w-4 h-4" />
            </button>
            <button onClick={() => setEditingField(null)} className="p-1.5 text-gray-500 hover:bg-gray-800 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button onClick={() => { setEditTitle(topic.title); setEditingField('title') }}
            className="group flex items-start gap-2 text-left w-full">
            <h2 className={`text-xl font-bold leading-snug ${topic.status === 'done' ? 'line-through text-gray-500' : 'text-white'}`}>
              {topic.title}
            </h2>
            <Edit3 className="w-4 h-4 mt-1 text-gray-600 opacity-0 group-hover:opacity-100 shrink-0" />
          </button>
        )}
      </div>

      {/* ── Date row ────────────────────────────────────── */}
      <div className="bg-[#111114] border border-[#2a2a30] rounded-xl px-4 py-3 mb-5 flex flex-wrap gap-x-6 gap-y-2">
        {/* วันประชุม — ใช้ group topics ใน Dashboard timeline */}
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <div>
            <p className="text-[10px] text-gray-600 uppercase tracking-wider">วันประชุม</p>
            <input
              type="date"
              defaultValue={topic.date?.split('T')[0] ?? ''}
              onChange={(e) => updateDate('date', e.target.value)}
              className="bg-transparent text-xs text-gray-300 border-b border-dashed border-gray-600 focus:outline-none focus:border-purple-500 mt-0.5"
            />
          </div>
        </div>

        {/* กำหนดแล้วเสร็จ */}
        <div className="flex items-center gap-2">
          <Clock className={`w-3.5 h-3.5 shrink-0 ${overdue ? 'text-red-400' : 'text-yellow-500'}`} />
          <div>
            <p className="text-[10px] text-gray-600 uppercase tracking-wider">
              กำหนดแล้วเสร็จ
              {overdue && <span className="text-red-400 ml-1">⚠ เลย</span>}
            </p>
            <input
              type="date"
              defaultValue={topic.estCompletionDate?.split('T')[0] ?? ''}
              onChange={(e) => updateDate('estCompletionDate', e.target.value)}
              className={`bg-transparent text-xs border-b border-dashed focus:outline-none mt-0.5 ${overdue ? 'text-red-400 border-red-700 focus:border-red-400' : 'text-gray-300 border-gray-600 focus:border-yellow-500'}`}
            />
          </div>
        </div>

        {/* แล้วเสร็จจริง */}
        <div className="flex items-center gap-2">
          <CheckSquare className="w-3.5 h-3.5 text-green-500 shrink-0" />
          <div>
            <p className="text-[10px] text-gray-600 uppercase tracking-wider">แล้วเสร็จจริง</p>
            <input
              type="date"
              defaultValue={topic.actualCompletionDate?.split('T')[0] ?? ''}
              onChange={(e) => updateDate('actualCompletionDate', e.target.value)}
              className="bg-transparent text-xs border-b border-dashed border-gray-600 text-gray-300 focus:outline-none focus:border-green-500 mt-0.5"
            />
          </div>
        </div>
      </div>

      {/* ── Description ─────────────────────────────────── */}
      <div className="mb-6">
        <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">Detail / Description</p>
        {editingField === 'description' ? (
          <div>
            <textarea autoFocus value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={4}
              className="w-full bg-[#111114] border border-blue-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none resize-none" />
            <div className="flex gap-2 mt-2">
              <button onClick={saveDesc} disabled={savingField}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-md">Save</button>
              <button onClick={() => setEditingField(null)} className="px-3 py-1 text-gray-400 hover:text-white text-xs">Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => { setEditDesc(topic.description); setEditingField('description') }}
            className="group w-full text-left">
            {topic.description ? (
              <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed border border-transparent hover:border-[#2a2a30] rounded-lg p-2 -m-2 transition-colors">
                {topic.description}
              </p>
            ) : (
              <p className="text-sm text-gray-600 italic border border-dashed border-[#2a2a30] rounded-lg p-3 hover:border-gray-500 transition-colors">
                + เพิ่ม description หรือ action plan...
              </p>
            )}
          </button>
        )}
      </div>

      {/* ── Why-Why-Why Analysis ─────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <HelpCircle className="w-4 h-4 text-orange-400" />
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Why Analysis</p>
          <span className="text-xs text-gray-600">(Root Cause)</span>
        </div>
        <div className="bg-[#111114] border border-[#2a2a30] rounded-xl p-4">
          <WhyAnalysis
            whys={topic.whys ?? []}
            onChange={saveWhys}
          />
        </div>
      </div>

      {/* ── Progress + Checklist ─────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <ListTodo className="w-4 h-4 text-blue-400" />
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Action Items</p>
        </div>

        {/* Checklist items */}
        <div className="flex flex-col gap-0.5">
          {topic.items.map((item) => (
            <div key={item._id}
              className="group flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#18181c] transition-colors">
              <button onClick={() => toggleItem(item)}
                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                  item.done ? 'bg-green-600 border-green-600' : 'border-gray-600 hover:border-gray-400'
                }`}>
                {item.done && <Check className="w-3 h-3 text-white" />}
              </button>
              <span className={`flex-1 text-sm ${item.done ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                {item.text}
              </span>
              <button onClick={() => deleteItem(item._id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-600 hover:text-red-400 transition-all">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {addingItem ? (
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="w-4 h-4 rounded border border-gray-600 shrink-0" />
              <input autoFocus value={newItem} onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addItem()
                  if (e.key === 'Escape') { setAddingItem(false); setNewItem('') }
                }}
                placeholder="เพิ่ม action item... (Enter)"
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none border-b border-gray-600" />
              <button onClick={addItem} className="p-1 text-green-400"><Check className="w-3.5 h-3.5" /></button>
              <button onClick={() => { setAddingItem(false); setNewItem('') }} className="p-1 text-gray-500">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button onClick={() => setAddingItem(true)}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-400 text-sm transition-colors rounded-lg hover:bg-[#18181c]">
              <Plus className="w-4 h-4" />Add action item
            </button>
          )}
        </div>
      </div>

      {/* ── History ─────────────────────────────────────── */}
      {showHistory && <HistoryPanel history={topic.history} />}
    </div>
  )
}

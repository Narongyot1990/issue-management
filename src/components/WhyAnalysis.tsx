'use client'
import { useState } from 'react'
import { WhyNode } from '@/types'
import { Plus, X, ChevronRight } from 'lucide-react'

// ── Tree helpers ──────────────────────────────────────────────
function genId() {
  return Math.random().toString(36).slice(2, 10)
}

function addChild(nodes: WhyNode[], parentId: string, text: string): WhyNode[] {
  return nodes.map((n) => {
    if (n._id === parentId) {
      return { ...n, children: [...n.children, { _id: genId(), text, children: [] }] }
    }
    return { ...n, children: addChild(n.children, parentId, text) }
  })
}

function deleteNode(nodes: WhyNode[], id: string): WhyNode[] {
  return nodes.filter((n) => n._id !== id).map((n) => ({
    ...n,
    children: deleteNode(n.children, id),
  }))
}

// ── Single node ───────────────────────────────────────────────
function WhyNodeRow({
  node,
  depth,
  isLast,
  onAddChild,
  onDelete,
}: {
  node: WhyNode
  depth: number
  isLast: boolean
  onAddChild: (parentId: string, text: string) => void
  onDelete: (id: string) => void
}) {
  const [addingChild, setAddingChild] = useState(false)
  const [childText, setChildText] = useState('')

  const submitChild = () => {
    if (!childText.trim()) return
    onAddChild(node._id, childText.trim())
    setChildText('')
    setAddingChild(false)
  }

  return (
    <div>
      <div className="flex items-start gap-1.5" style={{ paddingLeft: depth * 20 }}>
        {/* Tree connector */}
        {depth > 0 && (
          <div className="flex items-center gap-0.5 pt-2.5 shrink-0">
            <div className="w-3 h-px bg-gray-700" />
            <ChevronRight className="w-3 h-3 text-gray-600 shrink-0" />
          </div>
        )}

        {/* Node bubble */}
        <div className="group flex items-center gap-2 bg-[#1a1a22] border border-[#2a2a30] rounded-lg px-3 py-2 flex-1 min-w-0">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            depth === 0 ? 'bg-orange-400' : depth === 1 ? 'bg-yellow-400' : depth === 2 ? 'bg-blue-400' : 'bg-gray-400'
          }`} />
          <span className="text-sm text-gray-200 flex-1">{node.text}</span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={() => setAddingChild(true)}
              title="เพิ่มสาเหตุถัดไป"
              className="flex items-center gap-0.5 px-1.5 py-0.5 text-xs text-blue-400 hover:bg-blue-900/30 rounded transition-colors"
            >
              <Plus className="w-3 h-3" />
              {depth === 0 ? 'สาเหตุ' : depth === 1 ? 'Root Cause' : 'เพิ่มเติม'}
            </button>
            <button
              onClick={() => onDelete(node._id)}
              className="p-0.5 text-gray-600 hover:text-red-400 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Add child input */}
      {addingChild && (
        <div className="flex items-center gap-1.5 mt-1.5" style={{ paddingLeft: (depth + 1) * 20 }}>
          {depth >= 0 && <div className="flex items-center gap-0.5 pt-0.5 shrink-0">
            <div className="w-3 h-px bg-gray-700" />
            <ChevronRight className="w-3 h-3 text-gray-600 shrink-0" />
          </div>}
          <div className="flex items-center gap-2 flex-1 bg-[#111114] border border-blue-500/60 rounded-lg px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-600 shrink-0" />
            <input
              autoFocus
              value={childText}
              onChange={(e) => setChildText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitChild()
                if (e.key === 'Escape') { setAddingChild(false); setChildText('') }
              }}
              placeholder={depth === 0 ? 'สาเหตุคืออะไร...? (Enter)' : 'Root cause คืออะไร...? (Enter)'}
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none"
            />
            <button onClick={submitChild} className="text-xs text-blue-400 hover:text-blue-300">
              Add
            </button>
            <button
              onClick={() => { setAddingChild(false); setChildText('') }}
              className="text-gray-600 hover:text-gray-400"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Children */}
      {node.children.length > 0 && (
        <div className="mt-1.5">
          {node.children.map((child, i) => (
            <div key={child._id} className="mt-1.5">
              <WhyNodeRow
                node={child}
                depth={depth + 1}
                isLast={i === node.children.length - 1}
                onAddChild={onAddChild}
                onDelete={onDelete}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────
interface Props {
  whys: WhyNode[]
  onChange: (whys: WhyNode[]) => void
}

export function WhyAnalysis({ whys, onChange }: Props) {
  const [addingRoot, setAddingRoot] = useState(false)
  const [rootText, setRootText] = useState('')

  const addRoot = () => {
    if (!rootText.trim()) return
    onChange([...whys, { _id: genId(), text: rootText.trim(), children: [] }])
    setRootText('')
    setAddingRoot(false)
  }

  const handleAddChild = (parentId: string, text: string) => {
    onChange(addChild(whys, parentId, text))
  }

  const handleDelete = (id: string) => {
    onChange(deleteNode(whys, id))
  }

  return (
    <div>
      {/* Legend */}
      {whys.length > 0 && (
        <div className="flex items-center gap-3 mb-3 text-xs text-gray-600">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block" /> ปัญหา</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block" /> สาเหตุ</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" /> Root cause</span>
        </div>
      )}

      {/* Tree */}
      <div className="flex flex-col gap-2">
        {whys.map((node, i) => (
          <WhyNodeRow
            key={node._id}
            node={node}
            depth={0}
            isLast={i === whys.length - 1}
            onAddChild={handleAddChild}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Add root */}
      {addingRoot ? (
        <div className="flex items-center gap-2 mt-3 bg-[#111114] border border-blue-500/60 rounded-lg px-3 py-2">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
          <input
            autoFocus
            value={rootText}
            onChange={(e) => setRootText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addRoot()
              if (e.key === 'Escape') { setAddingRoot(false); setRootText('') }
            }}
            placeholder="ระบุปัญหา... (Enter เพื่อบันทึก)"
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none"
          />
          <button onClick={addRoot} className="text-xs text-blue-400 hover:text-blue-300">Add</button>
          <button onClick={() => { setAddingRoot(false); setRootText('') }} className="text-gray-600 hover:text-gray-400">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAddingRoot(true)}
          className="flex items-center gap-2 mt-3 px-3 py-2 text-gray-600 hover:text-gray-400 text-sm transition-colors rounded-lg hover:bg-[#18181c] w-full"
        >
          <Plus className="w-4 h-4" />
          เพิ่มปัญหา / Add Why
        </button>
      )}
    </div>
  )
}

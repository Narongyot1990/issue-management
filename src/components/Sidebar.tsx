'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SITES } from '@/lib/utils'
import { LayoutDashboard, ClipboardList } from 'lucide-react'

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-52 shrink-0 border-r border-[#2a2a30] flex flex-col bg-[#111114] h-screen sticky top-0">
      {/* Header */}
      <div className="px-4 py-4 border-b border-[#2a2a30]">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">ITL Ops</p>
        <h1 className="text-sm font-semibold text-white mt-0.5">Weekly Tracker</h1>
      </div>

      {/* Dashboard */}
      <div className="border-b border-[#2a2a30] py-2">
        <Link
          href="/dashboard"
          className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
            pathname === '/dashboard'
              ? 'text-white bg-[#1e1e24] border-r-2 border-blue-500'
              : 'text-gray-400 hover:text-white hover:bg-[#18181c]'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          Dashboard
        </Link>
      </div>

      {/* Sites */}
      <nav className="flex-1 overflow-y-auto py-3 scrollbar-thin">
        <p className="px-4 text-[10px] text-gray-600 uppercase tracking-widest mb-1">Sites</p>
        {SITES.map((site) => {
          const active = pathname === `/site/${site}`
          return (
            <Link
              key={site}
              href={`/site/${site}`}
              className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                active
                  ? 'bg-[#1e1e24] text-white font-medium border-r-2 border-blue-500'
                  : 'text-gray-400 hover:text-white hover:bg-[#18181c]'
              }`}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${active ? 'bg-blue-500' : 'bg-gray-600'}`} />
              <span className="truncate">{site}</span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom nav */}
      <div className="border-t border-[#2a2a30] py-2">
        <Link
          href="/history"
          className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
            pathname === '/history'
              ? 'text-white bg-[#1e1e24]'
              : 'text-gray-400 hover:text-white hover:bg-[#18181c]'
          }`}
        >
          <ClipboardList className="w-4 h-4 shrink-0" />
          History
        </Link>
      </div>
    </aside>
  )
}

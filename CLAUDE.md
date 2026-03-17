# ITL Ops Weekly Tracker — Project Summary

## Overview
A Next.js 16 web app for tracking Weekly Operations Meeting items across 6 logistics sites (EV transport). Deployed on Vercel + MongoDB Atlas.

**URL:** https://ops-tracker-omega.vercel.app
**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS · Mongoose · MongoDB Atlas · Vercel

---

## Business Context
- **Owner:** Operations Supervisor (ITL)
- **Users:** Supervisor + Site Leaders
- **Use case:** Record weekly meeting topics per site, track status, root cause analysis (Why-Why-Why), action items checklist, and view Dashboard summaries for email reporting.

---

## Sites
| Code | Name |
|------|------|
| OPS | ภาพรวม (Main office) |
| BBT | บางบัวทอง |
| KSN | คลองส่งน้ำ |
| CBI | ชลบุรี |
| RA2 | พระราม 2 |
| AYA | อยุธยา |

---

## Data Models

### Topic (`src/models/Topic.ts`)
Core entity. One topic = one agenda item from a meeting.

```ts
{
  date: Date               // วันประชุม — used for week grouping in Dashboard timeline
  site: Site               // OPS | BBT | KSN | CBI | RA2 | AYA
  title: string
  description: string      // action plan / detail
  status: 'open' | 'in_progress' | 'blocked' | 'done' | 'cancelled'
  estCompletionDate?: Date // กำหนดแล้วเสร็จ (target)
  actualCompletionDate?: Date // แล้วเสร็จจริง
  items: ChecklistItem[]   // action item checklist (done = strikethrough)
  whys: WhyNode[]         // Why-Why-Why tree (Schema.Types.Mixed, recursive)
  linkedIssueId?: ObjectId
  history: HistoryEntry[]  // audit log — every change appended here
  createdAt, updatedAt
}
```

### Issue (`src/models/Issue.ts`)
Persistent cross-week problems (not heavily used in Phase 1 — hidden from sidebar, accessible at `/issues`).

```ts
{
  site, title, plan, status: 'open'|'in_progress'|'resolved'
  openedDate, dueDate?, resolvedDate?
  sourceTopicId?: ObjectId
  history: HistoryEntry[]
}
```

### Shared sub-schemas
```ts
ChecklistItem: { _id, text, done: boolean }
WhyNode:       { _id, text, children: WhyNode[] }  // recursive, stored as Mixed
HistoryEntry:  { _id, action, field?, oldValue?, newValue?, note?, createdAt }
```

---

## Pages & Routes

| URL | Component | Description |
|-----|-----------|-------------|
| `/` | redirect | → `/dashboard` |
| `/dashboard` | `app/dashboard/page.tsx` | Summary stats, site cards, week filter, timeline |
| `/site/[site]` | `app/site/[site]/page.tsx` | Two-panel: topic list (left) + detail (right) |
| `/history` | `app/history/page.tsx` | Global timeline of all history entries |
| `/issues` | `app/issues/page.tsx` | Issue tracker (hidden from nav) |

### API Routes
```
GET/POST   /api/topics
GET/PATCH/DELETE /api/topics/[id]
POST       /api/topics/[id]/items
PATCH/DELETE /api/topics/[id]/items/[itemId]
GET/POST   /api/issues
GET/PATCH/DELETE /api/issues/[id]
```

---

## Key Components

| File | Role |
|------|------|
| `components/Sidebar.tsx` | Navigation: Dashboard + Sites + History |
| `components/TopicDetail.tsx` | Full topic editor: title, 3 dates, description, Why tree, checklist, history |
| `components/WhyAnalysis.tsx` | Recursive why-why-why tree UI (click "+ สาเหตุ" / "+ Root Cause" to nest) |
| `components/HistoryPanel.tsx` | Per-topic audit log display |
| `components/StatusBadge.tsx` | Color-coded status pills (Topic + Issue) |
| `components/ProgressBar.tsx` | Simple horizontal bar |
| `components/NewTopicModal.tsx` | Create topic modal |
| `lib/mongodb.ts` | Mongoose connection with global cache (Vercel-safe) |
| `lib/utils.ts` | SITES, SITE_LABELS, STATUS_CONFIG, date helpers, week grouping |

---

## 3 Date Fields on Topic (important — often confused)
| Field | Thai label | Purpose |
|-------|-----------|---------|
| `date` | วันประชุม | Meeting date — used to group by week in Dashboard timeline |
| `estCompletionDate` | กำหนดแล้วเสร็จ | Target completion (shows overdue warning if past) |
| `actualCompletionDate` | แล้วเสร็จจริง | Actual completion date |

---

## History System
Every mutation appends a `HistoryEntry` to `topic.history` (or `issue.history`). Actions:
- `created`, `status_changed`, `field_updated`
- `item_checked`, `item_unchecked`, `item_added`, `item_deleted`
- `issue_linked`, `progress_updated`

Global history page `/history` flattens all topic histories into a timeline sorted by `createdAt` desc.

---

## Dashboard Features
- **Week filter:** Buttons generated from all unique `date` fields (Monday-grouped). Click = filter all stats.
- **Timeline section:** One row per week, shows status counts + action item progress. Click row = toggle week filter.
- **Print/Email:** `window.print()` triggers print-only CSS block (clean table layout).
- **Site cards:** Per-site summary with topic list + overdue warnings.

---

## Why-Why-Why (Root Cause Analysis)
- Tree structure, max depth unlimited.
- Stored as `Schema.Types.Mixed` in MongoDB (not typed sub-schema) for simplicity.
- UI labels by depth: depth 0 = ปัญหา (orange), depth 1 = สาเหตุ (yellow), depth 2+ = Root Cause (blue).
- Add button labels: `+ สาเหตุ` on root nodes, `+ Root Cause` on child nodes.
- All tree mutations happen client-side, then one PATCH `/api/topics/[id]` saves the full `whys` array.

---

## Environment
```
MONGODB_URI=mongodb+srv://...  # Set in Vercel Dashboard (not in repo)
```
Local dev: `.env.local` (gitignored)

---

## Deployment
```bash
cd D:\projects\ITL\ops-tracker
vercel --prod
```
Vercel auto-detects Next.js. `MONGODB_URI` must be set in Vercel project environment variables.

---

## Phase 1 Complete — Pending / Future
- [ ] `/issues` page: currently built but hidden from sidebar. Consider integrating with topics more tightly.
- [ ] Auth: no auth in Phase 1. Consider adding simple PIN or NextAuth if needed.
- [ ] "All Sites" dashboard view improvements.
- [ ] Mobile responsiveness polish.

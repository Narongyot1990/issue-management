export type Site = 'OPS' | 'BBT' | 'KSN' | 'CBI' | 'RA2' | 'AYA'

export type TopicStatus = 'open' | 'in_progress' | 'blocked' | 'done' | 'cancelled'
export type IssueStatus = 'open' | 'in_progress' | 'resolved'
export type HistoryAction =
  | 'created'
  | 'status_changed'
  | 'item_checked'
  | 'item_unchecked'
  | 'item_added'
  | 'item_deleted'
  | 'field_updated'
  | 'issue_linked'
  | 'progress_updated'

export interface ChecklistItem {
  _id: string
  text: string
  done: boolean
}

export interface WhyNode {
  _id: string
  text: string
  children: WhyNode[]
}

export interface HistoryEntry {
  _id: string
  action: HistoryAction
  field?: string
  oldValue?: string
  newValue?: string
  note?: string
  createdAt: string
}

export interface Topic {
  _id: string
  date: string
  site: Site
  title: string
  description: string
  status: TopicStatus
  estCompletionDate?: string
  actualCompletionDate?: string
  items: ChecklistItem[]
  whys: WhyNode[]
  linkedIssueId?: string
  history: HistoryEntry[]
  createdAt: string
  updatedAt: string
}

export interface Issue {
  _id: string
  site: Site
  title: string
  plan: string
  status: IssueStatus
  openedDate: string
  dueDate?: string
  resolvedDate?: string
  sourceTopicId?: string
  history: HistoryEntry[]
  createdAt: string
  updatedAt: string
}

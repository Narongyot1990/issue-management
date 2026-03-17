import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Issue } from '@/models/Issue'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB()
  const { id } = await params
  const issue = await Issue.findById(id).lean()
  if (!issue) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(issue)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB()
  const { id } = await params
  const body = await req.json()
  const { historyEntry, ...fields } = body

  const issue = await Issue.findById(id)
  if (!issue) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  Object.assign(issue, fields)
  if (historyEntry) issue.history.push(historyEntry)

  await issue.save()
  return NextResponse.json(issue)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB()
  const { id } = await params
  await Issue.findByIdAndDelete(id)
  return NextResponse.json({ success: true })
}

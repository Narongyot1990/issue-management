import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Topic } from '@/models/Topic'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB()
  const { id } = await params
  const topic = await Topic.findById(id).lean()
  if (!topic) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(topic)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB()
  const { id } = await params
  const body = await req.json()
  const { historyEntry, ...fields } = body

  const topic = await Topic.findById(id)
  if (!topic) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  Object.assign(topic, fields)

  if (historyEntry) {
    topic.history.push(historyEntry)
  }

  await topic.save()
  return NextResponse.json(topic)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB()
  const { id } = await params
  await Topic.findByIdAndDelete(id)
  return NextResponse.json({ success: true })
}

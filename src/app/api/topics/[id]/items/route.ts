import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Topic } from '@/models/Topic'

// POST: add checklist item
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB()
  const { id } = await params
  const { text } = await req.json()

  const topic = await Topic.findById(id)
  if (!topic) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  topic.items.push({ text, done: false })
  topic.history.push({ action: 'item_added', note: `Added: "${text}"` })
  await topic.save()
  return NextResponse.json(topic)
}

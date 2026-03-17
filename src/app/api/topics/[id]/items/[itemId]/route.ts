import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Topic } from '@/models/Topic'

// PATCH: toggle done / edit text
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  await connectDB()
  const { id, itemId } = await params
  const body = await req.json()

  const topic = await Topic.findById(id)
  if (!topic) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const item = topic.items.id(itemId)
  if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })

  if (typeof body.done === 'boolean') {
    item.done = body.done
    topic.history.push({
      action: body.done ? 'item_checked' : 'item_unchecked',
      note: `"${item.text}" marked ${body.done ? 'done' : 'undone'}`,
    })
  }
  if (typeof body.text === 'string') {
    item.text = body.text
    topic.history.push({ action: 'field_updated', field: 'item_text', newValue: body.text })
  }

  await topic.save()
  return NextResponse.json(topic)
}

// DELETE: remove checklist item
export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  await connectDB()
  const { id, itemId } = await params

  const topic = await Topic.findById(id)
  if (!topic) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const item = topic.items.id(itemId)
  const itemText = item?.text ?? ''
  topic.items.pull({ _id: itemId })
  topic.history.push({ action: 'item_deleted', note: `Removed: "${itemText}"` })
  await topic.save()
  return NextResponse.json(topic)
}

import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Topic } from '@/models/Topic'

export async function GET(req: NextRequest) {
  await connectDB()
  const { searchParams } = new URL(req.url)
  const site = searchParams.get('site')
  const filter = site && site !== 'ALL' ? { site } : {}
  const topics = await Topic.find(filter).sort({ date: -1, createdAt: -1 }).lean()
  return NextResponse.json(topics)
}

export async function POST(req: NextRequest) {
  await connectDB()
  const body = await req.json()
  const topic = await Topic.create({
    ...body,
    history: [{ action: 'created', note: `Topic "${body.title}" created` }],
  })
  return NextResponse.json(topic, { status: 201 })
}

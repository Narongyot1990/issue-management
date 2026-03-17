import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Issue } from '@/models/Issue'

export async function GET(req: NextRequest) {
  await connectDB()
  const { searchParams } = new URL(req.url)
  const site = searchParams.get('site')
  const status = searchParams.get('status')
  const filter: Record<string, string> = {}
  if (site && site !== 'ALL') filter.site = site
  if (status && status !== 'all') filter.status = status
  const issues = await Issue.find(filter).sort({ createdAt: -1 }).lean()
  return NextResponse.json(issues)
}

export async function POST(req: NextRequest) {
  await connectDB()
  const body = await req.json()
  const issue = await Issue.create({
    ...body,
    history: [{ action: 'created', note: `Issue "${body.title}" opened` }],
  })
  return NextResponse.json(issue, { status: 201 })
}

import { NextRequest, NextResponse } from 'next/server'

const BOT_API = process.env.BOT_API_URL || 'http://localhost:3001/api'
const API_KEY = process.env.BACKOFFICE_API_KEY || process.env.ADMIN_API_KEY

async function proxy(path: string, init?: RequestInit): Promise<NextResponse> {
  const url = `${BOT_API}${path}`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(API_KEY ? { 'X-API-Key': API_KEY } : {}),
    ...(init?.headers as Record<string, string>),
  }
  const res = await fetch(url, { ...init, headers })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}

export async function GET() {
  return proxy('/admin/templates')
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  return proxy('/admin/templates', { method: 'POST', body })
}

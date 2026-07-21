import { Client } from 'pg'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const connectionString = [process.env.DATABASE_URL, process.env.DATABASE_URI].find((value) =>
    value?.startsWith('postgres'),
  )

  if (!connectionString) {
    return NextResponse.json({ database: 'not-configured', ok: false }, { status: 503 })
  }

  const client = new Client({ connectionString, connectionTimeoutMillis: 8_000 })

  try {
    await client.connect()
    await client.query('SELECT 1')
    return NextResponse.json({ database: 'reachable', ok: true })
  } catch {
    return NextResponse.json({ database: 'unreachable', ok: false }, { status: 503 })
  } finally {
    await client.end().catch(() => undefined)
  }
}

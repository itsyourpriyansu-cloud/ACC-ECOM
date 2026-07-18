import configPromise from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

const WINDOW_MS = 10 * 60 * 1000
const MAX_ATTEMPTS = 12
const attempts = new Map<string, { count: number; resetAt: number }>()

const getClientKey = (request: NextRequest) =>
  request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'

const isRateLimited = (key: string) => {
  const now = Date.now()
  const current = attempts.get(key)

  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }

  current.count += 1
  return current.count > MAX_ATTEMPTS
}

export async function POST(request: NextRequest) {
  if (isRateLimited(getClientKey(request))) {
    return NextResponse.json({ message: 'Please wait a few minutes and try again.' }, { status: 429 })
  }

  const body = (await request.json().catch(() => null)) as { email?: unknown } | null
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ message: 'Enter a valid email address.' }, { status: 400 })
  }

  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'users',
    limit: 1,
    overrideAccess: true,
    where: { email: { equals: email } },
  })

  return NextResponse.json(
    { next: result.docs.length > 0 ? 'login' : 'signup' },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}

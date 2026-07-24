import { NextRequest, NextResponse } from 'next/server'

/**
 * Kept for old clients without performing an account-existence lookup. New
 * signup screens post directly to the controlled signup endpoint.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { email?: unknown } | null
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ message: 'Enter a valid email address.' }, { status: 400 })
  }
  return NextResponse.json(
    { next: 'signup' },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}

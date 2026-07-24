import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth/current-user'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const current = await getCurrentUser(request.headers)
  return NextResponse.json(
    {
      authenticated: Boolean(current),
      user: current?.safe || null,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}

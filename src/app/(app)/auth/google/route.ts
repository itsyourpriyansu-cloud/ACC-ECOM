import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const destination = new URL('/api/auth/google', request.url)
  const returnTo = request.nextUrl.searchParams.get('returnTo')
  if (returnTo) destination.searchParams.set('returnTo', returnTo)
  return NextResponse.redirect(destination)
}

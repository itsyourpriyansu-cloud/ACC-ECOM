import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const destination = new URL('/api/auth/google/callback', request.url)
  request.nextUrl.searchParams.forEach((value, key) => destination.searchParams.set(key, value))
  return NextResponse.redirect(destination)
}

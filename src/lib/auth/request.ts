import type { NextRequest } from 'next/server'

import { getAppURL } from './config'

export const getClientIP = (headers: Headers) =>
  headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
  headers.get('x-real-ip')?.trim() ||
  'unknown'

export const hasValidOrigin = (request: NextRequest) => {
  const origin = request.headers.get('origin')
  if (!origin) return true

  try {
    return new URL(origin).origin === new URL(getAppURL()).origin
  } catch {
    return false
  }
}

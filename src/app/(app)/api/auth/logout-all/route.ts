import configPromise from '@payload-config'
import {
  createLocalReq,
  generateExpiredPayloadCookie,
  getPayload,
  logoutOperation,
} from 'payload'
import { NextRequest, NextResponse } from 'next/server'

import { writeAuthAudit } from '@/lib/auth/audit'
import { clearAuthCookies } from '@/lib/auth/cookies'
import { getCurrentUser } from '@/lib/auth/current-user'
import { revokeAllOAuthSessions } from '@/lib/auth/oauth-session'
import { authError } from '@/lib/auth/responses'
import { hasValidOrigin } from '@/lib/auth/request'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) return authError('INVALID_INPUT', 'Invalid request.', 403)
  const payload = await getPayload({ config: configPromise })
  const current = await getCurrentUser(request.headers)
  if (!current) return authError('INVALID_CREDENTIALS', 'Sign in is required.', 401)

  const req = await createLocalReq(
    { req: { headers: request.headers, url: request.url } },
    payload,
  )
  req.user = current.raw
  await logoutOperation({
    allSessions: true,
    collection: payload.collections.users,
    req,
  })
  await revokeAllOAuthSessions(payload, current.safe.id as number)
  await writeAuthAudit({
    event: 'logout_all_devices',
    headers: request.headers,
    payload,
    req,
    success: true,
    user: current.safe.id as number,
  })

  const response = NextResponse.json({ redirectTo: '/login', success: true })
  response.headers.append(
    'Set-Cookie',
    generateExpiredPayloadCookie({
      collectionAuthConfig: payload.collections.users.config.auth,
      config: payload.config,
      cookiePrefix: payload.config.cookiePrefix,
    }),
  )
  clearAuthCookies(response, `${payload.config.cookiePrefix}-token`)
  return response
}

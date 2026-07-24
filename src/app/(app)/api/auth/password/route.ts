import configPromise from '@payload-config'
import {
  createLocalReq,
  generateExpiredPayloadCookie,
  getPayload,
  loginOperation,
} from 'payload'
import { NextRequest, NextResponse } from 'next/server'

import { trustedAuthContext } from '@/collections/Users/hooks/security'
import { writeAuthAudit } from '@/lib/auth/audit'
import { clearAuthCookies } from '@/lib/auth/cookies'
import { getCurrentUser } from '@/lib/auth/current-user'
import { findOAuthSession, revokeAllOAuthSessions } from '@/lib/auth/oauth-session'
import { authError, validationError } from '@/lib/auth/responses'
import { hasValidOrigin } from '@/lib/auth/request'
import { passwordSchema } from '@/lib/auth/validation'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) return authError('INVALID_INPUT', 'Invalid request.', 403)
  const current = await getCurrentUser(request.headers)
  if (!current) return authError('INVALID_CREDENTIALS', 'Sign in is required.', 401)
  const parsed = passwordSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return validationError(parsed.error)

  const payload = await getPayload({ config: configPromise })
  if (current.safe.hasLocalPassword) {
    if (!parsed.data.currentPassword) {
      return authError('INVALID_INPUT', 'Enter your current password.', 400)
    }
    try {
      const req = await createLocalReq(
        { req: { headers: request.headers, url: request.url } },
        payload,
      )
      await loginOperation({
        collection: payload.collections.users,
        data: {
          email: current.safe.email,
          password: parsed.data.currentPassword,
        },
        overrideAccess: false,
        req,
      })
    } catch {
      return authError('INVALID_CREDENTIALS', 'The current password is incorrect.', 401)
    }
  } else {
    const oauthSession = await findOAuthSession(payload, request.headers)
    const createdAt = oauthSession ? new Date(oauthSession.createdAt).getTime() : 0
    if (!createdAt || Date.now() - createdAt > 30 * 60 * 1000) {
      return authError(
        'INVALID_CREDENTIALS',
        'For security, sign in with Google again before setting a password.',
        401,
      )
    }
  }

  const methods = new Set(current.safe.authMethods)
  methods.add('password')
  await payload.update({
    collection: 'users',
    context: trustedAuthContext,
    data: {
      authMethods: [...methods],
      hasLocalPassword: true,
      password: parsed.data.password,
      sessions: [],
    },
    id: current.safe.id as number,
    overrideAccess: true,
  })
  await revokeAllOAuthSessions(payload, current.safe.id as number)
  await writeAuthAudit({
    event: 'password_reset_completed',
    headers: request.headers,
    payload,
    provider: 'password',
    success: true,
    user: current.safe.id as number,
  })

  const response = NextResponse.json({
    message: 'Password updated. Sign in again on this device.',
    redirectTo: '/login',
    success: true,
  })
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

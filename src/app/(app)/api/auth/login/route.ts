import configPromise from '@payload-config'
import {
  createLocalReq,
  generatePayloadCookie,
  getPayload,
  loginOperation,
} from 'payload'
import { NextRequest, NextResponse } from 'next/server'

import { writeAuthAudit } from '@/lib/auth/audit'
import { toSafeUser } from '@/lib/auth/current-user'
import { authError, validationError } from '@/lib/auth/responses'
import { consumeRateLimit } from '@/lib/auth/rate-limit'
import { getClientIP, hasValidOrigin } from '@/lib/auth/request'
import { getSafeInternalPath } from '@/lib/auth/safe-redirect'
import { loginSchema } from '@/lib/auth/validation'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) return authError('INVALID_INPUT', 'Invalid request.', 403)
  const payload = await getPayload({ config: configPromise })
  const parsed = loginSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return validationError(parsed.error)

  const rate = await consumeRateLimit({
    action: 'login',
    identifier: `${getClientIP(request.headers)}:${parsed.data.email}`,
    limit: 12,
    payload,
    windowMs: 15 * 60 * 1000,
  })
  if (!rate.allowed) {
    return authError('RATE_LIMITED', 'Too many attempts. Please wait and try again.', 429)
  }

  try {
    const req = await createLocalReq(
      { req: { headers: request.headers, url: request.url } },
      payload,
    )
    const result = await loginOperation({
      collection: payload.collections.users,
      data: { email: parsed.data.email, password: parsed.data.password },
      depth: 0,
      overrideAccess: false,
      req,
    })
    if (!result.user || !result.token) throw new Error('INVALID_CREDENTIALS')
    await writeAuthAudit({
      event: 'password_login_succeeded',
      headers: request.headers,
      payload,
      provider: 'password',
      req,
      success: true,
      user: result.user.id,
    })
    const fullUser = await payload.findByID({
      collection: 'users',
      id: result.user.id,
      overrideAccess: true,
      req,
    })
    const response = NextResponse.json(
      {
        redirectTo: getSafeInternalPath(parsed.data.returnTo),
        success: true,
        user: toSafeUser(fullUser as unknown as Record<string, unknown>),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
    response.headers.append(
      'Set-Cookie',
      generatePayloadCookie({
        collectionAuthConfig: payload.collections.users.config.auth,
        cookiePrefix: payload.config.cookiePrefix,
        token: result.token,
      }),
    )
    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    const name = error instanceof Error ? error.name : ''
    const blocked = message === 'ACCOUNT_BLOCKED'
    const unverified = name === 'UnverifiedEmail' || /verified/i.test(message)
    await writeAuthAudit({
      event: 'password_login_failed',
      headers: request.headers,
      payload,
      provider: 'password',
      reasonCode: blocked
        ? 'ACCOUNT_BLOCKED'
        : unverified
          ? 'EMAIL_NOT_VERIFIED'
          : 'INVALID_CREDENTIALS',
      success: false,
    })
    if (blocked) {
      return authError(
        'ACCOUNT_BLOCKED',
        'This account is unavailable. Contact support if you believe this is a mistake.',
        403,
      )
    }
    if (unverified) {
      return authError(
        'EMAIL_NOT_VERIFIED',
        'Verify your email before signing in.',
        403,
      )
    }
    return authError(
      'INVALID_CREDENTIALS',
      'Unable to sign in with those details. Try Google sign-in or reset your password.',
      401,
    )
  }
}

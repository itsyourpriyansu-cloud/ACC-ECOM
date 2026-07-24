import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'

import { trustedAuthContext } from '@/collections/Users/hooks/security'
import { writeAuthAudit } from '@/lib/auth/audit'
import { clearAuthCookies } from '@/lib/auth/cookies'
import { revokeAllOAuthSessions } from '@/lib/auth/oauth-session'
import { authError, authSuccess, validationError } from '@/lib/auth/responses'
import { consumeRateLimit } from '@/lib/auth/rate-limit'
import { getClientIP, hasValidOrigin } from '@/lib/auth/request'
import { resetPasswordSchema } from '@/lib/auth/validation'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) return authError('INVALID_INPUT', 'Invalid request.', 403)
  const payload = await getPayload({ config: configPromise })
  const parsed = resetPasswordSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return validationError(parsed.error)

  const rate = await consumeRateLimit({
    action: 'reset-password',
    identifier: `${getClientIP(request.headers)}:${parsed.data.token}`,
    limit: 8,
    payload,
    windowMs: 60 * 60 * 1000,
  })
  if (!rate.allowed) {
    return authError('RATE_LIMITED', 'Please wait before trying another reset.', 429)
  }

  try {
    const matched = await payload.find({
      collection: 'users',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: {
        and: [
          { resetPasswordToken: { equals: parsed.data.token } },
          { resetPasswordExpiration: { greater_than: new Date().toISOString() } },
        ],
      },
    })
    const existing = matched.docs[0]
    if (!existing) throw new Error('RESET_TOKEN_INVALID')

    await payload.resetPassword({
      collection: 'users',
      context: trustedAuthContext,
      data: { password: parsed.data.password, token: parsed.data.token },
      overrideAccess: true,
      req: { headers: request.headers },
    })
    const methods = new Set(existing.authMethods || [])
    methods.add('password')
    await payload.update({
      collection: 'users',
      context: trustedAuthContext,
      data: {
        authMethods: [...methods],
        hasLocalPassword: true,
        sessions: [],
      },
      id: existing.id,
      overrideAccess: true,
    })
    await revokeAllOAuthSessions(payload, existing.id)
    await writeAuthAudit({
      event: 'password_reset_completed',
      headers: request.headers,
      payload,
      provider: 'password',
      success: true,
      user: existing.id,
    })

    const response = authSuccess('Your password has been changed. Sign in with the new password.')
    clearAuthCookies(response as NextResponse, `${payload.config.cookiePrefix}-token`)
    return response
  } catch (error) {
    payload.logger.warn({ err: error, msg: 'Password reset failed.' })
    return authError(
      'RESET_TOKEN_INVALID',
      'This reset link is invalid, expired, or has already been used.',
      400,
    )
  }
}

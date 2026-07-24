import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextRequest } from 'next/server'

import { trustedAuthContext } from '@/collections/Users/hooks/security'
import { writeAuthAudit } from '@/lib/auth/audit'
import { authError, authSuccess, validationError } from '@/lib/auth/responses'
import { consumeRateLimit } from '@/lib/auth/rate-limit'
import { getClientIP, hasValidOrigin } from '@/lib/auth/request'
import { forgotPasswordSchema } from '@/lib/auth/validation'

export const dynamic = 'force-dynamic'

const genericMessage =
  'If an account can receive password email, a reset link will arrive shortly.'

export async function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) return authError('INVALID_INPUT', 'Invalid request.', 403)
  const payload = await getPayload({ config: configPromise })
  const parsed = forgotPasswordSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return validationError(parsed.error)

  const rate = await consumeRateLimit({
    action: 'forgot-password',
    identifier: `${getClientIP(request.headers)}:${parsed.data.email}`,
    limit: 5,
    payload,
    windowMs: 60 * 60 * 1000,
  })
  if (!rate.allowed) return authSuccess(genericMessage)

  try {
    await payload.forgotPassword({
      collection: 'users',
      context: trustedAuthContext,
      data: { email: parsed.data.email },
      overrideAccess: true,
      req: { headers: request.headers, url: request.url },
    })
  } catch (error) {
    payload.logger.warn({ err: error, msg: 'Password reset request could not be delivered.' })
  }

  await writeAuthAudit({
    event: 'password_reset_requested',
    headers: request.headers,
    payload,
    provider: 'password',
    success: true,
  })
  return authSuccess(genericMessage)
}

import crypto from 'crypto'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextRequest } from 'next/server'

import { trustedAuthContext } from '@/collections/Users/hooks/security'
import { getAppURL } from '@/lib/auth/config'
import { authError, authSuccess, validationError } from '@/lib/auth/responses'
import { consumeRateLimit } from '@/lib/auth/rate-limit'
import { getClientIP, hasValidOrigin } from '@/lib/auth/request'
import { forgotPasswordSchema } from '@/lib/auth/validation'

export const dynamic = 'force-dynamic'

const message = 'If the account still needs verification, a new email will arrive shortly.'

export async function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) return authError('INVALID_INPUT', 'Invalid request.', 403)
  const payload = await getPayload({ config: configPromise })
  const parsed = forgotPasswordSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return validationError(parsed.error)

  const rate = await consumeRateLimit({
    action: 'resend-verification',
    identifier: `${getClientIP(request.headers)}:${parsed.data.email}`,
    limit: 3,
    payload,
    windowMs: 60 * 60 * 1000,
  })
  if (!rate.allowed) return authSuccess(message)

  const found = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: { email: { equals: parsed.data.email } },
  })
  const user = found.docs[0]
  if (user && user._verified !== true) {
    const token = crypto.randomBytes(32).toString('hex')
    await payload.update({
      collection: 'users',
      context: trustedAuthContext,
      data: { _verificationToken: token },
      id: user.id,
      overrideAccess: true,
    })
    const url = `${getAppURL()}/verify-email?token=${encodeURIComponent(token)}`
    await payload.sendEmail({
      html: `<p>Confirm your email address to finish creating your Alemah account.</p><p><a href="${url}">Verify email</a></p>`,
      subject: 'Verify your Alemah email address',
      to: user.email,
    })
  }
  return authSuccess(message)
}

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextRequest } from 'next/server'

import { trustedAuthContext } from '@/collections/Users/hooks/security'
import { writeAuthAudit } from '@/lib/auth/audit'
import { authError, authSuccess, validationError } from '@/lib/auth/responses'
import { consumeRateLimit } from '@/lib/auth/rate-limit'
import { getClientIP, hasValidOrigin } from '@/lib/auth/request'
import { signupSchema } from '@/lib/auth/validation'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) return authError('INVALID_INPUT', 'Invalid request.', 403)
  const payload = await getPayload({ config: configPromise })
  const parsed = signupSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return validationError(parsed.error)

  const { acceptedTerms: _acceptedTerms, passwordConfirm: _passwordConfirm, ...input } = parsed.data
  const rate = await consumeRateLimit({
    action: 'signup',
    identifier: `${getClientIP(request.headers)}:${input.email}`,
    limit: 5,
    payload,
    windowMs: 60 * 60 * 1000,
  })
  if (!rate.allowed) {
    return authError('RATE_LIMITED', 'Please wait before creating another account.', 429)
  }

  try {
    const duplicate = await payload.find({
      collection: 'users',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: { email: { equals: input.email } },
    })
    if (duplicate.docs[0]) {
      await writeAuthAudit({
        event: 'signup_failed',
        headers: request.headers,
        payload,
        provider: 'password',
        reasonCode: 'ACCOUNT_EXISTS',
        success: false,
      })
      return authError(
        'ACCOUNT_EXISTS',
        'An account may already exist. Try signing in or resetting your password.',
        409,
      )
    }

    const user = await payload.create({
      collection: 'users',
      context: trustedAuthContext,
      data: {
        acceptedTermsAt: new Date().toISOString(),
        accountStatus: 'active',
        authMethods: ['password'],
        displayName: input.firstName,
        email: input.email,
        firstName: input.firstName,
        hasLocalPassword: true,
        lastName: input.lastName || undefined,
        name: [input.firstName, input.lastName].filter(Boolean).join(' '),
        password: input.password,
        roles: ['customer'],
      },
      overrideAccess: true,
    })
    await writeAuthAudit({
      event: 'signup_succeeded',
      headers: request.headers,
      payload,
      provider: 'password',
      success: true,
      user: user.id,
    })
    return authSuccess(
      'Account created. Check your email to verify it before signing in.',
      '/check-email',
      201,
    )
  } catch (error) {
    payload.logger.error({ err: error, msg: 'Customer signup failed.' })
    await writeAuthAudit({
      event: 'signup_failed',
      headers: request.headers,
      payload,
      provider: 'password',
      reasonCode: 'CREATE_FAILED',
      success: false,
    })
    return authError(
      'UNKNOWN_ERROR',
      'We could not create the account. Try signing in or resetting your password.',
      400,
    )
  }
}

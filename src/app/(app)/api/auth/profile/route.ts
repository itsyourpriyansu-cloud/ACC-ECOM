import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'

import { trustedAuthContext } from '@/collections/Users/hooks/security'
import { getCurrentUser, toSafeUser } from '@/lib/auth/current-user'
import { authError, validationError } from '@/lib/auth/responses'
import { hasValidOrigin } from '@/lib/auth/request'
import { profileSchema } from '@/lib/auth/validation'

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest) {
  if (!hasValidOrigin(request)) return authError('INVALID_INPUT', 'Invalid request.', 403)
  const current = await getCurrentUser(request.headers)
  if (!current) return authError('INVALID_CREDENTIALS', 'Sign in is required.', 401)
  const parsed = profileSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return validationError(parsed.error)

  const payload = await getPayload({ config: configPromise })
  const user = await payload.update({
    collection: 'users',
    context: trustedAuthContext,
    data: {
      avatarURL: parsed.data.avatarURL || null,
      displayName: parsed.data.displayName || parsed.data.firstName,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName || null,
      name: [parsed.data.firstName, parsed.data.lastName].filter(Boolean).join(' '),
    },
    id: current.safe.id as number,
    overrideAccess: true,
  })
  return NextResponse.json(
    {
      message: 'Profile updated.',
      success: true,
      user: toSafeUser(user as unknown as Record<string, unknown>),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}

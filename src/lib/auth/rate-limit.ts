import type { Payload } from 'payload'

import { hashSecret } from './crypto'

type RateLimitArgs = {
  action: string
  identifier: string
  limit: number
  payload: Payload
  windowMs: number
}

const consume = async (
  { action, identifier, limit, payload, windowMs }: RateLimitArgs,
  canRetryCollision: boolean,
): Promise<{ allowed: boolean; retryAfter: number }> => {
  const now = Date.now()
  await payload.delete({
    collection: 'auth-rate-limits',
    overrideAccess: true,
    where: { expiresAt: { less_than_equal: new Date(now).toISOString() } },
  })
  const windowStart = Math.floor(now / windowMs) * windowMs
  const bucketKey = `${action}:${hashSecret(identifier, payload.secret)}:${windowStart}`
  const existing = await payload.find({
    collection: 'auth-rate-limits',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: { bucketKey: { equals: bucketKey } },
  })

  if (!existing.docs[0]) {
    try {
      await payload.create({
        collection: 'auth-rate-limits',
        data: {
          action,
          bucketKey,
          count: 1,
          expiresAt: new Date(windowStart + windowMs).toISOString(),
        },
        overrideAccess: true,
      })
      return { allowed: true, retryAfter: 0 }
    } catch (error) {
      // A concurrent request may have created this unique bucket first.
      if (canRetryCollision) {
        return consume({ action, identifier, limit, payload, windowMs }, false)
      }
      throw error
    }
  }

  const count = Number(existing.docs[0].count || 0) + 1
  await payload.update({
    collection: 'auth-rate-limits',
    data: { count },
    id: existing.docs[0].id,
    overrideAccess: true,
  })

  return {
    allowed: count <= limit,
    retryAfter: Math.max(1, Math.ceil((windowStart + windowMs - now) / 1000)),
  }
}

export const consumeRateLimit = (args: RateLimitArgs) => consume(args, true)

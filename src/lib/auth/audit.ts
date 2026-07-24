import type { Payload, PayloadRequest } from 'payload'

import type { AUTH_AUDIT_EVENTS } from '@/collections/AuthAuditEvents'
import { hashRequestValue } from './crypto'
import { getClientIP } from './request'

type AuditEvent = (typeof AUTH_AUDIT_EVENTS)[number]

export const writeAuthAudit = async ({
  event,
  headers,
  metadata,
  payload,
  provider,
  reasonCode,
  req,
  success,
  user,
}: {
  event: AuditEvent
  headers?: Headers
  metadata?: Record<string, boolean | number | string>
  payload: Payload
  provider?: 'google' | 'password'
  reasonCode?: string
  req?: PayloadRequest
  success: boolean
  user?: number
}) => {
  try {
    await payload.create({
      collection: 'auth-audit-events',
      data: {
        event,
        ipHash: headers
          ? hashRequestValue(getClientIP(headers), payload.secret)
          : undefined,
        metadata,
        provider,
        reasonCode,
        success,
        user,
        userAgent: headers?.get('user-agent')?.slice(0, 500),
      },
      overrideAccess: true,
      req,
    })
  } catch (error) {
    payload.logger.error({
      err: error,
      event,
      msg: 'Unable to persist authentication audit event.',
    })
  }
}

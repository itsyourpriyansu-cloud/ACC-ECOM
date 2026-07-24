import crypto from 'crypto'

import { getAuthSessionSecret } from './config'

export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('base64url')

export const hashSecret = (value: string, payloadSecret?: string) =>
  crypto.createHmac('sha256', getAuthSessionSecret(payloadSecret)).update(value).digest('hex')

export const safeEqual = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer)
}

export const hashRequestValue = (value: string | null | undefined, payloadSecret?: string) =>
  value ? hashSecret(value.slice(0, 1000), payloadSecret) : undefined

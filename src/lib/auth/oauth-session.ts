import type { Payload, PayloadRequest } from 'payload'

import {
  OAUTH_LAST_USED_THROTTLE_MS,
  OAUTH_SESSION_COOKIE,
  OAUTH_SESSION_SECONDS,
} from './config'
import { hashRequestValue, hashSecret, randomToken } from './crypto'
import { getClientIP } from './request'

const getCookie = (headers: Headers, name: string) => {
  const cookie = headers.get('cookie')
  if (!cookie) return null
  for (const part of cookie.split(';')) {
    const [key, ...value] = part.trim().split('=')
    if (key === name) return decodeURIComponent(value.join('='))
  }
  return null
}

export const getRawOAuthSessionToken = (headers: Headers) =>
  getCookie(headers, OAUTH_SESSION_COOKIE)

export const createOAuthSession = async ({
  headers,
  payload,
  req,
  user,
}: {
  headers: Headers
  payload: Payload
  req?: PayloadRequest
  user: number
}) => {
  const token = randomToken(32)
  const now = new Date()
  await payload.delete({
    collection: 'oauth-sessions',
    overrideAccess: true,
    req,
    where: { expiresAt: { less_than_equal: now.toISOString() } },
  })
  await payload.create({
    collection: 'oauth-sessions',
    data: {
      createdIPHash: hashRequestValue(getClientIP(headers), payload.secret),
      createdUserAgentHash: hashRequestValue(headers.get('user-agent'), payload.secret),
      expiresAt: new Date(now.getTime() + OAUTH_SESSION_SECONDS * 1000).toISOString(),
      lastUsedAt: now.toISOString(),
      tokenHash: hashSecret(token, payload.secret),
      user,
    },
    overrideAccess: true,
    req,
  })
  return token
}

export const findOAuthSession = async (payload: Payload, headers: Headers) => {
  const token = getRawOAuthSessionToken(headers)
  if (!token) return null

  const sessions = await payload.find({
    collection: 'oauth-sessions',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        { tokenHash: { equals: hashSecret(token, payload.secret) } },
        { expiresAt: { greater_than: new Date().toISOString() } },
        { revokedAt: { exists: false } },
      ],
    },
  })

  return sessions.docs[0] || null
}

export const revokeOAuthSession = async (
  payload: Payload,
  headers: Headers,
  req?: PayloadRequest,
) => {
  const session = await findOAuthSession(payload, headers)
  if (!session) return null
  await payload.update({
    collection: 'oauth-sessions',
    data: { revokedAt: new Date().toISOString() },
    id: session.id,
    overrideAccess: true,
    req,
  })
  return session
}

export const revokeAllOAuthSessions = async (payload: Payload, user: number) => {
  await payload.update({
    collection: 'oauth-sessions',
    data: { revokedAt: new Date().toISOString() },
    overrideAccess: true,
    where: {
      and: [{ user: { equals: user } }, { revokedAt: { exists: false } }],
    },
  })
}

export const touchOAuthSession = async (
  payload: Payload,
  session: { id: number | string; lastUsedAt?: null | string },
) => {
  const lastUsed = session.lastUsedAt ? new Date(session.lastUsedAt).getTime() : 0
  if (Date.now() - lastUsed < OAUTH_LAST_USED_THROTTLE_MS) return
  await payload.update({
    collection: 'oauth-sessions',
    data: { lastUsedAt: new Date().toISOString() },
    id: session.id,
    overrideAccess: true,
  })
}

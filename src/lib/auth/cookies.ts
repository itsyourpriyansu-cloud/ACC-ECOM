import type { NextResponse } from 'next/server'

import {
  getCookieOptions,
  OAUTH_FLOW_COOKIE,
  OAUTH_FLOW_SECONDS,
  OAUTH_SESSION_COOKIE,
  OAUTH_SESSION_SECONDS,
} from './config'
import { hashSecret, safeEqual } from './crypto'

export type OAuthFlowState = {
  expiresAt: number
  nonce: string
  returnTo: string
  state: string
  verifier: string
}

const encodeFlow = (flow: OAuthFlowState, payloadSecret?: string) => {
  const body = Buffer.from(JSON.stringify(flow)).toString('base64url')
  return `${body}.${hashSecret(body, payloadSecret)}`
}

export const decodeOAuthFlow = (value: string | undefined, payloadSecret?: string) => {
  if (!value) return null
  const [body, signature, extra] = value.split('.')
  if (!body || !signature || extra || !safeEqual(signature, hashSecret(body, payloadSecret))) return null

  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as OAuthFlowState
    if (
      typeof parsed.expiresAt !== 'number' ||
      typeof parsed.nonce !== 'string' ||
      typeof parsed.returnTo !== 'string' ||
      typeof parsed.state !== 'string' ||
      typeof parsed.verifier !== 'string'
    ) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export const setOAuthFlowCookie = (
  response: NextResponse,
  flow: OAuthFlowState,
  payloadSecret?: string,
) => {
  response.cookies.set({
    ...getCookieOptions(),
    maxAge: OAUTH_FLOW_SECONDS,
    name: OAUTH_FLOW_COOKIE,
    value: encodeFlow(flow, payloadSecret),
  })
}

export const setOAuthSessionCookie = (response: NextResponse, token: string) => {
  response.cookies.set({
    ...getCookieOptions(),
    maxAge: OAUTH_SESSION_SECONDS,
    name: OAUTH_SESSION_COOKIE,
    value: token,
  })
}

export const clearAuthCookies = (response: NextResponse, payloadCookieName?: string) => {
  for (const name of [OAUTH_FLOW_COOKIE, OAUTH_SESSION_COOKIE, payloadCookieName].filter(
    (value): value is string => Boolean(value),
  )) {
    response.cookies.set({
      ...getCookieOptions(),
      expires: new Date(0),
      name,
      value: '',
    })
  }
}

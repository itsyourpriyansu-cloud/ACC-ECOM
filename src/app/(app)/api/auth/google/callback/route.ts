import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'

import { writeAuthAudit } from '@/lib/auth/audit'
import { clearAuthCookies, decodeOAuthFlow, setOAuthSessionCookie } from '@/lib/auth/cookies'
import { OAUTH_FLOW_COOKIE } from '@/lib/auth/config'
import { getGoogleClient, resolveGoogleAccount, verifyGoogleIDToken } from '@/lib/auth/google'
import { consumeRateLimit } from '@/lib/auth/rate-limit'
import { getClientIP } from '@/lib/auth/request'
import { getSafeInternalPath } from '@/lib/auth/safe-redirect'

export const dynamic = 'force-dynamic'

const errorResponse = (
  request: NextRequest,
  payloadCookieName: string,
  message: string,
  code: string,
) => {
  const response = NextResponse.redirect(
    new URL(`/login?error=${encodeURIComponent(message)}&code=${encodeURIComponent(code)}`, request.url),
  )
  clearAuthCookies(response, payloadCookieName)
  return response
}

export async function GET(request: NextRequest) {
  const payload = await getPayload({ config: configPromise })
  const payloadCookieName = `${payload.config.cookiePrefix}-token`
  const flow = decodeOAuthFlow(
    request.cookies.get(OAUTH_FLOW_COOKIE)?.value,
    payload.secret,
  )
  const providerError = request.nextUrl.searchParams.get('error')
  const receivedState = request.nextUrl.searchParams.get('state')
  const code = request.nextUrl.searchParams.get('code')

  if (providerError) {
    await writeAuthAudit({
      event: 'google_login_failed',
      headers: request.headers,
      payload,
      provider: 'google',
      reasonCode: 'OAUTH_CANCELLED',
      success: false,
    })
    return errorResponse(request, payloadCookieName, 'Google sign-in was cancelled.', 'OAUTH_CANCELLED')
  }

  if (!flow || flow.expiresAt <= Date.now()) {
    await writeAuthAudit({
      event: 'oauth_callback_expired',
      headers: request.headers,
      payload,
      provider: 'google',
      reasonCode: 'OAUTH_EXPIRED',
      success: false,
    })
    return errorResponse(request, payloadCookieName, 'Your sign-in session expired. Please try again.', 'OAUTH_FAILED')
  }

  if (!receivedState || receivedState !== flow.state || !code) {
    await writeAuthAudit({
      event: 'oauth_state_mismatch',
      headers: request.headers,
      payload,
      provider: 'google',
      reasonCode: 'STATE_MISMATCH',
      success: false,
    })
    return errorResponse(request, payloadCookieName, 'Your sign-in session could not be verified.', 'OAUTH_FAILED')
  }

  const failureRate = await consumeRateLimit({
    action: 'google-callback',
    identifier: getClientIP(request.headers),
    limit: 20,
    payload,
    windowMs: 10 * 60 * 1000,
  })
  if (!failureRate.allowed) {
    return errorResponse(request, payloadCookieName, 'Please wait before trying again.', 'RATE_LIMITED')
  }

  try {
    const redirectURI =
      process.env.GOOGLE_REDIRECT_URI ||
      new URL('/api/auth/google/callback', request.url).toString()
    const { tokens } = await getGoogleClient().getToken({
      code,
      codeVerifier: flow.verifier,
      redirect_uri: redirectURI,
    })
    if (!tokens.id_token) throw new Error('ID_TOKEN_MISSING')

    const profile = await verifyGoogleIDToken(tokens.id_token, flow.nonce)
    const result = await resolveGoogleAccount({ headers: request.headers, profile })
    await writeAuthAudit({
      event: result.linked ? 'google_identity_linked' : 'google_login_succeeded',
      headers: request.headers,
      payload,
      provider: 'google',
      success: true,
      user: result.user.id,
    })

    const response = NextResponse.redirect(
      new URL(getSafeInternalPath(flow.returnTo), request.url),
    )
    clearAuthCookies(response, payloadCookieName)
    setOAuthSessionCookie(response, result.token)
    return response
  } catch (error) {
    const reason =
      error instanceof Error && ['ACCOUNT_BLOCKED', 'IDENTITY_CONFLICT'].includes(error.message)
        ? error.message
        : 'OAUTH_FAILED'
    await writeAuthAudit({
      event: reason === 'IDENTITY_CONFLICT' ? 'identity_conflict' : 'google_login_failed',
      headers: request.headers,
      payload,
      provider: 'google',
      reasonCode: reason,
      success: false,
    })
    const message =
      reason === 'ACCOUNT_BLOCKED'
        ? 'This account is unavailable. Contact support if you believe this is a mistake.'
        : reason === 'IDENTITY_CONFLICT'
          ? 'We could not safely connect this Google account. Contact support.'
          : 'We could not complete Google sign-in. Please try again.'
    return errorResponse(request, payloadCookieName, message, reason)
  }
}

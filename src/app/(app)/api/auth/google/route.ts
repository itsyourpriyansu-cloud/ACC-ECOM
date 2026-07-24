import crypto from 'crypto'

import configPromise from '@payload-config'
import { CodeChallengeMethod } from 'google-auth-library'
import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'

import { setOAuthFlowCookie } from '@/lib/auth/cookies'
import { OAUTH_FLOW_SECONDS } from '@/lib/auth/config'
import { getGoogleClient } from '@/lib/auth/google'
import { consumeRateLimit } from '@/lib/auth/rate-limit'
import { getClientIP } from '@/lib/auth/request'
import { getSafeInternalPath } from '@/lib/auth/safe-redirect'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const payload = await getPayload({ config: configPromise })
  const enabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === 'true'
  if (!enabled || !process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect(new URL('/login?error=Google sign-in is not available.', request.url))
  }

  const rate = await consumeRateLimit({
    action: 'google-start',
    identifier: getClientIP(request.headers),
    limit: 20,
    payload,
    windowMs: 10 * 60 * 1000,
  })
  if (!rate.allowed) {
    return NextResponse.redirect(new URL('/login?error=Please wait before trying again.', request.url))
  }

  const state = crypto.randomBytes(32).toString('base64url')
  const nonce = crypto.randomBytes(32).toString('base64url')
  const verifier = crypto.randomBytes(64).toString('base64url')
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url')
  const returnTo = getSafeInternalPath(request.nextUrl.searchParams.get('returnTo'))
  const redirectURI =
    process.env.GOOGLE_REDIRECT_URI ||
    new URL('/api/auth/google/callback', request.url).toString()

  const authorizationURL = getGoogleClient().generateAuthUrl({
    access_type: 'online',
    code_challenge: challenge,
    code_challenge_method: CodeChallengeMethod.S256,
    nonce,
    prompt: 'select_account',
    redirect_uri: redirectURI,
    scope: ['openid', 'email', 'profile'],
    state,
  })
  const response = NextResponse.redirect(authorizationURL)
  setOAuthFlowCookie(
    response,
    {
      expiresAt: Date.now() + OAUTH_FLOW_SECONDS * 1000,
      nonce,
      returnTo,
      state,
      verifier,
    },
    payload.secret,
  )
  return response
}

import crypto from 'crypto'

import { getSafeInternalPath } from '@/lib/auth/safe-redirect'
import { NextRequest, NextResponse } from 'next/server'

const STATE_COOKIE = 'alemah-google-oauth-state'
const STATE_LIFETIME_SECONDS = 10 * 60

export async function GET(request: NextRequest) {
  const clientID = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const authEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === 'true'

  if (!authEnabled || !clientID || !clientSecret) {
    return NextResponse.redirect(
      new URL('/login?error=Google%20sign-in%20is%20not%20available%20yet.', request.url),
    )
  }

  const state = crypto.randomBytes(32).toString('base64url')
  const redirectURI = new URL('/auth/google/callback', request.url).toString()
  const returnTo = getSafeInternalPath(request.nextUrl.searchParams.get('returnTo'))
  const authorizationURL = new URL('https://accounts.google.com/o/oauth2/v2/auth')

  authorizationURL.searchParams.set('client_id', clientID)
  authorizationURL.searchParams.set('redirect_uri', redirectURI)
  authorizationURL.searchParams.set('response_type', 'code')
  authorizationURL.searchParams.set('scope', 'openid email profile')
  authorizationURL.searchParams.set('state', state)
  authorizationURL.searchParams.set('prompt', 'select_account')

  const response = NextResponse.redirect(authorizationURL)
  response.cookies.set({
    name: STATE_COOKIE,
    value: JSON.stringify({ returnTo, state }),
    httpOnly: true,
    maxAge: STATE_LIFETIME_SECONDS,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })

  return response
}

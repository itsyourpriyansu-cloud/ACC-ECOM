import crypto from 'crypto'

import configPromise from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { createLocalReq, generatePayloadCookie, getFieldsToSign, getPayload, jwtSign } from 'payload'
import { addSessionToUser } from 'payload/shared'

const STATE_COOKIE = 'alemah-google-oauth-state'

type GoogleProfile = {
  email?: string
  email_verified?: boolean
  name?: string
  sub?: string
}

const loginError = (request: NextRequest, message: string) =>
  NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(message)}`, request.url))

const getStoredState = (value?: string) => {
  if (!value) return null

  try {
    const parsed = JSON.parse(value) as { returnTo?: unknown; state?: unknown }
    if (typeof parsed.state !== 'string' || typeof parsed.returnTo !== 'string') return null
    if (!parsed.returnTo.startsWith('/') || parsed.returnTo.startsWith('//')) return null
    return parsed as { returnTo: string; state: string }
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const clientID = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const authEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === 'true'
  const code = request.nextUrl.searchParams.get('code')
  const receivedState = request.nextUrl.searchParams.get('state')
  const storedState = getStoredState(request.cookies.get(STATE_COOKIE)?.value)

  if (!authEnabled || !clientID || !clientSecret) {
    return loginError(request, 'Google sign-in is not available yet.')
  }

  if (!code || !receivedState || !storedState || receivedState !== storedState.state) {
    return loginError(request, 'Your Google sign-in session expired. Please try again.')
  }

  const redirectURI = new URL('/auth/google/callback', request.url).toString()

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      body: new URLSearchParams({
        client_id: clientID,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectURI,
      }),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      method: 'POST',
    })

    const tokenData = (await tokenResponse.json()) as { access_token?: string }
    if (!tokenResponse.ok || !tokenData.access_token) {
      return loginError(request, 'Google could not verify this sign-in. Please try again.')
    }

    const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const profile = (await profileResponse.json()) as GoogleProfile

    if (!profileResponse.ok || !profile.sub || !profile.email || profile.email_verified !== true) {
      return loginError(request, 'Google did not provide a verified email address for this account.')
    }

    const payload = await getPayload({ config: configPromise })
    const email = profile.email.toLowerCase().trim()
    const users = await payload.find({
      collection: 'users',
      limit: 1,
      overrideAccess: true,
      where: { googleSubject: { equals: profile.sub } },
    })

    let user = users.docs[0]
    if (!user) {
      const matchingEmail = await payload.find({
        collection: 'users',
        limit: 1,
        overrideAccess: true,
        where: { email: { equals: email } },
      })

      if (matchingEmail.docs[0]) {
        user = await payload.update({
          collection: 'users',
          data: { googleSubject: profile.sub },
          id: matchingEmail.docs[0].id,
          overrideAccess: true,
        })
      } else {
        user = await payload.create({
          collection: 'users',
          data: {
            email,
            googleSubject: profile.sub,
            name: profile.name || email.split('@')[0],
            password: crypto.randomBytes(32).toString('base64url'),
          },
          overrideAccess: true,
        })
      }
    }

    const collection = payload.config.collections.find(({ slug }) => slug === 'users')
    if (!collection?.auth) throw new Error('Customer authentication is not configured.')

    // Payload is configured with session-backed authentication. A JWT without
    // the persisted session id is deliberately treated as a guest session by
    // Payload, so Google sign-in must create the same session a password login
    // would create before issuing its cookie.
    const localRequest = await createLocalReq(
      {
        req: {
          headers: request.headers,
          url: request.url,
        },
      },
      payload,
    )
    const { sid } = await addSessionToUser({
      collectionConfig: collection,
      payload,
      req: localRequest,
      user,
    })
    const { token } = await jwtSign({
      fieldsToSign: getFieldsToSign({ collectionConfig: collection, email, sid, user }),
      secret: payload.secret,
      tokenExpiration: collection.auth.tokenExpiration,
    })
    const response = NextResponse.redirect(new URL(storedState.returnTo, request.url))
    response.headers.append(
      'Set-Cookie',
      generatePayloadCookie({
        collectionAuthConfig: collection.auth,
        cookiePrefix: payload.config.cookiePrefix,
        token,
      }),
    )
    response.cookies.set({
      name: STATE_COOKIE,
      value: '',
      expires: new Date(0),
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
    return response
  } catch (error) {
    request.headers.get('x-request-id')
    console.error('Google authentication failed.', error)
    return loginError(request, 'We could not complete Google sign-in. Please try again.')
  }
}

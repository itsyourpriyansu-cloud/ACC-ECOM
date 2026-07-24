import { createLocalReq, getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { NextRequest } from 'next/server'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { trustedAuthContext } from '@/collections/Users/hooks/security'
import { GET as googleCallback } from '@/app/(app)/api/auth/google/callback/route'
import { POST as forgotPassword } from '@/app/(app)/api/auth/forgot-password/route'
import { POST as login } from '@/app/(app)/api/auth/login/route'
import { POST as logoutAll } from '@/app/(app)/api/auth/logout-all/route'
import { PATCH as updateProfile } from '@/app/(app)/api/auth/profile/route'
import { POST as resetPassword } from '@/app/(app)/api/auth/reset-password/route'
import { POST as signup } from '@/app/(app)/api/auth/signup/route'
import { OAUTH_FLOW_COOKIE } from '@/lib/auth/config'
import { getAppURL } from '@/lib/auth/config'
import { hashSecret } from '@/lib/auth/crypto'
import { resolveGoogleAccount } from '@/lib/auth/google'
import { createOAuthSession } from '@/lib/auth/oauth-session'
import { oauthSessionStrategy } from '@/lib/auth/strategy'

let payload: Payload
const emails: string[] = []

const appOrigin = () => new URL(getAppURL()).origin
const jsonRequest = (
  path: string,
  body: Record<string, unknown>,
  extraHeaders: Record<string, string> = {},
  method = 'POST',
) =>
  new NextRequest(`${appOrigin()}${path}`, {
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      origin: appOrigin(),
      'user-agent': 'vitest-auth-route',
      'x-forwarded-for': '203.0.113.50',
      ...extraHeaders,
    },
    method,
  })

describe('authentication data integrity', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  afterAll(async () => {
    if (emails.length) {
      await payload.delete({
        collection: 'users',
        overrideAccess: true,
        where: { email: { in: emails } },
      })
    }
  })

  it('denies generic anonymous user creation, including role injection', async () => {
    const email = `role-injection-${Date.now()}@example.com`
    const req = await createLocalReq({}, payload)
    await expect(
      payload.create({
        collection: 'users',
        data: {
          accountStatus: 'active',
          email,
          googleSubject: 'attacker-controlled-google-subject',
          password: 'Test-password-123!',
          roles: ['admin'],
        },
        overrideAccess: false,
        req,
      }),
    ).rejects.toThrow()

    const stored = await payload.find({
      collection: 'users',
      overrideAccess: true,
      where: { email: { equals: email } },
    })
    expect(stored.totalDocs).toBe(0)
  })

  it('creates an unverified customer only through controlled signup and prevents duplicates', async () => {
    const email = `controlled-signup-${Date.now()}@example.com`
    const password = 'Controlled-password-1234!'
    emails.push(email)
    const requestBody = {
      acceptedTerms: true,
      accountStatus: 'blocked',
      authMethods: ['google'],
      email,
      firstName: 'Controlled',
      hasLocalPassword: false,
      password,
      passwordConfirm: password,
      roles: ['admin'],
    }

    const created = await signup(jsonRequest('/api/auth/signup', requestBody))
    const createdBody = await created.json()
    expect(created.status).toBe(201)
    expect(createdBody).toMatchObject({ success: true, redirectTo: '/check-email' })
    expect(JSON.stringify(createdBody)).not.toMatch(/token|password/i)

    const stored = await payload.find({
      collection: 'users',
      overrideAccess: true,
      where: { email: { equals: email } },
    })
    expect(stored.totalDocs).toBe(1)
    expect(stored.docs[0]).toMatchObject({
      _verified: false,
      accountStatus: 'active',
      authMethods: ['password'],
      hasLocalPassword: true,
      roles: ['customer'],
    })
    const unverifiedLogin = await login(
      jsonRequest('/api/auth/login', { email, password }),
    )
    expect(unverifiedLogin.status).toBe(403)
    await expect(unverifiedLogin.json()).resolves.toMatchObject({
      code: 'EMAIL_NOT_VERIFIED',
      success: false,
    })

    const duplicate = await signup(jsonRequest('/api/auth/signup', requestBody))
    expect(duplicate.status).toBe(409)
    const afterDuplicate = await payload.find({
      collection: 'users',
      overrideAccess: true,
      where: { email: { equals: email } },
    })
    expect(afterDuplicate.totalDocs).toBe(1)
  })

  it('lets a customer update safe profile fields but not roles, status, email, or auth metadata', async () => {
    const suffix = Date.now()
    const email = `profile-owner-${suffix}@example.com`
    const otherEmail = `profile-other-${suffix}@example.com`
    emails.push(email, otherEmail)
    const user = await payload.create({
      collection: 'users',
      context: trustedAuthContext,
      data: {
        _verified: true,
        accountStatus: 'active',
        authMethods: ['password'],
        email,
        firstName: 'Profile',
        hasLocalPassword: true,
        password: 'Profile-password-1234!',
        roles: ['customer'],
      },
      disableVerificationEmail: true,
      overrideAccess: true,
    })
    const other = await payload.create({
      collection: 'users',
      context: trustedAuthContext,
      data: {
        _verified: true,
        accountStatus: 'active',
        authMethods: ['password'],
        email: otherEmail,
        firstName: 'Other',
        hasLocalPassword: true,
        password: 'Other-password-1234!',
        roles: ['customer'],
      },
      disableVerificationEmail: true,
      overrideAccess: true,
    })
    const req = await createLocalReq({ user }, payload)

    await expect(
      payload.findByID({
        collection: 'users',
        id: other.id,
        overrideAccess: false,
        req,
      }),
    ).rejects.toThrow()

    await expect(
      payload.update({
        collection: 'users',
        data: {
          accountStatus: 'blocked',
          authMethods: ['google'],
          email: 'attacker@example.com',
          roles: ['admin'],
        },
        id: user.id,
        overrideAccess: false,
        req,
      }),
    ).rejects.toThrow()
    const authenticated = await login(
      jsonRequest('/api/auth/login', {
        email,
        password: 'Profile-password-1234!',
      }),
    )
    const cookie = authenticated.headers.get('set-cookie')?.split(';')[0]
    expect(cookie).toEqual(expect.any(String))
    const profileResponse = await updateProfile(
      jsonRequest(
        '/api/auth/profile',
        {
          accountStatus: 'blocked',
          displayName: 'Customer-selected name',
          email: 'attacker@example.com',
          firstName: 'Updated',
          lastName: 'Customer',
          roles: ['admin'],
        },
        { cookie: cookie! },
        'PATCH',
      ),
    )
    expect(profileResponse.status).toBe(200)
    await expect(profileResponse.json()).resolves.toMatchObject({
      success: true,
      user: {
        displayName: 'Customer-selected name',
        firstName: 'Updated',
        lastName: 'Customer',
      },
    })

    const persisted = await payload.findByID({
      collection: 'users',
      id: user.id,
      overrideAccess: true,
    })
    expect(persisted).toMatchObject({
      accountStatus: 'active',
      authMethods: ['password'],
      email,
      roles: ['customer'],
    })
  })

  it('denies guest listing, denies customer admin access, and preserves administrator access', async () => {
    const suffix = Date.now()
    const customerEmail = `access-customer-${suffix}@example.com`
    const adminEmail = `access-admin-${suffix}@example.com`
    emails.push(customerEmail, adminEmail)
    const customer = await payload.create({
      collection: 'users',
      context: trustedAuthContext,
      data: {
        _verified: true,
        accountStatus: 'active',
        authMethods: ['password'],
        email: customerEmail,
        firstName: 'Customer',
        hasLocalPassword: true,
        password: 'Customer-access-password-1234!',
        roles: ['customer'],
      },
      disableVerificationEmail: true,
      overrideAccess: true,
    })
    const administrator = await payload.create({
      collection: 'users',
      context: trustedAuthContext,
      data: {
        _verified: true,
        accountStatus: 'active',
        authMethods: ['password'],
        email: adminEmail,
        firstName: 'Administrator',
        hasLocalPassword: true,
        password: 'Admin-access-password-1234!',
        roles: ['admin'],
      },
      disableVerificationEmail: true,
      overrideAccess: true,
    })
    const guestReq = await createLocalReq({}, payload)
    await expect(
      payload.find({
        collection: 'users',
        overrideAccess: false,
        req: guestReq,
      }),
    ).rejects.toThrow()

    const customerReq = await createLocalReq({ user: customer }, payload)
    const adminAccess = payload.collections.users.config.access.admin
    expect(await adminAccess({ req: customerReq } as never)).toBe(false)

    const adminReq = await createLocalReq({ user: administrator }, payload)
    expect(await adminAccess({ req: adminReq } as never)).toBe(true)
    await expect(
      payload.find({
        collection: 'users',
        overrideAccess: false,
        req: adminReq,
      }),
    ).resolves.toMatchObject({ totalDocs: expect.any(Number) })
  })

  it('locks repeated password failures and rejects the correct password while locked', async () => {
    const email = `login-lockout-${Date.now()}@example.com`
    const password = 'Lockout-password-1234!'
    emails.push(email)
    await payload.create({
      collection: 'users',
      context: trustedAuthContext,
      data: {
        _verified: true,
        accountStatus: 'active',
        authMethods: ['password'],
        email,
        firstName: 'Lockout',
        hasLocalPassword: true,
        password,
        roles: ['customer'],
      },
      disableVerificationEmail: true,
      overrideAccess: true,
    })

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const failed = await login(
        jsonRequest(
          '/api/auth/login',
          { email, password: 'incorrect-password' },
          { 'x-forwarded-for': `203.0.113.${70 + attempt}` },
        ),
      )
      expect(failed.status).toBe(401)
    }

    const correctWhileLocked = await login(
      jsonRequest('/api/auth/login', { email, password }),
    )
    expect(correctWhileLocked.status).toBe(401)
    await expect(correctWhileLocked.json()).resolves.toMatchObject({
      code: 'INVALID_CREDENTIALS',
      success: false,
    })
  })

  it('stores only an HMAC of the opaque OAuth session and authenticates it', async () => {
    const email = `oauth-session-${Date.now()}@example.com`
    emails.push(email)
    const user = await payload.create({
      collection: 'users',
      context: trustedAuthContext,
      data: {
        _verified: true,
        accountStatus: 'active',
        authMethods: ['google'],
        email,
        firstName: 'Session',
        hasLocalPassword: false,
        password: 'internal-test-password-that-is-never-shown',
        roles: ['customer'],
      },
      disableVerificationEmail: true,
      overrideAccess: true,
    })
    const headers = new Headers({
      'user-agent': 'vitest',
      'x-forwarded-for': '203.0.113.9',
    })
    const token = await createOAuthSession({ headers, payload, user: user.id })
    const stored = await payload.find({
      collection: 'oauth-sessions',
      limit: 1,
      overrideAccess: true,
      where: { user: { equals: user.id } },
    })
    expect(stored.docs[0]?.tokenHash).toBe(hashSecret(token, payload.secret))
    expect(JSON.stringify(stored.docs[0])).not.toContain(token)

    headers.set('cookie', `app_oauth_session=${token}`)
    const result = await oauthSessionStrategy.authenticate({ headers, payload })
    expect(result.user?.id).toBe(user.id)

    await payload.update({
      collection: 'users',
      context: trustedAuthContext,
      data: { accountStatus: 'blocked' },
      id: user.id,
      overrideAccess: true,
    })
    const blocked = await oauthSessionStrategy.authenticate({ headers, payload })
    expect(blocked.user).toBeNull()
  })

  it('keeps protected auth collections inaccessible to a customer', async () => {
    const email = `collection-access-${Date.now()}@example.com`
    emails.push(email)
    const user = await payload.create({
      collection: 'users',
      context: trustedAuthContext,
      data: {
        _verified: true,
        accountStatus: 'active',
        authMethods: ['password'],
        email,
        firstName: 'Access',
        hasLocalPassword: true,
        password: 'Valid-password-1234',
        roles: ['customer'],
      },
      disableVerificationEmail: true,
      overrideAccess: true,
    })
    const req = await createLocalReq({ user }, payload)

    for (const collection of [
      'auth-identities',
      'oauth-sessions',
      'auth-audit-events',
      'auth-rate-limits',
    ] as const) {
      await expect(
        payload.find({
          collection,
          overrideAccess: false,
          req,
        }),
      ).rejects.toThrow()
    }
  })

  it('resets a password generically, revokes old sessions, and rejects token reuse', async () => {
    const suffix = Date.now()
    const email = `password-recovery-${suffix}@example.com`
    const oldPassword = 'Recovery-old-password-1234!'
    const newPassword = 'Recovery-new-password-5678!'
    emails.push(email)
    const user = await payload.create({
      collection: 'users',
      context: trustedAuthContext,
      data: {
        _verified: true,
        accountStatus: 'active',
        authMethods: ['password'],
        email,
        firstName: 'Recovery',
        hasLocalPassword: true,
        password: oldPassword,
        roles: ['customer'],
      },
      disableVerificationEmail: true,
      overrideAccess: true,
    })
    await payload.login({
      collection: 'users',
      data: { email, password: oldPassword },
    })
    const oauthToken = await createOAuthSession({
      headers: new Headers({
        'user-agent': 'vitest-password-recovery',
        'x-forwarded-for': '203.0.113.60',
      }),
      payload,
      user: user.id,
    })

    const known = await forgotPassword(
      jsonRequest('/api/auth/forgot-password', { email }),
    )
    const unknown = await forgotPassword(
      jsonRequest('/api/auth/forgot-password', {
        email: `unknown-recovery-${suffix}@example.com`,
      }),
    )
    expect(known.status).toBe(200)
    expect(await known.json()).toEqual(await unknown.json())

    const resetToken = await payload.forgotPassword({
      collection: 'users',
      context: trustedAuthContext,
      data: { email },
      disableEmail: true,
      overrideAccess: true,
      req: { url: `${appOrigin()}/api/auth/forgot-password` },
    })
    expect(resetToken).toEqual(expect.any(String))

    const reset = await resetPassword(
      jsonRequest('/api/auth/reset-password', {
        password: newPassword,
        passwordConfirm: newPassword,
        token: resetToken,
      }),
    )
    expect(reset.status).toBe(200)

    const afterReset = await payload.findByID({
      collection: 'users',
      id: user.id,
      overrideAccess: true,
    })
    expect(afterReset.authMethods).toContain('password')
    expect(afterReset.hasLocalPassword).toBe(true)
    expect(afterReset.sessions || []).toHaveLength(0)
    await expect(
      payload.login({
        collection: 'users',
        data: { email, password: newPassword },
      }),
    ).resolves.toMatchObject({ user: { id: user.id } })
    await expect(
      payload.login({
        collection: 'users',
        data: { email, password: oldPassword },
      }),
    ).rejects.toThrow()

    const oauthSessions = await payload.find({
      collection: 'oauth-sessions',
      overrideAccess: true,
      where: { tokenHash: { equals: hashSecret(oauthToken, payload.secret) } },
    })
    expect(oauthSessions.docs[0]?.revokedAt).toEqual(expect.any(String))

    const reused = await resetPassword(
      jsonRequest('/api/auth/reset-password', {
        password: newPassword,
        passwordConfirm: newPassword,
        token: resetToken,
      }),
    )
    expect(reused.status).toBe(400)
  }, 20_000)

  it('logs out every Payload and OAuth session for an authenticated user', async () => {
    const email = `logout-all-${Date.now()}@example.com`
    const password = 'Logout-all-password-1234!'
    emails.push(email)
    const user = await payload.create({
      collection: 'users',
      context: trustedAuthContext,
      data: {
        _verified: true,
        accountStatus: 'active',
        authMethods: ['password', 'google'],
        email,
        firstName: 'Logout',
        hasLocalPassword: true,
        password,
        roles: ['customer'],
      },
      disableVerificationEmail: true,
      overrideAccess: true,
    })
    const authenticated = await login(
      jsonRequest('/api/auth/login', { email, password }),
    )
    expect(authenticated.status).toBe(200)
    await createOAuthSession({ headers: new Headers(), payload, user: user.id })
    await createOAuthSession({ headers: new Headers(), payload, user: user.id })
    const cookie = authenticated.headers.get('set-cookie')?.split(';')[0]
    expect(cookie).toEqual(expect.any(String))

    const response = await logoutAll(
      jsonRequest('/api/auth/logout-all', {}, { cookie: cookie! }),
    )
    expect(response.status).toBe(200)
    expect(response.headers.get('set-cookie')).toContain(
      'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    )

    const stored = await payload.findByID({
      collection: 'users',
      id: user.id,
      overrideAccess: true,
    })
    expect(stored.sessions || []).toHaveLength(0)
    const sessions = await payload.find({
      collection: 'oauth-sessions',
      overrideAccess: true,
      where: { user: { equals: user.id } },
    })
    expect(sessions.docs).toHaveLength(2)
    expect(sessions.docs.every((session) => Boolean(session.revokedAt))).toBe(true)
  })

  it('rejects cancelled, expired, and state-mismatched OAuth callbacks safely', async () => {
    const cancelled = await googleCallback(
      new NextRequest(`${appOrigin()}/api/auth/google/callback?error=access_denied`),
    )
    expect(cancelled.headers.get('location')).toContain('code=OAUTH_CANCELLED')

    const encodeFlow = (expiresAt: number, state: string) => {
      const body = Buffer.from(
        JSON.stringify({
          expiresAt,
          nonce: 'integration-nonce',
          returnTo: '/account',
          state,
          verifier: 'integration-code-verifier',
        }),
      ).toString('base64url')
      return `${body}.${hashSecret(body, payload.secret)}`
    }
    const callback = (
      query: string,
      flow: string,
    ) =>
      googleCallback(
        new NextRequest(`${appOrigin()}/api/auth/google/callback?${query}`, {
          headers: { cookie: `${OAUTH_FLOW_COOKIE}=${flow}` },
        }),
      )

    const expired = await callback(
      'state=expired-state&code=authorization-code',
      encodeFlow(Date.now() - 1, 'expired-state'),
    )
    expect(expired.headers.get('location')).toContain('code=OAUTH_FAILED')

    const mismatch = await callback(
      'state=wrong-state&code=authorization-code',
      encodeFlow(Date.now() + 60_000, 'expected-state'),
    )
    expect(mismatch.headers.get('location')).toContain('code=OAUTH_FAILED')
    expect(mismatch.headers.get('set-cookie')).toContain(`${OAUTH_FLOW_COOKIE}=`)

    const audit = await payload.find({
      collection: 'auth-audit-events',
      overrideAccess: true,
      where: {
        event: {
          in: ['oauth_callback_expired', 'oauth_state_mismatch'],
        },
      },
    })
    expect(audit.totalDocs).toBeGreaterThanOrEqual(2)
  })

  it('creates one Google customer and reuses its identity on later logins', async () => {
    const suffix = Date.now()
    const email = `google-new-${suffix}@example.com`
    const subject = `google-new-subject-${suffix}`
    emails.push(email)
    const headers = new Headers({
      'user-agent': 'vitest-google-new',
      'x-forwarded-for': '203.0.113.21',
    })
    const profile = {
      email,
      givenName: 'Google',
      name: 'Google Customer',
      subject,
    }

    const first = await resolveGoogleAccount({ headers, profile })
    const second = await resolveGoogleAccount({ headers, profile })

    expect(first.linked).toBe(false)
    expect(second.linked).toBe(false)
    expect(second.user.id).toBe(first.user.id)
    expect(first.user.roles).toContain('customer')
    expect(first.user.authMethods).toEqual(['google'])
    expect(first.user.hasLocalPassword).toBe(false)

    const users = await payload.find({
      collection: 'users',
      overrideAccess: true,
      where: { email: { equals: email } },
    })
    const identities = await payload.find({
      collection: 'auth-identities',
      overrideAccess: true,
      where: { providerKey: { equals: `google:${subject}` } },
    })
    expect(users.totalDocs).toBe(1)
    expect(identities.totalDocs).toBe(1)

    await payload.update({
      collection: 'users',
      context: trustedAuthContext,
      data: { accountStatus: 'blocked' },
      id: first.user.id,
      overrideAccess: true,
    })
    await expect(resolveGoogleAccount({ headers, profile })).rejects.toThrow('ACCOUNT_BLOCKED')
  })

  it('links a verified Google identity to an existing customer without losing password login', async () => {
    const suffix = Date.now()
    const email = `google-link-${suffix}@example.com`
    const password = 'Existing-password-1234!'
    emails.push(email)
    const user = await payload.create({
      collection: 'users',
      context: trustedAuthContext,
      data: {
        _verified: true,
        accountStatus: 'active',
        authMethods: ['password'],
        email,
        firstName: 'Existing',
        hasLocalPassword: true,
        password,
        roles: ['customer'],
      },
      disableVerificationEmail: true,
      overrideAccess: true,
    })

    const resolved = await resolveGoogleAccount({
      headers: new Headers({
        'user-agent': 'vitest-google-link',
        'x-forwarded-for': '203.0.113.22',
      }),
      profile: {
        email,
        givenName: 'Google',
        name: 'Google Linked',
        subject: `google-link-subject-${suffix}`,
      },
    })

    expect(resolved.linked).toBe(true)
    expect(resolved.user.id).toBe(user.id)
    expect(resolved.user.roles).toContain('customer')
    expect(resolved.user.authMethods).toEqual(expect.arrayContaining(['password', 'google']))
    await expect(
      payload.login({
        collection: 'users',
        data: { email, password },
      }),
    ).resolves.toMatchObject({ user: { id: user.id } })
  })

  it('never automatically links a Google identity to an administrator', async () => {
    const suffix = Date.now()
    const email = `google-admin-${suffix}@example.com`
    const subject = `google-admin-subject-${suffix}`
    emails.push(email)
    await payload.create({
      collection: 'users',
      context: trustedAuthContext,
      data: {
        _verified: true,
        accountStatus: 'active',
        authMethods: ['password'],
        email,
        firstName: 'Administrator',
        hasLocalPassword: true,
        password: 'Administrator-password-1234!',
        roles: ['admin'],
      },
      disableVerificationEmail: true,
      overrideAccess: true,
    })

    await expect(
      resolveGoogleAccount({
        headers: new Headers({
          'user-agent': 'vitest-google-admin',
          'x-forwarded-for': '203.0.113.23',
        }),
        profile: {
          email,
          givenName: 'Google',
          name: 'Google Administrator',
          subject,
        },
      }),
    ).rejects.toThrow('IDENTITY_CONFLICT')

    const identities = await payload.find({
      collection: 'auth-identities',
      overrideAccess: true,
      where: { providerKey: { equals: `google:${subject}` } },
    })
    expect(identities.totalDocs).toBe(0)
  })
})

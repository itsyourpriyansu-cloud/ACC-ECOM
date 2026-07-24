import { afterEach, describe, expect, it, vi } from 'vitest'
import { OAuth2Client } from 'google-auth-library'

import { decodeOAuthFlow } from '@/lib/auth/cookies'
import { hashSecret } from '@/lib/auth/crypto'
import { verifyGoogleIDToken } from '@/lib/auth/google'
import { signupSchema } from '@/lib/auth/validation'

describe('production authentication helpers', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.AUTH_SESSION_SECRET
    delete process.env.GOOGLE_CLIENT_ID
    delete process.env.GOOGLE_CLIENT_SECRET
  })

  it('enforces password policy, confirmation, and terms on signup', () => {
    expect(
      signupSchema.safeParse({
        acceptedTerms: false,
        email: 'User@Example.com',
        firstName: 'A',
        password: 'short',
        passwordConfirm: 'different',
      }).success,
    ).toBe(false)

    const valid = signupSchema.parse({
      acceptedTerms: true,
      email: ' User@Example.com ',
      firstName: ' Priya ',
      password: 'A secure passphrase with 24 chars',
      passwordConfirm: 'A secure passphrase with 24 chars',
    })
    expect(valid.email).toBe('user@example.com')
    expect(valid.firstName).toBe('Priya')
  })

  it('rejects tampered signed OAuth flow cookies', () => {
    process.env.AUTH_SESSION_SECRET = 'test-session-secret'
    const body = Buffer.from(
      JSON.stringify({
        expiresAt: Date.now() + 60_000,
        nonce: 'nonce',
        returnTo: '/account',
        state: 'state',
        verifier: 'verifier',
      }),
    ).toString('base64url')
    const valid = `${body}.${hashSecret(body)}`
    expect(decodeOAuthFlow(valid)?.returnTo).toBe('/account')
    expect(decodeOAuthFlow(`${valid}tampered`)).toBeNull()
  })

  it('requires a verified Google email and matching nonce', async () => {
    process.env.GOOGLE_CLIENT_ID = 'client-id'
    process.env.GOOGLE_CLIENT_SECRET = 'client-secret'
    vi.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue({
      getPayload: () => ({
        aud: 'client-id',
        email: 'person@example.com',
        email_verified: true,
        exp: Math.floor(Date.now() / 1000) + 300,
        iss: 'https://accounts.google.com',
        nonce: 'expected',
        sub: 'google-subject',
      }),
    } as never)

    await expect(verifyGoogleIDToken('signed-id-token', 'expected')).resolves.toMatchObject({
      email: 'person@example.com',
      subject: 'google-subject',
    })
    expect(OAuth2Client.prototype.verifyIdToken).toHaveBeenCalledWith({
      audience: 'client-id',
      idToken: 'signed-id-token',
    })
    await expect(verifyGoogleIDToken('signed-id-token', 'wrong')).rejects.toThrow()
  })

  it.each([
    [{ email_verified: false }, 'claims'],
    [{ iss: 'https://identity.example.com' }, 'issuer'],
    [{ sub: undefined }, 'claims'],
  ])('rejects unsafe Google claims: %o', async (overrides, expectedError) => {
    process.env.GOOGLE_CLIENT_ID = 'client-id'
    process.env.GOOGLE_CLIENT_SECRET = 'client-secret'
    vi.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue({
      getPayload: () => ({
        aud: 'client-id',
        email: 'person@example.com',
        email_verified: true,
        exp: Math.floor(Date.now() / 1000) + 300,
        iss: 'https://accounts.google.com',
        nonce: 'expected',
        sub: 'google-subject',
        ...overrides,
      }),
    } as never)

    await expect(verifyGoogleIDToken('signed-id-token', 'expected')).rejects.toThrow(
      expectedError,
    )
  })
})

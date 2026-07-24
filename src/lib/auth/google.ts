import crypto from 'crypto'

import configPromise from '@payload-config'
import { OAuth2Client } from 'google-auth-library'
import {
  commitTransaction,
  createLocalReq,
  getPayload,
  initTransaction,
  killTransaction,
  type Payload,
} from 'payload'

import { trustedAuthContext } from '@/collections/Users/hooks/security'
import { writeAuthAudit } from './audit'
import { createOAuthSession, revokeOAuthSession } from './oauth-session'

export type VerifiedGoogleProfile = {
  email: string
  familyName?: string
  givenName?: string
  name?: string
  picture?: string
  subject: string
}

export const getGoogleClient = () => {
  const clientID = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientID || !clientSecret) throw new Error('Google OAuth is not configured.')
  return new OAuth2Client(clientID, clientSecret)
}

export const verifyGoogleIDToken = async (
  idToken: string,
  expectedNonce: string,
): Promise<VerifiedGoogleProfile> => {
  const clientID = process.env.GOOGLE_CLIENT_ID
  if (!clientID) throw new Error('Google OAuth is not configured.')
  const ticket = await getGoogleClient().verifyIdToken({ audience: clientID, idToken })
  const claims = ticket.getPayload()

  if (
    !claims ||
    !claims.sub ||
    !claims.email ||
    claims.email_verified !== true ||
    claims.nonce !== expectedNonce
  ) {
    throw new Error('Google identity claims are invalid.')
  }

  if (!['accounts.google.com', 'https://accounts.google.com'].includes(claims.iss)) {
    throw new Error('Google identity issuer is invalid.')
  }

  return {
    email: claims.email.trim().toLowerCase(),
    familyName: claims.family_name,
    givenName: claims.given_name,
    name: claims.name,
    picture: claims.picture,
    subject: claims.sub,
  }
}

const getID = (value: number | { id: number }) => (typeof value === 'object' ? value.id : value)
const isAdminUser = (user: { roles?: null | string[] }) => user.roles?.includes('admin') === true
const isInactive = (user: { accountStatus?: null | string }) =>
  user.accountStatus === 'blocked' || user.accountStatus === 'pendingDeletion'

const resolveOnce = async ({
  headers,
  payload,
  profile,
}: {
  headers: Headers
  payload: Payload
  profile: VerifiedGoogleProfile
}) => {
  const req = await createLocalReq({ req: { headers } }, payload)
  const shouldCommit = await initTransaction(req)
  const providerKey = `google:${profile.subject}`

  try {
    const identityResult = await payload.find({
      collection: 'auth-identities',
      depth: 0,
      limit: 2,
      overrideAccess: true,
      pagination: false,
      req,
      where: {
        or: [
          { providerKey: { equals: providerKey } },
          {
            and: [
              { provider: { equals: 'google' } },
              { providerAccountId: { equals: profile.subject } },
            ],
          },
        ],
      },
    })

    if (identityResult.docs.length > 1) throw new Error('IDENTITY_CONFLICT')
    const identity = identityResult.docs[0]
    let user
    let linked = false

    if (identity) {
      const userID = getID(identity.user)
      user = await payload.findByID({
        collection: 'users',
        id: userID,
        overrideAccess: true,
        req,
      })
      if (!user || identity.providerKey !== providerKey) throw new Error('IDENTITY_CONFLICT')
      if (isInactive(user)) throw new Error('ACCOUNT_BLOCKED')
      if (isAdminUser(user)) throw new Error('IDENTITY_CONFLICT')

      await payload.update({
        collection: 'auth-identities',
        data: {
          lastUsedAt: new Date().toISOString(),
          providerEmail: profile.email,
        },
        id: identity.id,
        overrideAccess: true,
        req,
      })
    } else {
      const legacyIdentity = await payload.find({
        collection: 'users',
        depth: 0,
        limit: 2,
        overrideAccess: true,
        pagination: false,
        req,
        where: { googleSubject: { equals: profile.subject } },
      })
      if (legacyIdentity.docs.length > 1) throw new Error('IDENTITY_CONFLICT')

      const emailMatch = await payload.find({
        collection: 'users',
        depth: 0,
        limit: 2,
        overrideAccess: true,
        pagination: false,
        req,
        where: { email: { equals: profile.email } },
      })
      if (emailMatch.docs.length > 1) throw new Error('IDENTITY_CONFLICT')

      const legacyUser = legacyIdentity.docs[0]
      const emailUser = emailMatch.docs[0]
      if (legacyUser && emailUser && legacyUser.id !== emailUser.id) {
        throw new Error('IDENTITY_CONFLICT')
      }

      user = legacyUser || emailUser
      if (user) {
        if (isInactive(user)) throw new Error('ACCOUNT_BLOCKED')
        if (isAdminUser(user)) throw new Error('IDENTITY_CONFLICT')
        const methods = new Set(user.authMethods || [])
        if (user.hasLocalPassword || user.hash) methods.add('password')
        methods.add('google')

        user = await payload.update({
          collection: 'users',
          context: trustedAuthContext,
          data: {
            _verified: true,
            authMethods: [...methods],
            avatarURL: user.avatarURL || profile.picture,
            displayName: user.displayName || profile.name,
            emailVerifiedAt: user.emailVerifiedAt || new Date().toISOString(),
            firstName: user.firstName || profile.givenName || profile.name?.split(/\s+/)[0],
            lastName: user.lastName || profile.familyName,
          },
          id: user.id,
          overrideAccess: true,
          req,
        })
        linked = true
      } else {
        const generatedPassword = crypto.randomBytes(48).toString('base64url')
        user = await payload.create({
          collection: 'users',
          context: trustedAuthContext,
          data: {
            _verified: true,
            acceptedTermsAt: new Date().toISOString(),
            accountStatus: 'active',
            authMethods: ['google'],
            avatarURL: profile.picture,
            displayName: profile.name,
            email: profile.email,
            emailVerifiedAt: new Date().toISOString(),
            firstName: profile.givenName || profile.name?.split(/\s+/)[0] || 'Customer',
            hasLocalPassword: false,
            lastName: profile.familyName,
            name: profile.name || profile.email.split('@')[0],
            password: generatedPassword,
            roles: ['customer'],
          },
          disableVerificationEmail: true,
          overrideAccess: true,
          req,
        })
      }

      await payload.create({
        collection: 'auth-identities',
        data: {
          lastUsedAt: new Date().toISOString(),
          linkedAt: new Date().toISOString(),
          provider: 'google',
          providerAccountId: profile.subject,
          providerEmail: profile.email,
          providerKey,
          user: user.id,
        },
        overrideAccess: true,
        req,
      })
    }

    user = await payload.update({
      collection: 'users',
      context: trustedAuthContext,
      data: {
        lastLoginAt: new Date().toISOString(),
        lastLoginProvider: 'google',
      },
      id: user.id,
      overrideAccess: true,
      req,
    })

    await revokeOAuthSession(payload, headers, req)
    const token = await createOAuthSession({ headers, payload, req, user: user.id })
    if (shouldCommit) await commitTransaction(req)
    return { linked, token, user }
  } catch (error) {
    await killTransaction(req)
    throw error
  }
}

export const resolveGoogleAccount = async ({
  headers,
  profile,
}: {
  headers: Headers
  profile: VerifiedGoogleProfile
}) => {
  const payload = await getPayload({ config: configPromise })
  try {
    return await resolveOnce({ headers, payload, profile })
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (/duplicate|unique|constraint/i.test(message)) {
      return resolveOnce({ headers, payload, profile })
    }
    throw error
  }
}

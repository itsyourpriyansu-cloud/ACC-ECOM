import type {
  CollectionAfterLoginHook,
  CollectionAfterChangeHook,
  CollectionAfterReadHook,
  CollectionBeforeChangeHook,
  CollectionBeforeLoginHook,
} from 'payload'
import { APIError, AuthenticationError, extractJWT, Forbidden } from 'payload'

import { checkRole } from '@/access/utilities'
import { writeAuthAudit } from '@/lib/auth/audit'

const TRUSTED_CONTEXT_KEY = 'trustedAuthOperation'
const protectedFields = [
  '_verified',
  '_verificationToken',
  'acceptedTermsAt',
  'accountStatus',
  'authMethods',
  'email',
  'emailVerifiedAt',
  'googleSubject',
  'hasLocalPassword',
  'lastLoginAt',
  'lastLoginProvider',
  'lockUntil',
  'loginAttempts',
  'password',
  'passwordConfirm',
  'resetPasswordExpiration',
  'resetPasswordToken',
  'roles',
  'sessions',
] as const

export const trustedAuthContext = { [TRUSTED_CONTEXT_KEY]: true }

export const enforceSafeUserMutation: CollectionBeforeChangeHook = ({
  data,
  operation,
  req,
}) => {
  const trusted = req.context?.[TRUSTED_CONTEXT_KEY] === true
  const admin = checkRole(['admin'], req.user)

  if (!trusted && !admin) {
    for (const field of protectedFields) delete data[field]
  }

  if (operation === 'create' && !trusted && !admin) {
    data.roles = ['customer']
    data.accountStatus = 'active'
  }

  const firstName = typeof data.firstName === 'string' ? data.firstName.trim() : undefined
  const lastName = typeof data.lastName === 'string' ? data.lastName.trim() : undefined
  if (!data.name && firstName) data.name = [firstName, lastName].filter(Boolean).join(' ')

  return data
}

export const rejectBlockedLogin: CollectionBeforeLoginHook = ({ req, user }) => {
  if (user.accountStatus === 'blocked' || user.accountStatus === 'pendingDeletion') {
    throw new APIError('ACCOUNT_BLOCKED', 403)
  }
  if (
    user.hasLocalPassword === false &&
    Array.isArray(user.authMethods) &&
    req.context?.[TRUSTED_CONTEXT_KEY] !== true
  ) {
    throw new AuthenticationError(req.t)
  }
  return user
}

export const recordPasswordLogin: CollectionAfterLoginHook = async ({ req, user }) => {
  await req.payload.update({
    collection: 'users',
    context: trustedAuthContext,
    data: {
      lastLoginAt: new Date().toISOString(),
      lastLoginProvider: 'password',
    },
    id: user.id,
    overrideAccess: true,
    req,
  })
  return user
}

export const recordAccountBlock: CollectionAfterChangeHook = async ({
  doc,
  operation,
  previousDoc,
  req,
}) => {
  if (
    operation === 'update' &&
    doc.accountStatus === 'blocked' &&
    previousDoc?.accountStatus !== 'blocked'
  ) {
    await writeAuthAudit({
      event: 'account_blocked',
      headers: req.headers,
      payload: req.payload,
      req,
      success: true,
      user: doc.id,
    })
  }
  return doc
}

const readJWTSubject = (token: string) => {
  try {
    const encoded = token.split('.')[1]
    if (!encoded) return null
    const decoded = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as {
      id?: number | string
    }
    return decoded.id
  } catch {
    return null
  }
}

/**
 * Payload's JWT strategy loads the user on every request. Throwing only when a
 * blocked document is being loaded by its own token makes an existing session
 * fail closed while preserving an administrator's ability to inspect it.
 */
export const rejectBlockedSession: CollectionAfterReadHook = ({ doc, req }) => {
  if (doc.accountStatus !== 'blocked' && doc.accountStatus !== 'pendingDeletion') return doc
  const token = extractJWT({ headers: req.headers, payload: req.payload })
  const tokenUserID = token ? readJWTSubject(token) : null
  if (tokenUserID !== null && String(tokenUserID) === String(doc.id)) {
    throw new Forbidden(req.t)
  }
  return doc
}

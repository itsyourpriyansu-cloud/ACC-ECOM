import configPromise from '@payload-config'
import { headers as nextHeaders } from 'next/headers'
import { getPayload } from 'payload'

import type { SafeUser } from './types'

export const toSafeUser = (user: Record<string, unknown>): SafeUser => {
  const roles = Array.isArray(user.roles) ? user.roles : []
  const role = roles.includes('admin') ? 'admin' : roles.includes('support') ? 'support' : 'customer'
  const authMethods = Array.isArray(user.authMethods)
    ? user.authMethods.filter(
        (method): method is 'google' | 'password' =>
          method === 'google' || method === 'password',
      )
    : []

  return {
    authMethods,
    avatarURL: typeof user.avatarURL === 'string' ? user.avatarURL : null,
    displayName:
      typeof user.displayName === 'string'
        ? user.displayName
        : typeof user.name === 'string'
          ? user.name
          : null,
    email: typeof user.email === 'string' ? user.email : '',
    firstName:
      typeof user.firstName === 'string'
        ? user.firstName
        : typeof user.name === 'string'
          ? user.name.split(/\s+/)[0] || ''
          : '',
    hasLocalPassword: user.hasLocalPassword === true,
    id: user.id as number | string,
    lastName: typeof user.lastName === 'string' ? user.lastName : null,
    role,
  }
}

export const getCurrentUser = async (requestHeaders?: Headers) => {
  const headers = requestHeaders || (await nextHeaders())
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })
  if (!user || user.accountStatus !== 'active') return null
  return { raw: user, safe: toSafeUser(user as unknown as Record<string, unknown>) }
}

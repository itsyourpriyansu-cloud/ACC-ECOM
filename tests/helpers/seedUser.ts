import { getPayload } from 'payload'
import config from '../../src/payload.config.js'
import { trustedAuthContext } from '../../src/collections/Users/hooks/security.js'

export const testUser = {
  email: 'dev@payloadcms.com',
  password: 'test',
}

/**
 * Seeds a test user for e2e admin tests.
 */
export async function seedTestUser(): Promise<void> {
  const payload = await getPayload({ config })

  // Delete existing test user if any
  await payload.delete({
    collection: 'users',
    overrideAccess: true,
    where: {
      email: {
        equals: testUser.email,
      },
    },
  })

  // Create fresh test user
  await payload.create({
    collection: 'users',
    context: trustedAuthContext,
    data: {
      ...testUser,
      _verified: true,
      accountStatus: 'active',
      authMethods: ['password'],
      hasLocalPassword: true,
      roles: ['admin'],
    },
    disableVerificationEmail: true,
    overrideAccess: true,
  })
}

/**
 * Cleans up test user after tests
 */
export async function cleanupTestUser(): Promise<void> {
  const payload = await getPayload({ config })

  await payload.delete({
    collection: 'users',
    overrideAccess: true,
    where: {
      email: {
        equals: testUser.email,
      },
    },
  })
}

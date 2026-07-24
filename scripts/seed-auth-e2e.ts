import { getPayload } from 'payload'

import { trustedAuthContext } from '../src/collections/Users/hooks/security'
import config from '../src/payload.config'

export const authE2EUser = {
  blockedEmail: 'auth-e2e-blocked@example.com',
  email: 'auth-e2e-customer@example.com',
  password: 'Valid-password-1234',
}

const payload = await getPayload({ config })

await payload.delete({
  collection: 'users',
  overrideAccess: true,
  where: {
    email: { in: [authE2EUser.email, authE2EUser.blockedEmail] },
  },
})

for (const [email, accountStatus] of [
  [authE2EUser.email, 'active'],
  [authE2EUser.blockedEmail, 'blocked'],
] as const) {
  await payload.create({
    collection: 'users',
    context: trustedAuthContext,
    data: {
      _verified: true,
      accountStatus,
      authMethods: ['password'],
      email,
      emailVerifiedAt: new Date().toISOString(),
      firstName: 'Auth',
      hasLocalPassword: true,
      name: 'Auth Customer',
      password: authE2EUser.password,
      roles: ['customer'],
    },
    disableVerificationEmail: true,
    overrideAccess: true,
  })
}

await payload.destroy()

import { createLocalReq, getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { describe, it, beforeAll, expect } from 'vitest'

let payload: Payload

describe('API', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  it('fetches users', async () => {
    const users = await payload.find({
      collection: 'users',
    })
    expect(users).toBeDefined()
  })

  it('does not accept privileged identity fields from a public registration', async () => {
    const email = `account-security-${Date.now()}@example.com`
    const req = await createLocalReq({}, payload)

    try {
      const user = await payload.create({
        collection: 'users',
        data: {
          email,
          googleSubject: 'attacker-controlled-google-subject',
          password: 'Test-password-123!',
          phoneVerifiedAt: new Date().toISOString(),
          roles: ['admin'],
        },
        overrideAccess: false,
        req,
      })

      expect(user.googleSubject).toBeUndefined()
      expect(user.phoneVerifiedAt).toBeUndefined()
      expect(user.roles).toBeUndefined()

      const storedUser = await payload.findByID({
        collection: 'users',
        id: user.id,
        overrideAccess: true,
      })
      expect(storedUser.googleSubject).toBeNull()
      expect(storedUser.phoneVerifiedAt).toBeNull()
      expect(storedUser.roles).toEqual(['customer'])
    } finally {
      await payload.delete({
        collection: 'users',
        overrideAccess: true,
        where: { email: { equals: email } },
      })
    }
  })
})

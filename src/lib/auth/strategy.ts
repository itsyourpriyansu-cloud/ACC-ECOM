import type { AuthStrategy } from 'payload'

import { findOAuthSession, touchOAuthSession } from './oauth-session'

export const oauthSessionStrategy: AuthStrategy = {
  name: 'app-oauth-session',
  authenticate: async ({ headers, payload }) => {
    try {
      const session = await findOAuthSession(payload, headers)
      if (!session) return { user: null }

      const userID =
        typeof session.user === 'object' && session.user ? session.user.id : session.user
      if (!userID) return { user: null }

      const user = await payload.findByID({
        collection: 'users',
        id: userID,
        overrideAccess: true,
      })
      if (!user || user.accountStatus !== 'active') return { user: null }

      await touchOAuthSession(payload, session)
      return {
        user: {
          ...user,
          _strategy: 'app-oauth-session',
          collection: 'users',
        },
      }
    } catch (error) {
      payload.logger.warn({ err: error, msg: 'OAuth session authentication failed.' })
      return { user: null }
    }
  },
}

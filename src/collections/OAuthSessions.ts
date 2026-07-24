import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { checkRole } from '@/access/utilities'

export const OAuthSessions: CollectionConfig = {
  slug: 'oauth-sessions',
  access: {
    admin: ({ req: { user } }) => checkRole(['admin'], user),
    create: () => false,
    delete: () => false,
    read: () => false,
    update: () => false,
  },
  admin: {
    group: 'Security',
    hidden: true,
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'tokenHash',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'expiresAt',
      type: 'date',
      required: true,
      index: true,
    },
    {
      name: 'revokedAt',
      type: 'date',
      index: true,
    },
    {
      name: 'createdUserAgentHash',
      type: 'text',
    },
    {
      name: 'createdIPHash',
      type: 'text',
    },
    {
      name: 'lastUsedAt',
      type: 'date',
    },
  ],
}

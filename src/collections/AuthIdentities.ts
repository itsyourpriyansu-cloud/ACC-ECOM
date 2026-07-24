import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { checkRole } from '@/access/utilities'

export const AuthIdentities: CollectionConfig = {
  slug: 'auth-identities',
  access: {
    admin: ({ req: { user } }) => checkRole(['admin'], user),
    create: () => false,
    delete: () => false,
    read: adminOnly,
    update: () => false,
  },
  admin: {
    group: 'Security',
    defaultColumns: ['provider', 'providerEmail', 'linkedAt', 'lastUsedAt'],
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
      name: 'provider',
      type: 'select',
      options: [{ label: 'Google', value: 'google' }],
      required: true,
      index: true,
    },
    {
      name: 'providerAccountId',
      type: 'text',
      required: true,
      index: true,
      admin: { hidden: true },
    },
    {
      name: 'providerKey',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { hidden: true },
    },
    {
      name: 'providerEmail',
      type: 'email',
    },
    {
      name: 'linkedAt',
      type: 'date',
      required: true,
      index: true,
    },
    {
      name: 'lastUsedAt',
      type: 'date',
    },
  ],
}

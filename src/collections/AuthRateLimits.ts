import type { CollectionConfig } from 'payload'

export const AuthRateLimits: CollectionConfig = {
  slug: 'auth-rate-limits',
  access: {
    admin: () => false,
    create: () => false,
    delete: () => false,
    read: () => false,
    update: () => false,
  },
  admin: { hidden: true },
  fields: [
    {
      name: 'bucketKey',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'action',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'count',
      type: 'number',
      required: true,
      min: 1,
    },
    {
      name: 'expiresAt',
      type: 'date',
      required: true,
      index: true,
    },
  ],
}
